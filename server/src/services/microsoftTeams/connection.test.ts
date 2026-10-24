import {
    ConfidentialClientApplication,
    InteractionRequiredAuthError,
} from "@azure/msal-node";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { setTimeout as delay } from "node:timers/promises";
import { encryptIntegrationSecret } from "@/services/integrations/secret";
import {
    accessToken,
    AUTH_SCOPES,
    callbackUri,
    connectionStatus,
    disconnect,
    disconnectAndGetStatus,
    finishConnection,
    GRAPH_SCOPES,
    hash,
    startConnection,
} from "./connection";

jest.mock("@azure/msal-node", () => ({
    ...jest.requireActual("@azure/msal-node"),
    ConfidentialClientApplication: jest.fn(),
}));
jest.mock("node:timers/promises", () => ({ setTimeout: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
    prisma: {
        $transaction: jest.fn(),
        $executeRaw: jest.fn(),
        organizationMember: { findFirst: jest.fn() },
        organizationIntegration: { findUnique: jest.fn() },
        microsoftUserConnection: {
            findUnique: jest.fn(),
            upsert: jest.fn(),
            update: jest.fn(),
            deleteMany: jest.fn(),
        },
        microsoftAuthAttempt: {
            updateManyAndReturn: jest.fn(),
            deleteMany: jest.fn(),
            create: jest.fn(),
            findFirst: jest.fn(),
        },
        microsoftConnectionEvent: { create: jest.fn() },
    },
}));
const actor = { userId: "alice", organizationId: "org-a" };
const tenantId = "11111111-1111-1111-1111-111111111111";
const clientId = "22222222-2222-2222-2222-222222222222";
const cache = {
    serialize: jest.fn(() => '{"tokens":"private"}'),
    deserialize: jest.fn(),
    getAccountByHomeId: jest.fn(),
};
const msal = {
    getAuthCodeUrl: jest.fn(),
    acquireTokenByCode: jest.fn(),
    acquireTokenSilent: jest.fn(),
    getTokenCache: () => cache,
};
const attempt = {
    organizationId: actor.organizationId,
    userId: actor.userId,
    tenantId: tenantId,
    clientId: clientId,
    nonce: "nonce",
    verifierCiphertext: "",
};
beforeEach(() => {
    jest.resetAllMocks();
    process.env.INTEGRATION_SECRET_KEY = "teams-test-encryption-key";
    process.env.MICROSOFT_TEAMS_REDIRECT_URI =
        "https://backendonboarding.onrender.com/auth/microsoft/callback";
    (prisma.$transaction as jest.Mock).mockImplementation((fn) => fn(prisma));
    (prisma.organizationMember.findFirst as jest.Mock).mockResolvedValue({
        userId: actor.userId,
    });
    (prisma.organizationIntegration.findUnique as jest.Mock).mockResolvedValue({
        enabled: true,
        tenantId,
        clientId,
        clientSecretCiphertext: encryptIntegrationSecret("secret"),
        domain: "",
        licenseSkuId: "",
    });
    (ConfidentialClientApplication as jest.Mock).mockImplementation(() => msal);
    msal.getAuthCodeUrl.mockResolvedValue(
        "https://login.microsoftonline.com/authorize",
    );
    cache.serialize.mockReturnValue('{"tokens":"private"}');
    cache.getAccountByHomeId.mockResolvedValue({ homeAccountId: "home-alice" });
    attempt.verifierCiphertext = encryptIntegrationSecret("verifier");
    (
        prisma.microsoftAuthAttempt.updateManyAndReturn as jest.Mock
    ).mockResolvedValue([attempt]);
    (prisma.microsoftAuthAttempt.findFirst as jest.Mock).mockResolvedValue({
        id: "state",
    });
    msal.acquireTokenByCode.mockResolvedValue({
        account: {
            homeAccountId: "home-alice",
            name: "Alice",
            username: "alice@example.com",
        },
        scopes: AUTH_SCOPES,
        idTokenClaims: {
            nonce: "nonce",
            tid: tenantId,
            oid: "microsoft-alice",
        },
    });
    (prisma.microsoftUserConnection.findUnique as jest.Mock).mockResolvedValue({
        id: "connection-a",
        ...actor,
        tenantId,
        clientId,
        homeAccountId: "home-alice",
        microsoftUserId: "microsoft-alice",
        cacheCiphertext: encryptIntegrationSecret("{}"),
    });
    msal.acquireTokenSilent.mockResolvedValue({
        accessToken: "alice-token",
        scopes: GRAPH_SCOPES,
    });
});

