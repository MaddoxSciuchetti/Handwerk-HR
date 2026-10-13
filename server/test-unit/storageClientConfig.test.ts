import { storageClientConfig } from "../src/config/storageClientConfig";

describe("S3 credentials", () => {
    it("uses the SDK provider chain for profiles and IAM roles", () => {
        expect(
            storageClientConfig({
                AWS_REGION: "eu-north-1",
                AWS_PROFILE: "development",
            }),
        ).toEqual({ region: "eu-north-1" });
        expect(storageClientConfig({})).not.toHaveProperty("credentials");
    });

    it("supports explicit keys and temporary session credentials", () => {
        expect(
            storageClientConfig({
                AWS_REGION: "eu-north-1",
                AWS_ACCESS_KEY_ID: "test-access",
                AWS_SECRET_ACCESS_KEY: "test-secret",
                AWS_SESSION_TOKEN: "test-session",
            }),
        ).toEqual({
            region: "eu-north-1",
            credentials: {
                accessKeyId: "test-access",
                secretAccessKey: "test-secret",
                sessionToken: "test-session",
            },
        });
    });

    it("rejects partial keys rather than falling back to another account", () => {
        expect(() =>
            storageClientConfig({ AWS_ACCESS_KEY_ID: "test-access" }),
        ).toThrow("requires both");
        expect(() =>
            storageClientConfig({ AWS_SECRET_ACCESS_KEY: "test-secret" }),
        ).toThrow("requires both");
    });
});
