import {
    decryptIntegrationSecret,
    encryptIntegrationSecret,
} from "@/services/integrations/secret";

describe("integration secrets", () => {
    const original = process.env.INTEGRATION_SECRET_KEY;

    afterEach(() => {
        if (original === undefined) delete process.env.INTEGRATION_SECRET_KEY;
        else process.env.INTEGRATION_SECRET_KEY = original;
    });

    it("round-trips a secret and does not store it in plaintext", () => {
        process.env.INTEGRATION_SECRET_KEY = "test-master-key";
        const ciphertext = encryptIntegrationSecret("client-secret");
        expect(ciphertext).not.toContain("client-secret");
        expect(decryptIntegrationSecret(ciphertext)).toBe("client-secret");
    });

    it("refuses to encrypt when the master key is missing", () => {
        delete process.env.INTEGRATION_SECRET_KEY;
        expect(() => encryptIntegrationSecret("client-secret")).toThrow(
            "Integrationsgeheimnisse",
        );
    });
});
