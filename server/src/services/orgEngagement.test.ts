import { prisma } from "@/lib/prisma";
import { listOrgEngagements } from "./orgEngagement.service";

jest.mock("@/lib/prisma", () => ({
    prisma: { workerEngagement: { findMany: jest.fn() } },
}));

const findMany = prisma.workerEngagement.findMany as jest.Mock;

it.each([
    [[{ externalId: "  12345678-1234-1234-1234-123456789abc  " }], "12345678-1234-1234-1234-123456789abc"],
    [[], null],
    [[{ externalId: "   " }], null],
])("returns the stored Microsoft ID or null for the task form", async (externalAccounts, expected) => {
    findMany.mockResolvedValue([{
        id: "engagement-1",
        type: "offboarding",
        worker: { id: "worker-1", firstName: "Max", lastName: "Mustermann", externalAccounts },
    }]);

    await expect(listOrgEngagements("org-1")).resolves.toEqual([{
        id: "engagement-1",
        type: "offboarding",
        workerId: "worker-1",
        workerFirstName: "Max",
        workerLastName: "Mustermann",
        microsoftAccountId: expected,
    }]);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { organizationId: "org-1" },
        select: expect.objectContaining({
            worker: { select: expect.objectContaining({
                externalAccounts: {
                    where: { provider: "microsoft_365" },
                    select: { externalId: true },
                    take: 1,
                },
            }) },
        }),
    }));
});
