import { prisma } from "@/lib/prisma";
import { saveOrganizationIntegration } from "./store";
jest.mock("@/lib/prisma", () => ({
    prisma: {
        organizationIntegration: { findUnique: jest.fn(), upsert: jest.fn() },
    },
}));
jest.mock("./secret", () => ({
    encryptIntegrationSecret: () => "encrypted",
    IntegrationSecretUnavailable: class extends Error {},
}));
it("allows an administrator to enable Teams credentials without account-provisioning fields", async () => {
    (prisma.organizationIntegration.findUnique as jest.Mock).mockResolvedValue(
        null,
    );
    (prisma.organizationIntegration.upsert as jest.Mock).mockImplementation(
        async ({ create }) => create,
    );
    const result = await saveOrganizationIntegration({
        organizationId: "org",
        provider: "microsoft_graph",
        enabled: true,
        tenantId: "tenant",
        clientId: "client",
        clientSecret: "secret",
    });
    expect(result.enabled).toBe(true);
    expect(result.ready).toBe(false); // Existing provisioning/email readiness contract stays unchanged.
    expect(prisma.organizationIntegration.upsert).toHaveBeenCalled();
});
