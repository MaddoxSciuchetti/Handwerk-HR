import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { integrationsLive } from "@/services/integrations/runtime";
import { sendMail } from "@/utils/sendMail";

const API = "https://dev.crewmeister.com";

export type CrewmeisterCreateResult =
    | { status: "created"; externalId: string; passwordMailSent: boolean }
    | { status: "skipped"; reason: "already_created" | "not_live" | "not_configured" }
    | { status: "failed"; message: string };

type CrewmeisterAuth = { token: string; crewId: string };

function password() {
    const alphabet =
        "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    const bytes = randomBytes(16);
    let value = "Aa1!";
    for (let index = 0; index < 12; index += 1) {
        value += alphabet[bytes[index] % alphabet.length];
    }
    return value;
}

function pinCode() {
    const bytes = randomBytes(2);
    return String(1000 + ((bytes[0] << 8) | bytes[1]) % 9000);
}

function day(value: Date | null | undefined) {
    if (!value) return "";
    return value.toISOString().slice(0, 10);
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

function resourceId(payload: unknown) {
    const first = Array.isArray(payload) ? payload[0] : payload;
    if (!first || typeof first !== "object") return "";
    const after =
        "resourceAfterWrite" in first ? first.resourceAfterWrite : first;
    if (!after || typeof after !== "object" || !("id" in after)) return "";
    const id = after.id;
    if (typeof id === "number" || typeof id === "string") return String(id);
    return "";
}

async function crewmeister(
    token: string,
    path: string,
    init?: RequestInit,
) {
    const response = await fetch(`${API}${path}`, {
        ...init,
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            ...(init?.headers ?? {}),
        },
    });
    const payload = await readJson(response);
    return { response, payload };
}

async function resolveCrewId(auth: CrewmeisterAuth) {
    const { response, payload } = await crewmeister(
        auth.token,
        "/api/v3/platform-app/crews?pageSize=20",
    );
    if (!response.ok) {
        return {
            ok: false as const,
            message: errorMessage(
                payload,
                "Crewmeister hat die Crews nicht geliefert.",
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
    if (ids.length === 1) return { ok: true as const, crewId: ids[0] };
    return {
        ok: false as const,
        message:
            "Der Crewmeister-Token sieht mehrere Crews. Hinterlegen Sie die Crew-ID unter Integrationen.",
    };
}

export async function createCrewmeisterAccount(params: {
    organizationId: string;
    workerId: string;
    engagementId: string;
    auth: CrewmeisterAuth | null;
}): Promise<CrewmeisterCreateResult> {
    if (!params.auth) {
        return { status: "skipped", reason: "not_configured" };
    }
    const worker = await prisma.worker.findFirst({
        where: { id: params.workerId, organizationId: params.organizationId },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            entryDate: true,
            externalAccounts: {
                where: { provider: "crewmeister" },
                select: { externalId: true },
                take: 1,
            },
        },
    });
    if (!worker) {
        return { status: "failed", message: "Mitarbeiter nicht gefunden." };
    }
    if (worker.externalAccounts[0]) {
        return { status: "skipped", reason: "already_created" };
    }
    if (!integrationsLive()) {
        return { status: "skipped", reason: "not_live" };
    }

    const engagement = await prisma.workerEngagement.findFirst({
        where: {
            id: params.engagementId,
            organizationId: params.organizationId,
        },
        select: { startDate: true },
    });
    const crew = await resolveCrewId(params.auth);
    if (!crew.ok) return { status: "failed", message: crew.message };

    const name = `${worker.firstName} ${worker.lastName}`.trim();
    const generated = password();
    const userWrite = await crewmeister(
        params.auth.token,
        "/api/v3/platform-app/users",
        {
            method: "PATCH",
            body: JSON.stringify([
                {
                    method: "POST",
                    path: "",
                    scheduledAt: null,
                    body: {
                        name,
                        email: worker.email,
                        language: "de",
                        password: generated,
                        passwordConfirmation: generated,
                        terms: true,
                    },
                },
            ]),
        },
    );
    if (!userWrite.response.ok) {
        return {
            status: "failed",
            message: errorMessage(
                userWrite.payload,
                "Crewmeister hat den Benutzer abgelehnt.",
            ),
        };
    }
    const userId = resourceId(userWrite.payload);
    if (!userId) {
        return {
            status: "failed",
            message: "Crewmeister hat keine Benutzer-ID geliefert.",
        };
    }

    const firstWorkingDay =
        day(engagement?.startDate) || day(worker.entryDate) || day(new Date());
    const memberWrite = await crewmeister(
        params.auth.token,
        "/api/v3/platform-app/members",
        {
            method: "PATCH",
            body: JSON.stringify([
                {
                    method: "POST",
                    path: "",
                    scheduledAt: null,
                    body: {
                        crewId: Number(crew.crewId),
                        userId: Number(userId),
                        disabled: false,
                        email: worker.email,
                        employeeId: worker.id.replace(/-/g, "").slice(0, 32),
                        firstWorkingDay,
                        language: "DE",
                        name,
                        pinCode: pinCode(),
                        username: worker.email.split("@")[0] || name,
                    },
                },
            ]),
        },
    );
    if (!memberWrite.response.ok) {
        return {
            status: "failed",
            message: errorMessage(
                memberWrite.payload,
                "Crewmeister hat das Mitglied abgelehnt.",
            ),
        };
    }
    const memberId = resourceId(memberWrite.payload);
    if (!memberId) {
        return {
            status: "failed",
            message: "Crewmeister hat keine Mitglieds-ID geliefert.",
        };
    }

    await prisma.workerExternalAccount.upsert({
        where: {
            workerId_provider: {
                workerId: worker.id,
                provider: "crewmeister",
            },
        },
        create: {
            workerId: worker.id,
            provider: "crewmeister",
            externalId: memberId,
            status: "active",
        },
        update: { externalId: memberId, status: "active" },
    });

    const text = [
        `Hallo ${worker.firstName},`,
        "",
        "dein Crewmeister-Konto ist eingerichtet.",
        `E-Mail: ${worker.email}`,
        `Temporäres Passwort: ${generated}`,
        "Bitte ändere das Passwort bei der ersten Anmeldung.",
    ].join("\n");
    let passwordMailSent = false;
    try {
        const sent = await sendMail({
            to: worker.email,
            subject: "Dein Crewmeister-Zugang",
            text,
            html: text
                .split("\n")
                .map((line) => (line ? `<p>${line}</p>` : "<br>"))
                .join(""),
        });
        passwordMailSent = !sent.error && Boolean(sent.data?.id);
    } catch (error) {
        console.error("Crewmeister Passwortmail fehlgeschlagen", error);
    }

    return { status: "created", externalId: memberId, passwordMailSent };
}
