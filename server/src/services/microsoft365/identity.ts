import { randomBytes } from "crypto";
import type { UserPrincipalNameInput } from "./types";

const UMLAUTS: Record<string, string> = {
    ä: "ae",
    ö: "oe",
    ü: "ue",
    ß: "ss",
    Ä: "ae",
    Ö: "oe",
    Ü: "ue",
};

export function foldMailPart(value: string) {
    const folded = value
        .trim()
        .replace(/[äöüÄÖÜß]/g, (char) => UMLAUTS[char] ?? char)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ".")
        .replace(/^\.+|\.+$/g, "")
        .replace(/\.+/g, ".");
    return folded || "mitarbeiter";
}

export function buildUserPrincipalName(params: UserPrincipalNameInput) {
    const local = [
        foldMailPart(params.firstName),
        foldMailPart(params.lastName),
    ]
        .filter(Boolean)
        .join(".");
    const suffix = params.attempt > 1 ? String(params.attempt) : "";
    const domain = params.domain.trim().replace(/^@+/, "").toLowerCase();
    return `${local}${suffix}@${domain}`;
}

export function temporaryPassword() {
    const alphabet =
        "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    const bytes = randomBytes(16);
    let password = "Aa1!";
    for (let index = 0; index < 12; index += 1) {
        password += alphabet[bytes[index] % alphabet.length];
    }
    return password;
}
