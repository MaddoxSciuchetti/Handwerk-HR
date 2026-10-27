import { deleteWorkers, deleteWorker, getWorkerData } from "./worker.service";
import { deleteWorkersSchema } from "@/schemas/worker.schemas";
import { prisma } from "@/lib/prisma";

jest.mock("@/services/arbeitszeugnis", () => ({ certificateText: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
    prisma: {
        worker: { findMany: jest.fn(), deleteMany: jest.fn() },
        issue: { groupBy: jest.fn() },
        $transaction: jest.fn(),
    },
}));
const db = prisma as any;
beforeEach(() => {
    jest.clearAllMocks();
    db.$transaction.mockImplementation((run: any) => run(db));
});

it("deletes a deduplicated selection in one scoped transaction", async () => {
    db.worker.findMany.mockResolvedValue([{ id: "a" }, { id: "b" }]);
    db.worker.deleteMany.mockResolvedValue({ count: 2 });
    expect(
        await deleteWorkers({
            organizationId: "org",
            workerIds: ["a", "b", "a"],
        }),
    ).toEqual({ count: 2 });
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(db.worker.deleteMany).toHaveBeenCalledTimes(1);
    expect(db.worker.deleteMany).toHaveBeenCalledWith({
        where: { organizationId: "org", id: { in: ["a", "b"] } },
    });
});
it("rejects the whole selection if any worker is outside the organization or missing", async () => {
    db.worker.findMany.mockResolvedValue([{ id: "a" }]);
    await expect(
        deleteWorkers({ organizationId: "org", workerIds: ["a", "foreign"] }),
    ).rejects.toThrow("access denied");
    expect(db.worker.deleteMany).not.toHaveBeenCalled();
});
it("uses the same cascade deletion for a single worker", async () => {
    db.worker.findMany.mockResolvedValue([{ id: "a" }]);
    await deleteWorker({ organizationId: "org", workerId: "a" });
    expect(db.worker.deleteMany).toHaveBeenCalledTimes(1);
});
it("validates non-empty worker identifiers", () => {
    expect(deleteWorkersSchema.safeParse({ workerIds: [] }).success).toBe(
        false,
    );
    expect(deleteWorkersSchema.safeParse({ workerIds: [""] }).success).toBe(
        false,
    );
    expect(
        deleteWorkersSchema.safeParse({ workerIds: ["a", "b"] }).success,
    ).toBe(true);
});
it("loads grouped counts instead of individual issues for the list", async () => {
    db.worker.findMany.mockResolvedValue([
        { id: "a", engagements: [{ id: "e" }] },
    ]);
    db.issue.groupBy.mockResolvedValue([
        { workerEngagementId: "e", status: "done", _count: { _all: 100 } },
    ]);
    const result = await getWorkerData({
        organizationId: "org",
        viewerUserId: "viewer",
        summary: true,
    });
    expect(result[0].engagements[0]).toEqual({
        id: "e",
        issueCounts: [{ status: "done", count: 100 }],
    });
    expect(
        db.worker.findMany.mock.calls[0][0].select.engagements.select.issues,
    ).toBeUndefined();
    expect(db.issue.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
            where: {
                workerEngagementId: { in: ["e"] },
                OR: [{ assigneeOnly: false }, { assigneeUserId: "viewer" }],
            },
        }),
    );
});
it("skips the issue query for an empty list", async () => {
    db.worker.findMany.mockResolvedValue([]);
    expect(
        await getWorkerData({
            organizationId: "org",
            viewerUserId: "viewer",
            summary: true,
        }),
    ).toEqual([]);
    expect(db.issue.groupBy).not.toHaveBeenCalled();
});

it("includes historical phase counts in summaries without loading issue records", async () => {
    db.worker.findMany.mockResolvedValue([{ id: "worker", engagements: [
        { id: "team", type: "transfer" }, { id: "offboarding", type: "offboarding" }, { id: "onboarding", type: "onboarding" },
    ] }]);
    db.issue.groupBy.mockResolvedValue([
        { workerEngagementId: "offboarding", status: "done", _count: { _all: 1 } },
        { workerEngagementId: "onboarding", status: "open", _count: { _all: 4 } },
    ]);
    const result = await getWorkerData({ organizationId: "org", viewerUserId: "viewer", summary: true });
    expect(db.worker.findMany.mock.calls[0][0].select.engagements.take).toBeUndefined();
    expect(result[0].engagements).toEqual([
        { id: "team", type: "transfer", issueCounts: [] },
        { id: "offboarding", type: "offboarding", issueCounts: [{ status: "done", count: 1 }] },
        { id: "onboarding", type: "onboarding", issueCounts: [{ status: "open", count: 4 }] },
    ]);
});
