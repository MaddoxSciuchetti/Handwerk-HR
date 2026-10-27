import { runIssueSequence } from "./runSequence";
import { prisma } from "@/lib/prisma";
import { executionStatus } from "./issueExecutionStatus";
import { provisionMicrosoft365Account } from "../microsoft365Account";
import { deactivateCrewmeisterAccount } from "./crewmeisterAccount";
jest.mock("@/lib/prisma", () => ({
    prisma: {
        issue: { findFirst: jest.fn() },
        user: { findUnique: jest.fn() },
    },
}));
jest.mock("./issueExecutionStatus", () => ({
    executionStatus: jest.fn(),
    executionError: (error: Error) => error.message,
}));
jest.mock("../microsoft365Account", () => ({
    provisionMicrosoft365Account: jest.fn(),
}));
jest.mock("./runtime", () => ({
    loadMicrosoft365Config: jest.fn(async () => ({})),
    loadCrewmeisterToken: jest.fn(async () => ({ token: "jwt", crewId: "42" })),
    integrationsLive: () => true,
}));
jest.mock("./crewmeisterAccount", () => ({
    createCrewmeisterAccount: jest.fn(),
    deactivateCrewmeisterAccount: jest.fn(),
}));
jest.mock("../engagementMail", () => ({ isMailSequence: () => false }));
jest.mock("../offboardingAutomation", () => ({
    blockMicrosoftSignIn: jest.fn(),
}));
const input = { issueId: "issue", organizationId: "org", actorUserId: "user" };
beforeEach(() => {
    jest.clearAllMocks();
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        email: "hr@firma.de",
    });
    (prisma.issue.findFirst as jest.Mock).mockResolvedValue({
        id: "issue",
        status: "error",
        sequence: "microsoft_create_account",
        integrationProvider: "microsoft_graph",
        workerEngagement: { id: "engagement", workerId: "worker" },
    });
});
it("marks a successful retry in progress then done", async () => {
    (provisionMicrosoft365Account as jest.Mock).mockResolvedValue({
        status: "created",
    });
    expect(await runIssueSequence(input)).toEqual({ status: "completed" });
    expect(provisionMicrosoft365Account).toHaveBeenCalledWith(
        expect.objectContaining({ senderAddress: "hr@firma.de" }),
    );
    expect((executionStatus as jest.Mock).mock.calls).toEqual([
        ["issue", "user", "in_progress"],
        ["issue", "user", "done", undefined],
    ]);
});
it.each([false, true])(
    "persists returned and thrown errors (throws=%s)",
    async (throws) => {
        if (throws)
            (provisionMicrosoft365Account as jest.Mock).mockRejectedValue(
                new Error("Keine Lizenz"),
            );
        else
            (provisionMicrosoft365Account as jest.Mock).mockResolvedValue({
                status: "failed",
                message: "Keine Lizenz",
            });
        expect(await runIssueSequence(input)).toEqual({
            status: "failed",
            message: "Keine Lizenz",
        });
        expect(executionStatus).toHaveBeenLastCalledWith(
            "issue",
            "user",
            "error",
            "Keine Lizenz",
        );
    },
);
it("does not modify inaccessible tasks", async () => {
    (prisma.issue.findFirst as jest.Mock).mockResolvedValue(null);
    expect(await runIssueSequence(input)).toMatchObject({ status: "failed" });
    expect(executionStatus).not.toHaveBeenCalled();
});
it("does not rerun completed tasks", async () => {
    (prisma.issue.findFirst as jest.Mock).mockResolvedValue({
        id: "issue",
        status: "done",
    });
    expect(await runIssueSequence(input)).toEqual({ status: "completed" });
    expect(provisionMicrosoft365Account).not.toHaveBeenCalled();
});

it.each([true, false])(
    "routes Crewmeister deactivation and records its verified result (success=%s)",
    async (success) => {
        (prisma.issue.findFirst as jest.Mock).mockResolvedValue({
            id: "issue",
            status: "open",
            sequence: "crewmeister_deactivate_account",
            integrationProvider: "crewmeister",
            workerEngagement: { id: "engagement", workerId: "worker" },
        });
        (deactivateCrewmeisterAccount as jest.Mock).mockResolvedValue(
            success
                ? { status: "completed" }
                : { status: "failed", message: "Nicht bestätigt" },
        );
        expect(await runIssueSequence(input)).toEqual(
            success
                ? { status: "completed" }
                : { status: "failed", message: "Nicht bestätigt" },
        );
        expect(deactivateCrewmeisterAccount).toHaveBeenCalledWith({
            organizationId: "org",
            workerId: "worker",
            auth: { token: "jwt", crewId: "42" },
        });
        expect(executionStatus).toHaveBeenLastCalledWith(
            "issue",
            "user",
            success ? "done" : "error",
            success ? undefined : "Nicht bestätigt",
        );
    },
);
