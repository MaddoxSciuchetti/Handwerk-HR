import { prisma } from "@/lib/prisma";
import { createIssue } from "@/services/worker.service";
import { queryTasks, upsertIssueCommentInOrg } from "@/services/tasks.service";
import { sendMail } from "@/utils/sendMail";

jest.mock("@/lib/prisma", () => ({
    prisma: {
        issue: { findFirst: jest.fn(), findMany: jest.fn() },
        comment: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
        user: { findFirst: jest.fn(), findMany: jest.fn() },
    },
}));

jest.mock("@/services/worker.service", () => ({
    createIssue: jest.fn(),
    updateIssue: jest.fn(),
}));

jest.mock("@/utils/sendMail", () => ({
    sendMail: jest.fn(),
}));

jest.mock("@/constants/env", () => ({
    APP_ORIGIN: "https://app.example",
}));

const findIssue = prisma.issue.findFirst as jest.Mock;
const createComment = prisma.comment.create as jest.Mock;
const findUsers = prisma.user.findMany as jest.Mock;
const findUser = prisma.user.findFirst as jest.Mock;
const createMentionTask = createIssue as jest.Mock;
const mail = sendMail as jest.Mock;

const sourceIssue = {
    id: "issue-1",
    title: "Vertrag prüfen",
    workerEngagementId: "eng-1",
};

describe("task mention comments", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        findIssue.mockResolvedValue(sourceIssue);
        createComment.mockResolvedValue({ id: "comment-1" });
        findUser.mockResolvedValue({
            id: "sender",
            firstName: "Mia",
            lastName: "Meier",
            email: "mia@firma.de",
        });
        mail.mockResolvedValue({ data: { id: "mail-1" }, error: null });
        createMentionTask.mockResolvedValue({ id: "task-1" });
    });

    it("stores the mention on the source comment without creating a task and sends one email", async () => {
        findUsers.mockResolvedValue([
            {
                id: "coworker",
                firstName: "Otto",
                lastName: "Berg",
                email: "otto@firma.de",
            },
        ]);

        const result = await upsertIssueCommentInOrg("org-1", "sender", "issue-1", {
            body: "Bitte @Otto Berg schauen",
            mentionUserIds: ["coworker"],
        });

        expect(createMentionTask).not.toHaveBeenCalled();
        expect(createComment).toHaveBeenCalledWith(expect.objectContaining({
            data: {
                issueId: "issue-1",
                userId: "sender",
                body: "Bitte @Otto Berg schauen",
                mentionedUserIds: ["coworker"],
            },
        }));
        expect(mail).toHaveBeenCalledTimes(1);
        expect(mail).toHaveBeenCalledWith(
            expect.objectContaining({
                to: "otto@firma.de",
                subject: "Dringende Aufgabe: Vertrag prüfen",
                text: expect.stringContaining("https://app.example/tasks"),
            }),
        );
        expect(result.mailFailed).toBe(false);
    });

    it("stores a self-mention without a task or an email", async () => {
        const result = await upsertIssueCommentInOrg("org-1", "sender", "issue-1", {
            body: "Notiz an mich",
            mentionUserIds: ["sender"],
        });

        expect(findUsers).not.toHaveBeenCalled();
        expect(createMentionTask).not.toHaveBeenCalled();
        expect(mail).not.toHaveBeenCalled();
        expect(createComment).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ body: "Notiz an mich", userId: "sender" }),
            }),
        );
        expect(result.mailFailed).toBe(false);
    });
});


describe("task mention badges", () => {
    it("marks the original task for the current viewer without exposing comment recipients", async () => {
        const findTasks = prisma.issue.findMany as jest.Mock;
        findTasks.mockResolvedValue([
            { ...sourceIssue, assigneeUserId: "someone-else", _count: { comments: 2 } },
            { id: "other-task", _count: { comments: 0 } },
        ]);

        const tasks = await queryTasks("org-1", "coworker");

        expect(findTasks).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({ assigneeOnly: false }),
            include: expect.objectContaining({
                _count: { select: { comments: { where: { mentionedUserIds: { has: "coworker" } } } } },
            }),
        }));
        expect(tasks).toEqual([
            { ...sourceIssue, assigneeUserId: "someone-else", hasMention: true },
            { id: "other-task", hasMention: false },
        ]);
    });
});
