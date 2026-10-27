import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { integrationsLive } from "@/services/integrations/runtime";
import { sendMail } from "@/utils/sendMail";

// The developer portal hosts documentation; requests go to the production API.
const API = "https://api.crewmeister.com";

export type CrewmeisterCreateResult =
    | { status: "created"; externalId: string; passwordMailSent: boolean }
    | {
          status: "skipped";
          reason: "already_created" | "not_live" | "not_configured";
      }
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
    return String(1000 + (((bytes[0] << 8) | bytes[1]) % 9000));
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

function writeResult(payload: unknown): { id: string; message?: string } {
    const first = Array.isArray(payload) ? payload[0] : payload;
    if (!first || typeof first !== "object") return { id: "" };
    // Batch write responses can wrap the actual result and its HTTP status.
    if (
        "statusCode" in first &&
        typeof first.statusCode === "number" &&
        "body" in first
    ) {
        if (first.statusCode < 200 || first.statusCode >= 300) {
            return {
                id: "",
                message: errorMessage(
                    first.body,
                    `Crewmeister hat die Erstellung abgelehnt (HTTP ${first.statusCode}).`,
                ),
            };
        }
        return writeResult(first.body);
    }
    if ("code" in first && "message" in first) {
        return {
            id: "",
            message: errorMessage(
                first,
                "Crewmeister hat die Erstellung abgelehnt.",
            ),
        };
    }
    // A job ID is not the ID of a created user or member.
    if ("job" in first) {
        return {
            id: "",
            message:
                "Crewmeister verarbeitet die Erstellung noch. Die Erstellung wurde noch nicht bestätigt.",
        };
    }
    const after =
        "resourceAfterWrite" in first ? first.resourceAfterWrite : first;
    if (!after || typeof after !== "object" || !("id" in after))
        return { id: "" };
    const id = after.id;
    if (typeof id === "number" || typeof id === "string")
        return { id: String(id) };
    return { id: "" };
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

function duplicateUser(payload: unknown): boolean {
    const first = Array.isArray(payload) ? payload[0] : payload;
    if (!first || typeof first !== "object") return false;
    if ("body" in first) return duplicateUser(first.body);
    return (
        ("code" in first && first.code === "ALREADY_EXISTS") ||
        ("message" in first &&
            typeof first.message === "string" &&
            /already.*resource/i.test(first.message) &&
            /property email/i.test(first.message))
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
            method: "POST",
            body: JSON.stringify({
                name,
                email: worker.email,
                language: "de",
                password: generated,
                passwordConfirmation: generated,
                terms: true,
            }),
        },
    );
    let userResult = writeResult(userWrite.payload);
    let reusedUser = false;
    if (!userResult.id && duplicateUser(userWrite.payload)) {
        const query = new URLSearchParams({
            filter: `email==${JSON.stringify(worker.email.trim())}`,
            pageSize: "20",
        });
        const existing = await crewmeister(
            params.auth.token,
            `/api/v3/platform-app/users?${query}`,
        );
        const matches = pageContent(existing.payload).filter(
            (user) =>
                typeof user.email === "string" &&
                user.email.trim().toLowerCase() ===
                    worker.email.trim().toLowerCase(),
        );
        if (
            !existing.response.ok ||
            matches.length !== 1 ||
            !writeResult(matches[0]).id
        ) {
            return {
                status: "failed",
                message:
                    "Die E-Mail ist bei Crewmeister bereits vergeben, aber der Token kann das zugehörige Benutzerkonto nicht eindeutig lesen. Bitte den Crewmeister-Administrator bitten, das bestehende Konto der Crew zuzuordnen.",
            };
        }
        userResult = writeResult(matches[0]);
        reusedUser = true;
    } else if (!userWrite.response.ok) {
        return {
            status: "failed",
            message: errorMessage(
                userWrite.payload,
                "Crewmeister hat den Benutzer abgelehnt.",
            ),
        };
    }
    const userId = userResult.id;
    if (!userId) {
        return {
            status: "failed",
            message:
                userResult.message ??
                `Crewmeister hat keine Benutzer-ID geliefert (HTTP ${userWrite.response.status}).`,
        };
    }

    const firstWorkingDay =
        day(engagement?.startDate) || day(worker.entryDate) || day(new Date());
    let memberId = "";
    if (reusedUser) {
        const query = new URLSearchParams({
            filter: `crewId==${crew.crewId};userId==${userId}`,
            pageSize: "20",
        });
        const existing = await crewmeister(
            params.auth.token,
            `/api/v3/platform-app/members?${query}`,
        );
        if (!existing.response.ok)
            return {
                status: "failed",
                message: errorMessage(
                    existing.payload,
                    "Die bestehende Crewmeister-Mitgliedschaft konnte nicht geprüft werden.",
                ),
            };
        const member = pageContent(existing.payload).find(
            (item) =>
                String(item.crewId) === crew.crewId &&
                String(item.userId) === userId,
        );
        if (member?.disabled === true)
            return {
                status: "failed",
                message:
                    "Die bestehende Crewmeister-Mitgliedschaft ist deaktiviert. Bitte in Crewmeister prüfen.",
            };
        if (member) memberId = writeResult(member).id;
    }
    if (!memberId) {
        const memberWrite = await crewmeister(
            params.auth.token,
            "/api/v3/platform-app/members",
            {
                method: "POST",
                body: JSON.stringify({
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
                }),
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
        const memberResult = writeResult(memberWrite.payload);
        memberId = memberResult.id;
        if (!memberId) {
            return {
                status: "failed",
                message:
                    memberResult.message ??
                    `Crewmeister hat keine Mitglieds-ID geliefert (HTTP ${memberWrite.response.status}).`,
            };
        }
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
        ...(reusedUser
            ? [
                  "Bitte melde dich mit deinen bestehenden Crewmeister-Zugangsdaten an. Falls du dein Passwort nicht kennst, nutze die Passwort-zurücksetzen-Funktion bei Crewmeister.",
              ]
            : [
                  `Temporäres Passwort: ${generated}`,
                  "Bitte ändere das Passwort bei der ersten Anmeldung.",
              ]),
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
