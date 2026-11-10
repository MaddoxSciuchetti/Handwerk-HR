import { redactFields } from "@/observability/redact";
import { serializeError } from "@/observability/logger";

describe("redactFields", () => {
    it("redacts sensitive keys and keeps safe fields", () => {
        expect(
            redactFields({
                userId: "user-1",
                password: "secret-value",
                nested: { accessToken: "tok", orgId: "org-1" },
            }),
        ).toEqual({
            userId: "user-1",
            password: "[Redacted]",
            nested: { accessToken: "[Redacted]", orgId: "org-1" },
        });
    });
});

describe("serializeError", () => {
    it("serializes Error instances with name and message", () => {
        const error = new Error("boom");
        error.name = "TestError";
        const serialized = serializeError(error);
        expect(serialized.name).toBe("TestError");
        expect(serialized.message).toBe("boom");
        expect(serialized.stack).toContain("boom");
    });

    it("serializes unknown values", () => {
        expect(serializeError("nope")).toEqual({
            name: "Error",
            message: "nope",
        });
    });
});
