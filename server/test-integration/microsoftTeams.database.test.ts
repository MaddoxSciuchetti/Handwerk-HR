/** Run only against an explicitly provided, disposable localhost database with migrations applied. */
import { randomUUID } from "node:crypto";
import { ConfidentialClientApplication } from "@azure/msal-node";
import { prisma } from "@/lib/prisma";
import {
    encryptIntegrationSecret,
    decryptIntegrationSecret,
} from "@/services/integrations/secret";
import {
    accessToken,
    AUTH_SCOPES,
    disconnect,
    finishConnection,
    GRAPH_SCOPES,
    hash,
} from "@/services/microsoftTeams/connection";

import { sendTeams } from "@/services/microsoftTeams/messages";
import {
    graphFetch,
    listChannels,
    postChannelMessage,
} from "@/services/microsoftTeams/graph";
jest.mock("@/services/microsoftTeams/graph", () => ({
    ...jest.requireActual("@/services/microsoftTeams/graph"),
    graphFetch: jest.fn(),
    listChannels: jest.fn(),
    postChannelMessage: jest.fn(),
}));
jest.mock("@/lib/prisma", () => {
    const url = process.env.TEAMS_TEST_DATABASE_URL;
    if (!url) return { prisma: {} };
    const parsed = new URL(url);
    if (
        !["localhost", "127.0.0.1"].includes(parsed.hostname) ||
        parsed.pathname !== "/teams_final"
    )
        throw new Error(
            "Teams database tests require disposable localhost /teams_final",
        );
    const { PrismaClient } = jest.requireActual("@prisma/client");
    const { PrismaPg } = jest.requireActual("@prisma/adapter-pg");
    return {
        prisma: new PrismaClient({
            adapter: new PrismaPg({ connectionString: url }),
        }),
    };
});
jest.mock("@azure/msal-node", () => ({
    ...jest.requireActual("@azure/msal-node"),
    ConfidentialClientApplication: jest.fn(),
}));
const run = process.env.TEAMS_TEST_DATABASE_URL ? describe : describe.skip;
run("Microsoft Teams PostgreSQL persistence and locking", () => {
    const organizationId = randomUUID();
    const alice = { organizationId, userId: randomUUID() };
    const bob = { organizationId, userId: randomUUID() };
    const tenantId = randomUUID();
    const clientId = randomUUID();
    let acquireByCode: jest.Mock;
    let acquireSilent: jest.Mock;
    let maxConcurrent = 0;
    let concurrent = 0;
    beforeAll(async () => {
        process.env.INTEGRATION_SECRET_KEY = "isolated-teams-database-test-key";
        process.env.MICROSOFT_TEAMS_REDIRECT_URI =
            "http://localhost:3000/auth/microsoft/callback";
        await prisma.user.createMany({
            data: [alice, bob].map((actor, index) => ({
                id: actor.userId,
                firstName: "Tester",
                lastName: String(index),
                email: `${actor.userId}@example.test`,
                passwordHash: "not-a-real-password",
            })),
        });
        await prisma.organization.create({
            data: {
                id: organizationId,
                name: "Teams test",
                slug: `teams-${organizationId}`,
            },
        });
        await prisma.organizationMember.createMany({ data: [alice, bob] });
        await prisma.organizationIntegration.create({
            data: {
                organizationId,
                provider: "microsoft_graph",
                enabled: true,
                tenantId,
                clientId,
                clientSecretCiphertext:
                    encryptIntegrationSecret("fake-client-secret"),
            },
        });
        for (const actor of [alice, bob])
            await prisma.microsoftUserConnection.create({
                data: {
                    ...actor,
                    tenantId,
                    clientId,
                    microsoftUserId: `ms-${actor.userId}`,
                    homeAccountId: actor.userId,
                    displayName: "Test",
                    username: `${actor.userId}@example.test`,
                    scopes: GRAPH_SCOPES,
                    cacheCiphertext: encryptIntegrationSecret("{}"),
                },
            });
    });
    beforeEach(() => {
        acquireByCode = jest.fn();
        concurrent = 0;
        maxConcurrent = 0;
        acquireSilent = jest.fn(async ({ account }) => {
            concurrent++;
            maxConcurrent = Math.max(concurrent, maxConcurrent);
            await new Promise((resolve) => setTimeout(resolve, 35));
            concurrent--;
            return {
                accessToken: `token-${account.homeAccountId}`,
                scopes: GRAPH_SCOPES,
            };
        });
        (ConfidentialClientApplication as jest.Mock).mockImplementation(() => ({
            acquireTokenByCode: acquireByCode,
            acquireTokenSilent: acquireSilent,
            getTokenCache: () => ({
                serialize: () => '{"refresh":"private"}',
                deserialize: () => undefined,
                getAccountByHomeId: async (id: string) => ({
                    homeAccountId: id,
                }),
            }),
        }));
    });
    afterAll(async () => {
        await prisma.organization.delete({ where: { id: organizationId } });
        await prisma.user.deleteMany({
            where: { id: { in: [alice.userId, bob.userId] } },
        });
        await prisma.$disconnect();
    });
    async function attempt(expiresAt = new Date(Date.now() + 600000)) {
        const id = randomUUID();
        await prisma.microsoftAuthAttempt.create({
            data: {
                id,
                ...alice,
                tenantId,
                clientId,
                browserHash: hash("browser-secret"),
                verifierCiphertext: encryptIntegrationSecret("pkce"),
                nonce: "expected-nonce",
                expiresAt,
            },
        });
        return { state: id, browserSecret: "browser-secret", code: "code" };
    }
    it("serializes two cache renewals for the same account using PostgreSQL locks", async () => {
        const result = await Promise.all([
            accessToken(alice),
            accessToken(alice),
        ]);
        expect(maxConcurrent).toBe(1);
        expect(result.every((r) => r.token === `token-${alice.userId}`)).toBe(
            true,
        );
        const saved = await prisma.microsoftUserConnection.findUniqueOrThrow({
            where: { organizationId_userId: alice },
        });
        expect(saved.cacheCiphertext).not.toContain("private");
        expect(decryptIntegrationSecret(saved.cacheCiphertext)).toContain(
            "private",
        );
    });
    it("keeps two employees token caches and returned identities separate", async () => {
        const [a, b] = await Promise.all([
            accessToken(alice),
            accessToken(bob),
        ]);
        expect(a.token).toBe(`token-${alice.userId}`);
        expect(b.token).toBe(`token-${bob.userId}`);
        expect(a.connection.userId).not.toBe(b.connection.userId);
    });
    it("atomically consumes a callback once under concurrent replay", async () => {
        const input = await attempt();
        const results = await Promise.allSettled([
            finishConnection({ ...input, error: "access_denied" }),
            finishConnection({ ...input, error: "access_denied" }),
        ]);
        expect(
            results
                .map((r) => (r.status === "rejected" ? r.reason.code : ""))
                .sort(),
        ).toEqual(["consent_cancelled", "invalid_attempt"]);
        expect(acquireByCode).not.toHaveBeenCalled();
    });
    it("does not consume an expired attempt or one from another browser", async () => {
        const expired = await attempt(new Date(Date.now() - 1000));
        await expect(finishConnection(expired)).rejects.toMatchObject({
            code: "invalid_attempt",
        });
        const valid = await attempt();
        await expect(
            finishConnection({ ...valid, browserSecret: "different-browser" }),
        ).rejects.toMatchObject({ code: "invalid_attempt" });
        expect(
            (
                await prisma.microsoftAuthAttempt.findUniqueOrThrow({
                    where: { id: valid.state },
                })
            ).consumedAt,
        ).toBeNull();
    });
    it("prevents concurrent sends and keeps a confirmed delivery idempotent in PostgreSQL", async () => {
        process.env.INTEGRATIONS_LIVE = "true";
        const worker = await prisma.worker.create({
            data: {
                organizationId,
                createdByUserId: alice.userId,
                firstName: "Ada",
                lastName: "Test",
                email: "ada@example.test",
            },
        });
        const engagement = await prisma.workerEngagement.create({
            data: {
                organizationId,
                workerId: worker.id,
                responsibleUserId: alice.userId,
                type: "onboarding",
            },
        });
        const template = await prisma.mailTemplate.create({
            data: {
                organizationId,
                name: "Teams template",
                description: "Test",
                body: "Hallo {{Vorname}}",
            },
        });
        const issue = await prisma.issue.create({
            data: {
                workerEngagementId: engagement.id,
                createdByUserId: alice.userId,
                title: "Teams test",
                integrationProvider: "microsoft_graph",
                sequence: "microsoft_send_teams_message",
                mailTemplateId: template.id,
            },
        });
        const teamId = randomUUID();
        (listChannels as jest.Mock).mockResolvedValue({
            channels: [
                { teamId, channelId: "channel", label: "Team · Channel" },
            ],
            warnings: [],
        });
        (graphFetch as jest.Mock).mockImplementation(
            async () =>
                new Response(JSON.stringify({ isArchived: false }), {
                    status: 200,
                }),
        );
        let started!: () => void;
        const sendingStarted = new Promise<void>((resolve) => {
            started = resolve;
        });
        let release!: (value: unknown) => void;
        (postChannelMessage as jest.Mock).mockImplementation(() => {
            started();
            return new Promise((resolve) => {
                release = resolve;
            });
        });
        const input = {
            idempotencyKey: randomUUID(),
            destinations: [{ teamId, channelId: "channel" }],
        };
        const first = sendTeams(alice, issue.id, input);
        await sendingStarted;
        await expect(sendTeams(alice, issue.id, input)).rejects.toMatchObject({
            code: "send_in_progress",
        });
        release({ status: "sent", graphMessageId: "message" });
        expect((await first).status).toBe("completed");
        expect((await sendTeams(alice, issue.id, input)).status).toBe(
            "completed",
        );
        expect(postChannelMessage).toHaveBeenCalledTimes(1);
        expect(
            (await prisma.issue.findUniqueOrThrow({ where: { id: issue.id } }))
                .status,
        ).toBe("done");
    });
    it("disconnect cancels an in-flight exchange without affecting a colleague", async () => {
        const input = await attempt();
        let resolveExchange!: (value: any) => void;
        let exchangeStarted!: () => void;
        const started = new Promise<void>((resolve) => {
            exchangeStarted = resolve;
        });
        acquireByCode.mockImplementation(() => {
            exchangeStarted();
            return new Promise((resolve) => {
                resolveExchange = resolve;
            });
        });
        const finishing = finishConnection(input);
        await started;
        await disconnect(alice);
        resolveExchange({
            account: {
                homeAccountId: alice.userId,
                username: "alice@example.test",
            },
            scopes: AUTH_SCOPES,
            idTokenClaims: {
                nonce: "expected-nonce",
                tid: tenantId,
                oid: `ms-${alice.userId}`,
            },
        });
        await expect(finishing).rejects.toMatchObject({
            code: "invalid_attempt",
        });
        expect(
            await prisma.microsoftUserConnection.count({ where: alice }),
        ).toBe(0);
        expect(await prisma.microsoftUserConnection.count({ where: bob })).toBe(
            1,
        );
    });
});
