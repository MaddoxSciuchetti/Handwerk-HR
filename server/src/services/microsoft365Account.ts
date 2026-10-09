import { randomBytes } from "crypto";
import {
    MICROSOFT_365_ENV_KEYS,
    microsoft365Env,
    type Microsoft365EnvKey,
} from "@/constants/env";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/utils/sendMail";

const GRAPH = "https://graph.microsoft.com/v1.0";
const TOKEN_SCOPE = "https://graph.microsoft.com/.default";
const REQUIRED_PERMISSIONS = [
    "User.ReadWrite.All",
    "Directory.ReadWrite.All",
] as const;
const MAX_ADDRESS_ATTEMPTS = 20;

const UMLAUTS: Record<string, string> = {
    ä: "ae",
    ö: "oe",
    ü: "ue",
    ß: "ss",
    Ä: "ae",
    Ö: "oe",
    Ü: "ue",
};

export type Microsoft365AutomationStatus = {
    id: "microsoft-365";
    name: string;
    description: string;
    configured: boolean;
    missing: Microsoft365EnvKey[];
    permissions: readonly string[];
};

export type ProvisionMicrosoft365Result =
    | { status: "skipped"; reason: "not_configured" }
    | {
          status: "skipped";
          reason: "already_provisioned";
          workEmail: string;
      }
    | {
          status: "created";
          workEmail: string;
          externalId: string;
          passwordMailSent: boolean;
      }
    | { status: "failed"; message: string };

type Microsoft365Config = {
    tenantId: string;
    clientId: string;
    clientSecret: string;
    domain: string;
    licenseSkuId: string;
};

type GraphUser = {
    id?: string;
    userPrincipalName?: string;
};

export function missingMicrosoft365Env(): Microsoft365EnvKey[] {
    return MICROSOFT_365_ENV_KEYS.filter((key) => microsoft365Env(key).length === 0);
}

export function microsoft365Configured() {
    return missingMicrosoft365Env().length === 0;
}

export function microsoft365AutomationStatus(): Microsoft365AutomationStatus {
    return {
        id: "microsoft-365",
        name: "Microsoft 365 Konto anlegen",
        description:
            "Legt nach der Bestätigung des unterschriebenen Vertrags das Microsoft-Konto an, weist die Lizenz zu und speichert die Arbeits-E-Mail am Mitarbeiter.",
        configured: microsoft365Configured(),
        missing: missingMicrosoft365Env(),
        permissions: REQUIRED_PERMISSIONS,
    };
}

export function foldMailPart(value: string) {
    const folded = value
        .trim()
        .replace(/[äöüÄÖÜß]/g, (char) => UMLAUTS[char] ?? char)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ".")
        .replace(/^\.+|\.+$/g, "")
        .replace(/\.+/g, ".");
    return folded || "mitarbeiter";
}

export function buildUserPrincipalName(params: {
    firstName: string;
    lastName: string;
    domain: string;
    attempt: number;
}) {
    const local = [foldMailPart(params.firstName), foldMailPart(params.lastName)]
        .filter(Boolean)
        .join(".");
    const suffix = params.attempt > 1 ? String(params.attempt) : "";
    const domain = params.domain.trim().replace(/^@+/, "").toLowerCase();
    return `${local}${suffix}@${domain}`;
}

function readConfig(): Microsoft365Config | null {
    if (!microsoft365Configured()) return null;
    return {
        tenantId: microsoft365Env("MICROSOFT_365_TENANT_ID"),
        clientId: microsoft365Env("MICROSOFT_365_CLIENT_ID"),
        clientSecret: microsoft365Env("MICROSOFT_365_CLIENT_SECRET"),
        domain: microsoft365Env("MICROSOFT_365_DOMAIN"),
        licenseSkuId: microsoft365Env("MICROSOFT_365_LICENSE_SKU_ID"),
    };
}

function temporaryPassword() {
    const alphabet =
        "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    const bytes = randomBytes(16);
    let password = "Aa1!";
    for (let index = 0; index < 12; index += 1) {
        password += alphabet[bytes[index] % alphabet.length];
    }
    return password;
}

async function readBody(response: Response) {
    const text = await response.text();
    if (!text) return null;
    try {
        return JSON.parse(text) as unknown;
    } catch {
        return text;
    }
}

async function graphToken(config: Microsoft365Config) {
    const body = new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        scope: TOKEN_SCOPE,
        grant_type: "client_credentials",
    });
    const response = await fetch(
        `https://login.microsoftonline.com/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/token`,
        {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body,
        },
    );
    const payload = await readBody(response);
    const token =
        payload &&
        typeof payload === "object" &&
        "access_token" in payload &&
        typeof payload.access_token === "string"
            ? payload.access_token
            : "";
    if (!response.ok || !token) {
        console.error(
            "Microsoft 365 token request failed",
            response.status,
        );
        return null;
    }
    return token;
}

async function graphRequest(
    token: string,
    path: string,
    init?: RequestInit,
) {
    const response = await fetch(`${GRAPH}${path}`, {
        ...init,
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            ...(init?.headers ?? {}),
        },
    });
    const payload = await readBody(response);
    return { response, payload };
}

