import {
    applyTemplateApplication,
    templateApplicationPreview,
    templateApplyInput,
    readTemplateApplication,
    dismissTemplateApplicationResults,
} from "./templateApplication";
import { prisma } from "@/lib/prisma";
import { runIssueSequence } from "./integrations/runSequence";
import { sendTeams } from "./microsoftTeams/messages";
import { executionStatus } from "./integrations/issueExecutionStatus";
jest.mock("@/lib/prisma", () => ({
    prisma: {
        workerEngagement: { findFirst: jest.fn() },
        worker: { findFirst: jest.fn(), update: jest.fn() },
        issueTemplate: { findFirst: jest.fn() },
        templateApplication: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        issue: { findMany: jest.fn(), update: jest.fn() },
        issueAuditLog: { findMany: jest.fn() },
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
    db.worker.findFirst.mockResolvedValue({ workEmail: null });
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


describe("local integration simulation", () => {
    let previousNodeEnv: string | undefined;
    let previousMock: string | undefined;
    beforeEach(() => {
        previousNodeEnv = process.env.NODE_ENV;
        previousMock = process.env.INTEGRATIONS_MOCK;
        process.env.NODE_ENV = "development";
        process.env.INTEGRATIONS_MOCK = "true";
        jest.useFakeTimers();
    });
    afterEach(() => {
        if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
        else process.env.NODE_ENV = previousNodeEnv;
        if (previousMock === undefined) delete process.env.INTEGRATIONS_MOCK;
        else process.env.INTEGRATIONS_MOCK = previousMock;
        jest.useRealTimers();
    });
    it("unblocks preview without requiring integration credentials", async () => {
        const preview = await templateApplicationPreview(context, "engagement");
        expect(preview.mocked).toBe(true);
        expect(preview.items.every((entry) => entry.blockedReason === null)).toBe(true);
    });
    it("advances mocked tasks one at a time over ten seconds and never invokes providers", async () => {
        db.issueTemplate.findFirst.mockResolvedValue({
            id: "template",
            items: [item("a"), item("b", "microsoft_send_teams_message"), item("manual", null)],
        });
        let finished = false;
        const resultPromise = applyTemplateApplication(context, {
            ...manual, runAutomation: true,
            choices: { b: { destinations: [{ teamId: "mock-team", channelId: "mock-channel" }] } },
        }, createTasks).then((result) => { finished = true; return result; });
        await jest.advanceTimersByTimeAsync(0);
        expect(executionStatus).toHaveBeenCalledWith("issue-a", "user", "in_progress");
        expect(executionStatus).not.toHaveBeenCalledWith("issue-b", "user", "in_progress");
        await jest.advanceTimersByTimeAsync(4999);
        expect(finished).toBe(false);
        expect(executionStatus).not.toHaveBeenCalledWith("issue-a", "user", "done", expect.any(String));
        await jest.advanceTimersByTimeAsync(1);
        expect(executionStatus).toHaveBeenCalledWith("issue-a", "user", "done", expect.stringContaining("Simulation"));
        expect(executionStatus).toHaveBeenCalledWith("issue-b", "user", "in_progress");
        expect(executionStatus).not.toHaveBeenCalledWith("issue-b", "user", "done", expect.any(String));
        await jest.advanceTimersByTimeAsync(5000);
        const result = await resultPromise;
        expect(result.outcomes).toEqual([
            expect.objectContaining({ issueId: "issue-a", status: "completed" }),
            expect.objectContaining({ issueId: "issue-b", status: "completed" }),
        ]);
        expect(executionStatus).toHaveBeenCalledWith("issue-b", "user", "done", expect.stringContaining("Simulation"));
        expect(executionStatus).not.toHaveBeenCalledWith("issue-manual", "user", expect.anything());
        expect(runIssueSequence).not.toHaveBeenCalled();
        expect(sendTeams).not.toHaveBeenCalled();
    });
    it("accepts a new demo template after a finished application", async () => {
        const prior = { id: "application", templateId: "old-template", issueIds: ["old"], outcomes: [], completedAt: new Date(), idempotencyKey: "old-key" };
        db.templateApplication.findUnique.mockResolvedValue(prior);
        db.templateApplication.update.mockImplementation(async ({ data }: any) => ({ ...prior, ...data }));
        const result = await applyTemplateApplication(context, { ...manual, idempotencyKey: "new-key" }, createTasks);
        expect(createTasks).toHaveBeenCalledTimes(1);
        expect(result.issueIds).toEqual(["issue-a", "issue-b", "issue-manual"]);
        expect(db.templateApplication.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ templateId: "template", idempotencyKey: "new-key", outcomes: [] }) }));
    });
    it("does not repeat a demo run when retrying the same application key", async () => {
        db.templateApplication.findUnique.mockResolvedValue({ id: "application", templateId: "template", issueIds: ["old"], outcomes: [], completedAt: new Date(), idempotencyKey: "same-key" });
        await applyTemplateApplication(context, { ...manual, idempotencyKey: "same-key" }, createTasks);
        expect(createTasks).not.toHaveBeenCalled();
    });
    it("ignores the flag in production", async () => {
        process.env.NODE_ENV = "production";
        expect((await templateApplicationPreview(context, "engagement")).mocked).toBe(false);
        await applyTemplateApplication(context, { ...manual, runAutomation: true }, createTasks);
        expect(runIssueSequence).toHaveBeenCalledTimes(2);
    });
});


