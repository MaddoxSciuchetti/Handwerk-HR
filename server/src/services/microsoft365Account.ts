import { microsoftAppAuthError } from "./microsoft365/authError";
import { randomBytes } from "crypto";
import type { Microsoft365EnvKey } from "@/constants/env";
import { microsoftSimulationEnabled } from "@/constants/env";
import { microsoftGraphFetch, SIMULATION_TOKEN } from "@/services/integrations/microsoftSimulation";
import { prisma } from "@/lib/prisma";
import { integrationsLive } from "@/services/integrations/runtime";
import { sendPasswordMail } from "./microsoft365/passwordMail";

const GRAPH = "https://graph.microsoft.com/v1.0";
const TOKEN_SCOPE = "https://graph.microsoft.com/.default";
const REQUIRED_PERMISSIONS = [
    "User.ReadWrite.All",
    "Directory.ReadWrite.All",
    "Mail.Send",
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
    | { status: "skipped"; reason: "not_configured" | "not_live" }
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

export async function microsoft365AutomationStatus(
    organizationId: string,
): Promise<Microsoft365AutomationStatus> {
    const row = await prisma.organizationIntegration.findUnique({
        where: {
            organizationId_provider: {
                organizationId,
                provider: "microsoft_graph",
            },
        },
        select: {
            enabled: true,
            tenantId: true,
            clientId: true,
            domain: true,
            licenseSkuId: true,
            clientSecretCiphertext: true,
        },
    });
    const missing: Microsoft365EnvKey[] = [];
    if (!row?.tenantId?.trim()) missing.push("MICROSOFT_365_TENANT_ID");
    if (!row?.clientId?.trim()) missing.push("MICROSOFT_365_CLIENT_ID");
    if (!row?.clientSecretCiphertext) missing.push("MICROSOFT_365_CLIENT_SECRET");
    if (!row?.domain?.trim()) missing.push("MICROSOFT_365_DOMAIN");
    if (!row?.licenseSkuId?.trim()) missing.push("MICROSOFT_365_LICENSE_SKU_ID");
    return {
        id: "microsoft-365",
        name: "Microsoft 365",
        description:
            "Zugangsdaten liegen unter Integrationen. Ein Konto entsteht erst, wenn die Aufgabe ausgeführt wird.",
        configured: Boolean(row?.enabled) && (microsoftSimulationEnabled() || missing.length === 0),
        missing,
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

export async function microsoftGraphToken(
    config: Microsoft365Config | null,
    onAuthError?: (message: string) => void,
) {
    if (!config) return null;
    if (microsoftSimulationEnabled()) return SIMULATION_TOKEN;
    return graphToken(config, onAuthError);
}

async function graphToken(
    config: Microsoft365Config,
    onAuthError?: (message: string) => void,
) {
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
        onAuthError?.(microsoftAppAuthError(payload, response.status));
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
    const response = await microsoftGraphFetch(`${GRAPH}${path}`, {
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

export async function provisionMicrosoft365Account(params: {
    organizationId: string;
    workerId: string;
    config: Microsoft365Config | null;
    senderAddress?: string | null;
}): Promise<ProvisionMicrosoft365Result> {
    const config = params.config;
    if (!config) return { status: "skipped", reason: "not_configured" };

    const worker = await prisma.worker.findFirst({
        where: { id: params.workerId, organizationId: params.organizationId },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            microsoftEmail: true,
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
            workEmail: worker.microsoftEmail ?? "",
        };
    }

    if (!integrationsLive() && !microsoftSimulationEnabled()) {
        return { status: "skipped", reason: "not_live" };
    }

    const token = await microsoftGraphToken(config);
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
        let deleted = false;
        try {
            const { response } = await graphRequest(
                token,
                `/users/${encodeURIComponent(created.externalId)}`,
                { method: "DELETE" },
            );
            deleted = response.status === 204;
            if (!deleted) {
                console.error("Microsoft 365 account cleanup not confirmed", response.status);
            }
        } catch {
            console.error("Microsoft 365 account cleanup request failed");
        }
        return {
            status: "failed",
            message: deleted
                ? "Microsoft Graph hat die Lizenz abgelehnt."
                : `Microsoft Graph hat die Lizenz abgelehnt. Die Löschung des neu erstellten Kontos ${created.workEmail} (ID: ${created.externalId}) wurde nicht bestätigt. Bitte prüfe das Konto in Microsoft 365, bevor du die Kontoerstellung erneut ausführst.`,
        };
    }

    await prisma.$transaction(async (tx) => {
        await tx.worker.update({
            where: { id: worker.id },
            data: { microsoftEmail: created.workEmail },
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

    if (microsoftSimulationEnabled()) {
        return {
            status: "created",
            workEmail: created.workEmail,
            externalId: created.externalId,
            passwordMailSent: false,
        };
    }
    const passwordMailSent = await sendPasswordMail({
        to: worker.email,
        firstName: worker.firstName,
        workEmail: created.workEmail,
        password,
        senderAddress: params.senderAddress,
        organizationId: params.organizationId,
    });

    return {
        status: "created",
        workEmail: created.workEmail,
        externalId: created.externalId,
        passwordMailSent,
    };
}
