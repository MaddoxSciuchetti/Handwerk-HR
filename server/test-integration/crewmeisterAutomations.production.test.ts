/**
 * Production path: INTEGRATIONS_LIVE, real Crewmeister API host, no simulation.
 * Sequences run through runIssueSequence; only api.crewmeister.com may be called.
 */
import { encryptIntegrationSecret } from "@/services/integrations/secret";
import { runIssueSequence } from "@/services/integrations/runSequence";
import { prisma } from "@/lib/prisma";

jest.mock("@/services/arbeitszeugnis", () => ({
    previewArbeitszeugnis: jest.fn(),
    sendArbeitszeugnis: jest.fn(),
    prepareArbeitszeugnisPdf: jest.fn(),
    saveArbeitszeugnisDraft: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
    prisma: {
        $transaction: jest.fn(),
        organizationIntegration: { findUnique: jest.fn() },
        worker: { findFirst: jest.fn() },
        workerExternalAccount: { upsert: jest.fn(), deleteMany: jest.fn() },
        issue: {
            findFirst: jest.fn(),
            findUniqueOrThrow: jest.fn(),
            update: jest.fn(),
        },
        issueAuditLog: { create: jest.fn() },
    },
}));

const ORGANIZATION_ID = "org-1";
const CREW_ID = "42";
const MEMBER_ID = "99";
const USER_ID = "7";
const EMAIL = "ada@example.com";
const TOKEN = "production-crewmeister-token";

type Member = {
    id: number;
    crewId: number;
    userId: number;
    email: string;
    disabled: boolean;
    status?: string;
};

let issue: Record<string, unknown>;
let worker: Record<string, unknown>;
let member: Member | null;
let nextMemberId: number;
let expectNetwork: boolean;
let fetchSpy: jest.SpiedFunction<typeof fetch>;

function json(body: unknown, status = 200) {
    return {
        ok: status >= 200 && status < 300,
        status,
        text: async () => (body == null ? "" : JSON.stringify(body)),
    } as Response;
}

function calls() {
    return fetchSpy.mock.calls.map(([url, init]) => ({
        url: String(url),
        method: (init as RequestInit | undefined)?.method ?? "GET",
        headers: (init as RequestInit | undefined)?.headers as
            | Record<string, string>
            | undefined,
        body: String((init as RequestInit | undefined)?.body ?? ""),
    }));
}

function expectProductionCrewmeister() {
    expect(calls().length).toBeGreaterThan(0);
    for (const call of calls()) {
        expect(new URL(call.url).hostname).toBe("api.crewmeister.com");
        expect(call.headers).toMatchObject({
            Authorization: `Bearer ${TOKEN}`,
            "Content-Type": "application/json",
            "X-Write-Async": "false",
        });
    }
}

function crewmeisterResponse(url: string, init?: RequestInit) {
    const method = init?.method ?? "GET";
    const parsed = new URL(url);
    if (parsed.hostname !== "api.crewmeister.com") {
        throw new Error(`unexpected host ${parsed.hostname}`);
    }
    const path = parsed.pathname;

    if (method === "GET" && path === "/api/v3/platform-app/crews") {
        return json({ content: [{ id: Number(CREW_ID) }] });
    }

    if (method === "GET" && path === "/api/v3/platform-app/members") {
        expect(parsed.searchParams.get("filter")).toBe(
            `crewId==${CREW_ID};email==${JSON.stringify(EMAIL)}`,
        );
        return json({ content: member ? [member] : [] });
    }

    if (
        method === "GET" &&
        /^\/api\/v3\/platform-app\/members\/\d+$/.test(path)
    ) {
        const id = path.split("/").pop();
        if (!member || String(member.id) !== id) return json({}, 404);
        return json(member);
    }

    if (
        method === "POST" &&
        path === `/api/v2/crew/${CREW_ID}/invite/with-email`
    ) {
        expect(JSON.parse(String(init?.body))).toEqual({
            crewId: Number(CREW_ID),
            email: EMAIL,
            name: "Ada Lovelace",
            language: "de",
        });
        member = {
            id: nextMemberId,
            crewId: Number(CREW_ID),
            userId: Number(USER_ID),
            email: EMAIL,
            disabled: false,
            status: "INVITED",
        };
        return json({
            message: "Member created successfully",
            statusCode: 201,
            payload: { id: nextMemberId },
        });
    }

    if (
        method === "PATCH" &&
        path === `/api/v3/platform-app/members/${MEMBER_ID}`
    ) {
        expect(JSON.parse(String(init?.body))).toEqual({ disabled: true });
        if (!member || String(member.id) !== MEMBER_ID) {
            return json({}, 404);
        }
        member = { ...member, disabled: true };
        return json({ resourceAfterWrite: member });
    }

    if (
        method === "DELETE" &&
        path === `/api/v3/platform-app/members/${MEMBER_ID}`
    ) {
        if (
            !member ||
            String(member.id) !== MEMBER_ID ||
            member.disabled !== true
        ) {
            return json({ message: "forbidden" }, 403);
        }
        const before = member;
        member = null;
        return json({
            resourceBeforeWrite: before,
            resourceAfterWrite: null,
        });
    }

    throw new Error(`unexpected Crewmeister call ${method} ${url}`);
}

