import crypto from "crypto";

/**
 * Generates a cryptographically secure random token.
 * This is the RAW value — carried inside the signed JWT sent to the client.
 * Never stored in the database.
 */
export const generateRawToken = (bytes: number = 64): string => {
    return crypto.randomBytes(bytes).toString("hex");
};

/**
 * SHA-256 hash of a raw token.
 * This is the ONLY value stored in the database.
 */
export const hashToken = (token: string): string => {
    return crypto.createHash("sha256").update(token).digest("hex");
};
