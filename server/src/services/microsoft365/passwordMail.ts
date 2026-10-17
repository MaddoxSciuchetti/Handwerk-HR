import { sendMail } from "@/utils/sendMail";
import type { PasswordMailInput, PasswordMail } from "./types";

function escapeHtml(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

export function passwordMail(params: PasswordMailInput): PasswordMail {
    const greeting = params.firstName.trim()
        ? `Hallo ${params.firstName.trim()},`
        : "Hallo,";
    const text = [
        greeting,
        "",
        "dein Microsoft-Konto ist eingerichtet.",
        `Arbeits-E-Mail: ${params.workEmail}`,
        `Temporäres Passwort: ${params.password}`,
        "Bitte ändere das Passwort bei der ersten Anmeldung.",
    ].join("\n");
    const html = text
        .split("\n")
        .map((line) => (line ? `<p>${escapeHtml(line)}</p>` : "<br>"))
        .join("");
    return {
        subject: "Dein Microsoft-365-Zugang",
        text,
        html,
    };
}

export async function sendPasswordMail(
    input: PasswordMailInput & { to: string },
): Promise<boolean> {
    const template = passwordMail(input);
    try {
        const sent = await sendMail({ to: input.to, ...template });
        return !sent.error && Boolean(sent.data?.id);
    } catch (error) {
        console.error("Microsoft 365 Passwortmail fehlgeschlagen", error);
        return false;
    }
}
