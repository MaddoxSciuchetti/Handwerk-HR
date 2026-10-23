import {
    applyTemplateApplication,
    templateApplicationPreview,
    templateApplyInput,
} from "./templateApplication";
import { prisma } from "@/lib/prisma";
import { runIssueSequence } from "./integrations/runSequence";
import { sendTeams } from "./microsoftTeams/messages";
import { executionStatus } from "./integrations/issueExecutionStatus";
jest.mock("@/lib/prisma", () => ({
    prisma: {
        workerEngagement: { findFirst: jest.fn() },
        issueTemplate: { findFirst: jest.fn() },
        templateApplication: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        issue: { findMany: jest.fn(), update: jest.fn() },
        $transaction: jest.fn(),
        $queryRaw: jest.fn(),
    },
}));
jest.mock("./integrations/runSequence", () => ({
    runIssueSequence: jest.fn(),
}));
jest.mock("./integrations/issueExecutionStatus", () => ({
    executionStatus: jest.fn(),
    executionError: (e: Error) => e.message,
}));
jest.mock("./integrations/store", () => ({
    listOrganizationIntegrations: jest.fn(async () => [
        { provider: "microsoft_graph", enabled: true, ready: true, live: true },
    ]),
}));
jest.mock("./microsoftTeams/connection", () => ({
    connectionStatus: jest.fn(async () => ({
        ready: true,
        live: true,
        status: "connected",
    })),
}));
jest.mock("./microsoftTeams/messages", () => ({ sendTeams: jest.fn() }));
jest.mock("./engagementMail", () => ({
    isMailSequence: (v: string) => v === "microsoft_send_email",
    normalizeRecipients: jest.fn(async (_org, recipients) => recipients),
    listBsbMailAddresses: jest.fn(async () => ({
        addresses: [{ email: "hr@example.com", kind: "mailbox" }],
    })),
}));
const db = prisma as any;
const context = {
    workerId: "worker",
    organizationId: "org",
    templateId: "template",
    actorUserId: "user",
};
const manual = templateApplyInput.parse({ workerEngagementId: "engagement" });
const item = (
    id: string,
    sequence: string | null = "microsoft_create_account",
) => ({
    id,
    title: id,
    sequence,
    integrationProvider: sequence ? "microsoft_graph" : null,
});
const createTasks = jest.fn();
beforeEach(() => {
    jest.clearAllMocks();
    db.$transaction.mockImplementation(async (fn: any) => fn(db));
    db.workerEngagement.findFirst.mockResolvedValue({ id: "engagement" });
    db.issueTemplate.findFirst.mockResolvedValue({
        id: "template",
        name: "Onboarding",
        items: [item("a"), item("b"), item("manual", null)],
    });
    db.templateApplication.findUnique.mockResolvedValue(null);
    db.templateApplication.create.mockImplementation(async ({ data }: any) => ({
        id: "application",
        ...data,
    }));
    db.templateApplication.update.mockResolvedValue({});
    db.issue.findMany.mockResolvedValue([
        { id: "issue-a", templateItemId: "a" },
        { id: "issue-b", templateItemId: "b" },
    ]);
    createTasks.mockResolvedValue({
        count: 3,
        issueIds: ["issue-a", "issue-b", "issue-manual"],
    });
    (runIssueSequence as jest.Mock).mockResolvedValue({ status: "completed" });
});
it("previews without creation or execution, scoped to the organization", async () => {
    expect(
        (await templateApplicationPreview(context, "engagement")).items,
    ).toHaveLength(3);
    expect(db.workerEngagement.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
            where: {
                id: "engagement",
                workerId: "worker",
                organizationId: "org",
            },
        }),
    );
    expect(db.issueTemplate.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
            where: { id: "template", organizationId: "org" },
        }),
    );
    expect(createTasks).not.toHaveBeenCalled();
    expect(runIssueSequence).not.toHaveBeenCalled();
    expect(db.templateApplication.create).not.toHaveBeenCalled();
});
it("defaults to manual creation with a completed receipt and no external calls", async () => {
    expect(
        await applyTemplateApplication(context, manual, createTasks),
    ).toMatchObject({ count: 3, running: false });
    expect(createTasks).toHaveBeenCalledTimes(1);
    expect(runIssueSequence).not.toHaveBeenCalled();
    expect(sendTeams).not.toHaveBeenCalled();
    expect(db.templateApplication.create).toHaveBeenCalledWith(
        expect.objectContaining({
            data: expect.objectContaining({
                runAutomation: false,
                completedAt: expect.any(Date),
            }),
        }),
    );
});
it("runs only automated tasks in order after committing creation", async () => {
    await applyTemplateApplication(
        context,
        { ...manual, runAutomation: true },
        createTasks,
    );
    expect(
        (runIssueSequence as jest.Mock).mock.calls.map(
            ([input]) => input.issueId,
        ),
    ).toEqual(["issue-a", "issue-b"]);
    expect(createTasks.mock.invocationCallOrder[0]).toBeLessThan(
        (runIssueSequence as jest.Mock).mock.invocationCallOrder[0],
    );
});
it("continues after license failures and thrown provider errors", async () => {
    (runIssueSequence as jest.Mock)
        .mockResolvedValueOnce({
            status: "failed",
            message: "Keine freie Lizenz.",
        })
        .mockRejectedValueOnce(new Error("Provider offline"));
    expect(
        (
            await applyTemplateApplication(
                context,
                { ...manual, runAutomation: true },
                createTasks,
            )
        ).outcomes,
    ).toEqual([
        {
            issueId: "issue-a",
            status: "failed",
            message: "Keine freie Lizenz.",
        },
        { issueId: "issue-b", status: "failed", message: "Provider offline" },
    ]);
    expect(executionStatus).toHaveBeenCalledWith(
        "issue-b",
        "user",
        "error",
        "Provider offline",
    );
});
it("never reruns a previously accepted application", async () => {
    db.templateApplication.findUnique.mockResolvedValue({
        id: "previous",
        templateId: "template",
        issueIds: ["existing"],
        outcomes: [],
        completedAt: null,
    });
    expect(
        await applyTemplateApplication(
            context,
            { ...manual, runAutomation: true },
            createTasks,
        ),
    ).toMatchObject({ running: true, issueIds: ["existing"] });
    expect(createTasks).not.toHaveBeenCalled();
    expect(runIssueSequence).not.toHaveBeenCalled();
});
it("rechecks the receipt under the engagement lock", async () => {
    db.templateApplication.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
            id: "raced",
            templateId: "template",
            issueIds: [],
            outcomes: [],
            completedAt: new Date(),
        });
    await applyTemplateApplication(context, manual, createTasks);
    expect(db.$queryRaw).toHaveBeenCalled();
    expect(createTasks).not.toHaveBeenCalled();
});
it("records empty template applications", async () => {
    db.issueTemplate.findFirst.mockResolvedValue({ id: "template", items: [] });
    createTasks.mockResolvedValue({ count: 0, issueIds: [] });
    expect(
        await applyTemplateApplication(context, manual, createTasks),
    ).toMatchObject({ count: 0, running: false });
    expect(db.templateApplication.create).toHaveBeenCalled();
});
it("does not run actions when task creation fails", async () => {
    createTasks.mockRejectedValueOnce(new Error("creation failed"));
    await expect(
        applyTemplateApplication(
            context,
            { ...manual, runAutomation: true },
            createTasks,
        ),
    ).rejects.toThrow("creation failed");
    expect(db.templateApplication.create).not.toHaveBeenCalled();
    expect(runIssueSequence).not.toHaveBeenCalled();
});
it("rejects engagements and templates outside the organization", async () => {
    db.workerEngagement.findFirst.mockResolvedValueOnce(null);
    await expect(
        applyTemplateApplication(context, manual, createTasks),
    ).rejects.toThrow("Einsatz nicht gefunden");
    db.issueTemplate.findFirst.mockResolvedValueOnce(null);
    await expect(
        applyTemplateApplication(context, manual, createTasks),
    ).rejects.toThrow("Template nicht gefunden");
    expect(createTasks).not.toHaveBeenCalled();
});
it.each(["microsoft_send_email", "microsoft_send_teams_message"])(
    "requires choices for %s before creation",
    async (sequence) => {
        db.issueTemplate.findFirst.mockResolvedValue({
            id: "template",
            items: [item("a", sequence)],
        });
        await expect(
            applyTemplateApplication(
                context,
                { ...manual, runAutomation: true },
                createTasks,
            ),
        ).rejects.toThrow();
        expect(createTasks).not.toHaveBeenCalled();
    },
);
it("stores mail choices per task", async () => {
    db.issueTemplate.findFirst.mockResolvedValue({
        id: "template",
        items: [item("a", "microsoft_send_email")],
    });
    const recipients = [
        { kind: "microsoft_group" as const, label: "Team", groupId: "group" },
    ];
    await applyTemplateApplication(
        context,
        {
            ...manual,
            runAutomation: true,
            choices: { a: { senderAddress: "hr@example.com", recipients } },
        },
        createTasks,
    );
    expect(db.issue.update).toHaveBeenCalledWith({
        where: { id: "issue-a" },
        data: {
            mailSenderAddress: "hr@example.com",
            automationRecipients: recipients,
        },
    });
});
it("keeps uncertain Teams deliveries for review without retrying", async () => {
    db.issueTemplate.findFirst.mockResolvedValue({
        id: "template",
        items: [item("a", "microsoft_send_teams_message")],
    });
    (sendTeams as jest.Mock).mockResolvedValue({
        status: "sending",
        destinations: [{ status: "unknown" }],
    });
    const result = await applyTemplateApplication(
        context,
        {
            ...manual,
            runAutomation: true,
            choices: {
                a: { destinations: [{ teamId: "team", channelId: "channel" }] },
            },
        },
        createTasks,
    );
    expect(result.outcomes).toEqual([
        expect.objectContaining({ issueId: "issue-a", status: "pending" }),
    ]);
    expect(sendTeams).toHaveBeenCalledTimes(1);
    expect(executionStatus).not.toHaveBeenCalledWith(
        "issue-a",
        "user",
        "error",
        expect.anything(),
    );
});

it("requires renewed confirmation when template actions changed after preview", async () => {
    await expect(
        applyTemplateApplication(
            context,
            {
                ...manual,
                runAutomation: true,
                templateRevision: "old-revision",
            },
            createTasks,
        ),
    ).rejects.toThrow("Template wurde geändert");
    expect(createTasks).not.toHaveBeenCalled();
    expect(runIssueSequence).not.toHaveBeenCalled();
});
