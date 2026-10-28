/** Staging opts the Fragebogen and the Microsoft password mail onto Resend. */
export function isStagingEnvironment() {
    const app = process.env.APP_ENV?.trim().toLowerCase();
    if (app) return app === "staging";
    return process.env.NODE_ENV?.trim().toLowerCase() === "staging";
}
