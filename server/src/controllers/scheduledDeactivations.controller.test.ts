import {
    requireCronSecret,
    postScheduledDeactivations,
} from "./scheduledDeactivations.controller";
import { prisma } from "@/lib/prisma";
import { runIssueSequence } from "@/services/integrations/runSequence";
import { berlinToday } from "@/services/integrations/deactivationSchedule";

jest.mock("@/lib/prisma", () => ({
    prisma: { issue: { findMany: jest.fn() } },
}));
jest.mock("@/services/integrations/runSequence", () => ({
    runIssueSequence: jest.fn(),
}));

const originalSecret = process.env.CRON_SECRET;
let response: any;
let next: jest.Mock;

beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    response = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    process.env.CRON_SECRET = "cron-secret";
});

afterAll(() => {
    if (originalSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = originalSecret;
});

it.each([undefined, "", "Bearer wrong", "Bearer cron-secrex", "cron-secret"])(
    "rejects invalid authorization %s",
    (header) => {
        requireCronSecret({ get: () => header } as any, response, next);
        expect(response.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    },
);

it("rejects an unconfigured secret", () => {
    delete process.env.CRON_SECRET;
    requireCronSecret({ get: () => "Bearer " } as any, response, next);
    expect(response.status).toHaveBeenCalledWith(401);
});

it("accepts the exact bearer token", () => {
    requireCronSecret(
        { get: () => "Bearer cron-secret" } as any,
        response,
        next,
    );
    expect(next).toHaveBeenCalledWith();
});

it("queries due calendar schedules with claim filters and a batch limit", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-10-30T23:15:00Z"));
    (prisma.issue.findMany as jest.Mock).mockResolvedValue([]);
    await postScheduledDeactivations({} as any, response, next);
    const expectedCutoff = new Date(`${berlinToday()}T00:00:00Z`);
    expect(prisma.issue.findMany).toHaveBeenCalledWith({
        where: {
            sequence: {
                in: [
                    "crewmeister_deactivate_account",
                    "microsoft_deactivate_account",
                ],
            },
            status: { in: ["open", "error", "in_progress"] },
            scheduledDeactivateAt: { lt: expectedCutoff },
            AND: [
                {
                    OR: [
                        { deactivationClaimUntil: null },
                        { deactivationClaimUntil: { lte: expect.any(Date) } },
                    ],
                },
            ],
            workerEngagement: { isNot: null },
        },
        select: {
            id: true,
            scheduledDeactivateByUserId: true,
            workerEngagement: { select: { organizationId: true } },
        },
        orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
        take: 25,
    });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
        processed: 0,
        succeeded: 0,
        failed: 0,
    });
    expect(runIssueSequence).not.toHaveBeenCalled();
});

it("returns zero counts without due tasks", async () => {
    (prisma.issue.findMany as jest.Mock).mockResolvedValue([]);
    await postScheduledDeactivations({} as any, response, next);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
        processed: 0,
        succeeded: 0,
        failed: 0,
    });
    expect(runIssueSequence).not.toHaveBeenCalled();
});

it("runs each due task as the scheduling user and returns 200 when all succeed", async () => {
    (prisma.issue.findMany as jest.Mock).mockResolvedValue([
        {
            id: "crew",
            scheduledDeactivateByUserId: "scheduler-a",
            workerEngagement: { organizationId: "org-a" },
        },
        {
            id: "ms",
            scheduledDeactivateByUserId: "scheduler-b",
            workerEngagement: { organizationId: "org-b" },
        },
    ]);
    (runIssueSequence as jest.Mock).mockResolvedValue({ status: "completed" });
    const log = jest.spyOn(console, "info").mockImplementation();
    await postScheduledDeactivations({} as any, response, next);
    expect(runIssueSequence).toHaveBeenCalledTimes(2);
    expect(runIssueSequence).toHaveBeenCalledWith({
        issueId: "crew",
        organizationId: "org-a",
        actorUserId: "scheduler-a",
        scheduled: true,
    });
    expect(runIssueSequence).toHaveBeenCalledWith({
        issueId: "ms",
        organizationId: "org-b",
        actorUserId: "scheduler-b",
        scheduled: true,
    });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
        processed: 2,
        succeeded: 2,
        failed: 0,
    });
    log.mockRestore();
});

