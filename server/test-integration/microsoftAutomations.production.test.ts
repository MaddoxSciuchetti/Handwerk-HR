/**
 * Production path: INTEGRATIONS_LIVE, Microsoft Graph, simulation off.
 * Mail is sent as the domain stored on the Microsoft integration.
 * Resend is never used.
 */
import { randomUUID } from "node:crypto";
import resend from "@/config/resend";
import { encryptIntegrationSecret } from "@/services/integrations/secret";
import { runIssueSequence } from "@/services/integrations/runSequence";
import { sendEngagementQuestionnaire } from "@/services/questionnaireDispatch";
import { prisma } from "@/lib/prisma";
import { accessToken } from "@/services/microsoftTeams/connection";
import { listChannels } from "@/services/microsoftTeams/graph";
import { sendTeams } from "@/services/microsoftTeams/messages";

jest.mock("@/services/questionnaireMock", () => ({
    completeMockQuestionnaire: jest.fn(),
}));

jest.mock("@/services/arbeitszeugnis", () => ({
    previewArbeitszeugnis: jest.fn(),
    sendArbeitszeugnis: jest.fn(),
    prepareArbeitszeugnisPdf: jest.fn(),
    saveArbeitszeugnisDraft: jest.fn(),
}));

jest.mock("@/constants/env", () => {
    const actual = jest.requireActual("@/constants/env");
    return {
        ...actual,
        USE_MICROSOFT_MAIL: true,
        NODE_ENV: "production",
        QUESTIONNAIRE_MOCK_RESPONSES: false,
        FRONTENDURL: "https://app.handwerk.example",
        EMAIL_SENDER: "noreply@firma.de",
        MICROSOFT_GRAPH_MAILBOX: "",
        MICROSOFT_GRAPH_TOKEN: "",
    };
});

jest.mock("@/config/resend", () => ({
    __esModule: true,
    default: { emails: { send: jest.fn() } },
}));

