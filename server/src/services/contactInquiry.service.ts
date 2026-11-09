import { INTERNAL_SERVER_ERROR } from "@/constants/http";
import appAssert from "@/utils/appAssert";
import { sendMail } from "@/utils/sendMail";
import type { ContactInquiryInput } from "@/schemas/contact.schemas";

const DEFAULT_INQUIRY_TO = "maddoxsciuchetti@icloud.com";

export function contactInquiryRecipient() {
    const configured = process.env.CONTACT_INQUIRY_TO?.trim();
    return configured || DEFAULT_INQUIRY_TO;
}

export async function sendContactInquiry(input: ContactInquiryInput) {
    if (input.companyWebsite?.trim()) {
        return { ok: true as const, skipped: true as const };
    }

    const text = `Neue Anfrage von der HADOX-Website\n\nE-Mail: ${input.email}\n\nAnliegen:\n${input.message}`;
    const html = `
      <p><strong>Neue Anfrage von der HADOX-Website</strong></p>
      <p><strong>E-Mail:</strong> ${escapeHtml(input.email)}</p>
      <p><strong>Anliegen:</strong></p>
      <p>${escapeHtml(input.message).replace(/\n/g, "<br />")}</p>
    `;

    const sent = await sendMail({
        to: contactInquiryRecipient(),
        subject: "Hadox Anfrage",
        text,
        html,
        replyTo: input.email,
        via: "resend",
    });

    appAssert(
        !sent.error,
        INTERNAL_SERVER_ERROR,
        sent.error?.message || "E-Mail konnte nicht gesendet werden",
    );

    return { ok: true as const, skipped: false as const, id: sent.data?.id };
}

function escapeHtml(value: string) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}