afterAll(() => {
    delete process.env.MICROSOFT_TEAMS_REDIRECT_URI;
    delete process.env.INTEGRATION_SECRET_KEY;
});

it("starts a PKCE flow scoped to a user, without requiring account-provisioning fields", async () => {
    const before = Date.now();
    const result = await startConnection(actor);
    expect(msal.getAuthCodeUrl).toHaveBeenCalledWith(
        expect.objectContaining({
            redirectUri: callbackUri(),
            scopes: AUTH_SCOPES,
            codeChallengeMethod: "S256",
            state: expect.any(String),
            nonce: expect.any(String),
        }),
    );
    const stored = (prisma.microsoftAuthAttempt.create as jest.Mock).mock
        .calls[0][0].data;
    expect(stored).toMatchObject({
        ...actor,
        browserHash: hash(result.browserSecret),
    });
    expect(stored.verifierCiphertext).not.toBe("verifier");
    expect(stored.expiresAt.getTime() - before).toBeGreaterThanOrEqual(600_000);
    expect(stored.expiresAt.getTime() - before).toBeLessThan(601_000);
});

it("does not start sign-in for an inactive membership", async () => {
    (prisma.organizationMember.findFirst as jest.Mock).mockResolvedValue(null);
    await expect(startConnection(actor)).rejects.toMatchObject({
        code: "access_denied",
    });
    expect(msal.getAuthCodeUrl).not.toHaveBeenCalled();
});

it("binds the callback to the browser, enforces expiry and consumes an attempt once", async () => {
    await finishConnection({
        state: "state",
        browserSecret: "browser",
        code: "temporary-code",
    });
    expect(
        prisma.microsoftAuthAttempt.updateManyAndReturn,
    ).toHaveBeenCalledWith({
        where: {
            id: "state",
            browserHash: hash("browser"),
            expiresAt: { gt: expect.any(Date) },
            consumedAt: null,
        },
        data: { consumedAt: expect.any(Date) },
        select: {
            organizationId: true,
            userId: true,
            tenantId: true,
            clientId: true,
            verifierCiphertext: true,
            nonce: true,
        },
    });
    expect(prisma.microsoftUserConnection.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
            where: { organizationId_userId: actor },
            create: expect.objectContaining({
                ...actor,
                microsoftUserId: "microsoft-alice",
                cacheCiphertext: expect.not.stringContaining("private"),
            }),
        }),
    );
    (
        prisma.microsoftAuthAttempt.updateManyAndReturn as jest.Mock
    ).mockResolvedValue([]);
    await expect(
        finishConnection({
            state: "state",
            browserSecret: "browser",
            code: "temporary-code",
        }),
    ).rejects.toMatchObject({ code: "invalid_attempt" });
    expect(msal.acquireTokenByCode).toHaveBeenCalledTimes(1);
});

it.each([
    [{ nonce: "wrong", tid: tenantId, oid: "alice" }, "identity_mismatch"],
    [
        { nonce: "nonce", tid: "different-tenant", oid: "alice" },
        "identity_mismatch",
    ],
])("rejects callback identity mismatches", async (claims, code) => {
    msal.acquireTokenByCode.mockResolvedValue({
        account: { homeAccountId: "home" },
        scopes: AUTH_SCOPES,
        idTokenClaims: claims,
    });
    await expect(
        finishConnection({ state: "s", browserSecret: "b", code: "c" }),
    ).rejects.toMatchObject({ code });
    expect(prisma.microsoftUserConnection.upsert).not.toHaveBeenCalled();
});

