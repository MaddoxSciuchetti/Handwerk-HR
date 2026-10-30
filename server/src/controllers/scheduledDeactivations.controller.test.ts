import {
    requireCronSecret,
    postScheduledDeactivations,
} from "./scheduledDeactivations.controller";
import { prisma } from "@/lib/prisma";
import { runIssueSequence } from "@/services/integrations/runSequence";
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
it("returns zero counts without due tasks", async () => {
    (prisma.issue.findMany as jest.Mock).mockResolvedValue([]);
    await postScheduledDeactivations({} as any, response, next);
    expect(response.json).toHaveBeenCalledWith({
        processed: 0,
        succeeded: 0,
        failed: 0,
    });
    expect(runIssueSequence).not.toHaveBeenCalled();
    expect(prisma.issue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
            where: expect.objectContaining({
                sequence: {
                    in: [
                        "crewmeister_deactivate_account",
                        "microsoft_deactivate_account",
                    ],
                },
                status: { in: ["open", "error", "in_progress"] },
                AND: expect.arrayContaining([
                    expect.objectContaining({
                        OR: expect.arrayContaining([
                            {
                                scheduledDeactivateTestAt: null,
                                scheduledDeactivateAt: { lt: expect.any(Date) },
                            },
                        ]),
                    }),
                ]),
            }),
            take: 25,
        }),
    );
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

it("queries due test timestamps on staging in addition to normal calendar schedules", async () => {
    const previousService = process.env.RENDER_SERVICE_ID;
    const previousFlag = process.env.DEACTIVATION_SCHEDULE_TESTS;
    try {
        process.env.RENDER_SERVICE_ID = "srv-d6dnk2vpm1nc739v1m90";
        process.env.DEACTIVATION_SCHEDULE_TESTS = "true";
        (prisma.issue.findMany as jest.Mock).mockResolvedValue([]);
        await postScheduledDeactivations({} as any, response, next);
        expect(prisma.issue.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({
            AND: expect.arrayContaining([{ OR: expect.arrayContaining([{ scheduledDeactivateTestAt: { lte: expect.any(Date) } }]) }]),
        }) }));
    } finally {
        if (previousService === undefined) delete process.env.RENDER_SERVICE_ID; else process.env.RENDER_SERVICE_ID = previousService;
        if (previousFlag === undefined) delete process.env.DEACTIVATION_SCHEDULE_TESTS; else process.env.DEACTIVATION_SCHEDULE_TESTS = previousFlag;
    }
});