jest.mock("@/lib/prisma", () => ({
    prisma: {
        $transaction: jest.fn(),
        $queryRaw: jest.fn(),
        user: { findUnique: jest.fn() },
        organizationIntegration: { findUnique: jest.fn() },
        worker: { findFirst: jest.fn(), update: jest.fn() },
        workerExternalAccount: { upsert: jest.fn() },
        workerEngagement: { findFirst: jest.fn() },
        issue: {
            findFirst: jest.fn(),
            findUniqueOrThrow: jest.fn(),
            update: jest.fn(),
            createMany: jest.fn(),
        },
        issueAuditLog: { create: jest.fn() },
        mailTemplate: { findFirst: jest.fn() },
        engagementMailRecipient: { findMany: jest.fn() },
        questionnaire: { findUnique: jest.fn(), upsert: jest.fn() },
        questionnaireSubmission: { create: jest.fn() },
        documentMaster: { findFirst: jest.fn() },
        employmentContract: { create: jest.fn() },
        teamsSend: {
            findUnique: jest.fn(),
            findUniqueOrThrow: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        teamsSendDestination: {
            count: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
        },
    },
}));

jest.mock("@/services/microsoftTeams/connection", () => ({
    ...jest.requireActual("@/services/microsoftTeams/connection"),
    accessToken: jest.fn(),
    assertActiveMember: jest.fn(),
}));

jest.mock("@/services/microsoftTeams/graph", () => ({
    ...jest.requireActual("@/services/microsoftTeams/graph"),
    listChannels: jest.fn(),
}));

const ORGANIZATION_ID = "org-1";
const DOMAIN = "firma.de";
const ONMICROSOFT = "buero@contoso.onmicrosoft.com";
const PRODUCTION_SENDER = "buero@firma.de";

let issue: Record<string, unknown>;
let worker: Record<string, unknown>;
let engagement: Record<string, unknown>;
let teamsOp: any;
let fetchSpy: jest.SpiedFunction<typeof fetch>;

function json(body: unknown, status = 200) {
    return new Response(body == null ? null : JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

function graphResponse(url: string, init?: RequestInit) {
    const method = init?.method ?? "GET";
    const parsed = new URL(url);
    if (parsed.hostname === "login.microsoftonline.com") {
        return json({ access_token: "graph-token", expires_in: 3600 });
    }
    if (parsed.hostname !== "graph.microsoft.com") {
        throw new Error(`unexpected host ${parsed.hostname}`);
    }
    const path = parsed.pathname;
    if (method === "POST" && path === "/v1.0/users") {
        const body = JSON.parse(String(init?.body)) as { userPrincipalName: string };
        return json(
            { id: "graph-user-1", userPrincipalName: body.userPrincipalName },
            201,
        );
    }
    if (method === "POST" && path.endsWith("/assignLicense")) return json({});
    if (method === "POST" && /\/users\/[^/]+\/sendMail$/.test(path)) {
        return new Response(null, { status: 202 });
    }
    if (method === "POST" && /\/users\/[^/]+\/messages$/.test(path)) {
        return json({ id: "draft-1", conversationId: "conversation-1" }, 201);
    }
    if (method === "POST" && path.endsWith("/send")) {
        return new Response(null, { status: 202 });
    }
    if (method === "GET" && path.endsWith("/licenseDetails")) {
        return json({ value: [{ skuId: "sku-1" }] });
    }
    if (method === "GET" && /\/v1\.0\/users\/[^/]+$/.test(path)) {
        return json({ id: "graph-user-1", accountEnabled: true });
    }
    if (method === "PATCH" && /\/v1\.0\/users\/[^/]+$/.test(path)) {
        return new Response(null, { status: 204 });
    }
    if (method === "GET" && path.includes("/channels/")) {
        return json({ id: "channel-1", isArchived: false });
    }
    if (method === "POST" && path.endsWith("/messages")) {
        return json(
            { id: "teams-message-1", webUrl: "https://teams.microsoft.com/message/1" },
            201,
        );
    }
    throw new Error(`unexpected Graph call ${method} ${url}`);
}

function calls() {
    return fetchSpy.mock.calls.map(([url, init]) => ({
        url: String(url),
        method: (init as RequestInit | undefined)?.method ?? "GET",
        body: String((init as RequestInit | undefined)?.body ?? ""),
    }));
}

function expectProductionMicrosoft() {
    expect(resend.emails.send).not.toHaveBeenCalled();
    const urls = calls().map((call) => call.url).join("\n");
    expect(urls).toContain("graph.microsoft.com");
    expect(urls).not.toContain("onmicrosoft");
    expect(urls).not.toContain("api.resend.com");
    expect(calls().every((call) => {
        const host = new URL(call.url).hostname;
        return host === "graph.microsoft.com" || host === "login.microsoftonline.com";
    })).toBe(true);
}

describe("production Microsoft automations", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.INTEGRATIONS_LIVE = "true";
        process.env.INTEGRATION_SECRET_KEY = "production-microsoft-test-key";
        delete process.env.MICROSOFT_SIMULATION;
        delete process.env.QUESTIONNAIRE_MOCK_RESPONSES;
        teamsOp = null;
        worker = {
            id: "worker-1",
            firstName: "Ada",
            lastName: "Lovelace",
            email: "ada@personal.test",
            workEmail: null,
            microsoftEmail: null,
            position: "Gesellin",
            entryDate: null,
            exitDate: null,
            departureMailSentAt: null,
            externalAccounts: [],
        };
        issue = {
            id: "issue-1",
            status: "open",
            sequence: "microsoft_create_account",
            integrationProvider: "microsoft_graph",
            microsoftAccountId: null,
            mailTemplateId: "template-1",
            mailSenderAddress: ONMICROSOFT,
            automationRecipients: null,
            mailTemplate: {
                organizationId: ORGANIZATION_ID,
                body: "Willkommen {{Vorname}}",
            },
            workerEngagement: {
                id: "engagement-1",
                workerId: "worker-1",
                organizationId: ORGANIZATION_ID,
                worker,
            },
        };
        engagement = {
            id: "engagement-1",
            worker: { id: "worker-1", email: "ada@personal.test" },
            questionnaireSubmission: null,
            questionnaireOverrides: null,
        };
        (prisma.$transaction as jest.Mock).mockImplementation((fn) => fn(prisma));
        (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ locked: true }]);
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            email: ONMICROSOFT,
        });
        (prisma.organizationIntegration.findUnique as jest.Mock).mockResolvedValue({
            enabled: true,
            tenantId: "tenant-1",
            clientId: "client-1",
            domain: DOMAIN,
            licenseSkuId: "sku-1",
            clientSecretCiphertext: encryptIntegrationSecret("client-secret"),
        });
        (prisma.worker.findFirst as jest.Mock).mockImplementation(async () => worker);
        (prisma.worker.update as jest.Mock).mockResolvedValue(worker);
        (prisma.workerExternalAccount.upsert as jest.Mock).mockResolvedValue({});
        (prisma.issue.findFirst as jest.Mock).mockImplementation(async () => issue);
        (prisma.issue.findUniqueOrThrow as jest.Mock).mockImplementation(async () => issue);
        (prisma.issue.update as jest.Mock).mockImplementation(async ({ data }) => {
            Object.assign(issue, data);
            return issue;
        });
        (prisma.issueAuditLog.create as jest.Mock).mockResolvedValue({});
        (prisma.mailTemplate.findFirst as jest.Mock).mockResolvedValue({
            id: "template-1",
            name: "Willkommen",
            subject: "Willkommen {{Vorname}}",
            body: "Hallo {{Vorname}}",
        });
        (prisma.engagementMailRecipient.findMany as jest.Mock).mockResolvedValue([
            {
                kind: "teams_channel",
                label: "Büro",
                address: "kollege@firma.de",
                workerId: null,
                groupId: "channel-1",
            },
        ]);
        (prisma.workerEngagement.findFirst as jest.Mock).mockImplementation(
            async () => engagement,
        );
        (prisma.questionnaire.findUnique as jest.Mock).mockResolvedValue(null);
        (prisma.questionnaire.upsert as jest.Mock).mockResolvedValue({});
        (prisma.documentMaster.findFirst as jest.Mock).mockResolvedValue({
            id: "master-1",
        });
        (prisma.teamsSend.findUnique as jest.Mock).mockImplementation(async () =>
            teamsOp ? structuredClone(teamsOp) : null,
        );
        (prisma.teamsSend.findUniqueOrThrow as jest.Mock).mockImplementation(async () =>
            structuredClone(teamsOp),
        );
        (prisma.teamsSend.create as jest.Mock).mockImplementation(async ({ data }) => {
            teamsOp = {
                ...data,
                destinations: data.destinations.create.map((destination: object) => ({
                    ...destination,
                    id: randomUUID(),
                    status: "pending",
                })),
            };
            return structuredClone(teamsOp);
        });
        (prisma.teamsSend.update as jest.Mock).mockImplementation(async ({ data }) => {
            Object.assign(teamsOp, data);
            return structuredClone(teamsOp);
        });
        (prisma.teamsSendDestination.update as jest.Mock).mockImplementation(
            async ({ where, data }) => {
                const destination = teamsOp.destinations.find(
                    (item: { id: string }) => item.id === where.id,
                );
                Object.assign(destination, data);
                return destination;
            },
        );
        (prisma.teamsSendDestination.updateMany as jest.Mock).mockImplementation(
            async ({ where, data }) => {
                for (const destination of teamsOp.destinations) {
                    const status = where.status;
                    const matches =
                        typeof status === "string"
                            ? destination.status === status
                            : status.in.includes(destination.status);
                    if (matches) Object.assign(destination, data);
                }
                return { count: 0 };
            },
        );
        (prisma.teamsSendDestination.count as jest.Mock).mockImplementation(async () =>
            teamsOp.destinations.filter(
                (destination: { status: string }) => destination.status !== "sent",
            ).length,
        );
        (accessToken as jest.Mock).mockResolvedValue({
            token: "delegated-token",
            connection: {
                microsoftUserId: "ms-alice",
                tenantId: "tenant-1",
                displayName: "Alice",
            },
        });
        (listChannels as jest.Mock).mockResolvedValue({
            channels: [
                {
                    teamId: "team-1",
                    channelId: "channel-1",
                    label: "Büro · Allgemein",
                },
            ],
            warnings: [],
        });
        fetchSpy = jest.spyOn(global, "fetch").mockImplementation((input, init) =>
            Promise.resolve(graphResponse(String(input), init)),
        );
    });

    afterEach(() => {
        expectProductionMicrosoft();
    });

    const context = {
        organizationId: ORGANIZATION_ID,
        issueId: "issue-1",
        actorUserId: "user-1",
    };

    it("creates the Microsoft account through Graph and mails the password from the app domain", async () => {
        issue.sequence = "microsoft_create_account";
        expect(await runIssueSequence(context)).toEqual({ status: "completed" });
        const created = calls().find((call) => call.url.endsWith("/v1.0/users"));
        expect(created?.body).toContain("ada.lovelace@firma.de");
        expect(calls().some((call) => call.url.endsWith("/assignLicense"))).toBe(true);
        const draft = calls().find((call) => call.url.includes("/messages"));
        expect(draft?.url).toContain("/messages");
    });

    it("sends the new-account password mail through Graph from the app domain", async () => {
        issue.sequence = "microsoft_create_account";
        expect(await runIssueSequence(context)).toEqual({ status: "completed" });
        const draft = calls().find((call) => call.method === "POST" && call.url.includes("/messages") && !call.url.endsWith("/send"));
        expect(decodeURIComponent(draft?.url ?? "")).toContain(
            `/users/${PRODUCTION_SENDER}/messages`,
        );
        expect(draft?.body).toContain("Dein Microsoft-365-Zugang");
        expect(draft?.body).toContain("Temporäres Passwort");
        expect(draft?.body).toContain("ada@personal.test");
        expect(draft?.body).not.toContain("onmicrosoft.com");
    });

    it.each([
        "microsoft_send_email",
        "microsoft_send_onboarding_email",
        "microsoft_send_offboarding_email",
    ])("sends %s through Graph from the app domain", async (sequence) => {
        issue.sequence = sequence;
        expect(await runIssueSequence(context)).toEqual({ status: "completed" });
        const sent = calls().find((call) => call.url.endsWith("/sendMail"));
        expect(decodeURIComponent(sent?.url ?? "")).toContain(
            `/users/${PRODUCTION_SENDER}/sendMail`,
        );
        expect(sent?.body).toContain("kollege@firma.de");
        expect(sent?.body).toContain("Willkommen Ada");
    });

    it("deactivates the Microsoft account through Graph", async () => {
        issue.sequence = "microsoft_deactivate_account";
        worker.externalAccounts = [{ externalId: "graph-user-1" }];
        expect(await runIssueSequence(context)).toEqual({ status: "completed" });
        expect(calls().some((call) => call.method === "PATCH" && call.body.includes("false"))).toBe(true);
        expect(prisma.workerExternalAccount.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                create: expect.objectContaining({ status: "disabled" }),
            }),
        );
    });

    it("posts the Teams message through Graph", async () => {
        issue.sequence = "microsoft_send_teams_message";
        const sent = await sendTeams(
            { organizationId: ORGANIZATION_ID, userId: "user-1" },
            "issue-1",
            {
                idempotencyKey: randomUUID(),
                destinations: [{ teamId: "team-1", channelId: "channel-1" }],
            },
        );
        expect(sent.status).toBe("completed");
        const posted = calls().find(
            (call) => call.method === "POST" && call.url.includes("/channels/"),
        );
        expect(posted?.url).toContain(
            "https://graph.microsoft.com/v1.0/teams/team-1/channels/channel-1/messages",
        );
        expect(posted?.body).toContain("Willkommen Ada");
    });

    it("sends the Fragebogen through Graph from the app domain", async () => {
        expect(
            await sendEngagementQuestionnaire({
                organizationId: ORGANIZATION_ID,
                engagementId: "engagement-1",
                createdByUserId: "user-1",
            }),
        ).toMatchObject({ emailSent: true, mockCompleted: false });
        const draft = calls().find((call) => call.url.includes("/messages"));
        expect(decodeURIComponent(draft?.url ?? "")).toContain(
            `/users/${PRODUCTION_SENDER}/messages`,
        );
        expect(draft?.body).toContain("Bitte füllen Sie den Personalfragebogen aus");
        expect(draft?.body).toContain("ada@personal.test");
        expect(draft?.body).toContain("/fragebogen/");
    });
});
