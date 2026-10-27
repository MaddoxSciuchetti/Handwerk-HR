import resend from "../config/resend";
import { EMAIL_SENDER, NODE_ENV, USE_MICROSOFT_MAIL } from "../constants/env";
import { loadMicrosoft365Config } from "../services/integrations/runtime";
import { mailboxOnConfiguredDomain } from "../services/microsoft365/productionSender";
import { graphMailConfigured, sendGraphMail } from "../services/graphMail";
import { organizationMailToken } from "../services/organizationMailToken";
import { recordSentEmail } from "./testEmailOutbox";
import type { PdfAttachment } from "@/services/documentDelivery";

type Params = {
    to: string;
    senderAddress?: string;
    organizationId?: string;
    subject: string;
    text: string;
    html: string;
    replyTo?: string;
    headers?: Record<string, string>;
    attachments?: PdfAttachment[];
    idempotencyKey?: string;
    via?: "resend";
};

type SendResult = {
    data: { id: string } | null;
    error: { name: string; message: string } | null;
};

function asMailError(error: unknown) {
    if (error instanceof Error) {
        return { name: error.name, message: error.message };
    }
    if (
        error &&
        typeof error === "object" &&
        "message" in error &&
        typeof error.message === "string"
    ) {
        const name =
            "name" in error && typeof error.name === "string"
                ? error.name
                : "MailError";
        return { name, message: error.message };
    }
    return { name: "MailError", message: "Mail send failed" };
}

const getFromEmail = () => EMAIL_SENDER;

const getToEmail = (to: string) => (NODE_ENV === "development" ? to : to);

export const sendMail = async ({
    to,
    senderAddress,
    organizationId,
    subject,
    text,
    html,
    replyTo,
    headers,
    attachments,
    idempotencyKey,
    via,
}: Params): Promise<SendResult> => {
    const recipient = getToEmail(to);
    if (USE_MICROSOFT_MAIL && via !== "resend") {
        try {
            const config = organizationId
                ? await loadMicrosoft365Config(organizationId)
                : null;
            const accessToken = organizationId
                ? await organizationMailToken(organizationId)
                : null;
            if (!accessToken && !graphMailConfigured()) {
                return {
                    data: null,
                    error: {
                        name: "MailError",
                        message: "Microsoft-Mail ist für diese Organisation nicht eingerichtet.",
                    },
                };
            }
            const sent = await sendGraphMail({
                to: recipient,
                senderAddress: mailboxOnConfiguredDomain(
                    senderAddress,
                    config?.domain,
                ),
                ...(accessToken ? { accessToken } : {}),
                subject,
                html,
                attachments,
            });
            recordSentEmail({
                to: recipient,
                subject,
                text,
                html,
                providerId: sent.conversationId,
            });
            return { data: { id: sent.conversationId }, error: null };
        } catch (error) {
            return { data: null, error: asMailError(error) };
        }
    }

    const response = await resend.emails.send(
        {
            from: senderAddress || getFromEmail(),
            to: recipient,
            subject,
            text,
            html,
            ...(replyTo ? { replyTo } : {}),
            ...(headers ? { headers } : {}),
            ...(attachments
                ? {
                      attachments: attachments.map((a) => ({
                          filename: a.filename,
                          content: a.content,
                          contentType: a.contentType,
                      })),
                  }
                : {}),
        },
        idempotencyKey ? { idempotencyKey } : undefined,
    );
    recordSentEmail({
        to: recipient,
        subject,
        text,
        html,
        providerId: response.data?.id,
    });

    return {
        data: response.data?.id ? { id: response.data.id } : null,
        error: response.error ? asMailError(response.error) : null,
    };
};
