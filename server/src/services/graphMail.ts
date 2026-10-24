import { BAD_REQUEST } from "@/constants/http";
import {
    MICROSOFT_GRAPH_MAILBOX,
    MICROSOFT_GRAPH_TOKEN,
} from "@/constants/env";
import AppError from "@/utils/AppError";
import { createGraphMailTokenProvider, graphMailCredentials } from "./graphMailToken";
import {
    DeliveryRejected,
    type PdfAttachment,
} from "@/services/documentDelivery";

const GRAPH = "https://graph.microsoft.com/v1.0";
const tokens = createGraphMailTokenProvider(graphMailCredentials, () => MICROSOFT_GRAPH_TOKEN);

export function graphMailConfigured() {
    return tokens.canRenew() || MICROSOFT_GRAPH_TOKEN.length > 0;
}

function mailboxPath(senderAddress = MICROSOFT_GRAPH_MAILBOX) {
    if (!senderAddress && tokens.canRenew()) {
        throw new AppError(BAD_REQUEST, "Microsoft-Mail benötigt eine Absenderadresse oder MICROSOFT_GRAPH_MAILBOX.");
    }
    if (!senderAddress) return "/me";
    return `/users/${encodeURIComponent(senderAddress)}`;
}

async function graphFetch(path: string, init?: RequestInit) {
    if (!graphMailConfigured()) {
        throw new AppError(
            BAD_REQUEST,
            "Microsoft-Mail benötigt Anwendungszugangsdaten oder einen Graph-Token in der Umgebung.",
        );
    }

    let token = await tokens.getToken();
    const request = (accessToken: string) => fetch(`${GRAPH}${path}`, {
        ...init,
        signal: init?.signal ?? AbortSignal.timeout(30_000),
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            ...(init?.headers ?? {}),
        },
    });
    let response = await request(token);
    // Retry only a definitive authentication rejection, never a timeout or ambiguous send failure.
    if (response.status === 401 && tokens.canRenew()) {
        await response.body?.cancel();
        token = await tokens.getToken(token);
        response = await request(token);
    }

    if (response.status === 202 || response.status === 204) return null;

    const text = await response.text();
    if (!response.ok) {
        let code: string | undefined;
        try {
            const candidate = JSON.parse(text)?.error?.code;
            if (typeof candidate === "string" && /^[A-Za-z0-9_.-]{1,100}$/.test(candidate)) code = candidate;
        } catch { /* Non-JSON provider response. */ }
        console.error("Microsoft Graph request failed", response.status, code ?? "UnknownError");
        if (response.status >= 400 && response.status < 500)
            throw new DeliveryRejected("Microsoft Graph rejected delivery");
        throw new AppError(
            BAD_REQUEST,
            "Microsoft Graph hat die Anfrage abgelehnt.",
        );
    }

    return text ? (JSON.parse(text) as unknown) : null;
}

export async function sendGraphMail(params: {
    to: string;
    senderAddress?: string;
    subject: string;
    html: string;
    attachments?: PdfAttachment[];
}) {
    const draft = (await graphFetch(`${mailboxPath(params.senderAddress)}/messages`, {
        method: "POST",
        body: JSON.stringify({
            subject: params.subject,
            body: { contentType: "HTML", content: params.html },
            toRecipients: [{ emailAddress: { address: params.to } }],
            ...(params.attachments
                ? {
                      attachments: params.attachments.map((a) => ({
                          "@odata.type": "#microsoft.graph.fileAttachment",
                          name: a.filename,
                          contentType: a.contentType,
                          contentBytes: a.content.toString("base64"),
                      })),
                  }
                : {}),
        }),
    })) as { id?: string; conversationId?: string } | null;

    if (!draft?.id || !draft.conversationId) {
        throw new AppError(
            BAD_REQUEST,
            "Microsoft Graph hat keine Nachrichtenkennung geliefert.",
        );
    }

    await graphFetch(
        `${mailboxPath(params.senderAddress)}/messages/${encodeURIComponent(draft.id)}/send`,
        { method: "POST" },
    );

    return { conversationId: draft.conversationId };
}

type InboxMessage = {
    id: string;
    hasAttachments?: boolean;
};

export async function findInboxReply(conversationId: string) {
    const filter = `conversationId eq '${conversationId.replaceAll("'", "''")}'`;
    const query = new URLSearchParams({
        $filter: filter,
        $select: "id,hasAttachments,receivedDateTime",
        $top: "5",
    });
    const payload = (await graphFetch(
        `${mailboxPath()}/mailFolders/inbox/messages?${query.toString()}`,
    )) as { value?: InboxMessage[] } | null;

    return payload?.value?.[0] ?? null;
}

type FileAttachment = {
    "@odata.type"?: string;
    name?: string;
    contentType?: string;
    contentBytes?: string;
};

export async function downloadReplyPdf(messageId: string) {
    const payload = (await graphFetch(
        `${mailboxPath()}/messages/${encodeURIComponent(messageId)}/attachments`,
    )) as { value?: FileAttachment[] } | null;

    const pdf = payload?.value?.find((attachment) => {
        const name = attachment.name?.toLowerCase() ?? "";
        const type = attachment.contentType?.toLowerCase() ?? "";
        return (
            attachment["@odata.type"] === "#microsoft.graph.fileAttachment" &&
            Boolean(attachment.contentBytes) &&
            (type === "application/pdf" || name.endsWith(".pdf"))
        );
    });
    if (!pdf?.contentBytes) return null;

    return {
        name: pdf.name || "Arbeitsvertrag.pdf",
        bytes: Buffer.from(pdf.contentBytes, "base64"),
    };
}
