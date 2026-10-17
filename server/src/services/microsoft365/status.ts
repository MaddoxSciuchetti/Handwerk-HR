import { prisma } from "@/lib/prisma";
import type { Microsoft365EnvKey } from "@/constants/env";
import type { Microsoft365AutomationStatus } from "./types";

const REQUIRED_PERMISSIONS = [
    "User.ReadWrite.All",
    "Directory.ReadWrite.All",
    "Mail.Send",
] as const;

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
    if (!row?.clientSecretCiphertext)
        missing.push("MICROSOFT_365_CLIENT_SECRET");
    if (!row?.domain?.trim()) missing.push("MICROSOFT_365_DOMAIN");
    if (!row?.licenseSkuId?.trim())
        missing.push("MICROSOFT_365_LICENSE_SKU_ID");
    return {
        id: "microsoft-365",
        name: "Microsoft 365",
        description:
            "Zugangsdaten liegen unter Integrationen. Ein Konto entsteht erst, wenn die Aufgabe ausgeführt wird.",
        configured: Boolean(row?.enabled) && missing.length === 0,
        missing,
        permissions: REQUIRED_PERMISSIONS,
    };
}
