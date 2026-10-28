import { prisma } from "@/lib/prisma";
import { integrationsLive } from "@/services/integrations/runtime";

const API = "https://api.crewmeister.com";

export type CrewmeisterCreateResult =
    | { status: "created"; externalId: string }
    | {
          status: "skipped";
          reason: "already_created" | "not_live" | "not_configured";
      }
    | { status: "failed"; message: string };

type CrewmeisterAuth = { token: string; crewId: string };

function resourceId(value: unknown): string {
    if (typeof value === "number" && Number.isSafeInteger(value) && value > 0)
        return String(value);
    if (typeof value === "string" && /^[1-9]\d*$/.test(value)) return value;
    return "";
}

async function readJson(response: Response) {
    const text = await response.text();
    if (!text) return null;
    try {
        return JSON.parse(text) as unknown;
    } catch {
        return text;
    }
}

function errorMessage(payload: unknown, fallback: string) {
    if (
        payload &&
        typeof payload === "object" &&
        "message" in payload &&
        typeof payload.message === "string" &&
        payload.message.trim()
    ) {
        return payload.message;
    }
    return fallback;
}

async function crewmeister(token: string, path: string, init?: RequestInit) {
    const response = await fetch(`${API}${path}`, {
        ...init,
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "X-Write-Async": "false",
            ...(init?.headers ?? {}),
        },
    });
    const payload = await readJson(response);
    return { response, payload };
}

function pageContent(payload: unknown): Record<string, unknown>[] {
    if (
        !payload ||
        typeof payload !== "object" ||
        !("content" in payload) ||
        !Array.isArray(payload.content)
    )
        return [];
    return payload.content.filter(
        (item): item is Record<string, unknown> =>
            Boolean(item) && typeof item === "object",
    );
}

async function resolveCrewId(auth: CrewmeisterAuth) {
    const { response, payload } = await crewmeister(
        auth.token,
        "/api/v3/platform-app/crews?pageSize=20",
    );
    if (!response.ok) {
        if (response.status === 401) {
            return {
                ok: false as const,
                message:
                    "Crewmeister hat den Token abgelehnt (HTTP 401). Bitte einen gültigen Token unter Integrationen hinterlegen.",
            };
        }
        if (response.status === 403) {
            return {
                ok: false as const,
                message:
                    "Der Crewmeister-Token darf die Crews nicht lesen (HTTP 403). Bitte die Berechtigungen in Crewmeister prüfen.",
            };
        }
        return {
            ok: false as const,
            message: errorMessage(
                payload,
                `Crewmeister hat die Crews nicht geliefert (HTTP ${response.status}).`,
            ),
        };
    }
    const content =
        payload &&
        typeof payload === "object" &&
        "content" in payload &&
        Array.isArray(payload.content)
            ? payload.content
            : [];
    const ids = content
        .map((item) =>
            item && typeof item === "object" && "id" in item ? item.id : null,
        )
        .filter((id): id is number | string => id != null)
        .map(String);
    if (auth.crewId && ids.includes(auth.crewId)) {
        return { ok: true as const, crewId: auth.crewId };
    }
    if (auth.crewId)
        return {
            ok: false as const,
            message:
                "Die hinterlegte Crew-ID ist für diesen Crewmeister-Token nicht verfügbar. Bitte die Integration prüfen.",
        };
    if (ids.length === 1) return { ok: true as const, crewId: ids[0] };
    return {
        ok: false as const,
        message: ids.length
            ? "Der Crewmeister-Token sieht mehrere Crews. Hinterlegen Sie die Crew-ID unter Integrationen."
            : "Für diesen Crewmeister-Token wurde keine Crew gefunden.",
    };
}

async function verifyMembership(
    auth: CrewmeisterAuth,
    memberId: string,
    crewId: string,
    email: string,
    expectedDisabled = false,
    expectedUserId?: string,
): Promise<string | null> {
    const { response, payload } = await crewmeister(
        auth.token,
        `/api/v3/platform-app/members/${encodeURIComponent(memberId)}`,
    );
    if (!response.ok) {
        return `Die Crewmeister-Mitgliedschaft konnte nicht bestätigt werden (HTTP ${response.status}). Bitte Crew-ID und Token unter Integrationen prüfen.`;
    }
    if (
        !payload ||
        typeof payload !== "object" ||
        !("id" in payload) ||
        String(payload.id) !== memberId ||
        !("crewId" in payload) ||
        String(payload.crewId) !== crewId ||
        !("email" in payload) ||
        typeof payload.email !== "string" ||
        payload.email.trim().toLowerCase() !== email.trim().toLowerCase() ||
        !("userId" in payload) ||
        !resourceId(payload.userId) ||
        (expectedUserId !== undefined &&
            String(payload.userId) !== expectedUserId)
    ) {
        return "Die Crewmeister-Mitgliedschaft stimmt nicht mit dem Mitarbeiter und der gewählten Crew überein. Die Aufgabe wurde nicht als erfolgreich bestätigt.";
    }
    if (!("disabled" in payload) || payload.disabled !== expectedDisabled) {
        return expectedDisabled
            ? "Crewmeister hat die Deaktivierung der Mitgliedschaft noch nicht bestätigt. Bitte erneut versuchen."
            : "Die Crewmeister-Mitgliedschaft ist nicht aktiv. Bitte in Crewmeister prüfen.";
    }
    return null;
}

