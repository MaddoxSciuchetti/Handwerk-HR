import { EMAIL_SENDER, FRONTENDURL } from "@/constants/env";

export function stagingOnboardingMail(): boolean {
    return process.env.NODE_ENV === "staging" ||
        process.env.APP_ENV === "staging" ||
        process.env.RENDER_SERVICE_NAME?.toLowerCase() === "bsb-onboarding-backend-development" ||
        FRONTENDURL?.replace(/\/$/, "") === "https://bsb-onboarding-frontend-development.onrender.com";
}

export function defaultQuestionnaireSender(): string | null {
    return stagingOnboardingMail() ? EMAIL_SENDER : null;
}
