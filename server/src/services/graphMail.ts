import { BAD_REQUEST } from "@/constants/http";
import {
    MICROSOFT_GRAPH_MAILBOX,
    MICROSOFT_GRAPH_TOKEN,
} from "@/constants/env";
import AppError from "@/utils/AppError";

const GRAPH = "https://graph.microsoft.com/v1.0";

export function graphMailConfigured() {
    return MICROSOFT_GRAPH_TOKEN.length > 0;
}

function mailboxPath() {
    if (!MICROSOFT_GRAPH_MAILBOX) return "/me";
    return `/users/${encodeURIComponent(MICROSOFT_GRAPH_MAILBOX)}`;
}

async function graphFetch(path: string, init?: RequestInit) {
    if (!graphMailConfigured()) {
        throw new AppError(
            BAD_REQUEST,
            "Microsoft-Token fehlt in der Umgebung.",
        );
    }

    const response = await fetch(`${GRAPH}${path}`, {
        ...init,
        headers: {
            Authorization: `Bearer ${MICROSOFT_GRAPH_TOKEN}`,
            "Content-Type": "application/json",
            ...(init?.headers ?? {}),
        },
    });

    if (response.status === 202 || response.status === 204) return null;

    const text = await response.text();
    if (!response.ok) {
        console.error("Microsoft Graph request failed", response.status, text.slice(0, 500));
        throw new AppError(
            BAD_REQUEST,
            "Microsoft Graph hat die Anfrage abgelehnt.",
        );
    }

    return text ? (JSON.parse(text) as unknown) : null;
}

export async function sendGraphMail(params: {
    to: string;
    subject: string;
    html: string;
}) {
    const draft = (await graphFetch(`${mailboxPath()}/messages`, {
        method: "POST",
        body: JSON.stringify({
            subject: params.subject,
            body: { contentType: "HTML", content: params.html },
            toRecipients: [
                { emailAddress: { address: params.to } },
            ],
        }),
    })) as { id?: string; conversationId?: string } | null;

    if (!draft?.id || !draft.conversationId) {
        throw new AppError(
            BAD_REQUEST,
            "Microsoft Graph hat keine Nachrichtenkennung geliefert.",
        );
    }

    await graphFetch(
        `${mailboxPath()}/messages/${encodeURIComponent(draft.id)}/send`,
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
