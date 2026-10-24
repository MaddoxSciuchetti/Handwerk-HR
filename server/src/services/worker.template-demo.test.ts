import { applyIssueTemplate } from "./worker.service";
import { prisma } from "@/lib/prisma";
import { applyTemplateApplication } from "./templateApplication";

jest.mock("@/services/arbeitszeugnis", () => ({ certificateText: jest.fn() }));
jest.mock("./templateApplication", () => ({ applyTemplateApplication: jest.fn() }));
jest.mock("@/lib/prisma", () => ({ prisma: {
    worker: { findFirst: jest.fn() },
    workerEngagement: { findFirst: jest.fn() },
    issue: { findMany: jest.fn(), create: jest.fn() },
    issueAuditLog: { create: jest.fn() },
} }));
const db = prisma as any;
const items = [{ id: "a", title: "Microsoft-Konto", sequence: "microsoft_create_account", integrationProvider: "microsoft_graph" }];
const input = { workerId: "worker", organizationId: "org", workerEngagementId: "engagement", templateId: "template", actorUserId: "user", remainingOnly: true };
const originalEnv = { node: process.env.NODE_ENV, mock: process.env.INTEGRATIONS_MOCK };
beforeEach(() => {
    jest.clearAllMocks();
    db.worker.findFirst.mockResolvedValue({ id: "worker" });
    db.workerEngagement.findFirst.mockResolvedValue({ id: "engagement" });
    db.issue.findMany.mockResolvedValue([{ templateItemId: "a" }]);
    db.issue.create.mockResolvedValue({ id: "new-task" });
    (applyTemplateApplication as jest.Mock).mockImplementation(async (_context, _input, createTasks) => createTasks(db, { id: "template", items }));
});
afterEach(() => {
    if (originalEnv.node === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = originalEnv.node;
    if (originalEnv.mock === undefined) delete process.env.INTEGRATIONS_MOCK; else process.env.INTEGRATIONS_MOCK = originalEnv.mock;
});
it("creates another real task batch in local mock mode even when the controller requests only missing items", async () => {
    process.env.NODE_ENV = "development";
    process.env.INTEGRATIONS_MOCK = "true";
    expect(await applyIssueTemplate(input)).toEqual({ count: 1, issueIds: ["new-task"] });
    expect(db.issue.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ templateItemId: "a", workerEngagementId: "engagement" }) }));
});
it("keeps the missing-items restriction in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.INTEGRATIONS_MOCK = "true";
    expect(await applyIssueTemplate(input)).toEqual({ count: 0, issueIds: [] });
    expect(db.issue.create).not.toHaveBeenCalled();
});

it("forwards the entered work email to template application", async () => {
    await applyIssueTemplate({ ...input, workEmail: "worker@example.com" });
    expect(applyTemplateApplication).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ workEmail: "worker@example.com" }),
        expect.any(Function),
    );
});
