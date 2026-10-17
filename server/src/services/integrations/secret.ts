import {
    createCipheriv,
    createDecipheriv,
    createHash,
    randomBytes,
} from "crypto";

const ALGORITHM = "aes-256-gcm";

export class IntegrationSecretUnavailable extends Error {
    constructor() {
        super(
            "Integrationsgeheimnisse können auf diesem Server nicht gespeichert werden.",
        );
    }
}

function masterKey() {
    const raw = process.env.INTEGRATION_SECRET_KEY?.trim() ?? "";
    if (!raw) return null;
    return createHash("sha256").update(raw).digest();
}

export function encryptIntegrationSecret(plain: string) {
    const key = masterKey();
    if (!key) throw new IntegrationSecretUnavailable();
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
        cipher.update(plain, "utf8"),
        cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return [
        iv.toString("base64url"),
        tag.toString("base64url"),
        encrypted.toString("base64url"),
    ].join(".");
}

export function decryptIntegrationSecret(ciphertext: string) {
    const key = masterKey();
    if (!key) return null;
    const [ivPart, tagPart, dataPart] = ciphertext.split(".");
    if (!ivPart || !tagPart || !dataPart) return null;
    try {
        const decipher = createDecipheriv(
            ALGORITHM,
            key,
            Buffer.from(ivPart, "base64url"),
        );
        decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
        const plain = Buffer.concat([
            decipher.update(Buffer.from(dataPart, "base64url")),
            decipher.final(),
        ]);
        return plain.toString("utf8");
    } catch {
        return null;
    }
}
