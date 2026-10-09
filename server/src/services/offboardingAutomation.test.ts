import { prisma } from "@/lib/prisma";
import { microsoftGraphToken } from "@/services/microsoft365Account";
import { runTaskAutomation } from "@/services/offboardingAutomation";

jest.mock("@/lib/prisma", () => ({
    prisma: {
        issue: { findFirst: jest.fn(), update: jest.fn() },
        $transaction: jest.fn(),
    },
}));

jest.mock("@/services/microsoft365Account", () => ({
    microsoftGraphToken: jest.fn(),
}));

const findIssue = prisma.issue.findFirst as jest.Mock;
const updateIssue = prisma.issue.update as jest.Mock;
const transaction = prisma.$transaction as jest.Mock;
const token = microsoftGraphToken as jest.Mock;

const issue = {
    id: "issue-1",
    status: "open",
    workerEngagement: {
        worker: {
            id: "worker-1",
            workEmail: "ada@firma.de",
            externalAccounts: [{ externalId: "graph-user-1" }],
        },
    },
};

function jsonResponse(body: unknown, status = 200) {
    return {
        ok: status >= 200 && status < 300,
        status,
        text: async () => (body == null ? "" : JSON.stringify(body)),
    } as Response;
}

describe("offboarding microsoft automation", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "error").mockImplementation(() => undefined);
        findIssue.mockResolvedValue(issue);
        updateIssue.mockResolvedValue({});
        token.mockResolvedValue("graph-token");
        transaction.mockImplementation(async (run: (tx: unknown) => unknown) => {
            const tx = {
                workerExternalAccount: { upsert: jest.fn() },
                issue: { update: jest.fn() },
                issueAuditLog: { create: jest.fn() },
            };
            await run(tx);
            return tx;
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("blocks sign-in and marks the chosen task done", async () => {
        const fetchMock = jest
            .spyOn(global, "fetch")
            .mockResolvedValueOnce(
                jsonResponse({ id: "graph-user-1", accountEnabled: true }),
            )
            .mockResolvedValueOnce(jsonResponse(null, 204))
            .mockResolvedValueOnce(
                jsonResponse({ id: "graph-user-1", accountEnabled: false }),
            );

        const result = await runTaskAutomation({
            organizationId: "org-1",
            issueId: "issue-1",
            actorUserId: "user-1",
            automation: "o365-block-signin",
        });

        expect(result).toEqual({ status: "completed", alreadyBlocked: false });
        expect(fetchMock).toHaveBeenNthCalledWith(
            2,
            "https://graph.microsoft.com/v1.0/users/graph-user-1",
            expect.objectContaining({
                method: "PATCH",
                body: JSON.stringify({ accountEnabled: false }),
            }),
        );
        expect(updateIssue).toHaveBeenCalledWith({
            where: { id: "issue-1" },
            data: { automation: "o365-block-signin" },
        });
        const tx = await transaction.mock.results[0].value;
        expect(tx.issue.update).toHaveBeenCalledWith({
            where: { id: "issue-1" },
            data: { status: "done" },
        });
        expect(tx.workerExternalAccount.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                update: { externalId: "graph-user-1", status: "disabled" },
            }),
        );
    });

    it("treats an already blocked account as success", async () => {
        jest.spyOn(global, "fetch").mockResolvedValueOnce(
            jsonResponse({ id: "graph-user-1", accountEnabled: false }),
        );

        const result = await runTaskAutomation({
            organizationId: "org-1",
            issueId: "issue-1",
            actorUserId: "user-1",
            automation: "o365-block-signin",
        });

        expect(result).toEqual({ status: "completed", alreadyBlocked: true });
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("leaves the task open when Microsoft rejects the block", async () => {
        jest.spyOn(global, "fetch")
            .mockResolvedValueOnce(
                jsonResponse({ id: "graph-user-1", accountEnabled: true }),
            )
            .mockResolvedValueOnce(jsonResponse({ error: "denied" }, 403));

        const result = await runTaskAutomation({
            organizationId: "org-1",
            issueId: "issue-1",
            actorUserId: "user-1",
            automation: "o365-block-signin",
        });

        expect(result).toEqual({
            status: "failed",
            message: "Microsoft Graph hat die Sperre abgelehnt.",
        });
        expect(transaction).not.toHaveBeenCalled();
    });
});
