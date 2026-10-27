import { sendMail } from "@/utils/sendMail";
import type { PasswordMailInput, PasswordMail } from "./types";

function escapeHtml(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

export function microsoftSignInUrl(workEmail: string) {
    const url = new URL("https://www.office.com/login");
    url.searchParams.set("login_hint", workEmail.trim());
    return url.toString();
}

export function passwordMail(params: PasswordMailInput): PasswordMail {
    const greeting = params.firstName.trim()
        ? `Hallo ${params.firstName.trim()},`
        : "Hallo,";
    const signInUrl = microsoftSignInUrl(params.workEmail);
    const text = [
        greeting,
        "",
        "dein Microsoft-Konto ist eingerichtet.",
        `Arbeits-E-Mail: ${params.workEmail}`,
        `Temporäres Passwort: ${params.password}`,
        `Anmeldung: ${signInUrl}`,
        "Bitte ändere das Passwort bei der ersten Anmeldung.",
    ].join("\n");
    const html = [
        `<p>${escapeHtml(greeting)}</p>`,
        "<br>",
        "<p>dein Microsoft-Konto ist eingerichtet.</p>",
        `<p>Arbeits-E-Mail: ${escapeHtml(params.workEmail)}</p>`,
        `<p>Temporäres Passwort: ${escapeHtml(params.password)}</p>`,
        `<p><a href="${escapeHtml(signInUrl)}">Bei Microsoft 365 anmelden</a></p>`,
        "<p>Bitte ändere das Passwort bei der ersten Anmeldung.</p>",
    ].join("");
    return {
        subject: "Dein Microsoft-365-Zugang",
        text,
        html,
    };
}

export async function sendPasswordMail(
    input: PasswordMailInput & { to: string; senderAddress?: string | null },
): Promise<boolean> {
    const template = passwordMail(input);
    const senderAddress = input.senderAddress?.trim() || "";
    try {
        const sent = await sendMail({
            to: input.to,
            ...(senderAddress ? { senderAddress } : {}),
            ...template,
        });
        if (sent.error) {
            console.error(
                "Microsoft 365 Passwortmail fehlgeschlagen",
                sent.error.message,
            );
        }
        return !sent.error && Boolean(sent.data?.id);
    } catch (error) {
        console.error("Microsoft 365 Passwortmail fehlgeschlagen", error);
        return false;
    }
}