it("isolates individual failures, scopes executions and signals cron failure", async () => {
    (prisma.issue.findMany as jest.Mock).mockResolvedValue([
        {
            id: "a",
            scheduledDeactivateByUserId: "scheduler-a",
            workerEngagement: { organizationId: "org-a" },
        },
        {
            id: "b",
            scheduledDeactivateByUserId: "scheduler-b",
            workerEngagement: { organizationId: "org-b" },
        },
    ]);
    (runIssueSequence as jest.Mock)
        .mockResolvedValueOnce({ status: "completed" })
        .mockRejectedValueOnce(new Error("Timeout"));
    const log = jest.spyOn(console, "info").mockImplementation();
    const error = jest.spyOn(console, "error").mockImplementation();
    await postScheduledDeactivations({} as any, response, next);
    expect(runIssueSequence).toHaveBeenCalledWith({
        issueId: "a",
        organizationId: "org-a",
        actorUserId: "scheduler-a",
        scheduled: true,
    });
    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.json).toHaveBeenCalledWith({
        processed: 2,
        succeeded: 1,
        failed: 1,
    });
    expect(next).not.toHaveBeenCalled();
    log.mockRestore();
    error.mockRestore();
});

it("counts non-completed sequence results as failures for the cron exit signal", async () => {
    (prisma.issue.findMany as jest.Mock).mockResolvedValue([
        {
            id: "a",
            scheduledDeactivateByUserId: "scheduler",
            workerEngagement: { organizationId: "org" },
        },
    ]);
    (runIssueSequence as jest.Mock).mockResolvedValue({
        status: "failed",
        message: "Crewmeister timeout",
    });
    const log = jest.spyOn(console, "info").mockImplementation();
    await postScheduledDeactivations({} as any, response, next);
    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.json).toHaveBeenCalledWith({
        processed: 1,
        succeeded: 0,
        failed: 1,
    });
    log.mockRestore();
});

it("treats missing organisation or scheduling user as a failed task", async () => {
    (prisma.issue.findMany as jest.Mock).mockResolvedValue([
        {
            id: "broken",
            scheduledDeactivateByUserId: null,
            workerEngagement: { organizationId: "org" },
        },
        {
            id: "ok",
            scheduledDeactivateByUserId: "scheduler",
            workerEngagement: { organizationId: "org" },
        },
    ]);
    (runIssueSequence as jest.Mock).mockResolvedValue({ status: "completed" });
    const log = jest.spyOn(console, "info").mockImplementation();
    const error = jest.spyOn(console, "error").mockImplementation();
    await postScheduledDeactivations({} as any, response, next);
    expect(runIssueSequence).toHaveBeenCalledTimes(1);
    expect(runIssueSequence).toHaveBeenCalledWith({
        issueId: "ok",
        organizationId: "org",
        actorUserId: "scheduler",
        scheduled: true,
    });
    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.json).toHaveBeenCalledWith({
        processed: 2,
        succeeded: 1,
        failed: 1,
    });
    log.mockRestore();
    error.mockRestore();
});

it("runs due tasks concurrently up to five workers", async () => {
    const issues = Array.from({ length: 6 }, (_, index) => ({
        id: `issue-${index}`,
        scheduledDeactivateByUserId: "scheduler",
        workerEngagement: { organizationId: "org" },
    }));
    (prisma.issue.findMany as jest.Mock).mockResolvedValue(issues);
    let active = 0;
    let peak = 0;
    (runIssueSequence as jest.Mock).mockImplementation(async () => {
        active += 1;
        peak = Math.max(peak, active);
        await new Promise((resolve) => setTimeout(resolve, 20));
        active -= 1;
        return { status: "completed" };
    });
    const log = jest.spyOn(console, "info").mockImplementation();
    await postScheduledDeactivations({} as any, response, next);
    expect(runIssueSequence).toHaveBeenCalledTimes(6);
    expect(peak).toBe(5);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
        processed: 6,
        succeeded: 6,
        failed: 0,
    });
    log.mockRestore();
});