export async function createCrewmeisterAccount(params: {
    organizationId: string;
    workerId: string;
    engagementId: string;
    auth: CrewmeisterAuth | null;
}): Promise<CrewmeisterCreateResult> {
    if (!params.auth) return { status: "skipped", reason: "not_configured" };
    const worker = await prisma.worker.findFirst({
        where: { id: params.workerId, organizationId: params.organizationId },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
        },
    });
    if (!worker)
        return { status: "failed", message: "Mitarbeiter nicht gefunden." };
    if (!integrationsLive()) return { status: "skipped", reason: "not_live" };
    const email = worker.email?.trim() ?? "";
    if (!email.includes("@"))
        return {
            status: "failed",
            message:
                "Für diesen Mitarbeiter fehlt eine gültige E-Mail-Adresse.",
        };
    const crew = await resolveCrewId(params.auth);
    if (!crew.ok) return { status: "failed", message: crew.message };

    // Avoid sending a second invitation on retries or when the employee was added manually.
    // Memberships are visible to crew managers; global User records may not be.
    const query = new URLSearchParams({
        filter: `crewId==${crew.crewId};email==${JSON.stringify(email)}`,
        pageSize: "20",
    });
    const existing = await crewmeister(
        params.auth.token,
        `/api/v3/platform-app/members?${query}`,
    );
    if (
        !existing.response.ok ||
        !existing.payload ||
        typeof existing.payload !== "object" ||
        !("content" in existing.payload) ||
        !Array.isArray(existing.payload.content)
    ) {
        return {
            status: "failed",
            message: errorMessage(
                existing.payload,
                "Die bestehende Crewmeister-Mitgliedschaft konnte nicht geprüft werden.",
            ),
        };
    }
    const matches = pageContent(existing.payload).filter(
        (member) =>
            String(member.crewId) === crew.crewId &&
            typeof member.email === "string" &&
            member.email.trim().toLowerCase() === email.toLowerCase(),
    );
    if (matches.length > 1)
        return {
            status: "failed",
            message:
                "Für diese E-Mail wurden mehrere Crewmeister-Mitgliedschaften gefunden. Bitte in Crewmeister prüfen.",
        };
    const member = matches[0];
    if (member?.disabled === true)
        return {
            status: "failed",
            message:
                "Für diese E-Mail besteht bereits eine deaktivierte Crewmeister-Mitgliedschaft. Bitte den Mitarbeiter in Crewmeister reaktivieren.",
        };
    let memberId = resourceId(member?.id);
    const alreadyMember = Boolean(member);
    if (alreadyMember && !memberId)
        return {
            status: "failed",
            message: "Crewmeister hat keine gültige Mitglieds-ID geliefert.",
        };

    if (!alreadyMember) {
        // This is the invitation endpoint used by Crewmeister's web UI. It reuses
        // existing login accounts and lets Crewmeister handle the invitation email.
        const invitation = await crewmeister(
            params.auth.token,
            `/api/v2/crew/${encodeURIComponent(crew.crewId)}/invite/with-email`,
            {
                method: "POST",
                body: JSON.stringify({
                    crewId: Number(crew.crewId),
                    email,
                    name: `${worker.firstName} ${worker.lastName}`.trim(),
                    language: "de",
                }),
            },
        );
        const receipt = invitation.payload;
        const statusCode =
            receipt && typeof receipt === "object" && "statusCode" in receipt
                ? receipt.statusCode
                : null;
        if (
            !invitation.response.ok ||
            typeof statusCode !== "number" ||
            statusCode < 200 ||
            statusCode >= 300
        ) {
            return {
                status: "failed",
                message: errorMessage(
                    receipt,
                    `Crewmeister hat die Einladung abgelehnt (HTTP ${invitation.response.status}).`,
                ),
            };
        }
        const result =
            receipt && typeof receipt === "object" && "payload" in receipt
                ? receipt.payload
                : null;
        memberId =
            result && typeof result === "object" && "id" in result
                ? resourceId(result.id)
                : "";
        if (!memberId)
            return {
                status: "failed",
                message:
                    "Crewmeister hat keine gültige Mitglieds-ID für die Einladung geliefert.",
            };
    }

    const problem = await verifyMembership(
        params.auth,
        memberId,
        crew.crewId,
        email,
    );
    if (problem) return { status: "failed", message: problem };
    await prisma.workerExternalAccount.upsert({
        where: {
            workerId_provider: { workerId: worker.id, provider: "crewmeister" },
        },
        create: {
            workerId: worker.id,
            provider: "crewmeister",
            externalId: memberId,
            status: "active",
        },
        update: { externalId: memberId, status: "active" },
    });
    return alreadyMember
        ? { status: "skipped", reason: "already_created" }
        : { status: "created", externalId: memberId };
}

