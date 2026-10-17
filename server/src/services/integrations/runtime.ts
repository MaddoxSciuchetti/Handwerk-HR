import { prisma } from "@/lib/prisma";
import { decryptIntegrationSecret } from "@/services/integrations/secret";

import type { Microsoft365Config } from "../microsoft365/types";

export type Microsoft365Credentials = Microsoft365Config;

export function integrationsLive() {
    return process.env.INTEGRATIONS_LIVE === "true";
}

export const NOT_LIVE_MESSAGE =
    "Sequenzen werden in dieser Umgebung nicht ausgeführt.";

function filled(value: string | null | undefined) {
    return value?.trim() ?? "";
}

export async function loadMicrosoft365Config(
    organizationId: string,
): Promise<Microsoft365Credentials | null> {
    const row = await prisma.organizationIntegration.findUnique({
        where: {
            organizationId_provider: {
                organizationId,
                provider: "microsoft_graph",
            },
        },
    });
    if (!row?.enabled || !row.clientSecretCiphertext) return null;
    const tenantId = filled(row.tenantId);
    const clientId = filled(row.clientId);
    const domain = filled(row.domain);
    const licenseSkuId = filled(row.licenseSkuId);
    const clientSecret = decryptIntegrationSecret(row.clientSecretCiphertext);
    if (!tenantId || !clientId || !domain || !licenseSkuId || !clientSecret) {
        return null;
    }
    return { tenantId, clientId, clientSecret, domain, licenseSkuId };
}

export async function loadCrewmeisterToken(organizationId: string) {
    const row = await prisma.organizationIntegration.findUnique({
        where: {
            organizationId_provider: {
                organizationId,
                provider: "crewmeister",
            },
        },
    });
    if (!row?.enabled || !row.tokenCiphertext) return null;
    const token = decryptIntegrationSecret(row.tokenCiphertext)?.trim() ?? "";
    if (!token) return null;
    return { token, crewId: filled(row.crewId) };
}