describe("production Crewmeister automations", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        expectNetwork = true;
        process.env.INTEGRATIONS_LIVE = "true";
        process.env.INTEGRATION_SECRET_KEY = "production-crewmeister-test-key";
        delete process.env.MICROSOFT_SIMULATION;
        delete process.env.INTEGRATIONS_MOCK;
        member = null;
        nextMemberId = Number(MEMBER_ID);
        worker = {
            id: "worker-1",
            firstName: "Ada",
            lastName: "Lovelace",
            email: EMAIL,
        };
        issue = {
            id: "issue-1",
            status: "open",
            sequence: "crewmeister_create_account",
            integrationProvider: "crewmeister",
            microsoftAccountId: null,
            workerEngagement: {
                id: "engagement-1",
                workerId: "worker-1",
            },
        };
        (prisma.$transaction as jest.Mock).mockImplementation((fn) => fn(prisma));
        (prisma.organizationIntegration.findUnique as jest.Mock).mockResolvedValue({
            enabled: true,
            crewId: CREW_ID,
            tokenCiphertext: encryptIntegrationSecret(TOKEN),
        });
        (prisma.worker.findFirst as jest.Mock).mockImplementation(async () => worker);
        (prisma.workerExternalAccount.upsert as jest.Mock).mockResolvedValue({});
        (prisma.workerExternalAccount.deleteMany as jest.Mock).mockResolvedValue({
            count: 1,
        });
        (prisma.issue.findFirst as jest.Mock).mockImplementation(async () => issue);
        (prisma.issue.findUniqueOrThrow as jest.Mock).mockImplementation(
            async () => issue,
        );
        (prisma.issue.update as jest.Mock).mockImplementation(async ({ data }) => {
            Object.assign(issue, data);
            return issue;
        });
        (prisma.issueAuditLog.create as jest.Mock).mockResolvedValue({});
        fetchSpy = jest.spyOn(global, "fetch").mockImplementation((input, init) =>
            Promise.resolve(crewmeisterResponse(String(input), init)),
        );
    });

    afterEach(() => {
        if (expectNetwork) expectProductionCrewmeister();
        else expect(fetchSpy).not.toHaveBeenCalled();
        fetchSpy.mockRestore();
    });

    const context = {
        organizationId: ORGANIZATION_ID,
        issueId: "issue-1",
        actorUserId: "user-1",
    };

    it("invites through the V2 production endpoint and verifies membership", async () => {
        issue.sequence = "crewmeister_create_account";
        expect(await runIssueSequence(context)).toEqual({ status: "completed" });
        expect(
            calls().map((call) => [new URL(call.url).pathname, call.method]),
        ).toEqual([
            ["/api/v3/platform-app/crews", "GET"],
            ["/api/v3/platform-app/members", "GET"],
            ["/api/v2/crew/42/invite/with-email", "POST"],
            ["/api/v3/platform-app/members/99", "GET"],
        ]);
        expect(prisma.workerExternalAccount.upsert).toHaveBeenCalledWith({
            where: {
                workerId_provider: {
                    workerId: "worker-1",
                    provider: "crewmeister",
                },
            },
            create: {
                workerId: "worker-1",
                provider: "crewmeister",
                externalId: MEMBER_ID,
                status: "active",
            },
            update: { externalId: MEMBER_ID, status: "active" },
        });
        expect(issue.status).toBe("done");
    });

    it("reuses an existing membership without inviting again", async () => {
        member = {
            id: Number(MEMBER_ID),
            crewId: Number(CREW_ID),
            userId: Number(USER_ID),
            email: EMAIL,
            disabled: false,
            status: "INVITED",
        };
        issue.sequence = "crewmeister_create_account";
        expect(await runIssueSequence(context)).toEqual({ status: "completed" });
        expect(calls().some((call) => call.method === "POST")).toBe(false);
        expect(prisma.workerExternalAccount.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                update: { externalId: MEMBER_ID, status: "active" },
            }),
        );
    });

    it("deactivates the matched membership through PATCH and records disabled", async () => {
        member = {
            id: Number(MEMBER_ID),
            crewId: Number(CREW_ID),
            userId: Number(USER_ID),
            email: EMAIL,
            disabled: false,
        };
        issue.sequence = "crewmeister_deactivate_account";
        expect(await runIssueSequence(context)).toEqual({ status: "completed" });
        expect(
            calls().map((call) => [new URL(call.url).pathname, call.method]),
        ).toEqual([
            ["/api/v3/platform-app/crews", "GET"],
            ["/api/v3/platform-app/members", "GET"],
            ["/api/v3/platform-app/members/99", "GET"],
            ["/api/v3/platform-app/members/99", "PATCH"],
            ["/api/v3/platform-app/members/99", "GET"],
        ]);
        expect(prisma.workerExternalAccount.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                create: expect.objectContaining({ status: "disabled" }),
                update: { externalId: MEMBER_ID, status: "disabled" },
            }),
        );
        expect(member?.disabled).toBe(true);
    });

    it("deletes only a disabled membership and clears the local mapping", async () => {
        member = {
            id: Number(MEMBER_ID),
            crewId: Number(CREW_ID),
            userId: Number(USER_ID),
            email: EMAIL,
            disabled: true,
        };
        issue.sequence = "crewmeister_delete_membership";
        expect(await runIssueSequence(context)).toEqual({ status: "completed" });
        expect(
            calls().map((call) => [new URL(call.url).pathname, call.method]),
        ).toEqual([
            ["/api/v3/platform-app/crews", "GET"],
            ["/api/v3/platform-app/members", "GET"],
            ["/api/v3/platform-app/members/99", "GET"],
            ["/api/v3/platform-app/members/99", "DELETE"],
            ["/api/v3/platform-app/members", "GET"],
        ]);
        expect(prisma.workerExternalAccount.deleteMany).toHaveBeenCalledWith({
            where: {
                workerId: "worker-1",
                provider: "crewmeister",
                externalId: MEMBER_ID,
            },
        });
        expect(member).toBeNull();
    });

    it("runs create → deactivate → delete → recreate through the production path", async () => {
        issue.sequence = "crewmeister_create_account";
        expect(await runIssueSequence(context)).toEqual({ status: "completed" });

        issue.status = "open";
        issue.sequence = "crewmeister_deactivate_account";
        expect(await runIssueSequence(context)).toEqual({ status: "completed" });

        issue.status = "open";
        issue.sequence = "crewmeister_delete_membership";
        expect(await runIssueSequence(context)).toEqual({ status: "completed" });

        nextMemberId = 100;
        issue.status = "open";
        issue.sequence = "crewmeister_create_account";
        expect(await runIssueSequence(context)).toEqual({ status: "completed" });

        expect(prisma.workerExternalAccount.upsert).toHaveBeenLastCalledWith(
            expect.objectContaining({
                update: { externalId: "100", status: "active" },
            }),
        );
        const methods = calls().map((call) => call.method);
        expect(methods).toContain("POST");
        expect(methods).toContain("PATCH");
        expect(methods).toContain("DELETE");
    });

    it("fails closed when live execution is off", async () => {
        expectNetwork = false;
        process.env.INTEGRATIONS_LIVE = "false";
        issue.sequence = "crewmeister_create_account";
        expect(await runIssueSequence(context)).toEqual({
            status: "failed",
            message: "Sequenzen werden in dieser Umgebung nicht ausgeführt.",
        });
        expect(prisma.workerExternalAccount.upsert).not.toHaveBeenCalled();
    });
});