it("does not create a connection when consent is denied", async () => {
    await expect(
        finishConnection({
            state: "s",
            browserSecret: "b",
            error: "access_denied",
        }),
    ).rejects.toMatchObject({ code: "consent_cancelled" });
    expect(msal.acquireTokenByCode).not.toHaveBeenCalled();
    expect(prisma.microsoftUserConnection.upsert).not.toHaveBeenCalled();
});

it("rejects missing permissions before storing a connection", async () => {
    msal.acquireTokenByCode.mockResolvedValue({
        account: { homeAccountId: "home" },
        scopes: ["User.Read"],
        idTokenClaims: { nonce: "nonce", tid: tenantId, oid: "alice" },
    });
    await expect(
        finishConnection({ state: "s", browserSecret: "b", code: "c" }),
    ).rejects.toMatchObject({ code: "consent_required" });
    expect(prisma.microsoftUserConnection.upsert).not.toHaveBeenCalled();
});

it("exchanges the callback code using the saved PKCE verifier and configured redirect", async () => {
    await expect(
        finishConnection({
            state: "state",
            browserSecret: "browser",
            code: "temporary-code",
        }),
    ).resolves.toEqual(actor);
    expect(msal.acquireTokenByCode).toHaveBeenCalledWith({
        scopes: AUTH_SCOPES,
        code: "temporary-code",
        redirectUri: callbackUri(),
        codeVerifier: "verifier",
        nonce: "nonce",
    });
});

it.each([
    [{ clientId: "changed-client" }, "configuration_changed"],
    [{ verifierCiphertext: "unreadable" }, "invalid_attempt"],
])(
    "rejects invalid exchange configuration before contacting Microsoft",
    async (changes, code) => {
        (
            prisma.microsoftAuthAttempt.updateManyAndReturn as jest.Mock
        ).mockResolvedValue([{ ...attempt, ...changes }]);
        await expect(
            finishConnection({
                state: "state",
                browserSecret: "browser",
                code: "temporary-code",
            }),
        ).rejects.toMatchObject({ code });
        expect(msal.acquireTokenByCode).not.toHaveBeenCalled();
        expect(prisma.microsoftUserConnection.upsert).not.toHaveBeenCalled();
    },
);

it("does not save a connection if the organization configuration changes during the exchange", async () => {
    const config = await prisma.organizationIntegration.findUnique({
        where: {
            organizationId_provider: {
                organizationId: actor.organizationId,
                provider: "microsoft_graph",
            },
        },
    });
    (prisma.organizationIntegration.findUnique as jest.Mock)
        .mockResolvedValueOnce(config)
        .mockResolvedValueOnce({
            ...config,
            clientId: "33333333-3333-3333-3333-333333333333",
        });
    await expect(
        finishConnection({
            state: "state",
            browserSecret: "browser",
            code: "temporary-code",
        }),
    ).rejects.toMatchObject({ code: "configuration_changed" });
    expect(msal.acquireTokenByCode).toHaveBeenCalledTimes(1);
    expect(prisma.microsoftUserConnection.upsert).not.toHaveBeenCalled();
});

const callback = {
    state: "state",
    browserSecret: "browser",
    code: "temporary-code",
};
const databaseError = (code: string) =>
    new Prisma.PrismaClientKnownRequestError("Database failure", {
        code,
        clientVersion: "test",
    });