async function createGraphUser(params: {
    token: string;
    config: Microsoft365Config;
    firstName: string;
    lastName: string;
    password: string;
}) {
    for (let attempt = 1; attempt <= MAX_ADDRESS_ATTEMPTS; attempt += 1) {
        const userPrincipalName = buildUserPrincipalName({
            firstName: params.firstName,
            lastName: params.lastName,
            domain: params.config.domain,
            attempt,
        });
        const mailNickname = userPrincipalName.split("@")[0].slice(0, 64);
        const { response, payload } = await graphRequest(params.token, "/users", {
            method: "POST",
            body: JSON.stringify({
                accountEnabled: true,
                displayName: `${params.firstName.trim()} ${params.lastName.trim()}`.trim(),
                mailNickname,
                userPrincipalName,
                usageLocation: "DE",
                passwordProfile: {
                    forceChangePasswordNextSignIn: true,
                    password: params.password,
                },
            }),
        });

        if (response.status === 409) continue;

        if (!response.ok) {
            console.error(
                "Microsoft 365 user create failed",
                response.status,
            );
            return {
                ok: false as const,
                message: "Microsoft Graph hat das Konto abgelehnt.",
            };
        }

        const user = payload as GraphUser | null;
        const externalId = user?.id?.trim() ?? "";
        const workEmail = user?.userPrincipalName?.trim() || userPrincipalName;
        if (!externalId) {
            return {
                ok: false as const,
                message: "Microsoft Graph hat keine Benutzerkennung geliefert.",
            };
        }
        return { ok: true as const, externalId, workEmail };
    }

    return {
        ok: false as const,
        message: "Die Arbeits-E-Mail ist bereits vergeben.",
    };
}

async function assignLicense(params: {
    token: string;
    externalId: string;
    licenseSkuId: string;
}) {
    const { response } = await graphRequest(
        params.token,
        `/users/${encodeURIComponent(params.externalId)}/assignLicense`,
        {
            method: "POST",
            body: JSON.stringify({
                addLicenses: [{ skuId: params.licenseSkuId }],
                removeLicenses: [],
            }),
        },
    );
    if (!response.ok) {
        console.error("Microsoft 365 license assignment failed", response.status);
        return false;
    }
    return true;
}

function escapeHtml(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function passwordMail(params: {
    firstName: string;
    workEmail: string;
    password: string;
}) {
    const greeting = params.firstName.trim()
        ? `Hallo ${params.firstName.trim()},`
        : "Hallo,";
    const text = [
        greeting,
        "",
        "dein Microsoft-Konto ist eingerichtet.",
        `Arbeits-E-Mail: ${params.workEmail}`,
        `Temporäres Passwort: ${params.password}`,
        "Bitte ändere das Passwort bei der ersten Anmeldung.",
    ].join("\n");
    const html = text
        .split("\n")
        .map((line) => (line ? `<p>${escapeHtml(line)}</p>` : "<br>"))
        .join("");
    return {
        subject: "Dein Microsoft-365-Zugang",
        text,
        html,
    };
}

export async function provisionMicrosoft365Account(params: {
    organizationId: string;
    workerId: string;
}): Promise<ProvisionMicrosoft365Result> {
    const config = readConfig();
    if (!config) return { status: "skipped", reason: "not_configured" };

    const worker = await prisma.worker.findFirst({
        where: { id: params.workerId, organizationId: params.organizationId },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            workEmail: true,
            externalAccounts: {
                where: { provider: "microsoft_365" },
                select: { externalId: true },
                take: 1,
            },
        },
    });
    if (!worker) {
        return { status: "failed", message: "Mitarbeiter nicht gefunden." };
    }

    const existing = worker.externalAccounts[0];
    if (existing) {
        return {
            status: "skipped",
            reason: "already_provisioned",
            workEmail: worker.workEmail ?? "",
        };
    }

    const token = await graphToken(config);
    if (!token) {
        return {
            status: "failed",
            message: "Microsoft Graph hat die Anmeldung abgelehnt.",
        };
    }

    const password = temporaryPassword();
    const created = await createGraphUser({
        token,
        config,
        firstName: worker.firstName,
        lastName: worker.lastName,
        password,
    });
    if (!created.ok) return { status: "failed", message: created.message };

    const licensed = await assignLicense({
        token,
        externalId: created.externalId,
        licenseSkuId: config.licenseSkuId,
    });
    if (!licensed) {
        await graphRequest(
            token,
            `/users/${encodeURIComponent(created.externalId)}`,
            { method: "DELETE" },
        );
        return {
            status: "failed",
            message: "Microsoft Graph hat die Lizenz abgelehnt.",
        };
    }

    await prisma.$transaction(async (tx) => {
        await tx.worker.update({
            where: { id: worker.id },
            data: { workEmail: created.workEmail },
        });
        await tx.workerExternalAccount.upsert({
            where: {
                workerId_provider: {
                    workerId: worker.id,
                    provider: "microsoft_365",
                },
            },
            create: {
                workerId: worker.id,
                provider: "microsoft_365",
                externalId: created.externalId,
                status: "active",
            },
            update: {
                externalId: created.externalId,
                status: "active",
            },
        });
    });

    const template = passwordMail({
        firstName: worker.firstName,
        workEmail: created.workEmail,
        password,
    });
    let passwordMailSent = false;
    try {
        const sent = await sendMail({
            to: worker.email,
            subject: template.subject,
            text: template.text,
            html: template.html,
        });
        passwordMailSent = !sent.error && Boolean(sent.data?.id);
    } catch (error) {
        console.error("Microsoft 365 Passwortmail fehlgeschlagen", error);
    }

    return {
        status: "created",
        workEmail: created.workEmail,
        externalId: created.externalId,
        passwordMailSent,
    };
}
