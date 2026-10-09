import resend from "../config/resend";
import { EMAIL_SENDER, NODE_ENV, USE_MICROSOFT_MAIL } from "../constants/env";
import { sendGraphMail } from "../services/graphMail";
import { recordSentEmail } from "./testEmailOutbox";

type Params = {
    to: string;
    subject: string;
    text: string;
    html: string;
    replyTo?: string;
    headers?: Record<string, string>;
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
    subject,
    text,
    html,
    replyTo,
    headers,
}: Params): Promise<SendResult> => {
    const recipient = getToEmail(to);
    if (USE_MICROSOFT_MAIL) {
        try {
            const sent = await sendGraphMail({ to: recipient, subject, html });
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

    const response = await resend.emails.send({
        from: getFromEmail(),
        to: recipient,
        subject,
        text,
        html,
        ...(replyTo ? { replyTo } : {}),
        ...(headers ? { headers } : {}),
    });
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
