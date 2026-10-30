import { prisma } from "@/lib/prisma";
import {
    berlinToday,
    validateSchedule,
    saveDeactivationSchedule,
    claimDeactivation,
    finishDeactivation,
} from "./deactivationSchedule";
jest.mock("@/lib/prisma", () => ({
    prisma: {
        issue: {
            findFirst: jest.fn(),
            findUniqueOrThrow: jest.fn(),
            update: jest.fn(),
        },
        issueAuditLog: { create: jest.fn() },
        $transaction: jest.fn(),
        $queryRaw: jest.fn(),
    },
}));
const db = prisma as any;
const params = { organizationId: "org", issueId: "issue", actorUserId: "user" };
let issue: any;
beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date("2026-10-30T23:00:00Z"));
    issue = {
        id: "issue",
        status: "open",
        sequence: "microsoft_deactivate_account",
        scheduledDeactivateAt: new Date("2026-10-30T00:00:00Z"),
        scheduledDeactivateByUserId: "scheduler",
    };
    db.$transaction.mockImplementation((fn: any) => fn(db));
    db.issue.findFirst.mockImplementation(async () => ({ ...issue }));
    db.issue.findUniqueOrThrow.mockImplementation(async () => ({ ...issue }));
    db.issue.update.mockImplementation(async ({ data }: any) =>
        Object.assign(issue, data),
    );
});
afterEach(() => jest.useRealTimers());
it.each([
    ["2026-10-30T22:59:59Z", "2026-10-30"],
    ["2026-10-30T23:00:00Z", "2026-10-31"],
    ["2026-03-28T22:59:59Z", "2026-03-28"],
    ["2026-03-28T23:00:00Z", "2026-03-29"],
    ["2026-03-29T21:59:59Z", "2026-03-29"],
    ["2026-03-29T22:00:00Z", "2026-03-30"],
    ["2026-10-24T22:00:00Z", "2026-10-25"],
    ["2026-10-25T23:00:00Z", "2026-10-26"],
])("uses Berlin calendar date at %s", (time, expected) =>
    expect(berlinToday(new Date(time))).toBe(expected),
);
it.each(["2026-02-30", "2026-10-30", "31.10.2026", "", "garbage"])(
    "rejects invalid or past date %s",
    (date) => expect(() => validateSchedule(date)).toThrow(),
);
it("allows today and future dates", () =>
    expect(validateSchedule("2026-10-31")).toEqual(
        new Date("2026-10-31T00:00:00Z"),
    ));
it("scopes schedule edits to the organisation", async () => {
    db.issue.findFirst.mockResolvedValue(null);
    await expect(
        saveDeactivationSchedule({ ...params, scheduledDeactivateAt: null }),
    ).rejects.toThrow();
    expect(db.issue.findFirst).toHaveBeenCalledWith({
        where: { id: "issue", workerEngagement: { organizationId: "org" } },
    });
    expect(db.issue.update).not.toHaveBeenCalled();
});
it.each(["crewmeister_deactivate_account", "microsoft_deactivate_account"])(
    "schedules, changes and cancels %s without running it",
    async (sequence) => {
        issue.sequence = sequence;
        await saveDeactivationSchedule({
            ...params,
            scheduledDeactivateAt: "2026-10-31",
        });
        expect(issue.scheduledDeactivateByUserId).toBe("user");
        await saveDeactivationSchedule({
            ...params,
            scheduledDeactivateAt: "2026-11-01",
        });
        expect(issue.scheduledDeactivateAt).toEqual(
            new Date("2026-11-01T00:00:00Z"),
        );
        await saveDeactivationSchedule({
            ...params,
            scheduledDeactivateAt: null,
        });
        expect(issue.scheduledDeactivateAt).toBeNull();
        expect(issue.status).toBe("open");
    },
);
it.each(["done", "cancelled", "not_applicable"])(
    "does not schedule or claim %s tasks",
    async (status) => {
        issue.status = status;
        await expect(
            saveDeactivationSchedule({
                ...params,
                scheduledDeactivateAt: null,
            }),
        ).rejects.toThrow();
        expect(await claimDeactivation(params)).toBeNull();
    },
);
it("rejects other sequences", async () => {
    issue.sequence = "crewmeister_delete_membership";
    await expect(
        saveDeactivationSchedule({ ...params, scheduledDeactivateAt: null }),
    ).rejects.toThrow();
});
it("rejects a second run and schedule edits while a claim is active", async () => {
    expect(await claimDeactivation(params)).toBeTruthy();
    expect(await claimDeactivation(params)).toBeNull();
    await expect(
        saveDeactivationSchedule({ ...params, scheduledDeactivateAt: null }),
    ).rejects.toThrow("läuft bereits");
});
it("recovers an expired claim", async () => {
    issue.deactivationClaimUntil = new Date(Date.now() - 1);
    expect(await claimDeactivation(params)).toBeTruthy();
});
it("rechecks cancellation and changed dates before claiming cron work", async () => {
    issue.scheduledDeactivateAt = null;
    expect(await claimDeactivation({ ...params, scheduled: true })).toBeNull();
    issue.scheduledDeactivateAt = new Date("2026-10-31T00:00:00Z");
    expect(await claimDeactivation({ ...params, scheduled: true })).toBeNull();
});
it("keeps access until the last day ends", async () => {
    jest.setSystemTime(new Date("2026-10-30T22:59:59Z"));
    expect(await claimDeactivation({ ...params, scheduled: true })).toBeNull();
    jest.setSystemTime(new Date("2026-10-30T23:00:00Z"));
    expect(
        await claimDeactivation({ ...params, scheduled: true }),
    ).toMatchObject({ actorUserId: "scheduler" });
});
it.each([true, false])(
    "clears successful schedules and keeps failed ones for retry (success=%s)",
    async (succeeded) => {
        const claim = await claimDeactivation({ ...params, scheduled: true });
        await finishDeactivation({
            issueId: "issue",
            ...claim!,
            scheduled: true,
            succeeded,
            message: succeeded ? undefined : "Timeout",
        });
        expect(issue.status).toBe(succeeded ? "done" : "error");
        expect(issue.deactivationClaimToken).toBeNull();
        expect(Boolean(issue.scheduledDeactivateAt)).toBe(!succeeded);
        expect(db.issueAuditLog.create).toHaveBeenLastCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    actorUserId: "scheduler",
                    newValue: expect.objectContaining({
                        executionSource: "cron",
                    }),
                }),
            }),
        );
    },
);
it("fences off a stale worker's completion", async () => {
    issue.deactivationClaimToken = "new-claim";
    await expect(
        finishDeactivation({
            issueId: "issue",
            token: "old-claim",
            actorUserId: "user",
            succeeded: true,
        }),
    ).rejects.toThrow();
    expect(db.issue.update).not.toHaveBeenCalled();
});

it("serializes simultaneous claims through the database lock", async () => {
    // Model PostgreSQL's transaction-scoped advisory lock with a deterministic queue.
    let tail = Promise.resolve();
    db.$transaction.mockImplementation(async (fn: any) => {
        let release: (() => void) | undefined;
        const tx = {
            ...db,
            $queryRaw: async () => {
                const previous = tail;
                tail = new Promise<void>((resolve) => {
                    release = resolve;
                });
                await previous;
            },
        };
        try {
            return await fn(tx);
        } finally {
            release?.();
        }
    });
    const claims = await Promise.all([
        claimDeactivation(params),
        claimDeactivation(params),
    ]);
    expect(claims.filter(Boolean)).toHaveLength(1);
    expect(db.issue.update).toHaveBeenCalledTimes(1);
});
