import { prisma } from "@/lib/prisma";
import {
    microsoftGraphFetch,
    SIMULATION_TOKEN,
} from "@/services/integrations/microsoftSimulation";
import { loadMicrosoft365Config } from "@/services/integrations/runtime";
import { runIssueSequence } from "@/services/integrations/runSequence";
import {
    listOrganizationIntegrations,
    saveOrganizationIntegration,
} from "@/services/integrations/store";
import { microsoftGraphToken } from "@/services/microsoft365Account";
import { welcomeMailPage } from "@/services/welcomeMail";
import { sendMail } from "@/utils/sendMail";

jest.mock("@/lib/prisma", () => ({
    prisma: {
        organizationIntegration: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            upsert: jest.fn(),
        },
        worker: { findFirst: jest.fn(), update: jest.fn() },
        workerExternalAccount: { upsert: jest.fn() },
        welcomeMailSettings: { findUnique: jest.fn() },
        departureMailSettings: { findUnique: jest.fn() },
        mailTemplate: { findFirst: jest.fn() },
        engagementMailRecipient: { findMany: jest.fn() },
        issue: { findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn(), findUniqueOrThrow: jest.fn() },
        issueAuditLog: { create: jest.fn() },
        $transaction: jest.fn(),
    },
}));
jest.mock("@/utils/sendMail", () => ({ sendMail: jest.fn() }));
jest.mock("@/services/arbeitszeugnis", () => ({}));

const envKeys = [
    "MICROSOFT_SIMULATION",
    "INTEGRATIONS_LIVE",
    "INTEGRATION_SECRET_KEY",
] as const;
const originals = envKeys.map((key) => process.env[key]);
const settings = {
    senderAddress: "admin@staging.example.test",
    groupId: "simulation-microsoft-office",
    groupName: "Büro (Test)",
    subject: "Hallo {{Vorname}}",
    body: "Willkommen {{Arbeitsmail}}",
};
const context = {
    organizationId: "org-staging",
    issueId: "issue-1",
    actorUserId: "user-1",
};

