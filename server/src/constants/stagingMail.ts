import { appEnv, nodeEnv } from "@/constants/env";

/** Staging opts the Fragebogen and the Microsoft password mail onto Resend. */
export function isStagingEnvironment() {
    const app = appEnv();
    if (app) return app === "staging";
    return nodeEnv().toLowerCase() === "staging";
}
