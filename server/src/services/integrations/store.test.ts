import { prisma } from "@/lib/prisma";
import {
    loadMicrosoft365Config,
    loadCrewmeisterToken,
} from "@/services/integrations/runtime";
import {
    listOrganizationIntegrations,
    saveOrganizationIntegration,
} from "@/services/integrations/store";

jest.mock("@/lib/prisma", () => ({
    prisma: {
        organizationIntegration: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            upsert: jest.fn(),
        },
    },
}));

const findUnique = prisma.organizationIntegration.findUnique as jest.Mock;
const findMany = prisma.organizationIntegration.findMany as jest.Mock;
const upsert = prisma.organizationIntegration.upsert as jest.Mock;
const microsoft = {
    organizationId: "org-staging",
    provider: "microsoft_graph" as const,
    enabled: true,
    tenantId: "a",
    clientId: "as",
    clientSecret: "dummy-client-secret",
    domain: "as",
    licenseSkuId: "as",
};

describe("integration settings on staging", () => {
    const originalKey = process.env.INTEGRATION_SECRET_KEY;
    const originalLive = process.env.INTEGRATIONS_LIVE;

    beforeEach(() => {
        jest.resetAllMocks();
        process.env.INTEGRATION_SECRET_KEY = "staging-test-encryption-key";
        delete process.env.INTEGRATIONS_LIVE;
        findUnique.mockResolvedValue(null);
        upsert.mockImplementation(async ({ create }) => create);
    });

    afterEach(() => {
        if (originalKey === undefined)
            delete process.env.INTEGRATION_SECRET_KEY;
        else process.env.INTEGRATION_SECRET_KEY = originalKey;
        if (originalLive === undefined) delete process.env.INTEGRATIONS_LIVE;
        else process.env.INTEGRATIONS_LIVE = originalLive;
        jest.restoreAllMocks();
    });

    it("saves dummy Microsoft credentials encrypted and loads them with execution off", async () => {
        const fetchSpy = jest
            .spyOn(global, "fetch")
            .mockRejectedValue(new Error("unexpected provider call"));
        const saved = await saveOrganizationIntegration(microsoft);
        const row = upsert.mock.calls[0][0].create;
        expect(row.clientSecretCiphertext).not.toContain(
            microsoft.clientSecret,
        );
        expect(saved).toMatchObject({
            enabled: true,
            hasClientSecret: true,
            live: false,
        });
        expect(saved).not.toHaveProperty("clientSecret");
        expect(saved).not.toHaveProperty("clientSecretCiphertext");

        findUnique.mockResolvedValue(row);
        findMany.mockResolvedValue([row]);
        expect(await loadMicrosoft365Config(microsoft.organizationId)).toEqual({
            tenantId: "a",
            clientId: "as",
            clientSecret: microsoft.clientSecret,
            domain: "as",
            licenseSkuId: "as",
        });
        const listed = await listOrganizationIntegrations(
            microsoft.organizationId,
        );
        expect(listed[0]).toEqual(saved);
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("preserves the saved Microsoft secret when its input is left blank", async () => {
        await saveOrganizationIntegration(microsoft);
        const row = upsert.mock.calls[0][0].create;
        findUnique.mockResolvedValue(row);
        await saveOrganizationIntegration({ ...microsoft, clientSecret: "" });
        expect(upsert.mock.calls[1][0].update.clientSecretCiphertext).toBe(
            row.clientSecretCiphertext,
        );
    });

    it("saves and loads a dummy Crewmeister token with execution off", async () => {
        const saved = await saveOrganizationIntegration({
            organizationId: microsoft.organizationId,
            provider: "crewmeister",
            enabled: true,
            token: "dummy-token",
            crewId: "42",
        });
        const row = upsert.mock.calls[0][0].create;
        expect(row.tokenCiphertext).not.toContain("dummy-token");
        expect(saved).toMatchObject({ hasToken: true, live: false });
        expect(saved).not.toHaveProperty("tokenCiphertext");
        findUnique.mockResolvedValue(row);
        expect(await loadCrewmeisterToken(microsoft.organizationId)).toEqual({
            token: "dummy-token",
            crewId: "42",
        });
    });

    it.each(["microsoft_graph", "crewmeister"] as const)(
        "explains the missing server key for %s without writing credentials",
        async (provider) => {
            delete process.env.INTEGRATION_SECRET_KEY;
            await expect(
                saveOrganizationIntegration({
                    ...microsoft,
                    provider,
                    token: "dummy-token",
                }),
            ).rejects.toMatchObject({
                statusCode: 400,
                message: expect.stringContaining("INTEGRATION_SECRET_KEY"),
            });
            expect(upsert).not.toHaveBeenCalled();
        },
    );

    it("rejects activation with incomplete Microsoft settings", async () => {
        await expect(
            saveOrganizationIntegration({ ...microsoft, tenantId: "" }),
        ).rejects.toMatchObject({ statusCode: 400 });
        expect(upsert).not.toHaveBeenCalled();
    });
});
