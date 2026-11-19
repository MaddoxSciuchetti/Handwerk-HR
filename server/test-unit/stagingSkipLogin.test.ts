import {
    stagingSkipLoginEmail,
    stagingSkipLoginEnabled,
} from "@/constants/env";

describe("stagingSkipLoginEnabled", () => {
    const original = { ...process.env };

    afterEach(() => {
        process.env = { ...original };
    });

    it("is off by default", () => {
        delete process.env.STAGING_SKIP_LOGIN;
        process.env.APP_ENV = "staging";
        expect(stagingSkipLoginEnabled()).toBe(false);
    });

    it("is on for staging when the flag is set", () => {
        process.env.STAGING_SKIP_LOGIN = "true";
        process.env.APP_ENV = "staging";
        expect(stagingSkipLoginEnabled()).toBe(true);
    });

    it("never enables for production APP_ENV", () => {
        process.env.STAGING_SKIP_LOGIN = "true";
        process.env.APP_ENV = "production";
        expect(stagingSkipLoginEnabled()).toBe(false);
    });

    it("defaults the staging user email to the seed admin", () => {
        delete process.env.STAGING_SKIP_LOGIN_EMAIL;
        expect(stagingSkipLoginEmail()).toBe("admin@example.com");
    });
});
