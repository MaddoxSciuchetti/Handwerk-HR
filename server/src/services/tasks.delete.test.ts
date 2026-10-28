import { prisma } from "@/lib/prisma";
import { deleteTasksInOrg } from "@/services/tasks.service";

jest.mock("@/services/worker.service", () => ({
    createIssue: jest.fn(),
    updateIssue: jest.fn(),
}));

jest.mock("@/utils/sendMail", () => ({
    sendMail: jest.fn(),
}));

jest.mock("@/constants/env", () => ({
    APP_ORIGIN: "https://app.example",
}));

jest.mock("@/lib/prisma", () => ({
    prisma: {
        issue: {
            deleteMany: jest.fn(),
        },
        templateItem: {
            delete: jest.fn(),
            update: jest.fn(),
            deleteMany: jest.fn(),
        },
    },
}));

describe("deleteTasksInOrg", () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it("deletes engagement tasks and leaves the template that created them", async () => {
        (prisma.issue.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

        await expect(deleteTasksInOrg("org-1", ["issue-1"])).resolves.toEqual({
            count: 1,
        });

        expect(prisma.issue.deleteMany).toHaveBeenCalledWith({
            where: {
                id: { in: ["issue-1"] },
                OR: [{ workerEngagement: { organizationId: "org-1" } }, { organizationId: "org-1" }],
            },
        });
        expect(prisma.templateItem.delete).not.toHaveBeenCalled();
        expect(prisma.templateItem.update).not.toHaveBeenCalled();
        expect(prisma.templateItem.deleteMany).not.toHaveBeenCalled();
    });
});
