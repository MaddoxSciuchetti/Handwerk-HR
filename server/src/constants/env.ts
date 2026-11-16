import { resolve } from "node:path";

const getEnv = (key: string, defaultValue?: string): string => {
    const value = process.env[key] || defaultValue;

    if (value == undefined) {
        throw new Error(`Missing environment variable: ${key}`);
    }

    return value;
};

export const PORT = getEnv("PORT", "3000");
export const FRONTENDURL = getEnv("FRONTEND_URL");
/** Boot-time snapshot. Prefer `nodeEnv()` when tests mutate `process.env.NODE_ENV`. */
export const NODE_ENV = getEnv("NODE_ENV", "development");
export const nodeEnv = () => process.env.NODE_ENV?.trim() || NODE_ENV;
// Explicit staging opt-in; independent of INTEGRATIONS_LIVE and Crewmeister.
export function microsoftSimulationEnabled() {
    return process.env.MICROSOFT_SIMULATION?.trim().toLowerCase() === "true";
}
// Explicit opt-in for development/staging questionnaire responses.
export const QUESTIONNAIRE_MOCK_RESPONSES =
    process.env.QUESTIONNAIRE_MOCK_RESPONSES?.trim().toLowerCase() === "true";
export const APP_ORIGIN = getEnv("APP_ORIGIN");
export const JWT_SECRET = getEnv("JWT_SECRET");
export const JWT_REFRESH_SECRET = getEnv("JWT_REFRESH_SECRET");
export const EMAIL_SENDER = getEnv("EMAIL_SENDER");
export const RESEND_API_KEY = getEnv("RESEND_API_KEY");
export const POSTGRES_URI = getEnv("DATABASE_URL");
export const STRIPE_SECRET_KEY = getEnv("STRIPE_SECRET_KEY");
export const STRIPE_WEBHOOK_SECRET = getEnv("STRIPE_WEBHOOK_SECRET");
export const MICROSOFT_GRAPH_TOKEN =
    process.env.MICROSOFT_GRAPH_TOKEN?.trim() ?? "";
export const MICROSOFT_GRAPH_MAILBOX =
    process.env.MICROSOFT_GRAPH_MAILBOX?.trim() ?? "";
export const USE_MICROSOFT_MAIL =
    process.env.USE_MICROSOFT_MAIL?.trim().toLowerCase() === "true";
export const RESEND_INBOUND_ADDRESS =
    process.env.RESEND_INBOUND_ADDRESS?.trim() ?? "";
export const RESEND_WEBHOOK_SECRET =
    process.env.RESEND_WEBHOOK_SECRET?.trim() ?? "";
export const GOOGLE_OAUTH_CLIENT_ID =
    process.env.GOOGLE_OAUTH_CLIENT_ID?.trim() ?? "";
export const GOOGLE_OAUTH_CLIENT_SECRET =
    process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim() ?? "";
export const GOOGLE_OAUTH_REDIRECT_URI =
    process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim() ?? "";
export const GOOGLE_OAUTH_REFRESH_TOKEN =
    process.env.GOOGLE_OAUTH_REFRESH_TOKEN?.trim() ?? "";
// Getter so tests can mutate process.env.OPENAI_API_KEY between cases.
export const openAiApiKey = () => process.env.OPENAI_API_KEY?.trim() ?? "";
export const OPENAI_API_KEY = openAiApiKey();
// Document PDFs render in-process via @react-pdf/renderer using these fonts.
export const DOCUMENT_FONT_DIR =
    process.env.DOCUMENT_FONT_DIR?.trim() ||
    (NODE_ENV === "development" ? resolve("document-fonts") : "");

export const AWS_REGION = process.env.AWS_REGION?.trim() ?? "";
export const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET?.trim() ?? "";
export const contactInquiryTo = () =>
    process.env.CONTACT_INQUIRY_TO?.trim() ?? "";
export const appEnv = () => process.env.APP_ENV?.trim().toLowerCase() ?? "";
export const integrationsMockEnabled = () =>
    process.env.INTEGRATIONS_MOCK?.trim().toLowerCase() === "true";
export const LOG_LEVEL = process.env.LOG_LEVEL?.trim() ?? "";
export const OTEL_EXPORTER_OTLP_ENDPOINT =
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim() ?? "";
export const SENTRY_DSN = process.env.SENTRY_DSN?.trim() ?? "";
export const MICROSOFT_TEAMS_REDIRECT_URI =
    process.env.MICROSOFT_TEAMS_REDIRECT_URI?.trim() ?? "";

export const MICROSOFT_365_ENV_KEYS = [
    "MICROSOFT_365_TENANT_ID",
    "MICROSOFT_365_CLIENT_ID",
    "MICROSOFT_365_CLIENT_SECRET",
    "MICROSOFT_365_DOMAIN",
    "MICROSOFT_365_LICENSE_SKU_ID",
] as const;

export type Microsoft365EnvKey = (typeof MICROSOFT_365_ENV_KEYS)[number];

export function microsoft365Env(key: Microsoft365EnvKey) {
    return process.env[key]?.trim() ?? "";
}

export const CRON_SECRET = () => process.env.CRON_SECRET?.trim() ?? "";