it("requires fresh sign-in after an exchange failure without retrying the code or changing a connection", async () => {
    msal.acquireTokenByCode.mockRejectedValue(
        new Error("private Microsoft details"),
    );
    await expect(finishConnection(callback)).rejects.toMatchObject({
        code: "token_exchange_failed",
    });
    expect(msal.acquireTokenByCode).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.microsoftUserConnection.upsert).not.toHaveBeenCalled();
    expect(prisma.microsoftUserConnection.deleteMany).not.toHaveBeenCalled();
});

it.each(["P1001", "P1002", "P2024", "P2034"])(
    "retries a transient %s save failure using the tokens already received",
    async (code) => {
        (prisma.$transaction as jest.Mock).mockRejectedValueOnce(
            databaseError(code),
        );
        await expect(finishConnection(callback)).resolves.toEqual(actor);
        expect(prisma.$transaction).toHaveBeenCalledTimes(2);
        expect(msal.acquireTokenByCode).toHaveBeenCalledTimes(1);
        expect(delay).toHaveBeenCalledWith(150);
        expect(prisma.microsoftUserConnection.upsert).toHaveBeenCalledTimes(1);
    },
);

it("retries a temporary database initialization failure", async () => {
    (prisma.$transaction as jest.Mock).mockRejectedValueOnce(
        new Prisma.PrismaClientInitializationError(
            "Unavailable",
            "test",
            "P1001",
        ),
    );
    await expect(finishConnection(callback)).resolves.toEqual(actor);
    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    expect(msal.acquireTokenByCode).toHaveBeenCalledTimes(1);
});

