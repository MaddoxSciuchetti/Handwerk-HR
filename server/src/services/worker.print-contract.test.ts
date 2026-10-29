import { updateIssue } from "./worker.service";
import { freezePrintedContract } from "./employmentContract.service";
import { prisma } from "@/lib/prisma";

jest.mock("./employmentContract.service", () => ({ freezePrintedContract: jest.fn() }));
jest.mock("@/services/arbeitszeugnis", () => ({ certificateText: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
    prisma: {
        issue: { findFirst: jest.fn(), update: jest.fn() },
        issueAuditLog: { create: jest.fn() },
        $transaction: jest.fn(),
    },
}));
const db = prisma as any;
const existing = { id: "issue", kind: "contract_send", status: "open", workerEngagementId: "eng" };
const params = { issueId: "issue", workerEngagementId: "eng", actorUserId: "actor", status: "done" as const };
beforeEach(() => {
    jest.resetAllMocks();
    db.issue.findFirst.mockResolvedValue(existing);
    db.issue.update.mockImplementation(async ({ data }: any) => ({ ...existing, ...data }));
    db.$transaction.mockImplementation((run: any) => run(db));
});
it("freezes the contract in the task completion transaction", async () => {
    await updateIssue(params);
    expect(freezePrintedContract).toHaveBeenCalledWith(db, "eng");
    expect(db.issueAuditLog.create).toHaveBeenCalled();
});
it("rejects completion if the contract snapshot cannot be saved", async () => {
    (freezePrintedContract as jest.Mock).mockRejectedValue(new Error("snapshot failed"));
    await expect(updateIssue(params)).rejects.toThrow("snapshot failed");
    expect(db.issueAuditLog.create).not.toHaveBeenCalled();
    expect(db.issue.update).not.toHaveBeenCalled();
});
it("does not release the snapshot when the task is reopened", async () => {
    db.issue.findFirst.mockResolvedValue({ ...existing, status: "done" });
    await updateIssue({ ...params, status: "open" });
    expect(freezePrintedContract).not.toHaveBeenCalled();
});
it("does not freeze contracts when an unrelated task is completed", async () => {
    db.issue.findFirst.mockResolvedValue({ ...existing, kind: "standard" });
    await updateIssue(params);
    expect(freezePrintedContract).not.toHaveBeenCalled();
});
