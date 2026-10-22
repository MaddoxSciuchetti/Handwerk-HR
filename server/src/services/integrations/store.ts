import { BAD_REQUEST } from "@/constants/http";
import { prisma } from "@/lib/prisma";
import { integrationsLive } from "@/services/integrations/runtime";
import {
    encryptIntegrationSecret,
    IntegrationSecretUnavailable,
} from "@/services/integrations/secret";
import AppError from "@/utils/AppError";
import type { IntegrationProvider } from "@prisma/client";

export type IntegrationView = {
    provider: IntegrationProvider;
    enabled: boolean;
    tenantId: string;
    clientId: string;
    domain: string;
    licenseSkuId: string;
    crewId: string;
    hasClientSecret: boolean;
    hasToken: boolean;
    ready: boolean;
    live: boolean;
};

const providers: IntegrationProvider[] = ["microsoft_graph", "crewmeister"];

function view(
    provider: IntegrationProvider,
    row: {
        enabled: boolean;
        tenantId: string | null;
        clientId: string | null;
        domain: string | null;
        licenseSkuId: string | null;
        crewId: string | null;
        clientSecretCiphertext: string | null;
        tokenCiphertext: string | null;
    } | null,
): IntegrationView {
    return {
        provider,
        enabled: row?.enabled ?? false,
        tenantId: row?.tenantId ?? "",
        clientId: row?.clientId ?? "",
        domain: row?.domain ?? "",
        licenseSkuId: row?.licenseSkuId ?? "",
        crewId: row?.crewId ?? "",
        hasClientSecret: Boolean(row?.clientSecretCiphertext),
        hasToken: Boolean(row?.tokenCiphertext),
        ready:
            provider === "microsoft_graph"
                ? Boolean(
                      row?.tenantId &&
                          row.clientId &&
                          row.domain &&
                          row.licenseSkuId &&
                          row.clientSecretCiphertext,
                  )
                : Boolean(row?.tokenCiphertext),
        live: integrationsLive(),
    };
}

export function redactIntegrationSecrets(integration: IntegrationView): IntegrationView {
    return {
        ...integration,
        tenantId: "",
        clientId: "",
        domain: "",
        licenseSkuId: "",
        crewId: "",
    };
}

export async function listOrganizationIntegrations(organizationId: string) {
    const rows = await prisma.organizationIntegration.findMany({
        where: { organizationId },
    });
    return providers.map((provider) =>
        view(provider, rows.find((row) => row.provider === provider) ?? null),
    );
}

function requireSecret(hasStored: boolean, incoming: string) {
    if (incoming || hasStored) return;
    throw new AppError(BAD_REQUEST, "Das Geheimnis fehlt.");
}

export async function saveOrganizationIntegration(params: {
    organizationId: string;
    provider: IntegrationProvider;
    enabled: boolean;
    tenantId?: string;
    clientId?: string;
    domain?: string;
    licenseSkuId?: string;
    crewId?: string;
    clientSecret?: string;
    token?: string;
}) {
    const existing = await prisma.organizationIntegration.findUnique({
        where: {
            organizationId_provider: {
                organizationId: params.organizationId,
                provider: params.provider,
            },
        },
    });
    const secret = params.clientSecret?.trim() ?? "";
    const token = params.token?.trim() ?? "";
    let clientSecretCiphertext = existing?.clientSecretCiphertext ?? null;
    let tokenCiphertext = existing?.tokenCiphertext ?? null;
    try {
        if (params.provider === "microsoft_graph" && secret) {
            clientSecretCiphertext = encryptIntegrationSecret(secret);
        }
        if (params.provider === "crewmeister" && token) {
            tokenCiphertext = encryptIntegrationSecret(token);
        }
    } catch (error) {
        if (error instanceof IntegrationSecretUnavailable) {
            throw new AppError(BAD_REQUEST, error.message);
        }
        throw error;
    }

    if (params.enabled && params.provider === "microsoft_graph") {
        const tenantId = (params.tenantId ?? existing?.tenantId ?? "").trim();
        const clientId = (params.clientId ?? existing?.clientId ?? "").trim();
        // Teams needs an app registration, while account provisioning separately requires domain/SKU.
        if (!tenantId || !clientId) {
            throw new AppError(
                BAD_REQUEST,
                "Tenant und Client sind erforderlich.",
            );
        }
        requireSecret(Boolean(clientSecretCiphertext), secret);
    }
    if (params.enabled && params.provider === "crewmeister") {
        requireSecret(Boolean(tokenCiphertext), token);
    }

    const saved = await prisma.organizationIntegration.upsert({
        where: {
            organizationId_provider: {
                organizationId: params.organizationId,
                provider: params.provider,
            },
        },
        create: {
            organizationId: params.organizationId,
            provider: params.provider,
            enabled: params.enabled,
            tenantId: params.tenantId?.trim() || null,
            clientId: params.clientId?.trim() || null,
            domain: params.domain?.trim() || null,
            licenseSkuId: params.licenseSkuId?.trim() || null,
            crewId: params.crewId?.trim() || null,
            clientSecretCiphertext,
            tokenCiphertext,
        },
        update: {
            enabled: params.enabled,
            tenantId: params.tenantId?.trim() || null,
            clientId: params.clientId?.trim() || null,
            domain: params.domain?.trim() || null,
            licenseSkuId: params.licenseSkuId?.trim() || null,
            crewId: params.crewId?.trim() || null,
            clientSecretCiphertext,
            tokenCiphertext,
        },
    });
    return view(params.provider, saved);
}
