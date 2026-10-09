const getEnv = (key: string, defaultValue?: string): string => {
    const value = process.env[key] || defaultValue;

    if (value == undefined) {
        throw new Error(`Missing environment variable: ${key}`);
    }

    return value;
};

export const PORT = getEnv("PORT", "3000");
export const FRONTENDURL = getEnv("FRONTEND_URL");
export const NODE_ENV = getEnv("NODE_ENV", "development");
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
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim() ?? "";

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