export async function deactivateCrewmeisterAccount(params: {
    organizationId: string;
    workerId: string;
    auth: CrewmeisterAuth | null;
}): Promise<
    | { status: "completed" }
    | { status: "skipped"; reason: "not_configured" | "not_live" }
    | { status: "failed"; message: string }
> {
    if (!params.auth) return { status: "skipped", reason: "not_configured" };
    const worker = await prisma.worker.findFirst({
        where: { id: params.workerId, organizationId: params.organizationId },
        select: { id: true, email: true },
    });
    if (!worker)
        return { status: "failed", message: "Mitarbeiter nicht gefunden." };
    if (!integrationsLive()) return { status: "skipped", reason: "not_live" };
    const email = worker.email?.trim() ?? "";
    if (!email.includes("@"))
        return {
            status: "failed",
            message:
                "Für diesen Mitarbeiter fehlt eine gültige E-Mail-Adresse.",
        };
    const crew = await resolveCrewId(params.auth);
    if (!crew.ok) return { status: "failed", message: crew.message };
    const query = new URLSearchParams({
        filter: `crewId==${crew.crewId};email==${JSON.stringify(email)}`,
        pageSize: "20",
    });
    const found = await crewmeister(
        params.auth.token,
        `/api/v3/platform-app/members?${query}`,
    );
    if (!found.response.ok)
        return {
            status: "failed",
            message: errorMessage(
                found.payload,
                "Die Crewmeister-Mitgliedschaft konnte nicht geladen werden.",
            ),
        };
    const matches = pageContent(found.payload).filter(
        (member) =>
            String(member.crewId) === crew.crewId &&
            typeof member.email === "string" &&
            member.email.trim().toLowerCase() === email.toLowerCase(),
    );
    if (matches.length !== 1 || !resourceId(matches[0]?.id))
        return {
            status: "failed",
            message:
                "Es wurde keine eindeutige Crewmeister-Mitgliedschaft für diesen Mitarbeiter gefunden. Bitte in Crewmeister prüfen.",
        };
    const member = matches[0];
    const memberId = resourceId(member.id);
    const alreadyDisabled = member.disabled === true;
    const identityProblem = await verifyMembership(
        params.auth,
        memberId,
        crew.crewId,
        email,
        alreadyDisabled,
    );
    if (identityProblem) return { status: "failed", message: identityProblem };
    if (!alreadyDisabled) {
        const result = await crewmeister(
            params.auth.token,
            `/api/v3/platform-app/members/${memberId}`,
            {
                method: "PATCH",
                body: JSON.stringify({ disabled: true }),
            },
        );
        if (
            !result.response.ok ||
            (result.payload &&
                typeof result.payload === "object" &&
                "code" in result.payload)
        )
            return {
                status: "failed",
                message: errorMessage(
                    result.payload,
                    `Crewmeister hat die Deaktivierung abgelehnt (HTTP ${result.response.status}).`,
                ),
            };
        const problem = await verifyMembership(
            params.auth,
            memberId,
            crew.crewId,
            email,
            true,
        );
        if (problem) return { status: "failed", message: problem };
    }
    await prisma.workerExternalAccount.upsert({
        where: {
            workerId_provider: { workerId: worker.id, provider: "crewmeister" },
        },
        create: {
            workerId: worker.id,
            provider: "crewmeister",
            externalId: memberId,
            status: "disabled",
        },
        update: { externalId: memberId, status: "disabled" },
    });
    return { status: "completed" };
}

