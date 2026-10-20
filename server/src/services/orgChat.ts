import { APP_ORIGIN } from "@/constants/env";
import { BAD_REQUEST } from "@/constants/http";
import { prisma } from "@/lib/prisma";
import AppError from "@/utils/AppError";
import { getTaskMentionTemplate } from "@/utils/emailTemplates";
import { sendMail } from "@/utils/sendMail";

const messageUserSelect = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
} as const;

function tasksPageUrl() {
    const origin = APP_ORIGIN.split(",")[0]?.trim().replace(/\/$/, "") ?? "";
    return `${origin}/tasks`;
}

export async function listOrgChatMessages(orgId: string) {
    return prisma.orgChatMessage.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "asc" },
        take: 100,
        select: {
            id: true,
            body: true,
            createdAt: true,
            user: { select: messageUserSelect },
        },
    });
}

export async function postOrgChatMessage(
    orgId: string,
    userId: string,
    payload: { body: string; mentionUserIds?: string[] },
) {
    const body = payload.body.trim();
    if (!body) {
        throw new Error("Nachricht darf nicht leer sein");
    }

    const mentionIds = [
        ...new Set(
            (payload.mentionUserIds ?? []).filter(
                (id): id is string =>
                    typeof id === "string" && id.length > 0 && id !== userId,
            ),
        ),
    ];
    const mentioned =
        mentionIds.length === 0
            ? []
            : await prisma.user.findMany({
                  where: {
                      id: { in: mentionIds },
                      organizationMembers: {
                          some: { organizationId: orgId },
                      },
                  },
                  select: messageUserSelect,
              });
    if (mentioned.length !== mentionIds.length) {
        throw new AppError(
            BAD_REQUEST,
            "Erwähnter Mitarbeiter wurde nicht gefunden",
        );
    }

    const message = await prisma.orgChatMessage.create({
        data: { organizationId: orgId, userId, body },
        select: {
            id: true,
            body: true,
            createdAt: true,
            user: { select: messageUserSelect },
        },
    });

    if (mentioned.length === 0) {
        return { message, mailFailed: false };
    }

    const actor = await prisma.user.findFirst({
        where: { id: userId },
        select: { firstName: true, lastName: true, email: true },
    });
    const senderName =
        `${actor?.firstName ?? ""} ${actor?.lastName ?? ""}`.trim() ||
        actor?.email ||
        "Ein Kollege";
    const actionUrl = tasksPageUrl();
    let mailFailed = false;

    for (const person of mentioned) {
        const recipientName =
            `${person.firstName} ${person.lastName}`.trim() || person.email;
        const template = getTaskMentionTemplate({
            recipientName,
            senderName,
            sourceTitle: "Chat",
            message: body,
            actionUrl,
        });
        const sent = await sendMail({
            to: person.email,
            subject: template.subject,
            text: template.text,
            html: template.html,
        });
        if (sent.error) mailFailed = true;
    }

    return { message, mailFailed };
}