it("stops after three failed saves and preserves the previous connection", async () => {
    (prisma.$transaction as jest.Mock).mockRejectedValue(
        databaseError("P2034"),
    );
    await expect(finishConnection(callback)).rejects.toMatchObject({
        code: "connection_save_failed",
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(3);
    expect(delay).toHaveBeenNthCalledWith(1, 150);
    expect(delay).toHaveBeenNthCalledWith(2, 300);
    expect(msal.acquireTokenByCode).toHaveBeenCalledTimes(1);
    expect(prisma.microsoftUserConnection.upsert).not.toHaveBeenCalled();
    expect(prisma.microsoftUserConnection.deleteMany).not.toHaveBeenCalled();
});

it.each(["P2002", "P1017"])(
    "does not retry a permanent or ambiguous %s save error",
    async (code) => {
        (prisma.$transaction as jest.Mock).mockRejectedValue(
            databaseError(code),
        );
        await expect(finishConnection(callback)).rejects.toMatchObject({
            code: "connection_save_failed",
        });
        expect(prisma.$transaction).toHaveBeenCalledTimes(1);
        expect(delay).not.toHaveBeenCalled();
    },
);

it.each(["cancelled", "inactive", "configuration_changed"])(
    "rechecks %s state before saving on a retry",
    async (change) => {
        (prisma.$transaction as jest.Mock).mockRejectedValueOnce(
            databaseError("P2034"),
        );
        if (change === "cancelled") {
            (
                prisma.microsoftAuthAttempt.findFirst as jest.Mock
            ).mockResolvedValue(null);
        } else if (change === "inactive") {
            (prisma.organizationMember.findFirst as jest.Mock)
                .mockResolvedValueOnce({ userId: actor.userId })
                .mockResolvedValue(null);
        } else {
            const config = {
                enabled: true,
                tenantId,
                clientId,
                clientSecretCiphertext: encryptIntegrationSecret("secret"),
            };
            (prisma.organizationIntegration.findUnique as jest.Mock)
                .mockResolvedValueOnce(config)
                .mockResolvedValue({
                    ...config,
                    clientId: "33333333-3333-3333-3333-333333333333",
                });
        }
        await expect(finishConnection(callback)).rejects.toMatchObject({
            code:
                change === "cancelled"
                    ? "invalid_attempt"
                    : change === "inactive"
                      ? "access_denied"
                      : "configuration_changed",
        });
        expect(prisma.$transaction).toHaveBeenCalledTimes(2);
        expect(msal.acquireTokenByCode).toHaveBeenCalledTimes(1);
        expect(prisma.microsoftUserConnection.upsert).not.toHaveBeenCalled();
        expect(delay).toHaveBeenCalledTimes(1);
    },
);

it("refreshes only the requesting employee cache, under a database lock", async () => {
    const result = await accessToken(actor);
    expect(result.token).toBe("alice-token");
    expect(prisma.microsoftUserConnection.findUnique).toHaveBeenCalledWith({
        where: { organizationId_userId: actor },
    });
    expect(prisma.$executeRaw).toHaveBeenCalled();
    expect(cache.getAccountByHomeId).toHaveBeenCalledWith("home-alice");
    expect(prisma.microsoftUserConnection.update).toHaveBeenCalledWith(
        expect.objectContaining({
            where: { id: "connection-a" },
            data: expect.objectContaining({
                cacheCiphertext: expect.not.stringContaining("private"),
            }),
        }),
    );
});

it("persists reconnect-required status when Microsoft requires interaction", async () => {
    msal.acquireTokenSilent.mockRejectedValue(
        new InteractionRequiredAuthError(
            "interaction_required",
            "MFA required",
        ),
    );
    await expect(accessToken(actor)).rejects.toMatchObject({
        code: "reconnect_required",
    });
    expect(prisma.microsoftUserConnection.update).toHaveBeenCalledWith({
        where: { id: "connection-a" },
        data: { reconnectRequired: true },
    });
});

it("disconnects just the requesting user and cancels outstanding attempts", async () => {
    await disconnect(actor);
    expect(prisma.microsoftUserConnection.deleteMany).toHaveBeenCalledWith({
        where: actor,
    });
    expect(prisma.microsoftAuthAttempt.deleteMany).toHaveBeenCalledWith({
        where: actor,
    });
});

it("returns metadata only, even when provisioning fields are empty", async () => {
    const status = await connectionStatus(actor);
    expect(status.ready).toBe(true);
    expect(status).not.toHaveProperty("cacheCiphertext");
    expect(status).not.toHaveProperty("clientSecret");
});

it("returns the refreshed status after completing the disconnect transaction", async () => {
    (prisma.microsoftUserConnection.findUnique as jest.Mock).mockResolvedValue(
        null,
    );
    const status = await disconnectAndGetStatus(actor);
    expect(status).toMatchObject({
        ...actor,
        ready: true,
        status: "disconnected",
        account: null,
    });
    const deletionOrder = (
        prisma.microsoftUserConnection.deleteMany as jest.Mock
    ).mock.invocationCallOrder[0];
    const readOrder = (prisma.microsoftUserConnection.findUnique as jest.Mock)
        .mock.invocationCallOrder[0];
    expect(deletionOrder).toBeLessThan(readOrder);
});

it("does not return connection metadata if disconnect fails", async () => {
    (prisma.$transaction as jest.Mock).mockRejectedValue(
        new Error("database unavailable"),
    );
    await expect(disconnectAndGetStatus(actor)).rejects.toThrow(
        "database unavailable",
    );
    expect(prisma.microsoftUserConnection.findUnique).not.toHaveBeenCalled();
});

it("does not resurrect a connection when a pending login was cancelled during code exchange", async () => {
    (prisma.microsoftAuthAttempt.findFirst as jest.Mock).mockResolvedValue(
        null,
    );
    await expect(
        finishConnection({
            state: "state",
            browserSecret: "browser",
            code: "temporary-code",
        }),
    ).rejects.toMatchObject({ code: "invalid_attempt" });
    expect(prisma.microsoftUserConnection.upsert).not.toHaveBeenCalled();
});

it("requires reconnection when a refresh grant has been revoked", async () => {
    msal.acquireTokenSilent.mockRejectedValue({ errorCode: "invalid_grant" });
    await expect(accessToken(actor)).rejects.toMatchObject({
        code: "reconnect_required",
    });
});
