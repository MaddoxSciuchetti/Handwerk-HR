import { metricRoute } from "@/observability/metricRoute";

describe("metricRoute", () => {
    it("keeps static paths", () => {
        expect(metricRoute("/tasks")).toBe("/tasks");
        expect(metricRoute("/auth/v2/login")).toBe("/auth/v2/login");
    });

    it("collapses UUIDs", () => {
        expect(
            metricRoute("/fragebogen/11111111-2222-3333-4444-555555555555"),
        ).toBe("/fragebogen/:id");
    });

    it("collapses numeric ids", () => {
        expect(metricRoute("/worker/42/files")).toBe("/worker/:id/files");
    });

    it("collapses 64-char hex invite tokens (not UUIDs)", () => {
        const token = "a".repeat(64);
        expect(metricRoute(`/invites/${token}`)).toBe("/invites/:token");
        expect(metricRoute(`/invites/${token}/accept`)).toBe(
            "/invites/:token/accept",
        );
    });

    it("collapses other long hex path segments", () => {
        expect(metricRoute(`/auth/v2/email/verify/${"b".repeat(32)}`)).toBe(
            "/auth/v2/email/verify/:token",
        );
    });
});
