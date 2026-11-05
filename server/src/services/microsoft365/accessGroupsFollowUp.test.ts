import { ensureMicrosoftAccessGroupsFollowUp } from "./accessGroupsFollowUp";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
    prisma: {
        issue: { findFirst: jest.fn(), create: jest.fn() },
        workerEngagement: { findFirst: jest.fn() },
    },
}));

const findIssue = prisma.issue.findFirst as jest.Mock;
const createIssue = prisma.issue.create as jest.Mock;
const findEngagement = prisma.workerEngagement.findFirst as jest.Mock;

beforeEach(() => jest.clearAllMocks());

it("returns an existing open follow-up without creating another", async () => {
    findIssue.mockResolvedValue({ id: "existing" });
    await expect(
        ensureMicrosoftAccessGroupsFollowUp({
            organizationId: "org",
            engagementId: "engagement",
            actorUserId: "user",
        }),
    ).resolves.toBe("existing");
    expect(createIssue).not.toHaveBeenCalled();
});

it("creates a temporary assign-groups task when none is open", async () => {
    findIssue.mockResolvedValue(null);
    findEngagement.mockResolvedValue({ responsibleUserId: "owner" });
    createIssue.mockResolvedValue({ id: "created" });
    await expect(
        ensureMicrosoftAccessGroupsFollowUp({
            organizationId: "org",
            engagementId: "engagement",
            actorUserId: "user",
        }),
    ).resolves.toBe("created");
    expect(createIssue).toHaveBeenCalledWith({
        data: expect.objectContaining({
            workerEngagementId: "engagement",
            createdByUserId: "user",
            assigneeUserId: "owner",
            status: "open",
            isTemporary: true,
            sequence: "microsoft_assign_access_groups",
            integrationProvider: "microsoft_graph",
            title: "Microsoft-Gruppen zuweisen",
        }),
        select: { id: true },
    });
});

it("assigns the actor when the engagement has no owner", async () => {
    findIssue.mockResolvedValue(null);
    findEngagement.mockResolvedValue({ responsibleUserId: null });
    createIssue.mockResolvedValue({ id: "created" });
    await ensureMicrosoftAccessGroupsFollowUp({
        organizationId: "org",
        engagementId: "engagement",
        actorUserId: "user",
    });
    expect(createIssue).toHaveBeenCalledWith({
        data: expect.objectContaining({ assigneeUserId: "user" }),
        select: { id: true },
    });
});
