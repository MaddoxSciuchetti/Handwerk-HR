import { confirmReturnedEmploymentContract } from "./signedContractReturn.service";
import { prisma } from "@/lib/prisma";
jest.mock("@/lib/prisma", () => ({
    prisma: {
        employmentContract: { findFirst: jest.fn(), updateMany: jest.fn() },
        issue: {
            findFirst: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            create: jest.fn(),
        },
        issueAuditLog: { create: jest.fn() },
        workerEngagement: { update: jest.fn() },
        issueTemplate: { findMany: jest.fn() },
        $transaction: jest.fn(),
    },
}));
jest.mock("@/config/aws", () => ({}));
jest.mock("@/config/resend", () => ({}));
jest.mock("@/services/graphMail", () => ({}));
it("completes the signed-contract task and leaves template choice to the popup", async () => {
    const db = prisma as any;
    db.$transaction.mockImplementation(async (callback: any) => callback(db));
    db.employmentContract.findFirst.mockResolvedValue({
        id: "contract",
        engagementId: "engagement",
        confirmedAt: null,
        engagement: { status: "pending" },
    });
    db.employmentContract.updateMany.mockResolvedValue({ count: 1 });
    db.issue.findFirst.mockResolvedValue({ id: "confirm" });
    db.issue.findMany.mockResolvedValue([
        {
            id: "signed",
            status: "open",
            title: "Arbeitsvertrag unterschrieben",
        },
    ]);
    await confirmReturnedEmploymentContract({
        organizationId: "org",
        workerId: "worker",
        engagementId: "engagement",
        actorUserId: "user",
        issueId: "confirm",
    });
    expect(db.issue.update).toHaveBeenCalledWith({
        where: { id: "signed" },
        data: { status: "done" },
    });
    // Task completion determines progress in the database; receipt must not overwrite it.
    expect(db.workerEngagement.update).not.toHaveBeenCalled();
    expect(db.issueTemplate.findMany).not.toHaveBeenCalled();
    expect(db.issue.create).not.toHaveBeenCalled();
});