it("returns final task titles and database statuses for reopening the completed run", async () => {
    db.issue.findMany.mockResolvedValueOnce([{ id: "issue-a", templateItemId: "a" }])
        .mockResolvedValueOnce([{ id: "issue-a", title: "Microsoft-Konto", status: "done", sequence: "microsoft_create_account" }]);
    const result = await applyTemplateApplication(context, { ...manual, runAutomation: true }, createTasks);
    expect(result.tasks).toEqual([{ id: "issue-a", title: "Microsoft-Konto", status: "done", sequence: "microsoft_create_account" }]);
    expect(db.issue.findMany).toHaveBeenLastCalledWith(expect.objectContaining({
        where: { id: { in: ["issue-a", "issue-b", "issue-manual"] }, workerEngagement: { organizationId: "org" } },
        select: { id: true, title: true, status: true, sequence: true },
    }));
});


it("reads current stored task statuses instead of relying on the apply response", async () => {
    db.templateApplication.findUnique.mockResolvedValue({ templateId: "template", issueIds: ["stored-task"], outcomes: [], completedAt: new Date() });
    db.issue.findMany.mockResolvedValue([{ id: "stored-task", title: "Microsoft-Konto", status: "done", sequence: "microsoft_create_account" }]);
    const record = await readTemplateApplication(context, "engagement");
    expect(record?.result).toMatchObject({ count: 1, tasks: [{ id: "stored-task", status: "done" }] });
    expect(createTasks).not.toHaveBeenCalled();
});
it("clears the original failure after a task is retried successfully", async () => {
    db.templateApplication.findUnique.mockResolvedValue({
        templateId: "template", issueIds: ["crew"], completedAt: new Date(),
        outcomes: [{ issueId: "crew", status: "failed", message: "Mitgliedschaft deaktiviert" }],
    });
    db.issue.findMany.mockResolvedValue([
        { id: "crew", title: "Crewmeister", status: "done", sequence: "crewmeister_create_account" },
    ]);
    const record = await readTemplateApplication(context, "engagement");
    expect(record?.result.outcomes).toEqual([{ issueId: "crew", status: "completed" }]);
    expect(runIssueSequence).not.toHaveBeenCalled();
    expect(db.templateApplication.update).not.toHaveBeenCalled();
});

