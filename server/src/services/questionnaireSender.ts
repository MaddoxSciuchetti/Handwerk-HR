import { EMAIL_SENDER, FRONTENDURL } from "@/constants/env";

export function defaultQuestionnaireSender(): string | null {
    const staging = process.env.NODE_ENV === "staging" ||
        process.env.APP_ENV === "staging" ||
        process.env.RENDER_SERVICE_NAME?.toLowerCase() === "bsb-onboarding-backend-development" ||
        FRONTENDURL?.replace(/\/$/, "") === "https://bsb-onboarding-frontend-development.onrender.com";
    return staging ? EMAIL_SENDER : null;
}