// Membership removal is deliberately separate from offboarding/deactivation.
// Swagger documents a Member DELETE, not an invitation-only cancellation API.
export async function deleteCrewmeisterMembership(
    params: Parameters<typeof deactivateCrewmeisterAccount>[0],
): ReturnType<typeof deactivateCrewmeisterAccount> {
    if (!params.auth) return { status: "skipped", reason: "not_configured" };
    const worker = await prisma.worker.findFirst({
        where: { id: params.workerId, organizationId: params.organizationId },
        select: { id: true, email: true },
    });
    if (!worker)
        return { status: "failed", message: "Mitarbeiter nicht gefunden." };
    if (!integrationsLive()) return { status: "skipped", reason: "not_live" };
    const email = worker.email?.trim() ?? "";
    if (!email.includes("@"))
        return {
            status: "failed",
            message:
                "Für diesen Mitarbeiter fehlt eine gültige E-Mail-Adresse.",
        };
    const crew = await resolveCrewId(params.auth);
    if (!crew.ok) return { status: "failed", message: crew.message };
    const query = new URLSearchParams({
        filter: `crewId==${crew.crewId};email==${JSON.stringify(email)}`,
        pageSize: "20",
    });
    const path = `/api/v3/platform-app/members?${query}`;
    const found = await crewmeister(params.auth.token, path);
    const members = pageContent(found.payload);
    const member = members[0];
    if (!found.response.ok)
        return {
            status: "failed",
            message: errorMessage(
                found.payload,
                `Crewmeister-Mitgliedschaft konnte nicht geladen werden (HTTP ${found.response.status}).`,
            ),
        };
    if (members.length !== 1 || !resourceId(member?.id))
        return {
            status: "failed",
            message:
                "Es wurde keine eindeutige Crewmeister-Mitgliedschaft zum Entfernen gefunden. Bitte in Crewmeister prüfen.",
        };
    const memberId = resourceId(member.id);
    // Re-read the exact record before deletion; an enabled member must first be
    // deactivated explicitly. Never delete a global User or authentication token.
    const problem = await verifyMembership(
        params.auth,
        memberId,
        crew.crewId,
        email,
        true,
        resourceId(member.userId),
    );
    if (problem)
        return {
            status: "failed",
            message: `${problem} Vor dem Entfernen muss die Mitgliedschaft deaktiviert sein.`,
        };
    if (
        String(member.crewId) !== crew.crewId ||
        typeof member.email !== "string" ||
        member.email.trim().toLowerCase() !== email.toLowerCase() ||
        !resourceId(member.userId) ||
        member.disabled !== true
    )
        return {
            status: "failed",
            message:
                "Nur die eindeutig zugeordnete, deaktivierte Crewmeister-Mitgliedschaft darf entfernt werden.",
        };

    const removed = await crewmeister(
        params.auth.token,
        `/api/v3/platform-app/members/${memberId}`,
        { method: "DELETE" },
    );
    const receipt = removed.payload;
    // A 202 only accepts a job. A 404 can also mean missing permissions. Neither
    // confirms deletion. Require the synchronous write receipt and then read back.
    if (
        removed.response.status !== 200 ||
        !receipt ||
        typeof receipt !== "object" ||
        !("resourceAfterWrite" in receipt) ||
        receipt.resourceAfterWrite !== null ||
        !("resourceBeforeWrite" in receipt) ||
        !receipt.resourceBeforeWrite ||
        typeof receipt.resourceBeforeWrite !== "object" ||
        !("id" in receipt.resourceBeforeWrite) ||
        String(receipt.resourceBeforeWrite.id) !== memberId ||
        !("crewId" in receipt.resourceBeforeWrite) ||
        String(receipt.resourceBeforeWrite.crewId) !== crew.crewId ||
        !("userId" in receipt.resourceBeforeWrite) ||
        String(receipt.resourceBeforeWrite.userId) !== String(member.userId)
    )
        return {
            status: "failed",
            message: errorMessage(
                receipt,
                `Crewmeister hat die Entfernung nicht bestätigt (HTTP ${removed.response.status}). Bitte Löschberechtigung und Mitgliedschaft in Crewmeister prüfen.`,
            ),
        };

    const remaining = await crewmeister(params.auth.token, path);
    if (
        !remaining.response.ok ||
        !remaining.payload ||
        typeof remaining.payload !== "object" ||
        !("content" in remaining.payload) ||
        !Array.isArray(remaining.payload.content) ||
        remaining.payload.content.length !== 0
    )
        return {
            status: "failed",
            message:
                "Die entfernte Crewmeister-Mitgliedschaft ist noch vorhanden oder die Nachprüfung ist fehlgeschlagen. Bitte in Crewmeister prüfen.",
        };
    await prisma.workerExternalAccount.deleteMany({
        where: {
            workerId: worker.id,
            provider: "crewmeister",
            externalId: memberId,
        },
    });
    return { status: "completed" };
}