describe("Microsoft staging simulation", () => {
    let fetchSpy: jest.SpiedFunction<typeof fetch>;

    beforeEach(() => {
        jest.resetAllMocks();
        (prisma.issue.findUniqueOrThrow as jest.Mock).mockResolvedValue({ status: "open" });
        process.env.MICROSOFT_SIMULATION = "true";
        delete process.env.INTEGRATIONS_LIVE;
        delete process.env.INTEGRATION_SECRET_KEY;
        fetchSpy = jest
            .spyOn(global, "fetch")
            .mockRejectedValue(new Error("unexpected network call"));
        (
            prisma.organizationIntegration.findUnique as jest.Mock
        ).mockResolvedValue({ enabled: true });
        (
            prisma.organizationIntegration.findMany as jest.Mock
        ).mockResolvedValue([]);
        (prisma.organizationIntegration.upsert as jest.Mock).mockImplementation(
            async ({ create }) => create,
        );
        (prisma.welcomeMailSettings.findUnique as jest.Mock).mockResolvedValue(
            settings,
        );
        (
            prisma.departureMailSettings.findUnique as jest.Mock
        ).mockResolvedValue(settings);
        (prisma.mailTemplate.findFirst as jest.Mock).mockResolvedValue({
            id: "template-1", name: "Test", subject: settings.subject, body: settings.body,
        });
        (prisma.engagementMailRecipient.findMany as jest.Mock).mockResolvedValue([
            { kind: "microsoft_group", groupId: settings.groupId, label: settings.groupName },
        ]);
        (prisma.worker.findFirst as jest.Mock).mockResolvedValue({
            id: "worker-1",
            firstName: "Ada",
            lastName: "Lovelace",
            email: "ada@example.test",
            workEmail: "ada@staging.example.test",
            externalAccounts: [],
            entryDate: null,
            exitDate: null,
            position: "Test",
            welcomeMailSentAt: null,
            departureMailSentAt: null,
        });
        (prisma.issue.findMany as jest.Mock).mockResolvedValue([]);
        (prisma.$transaction as jest.Mock).mockImplementation(async (fn) =>
            fn(prisma),
        );
    });

    afterEach(() => {
        expect(fetchSpy).not.toHaveBeenCalled();
        expect(sendMail).not.toHaveBeenCalled();
        jest.restoreAllMocks();
        envKeys.forEach((key, index) => {
            if (originals[index] === undefined) delete process.env[key];
            else process.env[key] = originals[index];
        });
    });

    it("enables simulation without secrets, and exposes sample teams and the mode", async () => {
        const saved = await saveOrganizationIntegration({
            ...context,
            provider: "microsoft_graph",
            enabled: true,
        });
        expect(saved).toMatchObject({
            enabled: true,
            simulated: true,
            live: false,
            hasClientSecret: false,
        });
        expect(
            await loadMicrosoft365Config(context.organizationId),
        ).toMatchObject({ domain: "staging.example.test" });
        const page = await welcomeMailPage(context.organizationId);
        expect(page).toMatchObject({ simulated: true, groupsError: null });
        expect(page.groups).toEqual([
            { id: "simulation-microsoft-office", displayName: "Büro (Test)" },
            {
                id: "simulation-microsoft-field",
                displayName: "Handwerk (Test)",
            },
        ]);
        const integrations = await listOrganizationIntegrations(
            context.organizationId,
        );
        expect(
            integrations.find((item) => item.provider === "crewmeister")
                ?.simulated,
        ).toBe(false);
    });

    it.each([
        "microsoft_create_account",
        "microsoft_send_onboarding_email",
        "microsoft_send_offboarding_email",
        "microsoft_deactivate_account",
    ])(
        "completes %s through the normal sequence workflow without provider calls",
        async (sequence) => {
            (prisma.issue.findFirst as jest.Mock).mockResolvedValue({
                id: context.issueId,
                status: "open",
                integrationProvider: "microsoft_graph",
                sequence,
                mailTemplateId: "template-1",
                mailSenderAddress: settings.senderAddress,
                workerEngagement: { id: "engagement-1", workerId: "worker-1" },
            });
            if (sequence === "microsoft_deactivate_account") {
                (prisma.worker.findFirst as jest.Mock).mockResolvedValue({
                    id: "worker-1",
                    externalAccounts: [{ externalId: "simulation-microsoft-worker-1" }],
                });
            }
            expect(await runIssueSequence(context)).toEqual({
                status: "completed",
            });
            expect(prisma.issue.update).toHaveBeenCalledWith({
                where: { id: context.issueId },
                data: { status: "done", completedAt: expect.any(Date) },
            });
            expect(prisma.issueAuditLog.create).toHaveBeenCalled();
            if (sequence === "microsoft_create_account") {
                expect(prisma.worker.update).toHaveBeenCalledWith(
                    expect.objectContaining({
                        data: {
                            microsoftEmail: "ada.lovelace@staging.example.test",
                        },
                    }),
                );
            }
            if (sequence === "microsoft_deactivate_account") {
                expect(
                    prisma.workerExternalAccount.upsert,
                ).toHaveBeenCalledWith(
                    expect.objectContaining({
                        create: expect.objectContaining({
                            status: "disabled",
                            externalId: expect.stringMatching(
                                /^simulation-microsoft-/,
                            ),
                        }),
                    }),
                );
            }
        },
    );

    it("still simulates when live integrations are enabled", async () => {
        process.env.INTEGRATIONS_LIVE = "true";
        const config = await loadMicrosoft365Config(context.organizationId);
        expect(await microsoftGraphToken(config)).toBe(SIMULATION_TOKEN);
        expect(
            (await welcomeMailPage(context.organizationId)).groups,
        ).toHaveLength(2);
    });

    it("keeps disabled integrations disabled", async () => {
        (
            prisma.organizationIntegration.findUnique as jest.Mock
        ).mockResolvedValue({ enabled: false });
        expect(await loadMicrosoft365Config(context.organizationId)).toBeNull();
    });

    it("rejects unsupported simulation requests rather than calling Microsoft", async () => {
        await expect(
            microsoftGraphFetch("https://graph.microsoft.com/v1.0/unsupported"),
        ).rejects.toThrow("Simulation unterstützt");
    });

    it("restores normal credential and execution checks when simulation is off", async () => {
        delete process.env.MICROSOFT_SIMULATION;
        expect(await loadMicrosoft365Config(context.organizationId)).toBeNull();
        const page = await welcomeMailPage(context.organizationId);
        expect(page).toMatchObject({
            simulated: false,
            groups: [],
            groupsError:
                "Sequenzen werden in dieser Umgebung nicht ausgeführt.",
        });
        await expect(
            saveOrganizationIntegration({
                organizationId: context.organizationId,
                provider: "microsoft_graph",
                enabled: true,
            }),
        ).rejects.toMatchObject({ statusCode: 400 });
    });

    it("never forwards simulated identifiers or tokens to live Graph", async () => {
        delete process.env.MICROSOFT_SIMULATION;
        await expect(
            microsoftGraphFetch(
                "https://graph.microsoft.com/v1.0/groups/simulation-microsoft-office",
            ),
        ).rejects.toThrow("nicht live");
        await expect(
            microsoftGraphFetch("https://graph.microsoft.com/v1.0/users", {
                headers: { Authorization: `Bearer ${SIMULATION_TOKEN}` },
            }),
        ).rejects.toThrow("nicht live");
    });
});