it("shows a retry in progress without the previous error", async () => {
    db.templateApplication.findUnique.mockResolvedValue({
        templateId: "template", issueIds: ["crew"], completedAt: new Date(),
        outcomes: [{ issueId: "crew", status: "failed", message: "Alter Fehler" }],
    });
    db.issue.findMany.mockResolvedValue([{ id: "crew", status: "in_progress" }]);
    expect((await readTemplateApplication(context, "engagement"))?.result.outcomes)
        .toEqual([{ issueId: "crew", status: "pending" }]);
});

it("uses the latest failure when a retry fails for a different reason", async () => {
    db.templateApplication.findUnique.mockResolvedValue({
        templateId: "template", issueIds: ["crew"], completedAt: new Date(),
        outcomes: [{ issueId: "crew", status: "failed", message: "Alter Fehler" }],
    });
    db.issue.findMany.mockResolvedValue([{ id: "crew", status: "error" }]);
    db.issueAuditLog.findMany.mockResolvedValue([
        { issueId: "crew", newValue: { status: "error", automationError: "Token abgelaufen" } },
    ]);
    expect((await readTemplateApplication(context, "engagement"))?.result.outcomes)
        .toEqual([{ issueId: "crew", status: "failed", message: "Token abgelaufen" }]);
    expect(db.issueAuditLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: {
            issueId: { in: ["crew"] }, action: "issue.updated",
            newValue: { path: ["status"], equals: "error" },
        },
    }));
});

it("recovers existing tasks for an older empty demo receipt", async () => {
    db.templateApplication.findUnique.mockResolvedValue({ templateId: "template", issueIds: [], outcomes: [], completedAt: new Date() });
    db.issue.findMany.mockResolvedValue([{ id: "existing", title: "Microsoft-Konto", status: "done", sequence: "microsoft_create_account" }]);
    const record = await readTemplateApplication(context, "engagement");
    expect(record?.result.count).toBe(1);
    expect(record?.result.issueIds).toEqual(["existing"]);
    expect(db.issue.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {
        workerEngagementId: "engagement", workerEngagement: { organizationId: "org" }, templateItem: { issueTemplateId: "template" },
    } }));
});
it("records that the finished bar was closed and ignores a second close", async () => {
    db.templateApplication.findUnique.mockResolvedValue({
        id: "application",
        completedAt: new Date(),
        resultsDismissedAt: null,
    });
    db.templateApplication.update.mockResolvedValue({});
    await expect(dismissTemplateApplicationResults(context, "engagement")).resolves.toEqual({ dismissed: true });
    expect(db.templateApplication.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: "application" },
        data: { resultsDismissedAt: expect.any(Date) },
    }));
    db.templateApplication.findUnique.mockResolvedValue({
        id: "application",
        completedAt: new Date(),
        resultsDismissedAt: new Date(),
    });
    db.templateApplication.update.mockClear();
    await dismissTemplateApplicationResults(context, "engagement");
    expect(db.templateApplication.update).not.toHaveBeenCalled();
});

it("does not expose saved task results from another engagement or organization", async () => {
    db.workerEngagement.findFirst.mockResolvedValue(null);
    await expect(readTemplateApplication(context, "foreign")).rejects.toThrow("Einsatz nicht gefunden");
    expect(db.templateApplication.findUnique).not.toHaveBeenCalled();
});

describe("Microsoft removal without a separate work email", () => {
    beforeEach(() => {
        db.issueTemplate.findFirst.mockResolvedValue({
            id: "template", name: "Offboarding",
            items: [item("a", "microsoft_deactivate_account")],
        });
    });
    it("does not ask for an email before creating the tasks", async () => {
        const preview = await templateApplicationPreview(context, "engagement");
        expect(preview).not.toHaveProperty("requiresWorkEmail");
        await applyTemplateApplication(context, { ...manual, runAutomation: true }, createTasks);
        expect(db.worker.update).not.toHaveBeenCalled();
        expect(createTasks).toHaveBeenCalled();
    });
});
