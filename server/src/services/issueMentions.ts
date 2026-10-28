import { prisma } from "@/lib/prisma";

export function unreadMentionInclude(viewerUserId: string) {
    return {
        where: { userId: viewerUserId, seenAt: null },
        select: { id: true },
        take: 1,
    };
}

export function attachMentionFlag<T extends { mentions?: { id: string }[] }>(
    issue: T,
) {
    const { mentions, ...rest } = issue;
    return { ...rest, mentioned: (mentions?.length ?? 0) > 0 };
}

export async function recordIssueMentions(issueId: string, userIds: string[]) {
    await Promise.all(
        userIds.map((userId) =>
            prisma.issueMention.upsert({
                where: { issueId_userId: { issueId, userId } },
                create: { issueId, userId },
                update: { seenAt: null },
            }),
        ),
    );
}

export async function markIssueMentionsSeen(issueId: string, userId: string) {
    await prisma.issueMention.updateMany({
        where: { issueId, userId, seenAt: null },
        data: { seenAt: new Date() },
    });
}
