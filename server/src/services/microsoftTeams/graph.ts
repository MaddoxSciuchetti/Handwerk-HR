import { prisma } from "@/lib/prisma";
import { accessToken, TeamsError, type Actor } from "./connection";

const GRAPH = "https://graph.microsoft.com/v1.0";
export type ChannelChoice = {
    teamId: string;
    channelId: string;
    teamName: string;
    channelName: string;
    label: string;
};
export function graphChannelPath(teamId: string, channelId: string) {
    return `/teams/${encodeURIComponent(teamId)}/channels/${encodeURIComponent(channelId)}`;
}
export async function graphFetch(
    token: string,
    path: string,
    init?: RequestInit,
) {
    return fetch(`${GRAPH}${path}`, {
        ...init,
        redirect: "error",
        signal: AbortSignal.timeout(20_000),
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            ...init?.headers,
        },
    });
}
export async function authenticationRejected(actor: Actor) {
    await prisma.$transaction(async (tx) => {
        const changed = await tx.microsoftUserConnection.updateMany({
            where: { ...actor, reconnectRequired: false },
            data: { reconnectRequired: true },
        });
        if (changed.count)
            await tx.microsoftConnectionEvent.create({
                data: { ...actor, action: "reconnect_required" },
            });
    });
}
export function paginationPath(next: string) {
    const url = new URL(next);
    if (
        url.origin !== "https://graph.microsoft.com" ||
        !url.pathname.startsWith("/v1.0/") ||
        url.username ||
        url.password
    ) {
        throw new TeamsError(
            "invalid_graph_response",
            "Microsoft hat eine ungültige Antwort geliefert.",
        );
    }
    return url.pathname.slice("/v1.0".length) + url.search;
}
async function list<T>(actor: Actor, token: string, initialPath: string) {
    const values: T[] = [];
    let path: string | undefined = initialPath;
    const visited = new Set<string>();
    while (path) {
        if (visited.has(path) || visited.size >= 200)
            throw new TeamsError(
                "pagination_failed",
                "Die Kanalliste konnte nicht vollständig geladen werden.",
            );
        visited.add(path);
        const response = await graphFetch(token, path);
        if (response.status === 401) {
            await authenticationRejected(actor);
            throw new TeamsError(
                "reconnect_required",
                "Bitte Microsoft Teams erneut verbinden.",
            );
        }
        if (!response.ok)
            throw new TeamsError(
                "channels_unavailable",
                "Microsoft hat den Zugriff auf die Kanalliste abgelehnt. Bitte Berechtigungen prüfen.",
            );
        const payload = (await response.json()) as {
            value?: T[];
            "@odata.nextLink"?: string;
        };
        values.push(...(payload.value ?? []));
        path = payload["@odata.nextLink"]
            ? paginationPath(payload["@odata.nextLink"])
            : undefined;
    }
    return values;
}
export async function listChannels(actor: Actor) {
    const auth = await accessToken(actor);
    const teams = await list<{ id: string; displayName: string }>(
        actor,
        auth.token,
        "/me/teamwork/associatedTeams",
    );
    const choices = new Map<string, ChannelChoice>();
    const warnings: string[] = [];
    // Sequential requests avoid a burst of Graph calls for large organizations.
    for (const team of teams) {
        try {
            const channels = await list<{
                id: string;
                displayName: string;
                isArchived?: boolean;
                "@odata.id"?: string;
            }>(
                actor,
                auth.token,
                `/teams/${encodeURIComponent(team.id)}/allChannels?$select=id,displayName,isArchived`,
            );
            for (const channel of channels) {
                if (!channel.id || channel.isArchived) continue;
                const canonicalTeam = channel["@odata.id"]?.match(
                    /\/teams\/([^/]+)\/channels\//,
                )?.[1];
                const teamId = canonicalTeam
                    ? decodeURIComponent(canonicalTeam)
                    : team.id;
                const label = `${team.displayName} · ${channel.displayName}`;
                choices.set(`${teamId}:${channel.id}`, {
                    teamId,
                    channelId: channel.id,
                    teamName: team.displayName,
                    channelName: channel.displayName,
                    label,
                });
            }
        } catch (error) {
            if (
                error instanceof TeamsError &&
                error.code === "reconnect_required"
            )
                throw error;
            warnings.push(
                `${team.displayName}: Kanäle konnten nicht geladen werden.`,
            );
        }
    }
    return {
        channels: [...choices.values()].sort((a, b) =>
            a.label.localeCompare(b.label),
        ),
        warnings,
    };
}

export function retryDate(value: string | null, now = Date.now()) {
    if (!value) return new Date(now + 60_000);
    const seconds = Number(value);
    return new Date(
        Number.isFinite(seconds)
            ? now + Math.max(1, seconds) * 1000
            : Math.max(now + 1000, Date.parse(value) || now + 60_000),
    );
}

export type PostOutcome = {
    status: "sent" | "failed" | "unknown";
    graphMessageId?: string;
    messageUrl?: string;
    error?: string;
    retryAfter?: Date;
    reconnect?: boolean;
};
export async function postChannelMessage(
    token: string,
    teamId: string,
    channelId: string,
    body: string,
): Promise<PostOutcome> {
    try {
        const response = await graphFetch(
            token,
            `${graphChannelPath(teamId, channelId)}/messages`,
            {
                method: "POST",
                body: JSON.stringify({
                    body: { contentType: "text", content: body },
                }),
            },
        );
        if (response.status === 201) {
            const message = (await response.json()) as {
                id?: string;
                webUrl?: string;
            };
            if (!message.id)
                return {
                    status: "unknown",
                    error: "Microsoft hat keine Nachrichtenkennung zurückgegeben. Bitte in Teams prüfen.",
                };
            return {
                status: "sent",
                graphMessageId: message.id,
                messageUrl: message.webUrl,
            };
        }
        if (response.status === 429)
            return {
                status: "failed",
                retryAfter: retryDate(response.headers.get("Retry-After")),
                error: "Microsoft begrenzt die Anfragen. Bitte nach der Wartezeit erneut senden.",
            };
        if (response.status === 401)
            return {
                status: "failed",
                reconnect: true,
                error: "Microsoft Teams muss erneut verbunden werden.",
            };
        if (response.status === 403 || response.status === 404)
            return {
                status: "failed",
                error: "Kein Schreibzugriff auf diesen Kanal oder Kanal nicht mehr verfügbar.",
            };
        if (response.status >= 500 || response.status === 408 || response.ok)
            return {
                status: "unknown",
                error: "Zustellung unklar. Bitte in Teams prüfen, bevor erneut gesendet wird.",
            };
        return {
            status: "failed",
            error: "Microsoft hat die Nachricht abgelehnt.",
        };
    } catch {
        return {
            status: "unknown",
            error: "Zustellung unklar. Bitte in Teams prüfen, bevor erneut gesendet wird.",
        };
    }
}
