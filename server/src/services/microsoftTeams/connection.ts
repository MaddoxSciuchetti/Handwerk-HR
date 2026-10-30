import { integrationsMocked } from "../integrations/localMock";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import {
    ConfidentialClientApplication,
    InteractionRequiredAuthError,
} from "@azure/msal-node";
import { Prisma, type MicrosoftAuthAttempt } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
    decryptIntegrationSecret,
    encryptIntegrationSecret,
} from "@/services/integrations/secret";
import { integrationsLive } from "@/services/integrations/runtime";
import AppError from "@/utils/AppError";

export const GRAPH_SCOPES = [
    "User.Read",
    "Team.ReadBasic.All",
    "Channel.ReadBasic.All",
    "ChannelMessage.Send",
    "Files.Read.All",
    "Sites.Read.All",
];
export const AUTH_SCOPES = [
    "openid",
    "profile",
    "offline_access",
    ...GRAPH_SCOPES,
];
export const CALLBACK_COOKIE = "microsoftTeamsAttempt";
export const hash = (value: string) =>
    createHash("sha256").update(value).digest("hex");
export type Actor = { organizationId: string; userId: string };
export class TeamsError extends AppError {
    constructor(
        public code: string,
        message: string,
        status: 400 | 403 | 404 | 409 | 503 = 400,
    ) {
        super(status, message);
    }
}
export function callbackUri() {
    const value =
        process.env.MICROSOFT_TEAMS_REDIRECT_URI?.trim() ||
        (process.env.NODE_ENV === "production"
            ? "https://backendonboarding.onrender.com/auth/microsoft/callback"
            : "");
    if (!value)
        throw new TeamsError(
            "not_configured",
            "Die Microsoft-Umleitungsadresse ist noch nicht eingerichtet.",
        );
    const url = new URL(value);
    if (
        url.pathname !== "/auth/microsoft/callback" ||
        (url.protocol !== "https:" &&
            !["localhost", "127.0.0.1"].includes(url.hostname))
    ) {
        throw new TeamsError(
            "not_configured",
            "Die Microsoft-Umleitungsadresse ist ungültig.",
        );
    }
    if (url.search || url.hash || url.username || url.password)
        throw new TeamsError(
            "not_configured",
            "Die Microsoft-Umleitungsadresse ist ungültig.",
        );
    return value;
}

export async function assertActiveMember(
    actor: Actor,
    db: Prisma.TransactionClient = prisma,
) {
    const member = await db.organizationMember.findFirst({
        where: {
            ...actor,
            status: "active",
            user: { status: "active" },
        },
        select: { userId: true },
    });
    if (!member)
        throw new TeamsError(
            "access_denied",
            "Kein Zugriff auf diese Organisation.",
            403,
        );
}

export async function teamsConfig(
    organizationId: string,
    db: Prisma.TransactionClient = prisma,
) {
    const row = await db.organizationIntegration.findUnique({
        where: {
            organizationId_provider: {
                organizationId,
                provider: "microsoft_graph",
            },
        },
    });
    const secret = row?.clientSecretCiphertext
        ? decryptIntegrationSecret(row.clientSecretCiphertext)
        : null;
    // Require GUIDs rather than allowing user-controlled authority hosts or tenant aliases.
    const guid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (
        !row?.enabled ||
        !guid.test(row.tenantId || "") ||
        !guid.test(row.clientId || "") ||
        !secret
    ) {
        throw new TeamsError(
            "not_configured",
            "Microsoft Teams ist für diese Organisation noch nicht eingerichtet.",
        );
    }
    return {
        tenantId: row.tenantId!,
        clientId: row.clientId!,
        clientSecret: secret,
    };
}

export function msalClient(config: Awaited<ReturnType<typeof teamsConfig>>) {
    return new ConfidentialClientApplication({
        auth: {
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            authority: `https://login.microsoftonline.com/${config.tenantId}`,
        },
        system: {
            loggerOptions: {
                piiLoggingEnabled: false,
                loggerCallback: () => undefined,
            },
        },
    });
}

export async function connectionStatus(actor: Actor) {
    await assertActiveMember(actor);
    if (integrationsMocked()) return {
        ...actor, ready: true, live: true, status: "connected",
        account: { displayName: "Lokale Demo", username: "hr@example.test" },
    };
    let ready = true;
    let configuration: Awaited<ReturnType<typeof teamsConfig>> | undefined;
    try {
        configuration = await teamsConfig(actor.organizationId);
        callbackUri();
    } catch {
        ready = false;
    }
    const row = await prisma.microsoftUserConnection.findUnique({
        where: { organizationId_userId: actor },
    });
    const changed = Boolean(
        row &&
        configuration &&
        (row.clientId !== configuration.clientId ||
            row.tenantId !== configuration.tenantId),
    );
    return {
        organizationId: actor.organizationId,
        userId: actor.userId,
        ready,
        live: integrationsLive(),
        status: !row
            ? "disconnected"
            : row.reconnectRequired || changed
              ? "reconnect_required"
              : "connected",
        account: row
            ? { displayName: row.displayName, username: row.username }
            : null,
    };
}

export async function startConnection(actor: Actor) {
    await assertActiveMember(actor);
    const config = await teamsConfig(actor.organizationId);
    const verifier = randomBytes(48).toString("base64url");
    const nonce = randomBytes(32).toString("base64url");
    const browserSecret = randomBytes(32).toString("base64url");
    const state = randomUUID();
    const url = await msalClient(config).getAuthCodeUrl({
        scopes: AUTH_SCOPES,
        redirectUri: callbackUri(),
        state,
        nonce,
        codeChallenge: createHash("sha256")
            .update(verifier)
            .digest("base64url"),
        codeChallengeMethod: "S256",
        prompt: "select_account",
        responseMode: "query",
    });
    await saveAuthAttempt(actor, {
        id: state,
        ...actor,
        tenantId: config.tenantId,
        clientId: config.clientId,
        browserHash: hash(browserSecret),
        nonce,
        verifierCiphertext: encryptIntegrationSecret(verifier),
        expiresAt: new Date(Date.now() + 600_000),
    });
    return { url, browserSecret, state };
}

// The staging site proxies API calls, so a cookie set on that response is stored
// for the frontend host. Microsoft returns to the backend host. This rebuilds the
// authorize URL after the browser has opened the backend directly.
export async function microsoftAuthorizeUrl(state: string, browserSecret: string) {
    const attempt = await prisma.microsoftAuthAttempt.findUnique({
        where: { id: state },
    });
    if (
        !attempt ||
        attempt.consumedAt ||
        attempt.expiresAt <= new Date() ||
        attempt.browserHash !== hash(browserSecret)
    ) {
        throw new TeamsError(
            "invalid_attempt",
            "Die Anmeldung ist abgelaufen oder ungültig. Bitte erneut verbinden.",
        );
    }
    const config = await teamsConfig(attempt.organizationId);
    if (
        config.clientId !== attempt.clientId ||
        config.tenantId !== attempt.tenantId
    ) {
        throw new TeamsError(
            "configuration_changed",
            "Die Microsoft-Einstellungen wurden geändert. Bitte erneut verbinden.",
        );
    }
    const verifier = decryptIntegrationSecret(attempt.verifierCiphertext);
    if (!verifier) {
        throw new TeamsError(
            "invalid_attempt",
            "Die Anmeldung ist ungültig. Bitte erneut verbinden.",
        );
    }
    return msalClient(config).getAuthCodeUrl({
        scopes: AUTH_SCOPES,
        redirectUri: callbackUri(),
        state,
        nonce: attempt.nonce,
        codeChallenge: createHash("sha256").update(verifier).digest("base64url"),
        codeChallengeMethod: "S256",
        prompt: "select_account",
        responseMode: "query",
    });
}

async function saveAuthAttempt(
    actor: Actor,
    data: Prisma.MicrosoftAuthAttemptUncheckedCreateInput,
) {
    await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`teams-connection:${actor.organizationId}:${actor.userId}`}, 0))`;
        await tx.microsoftAuthAttempt.deleteMany({
            where: { OR: [actor, { expiresAt: { lt: new Date() } }] },
        });
        await tx.microsoftAuthAttempt.create({ data });
    });
}

type MicrosoftCallbackInput = {
    state: string;
    browserSecret: string;
    code?: string;
    error?: string;
};

type SignInAttempt = Pick<
    MicrosoftAuthAttempt,
    | "organizationId"
    | "userId"
    | "tenantId"
    | "clientId"
    | "verifierCiphertext"
    | "nonce"
>;

type TeamsConfig = Awaited<ReturnType<typeof teamsConfig>>;
type TokenExchange = Awaited<ReturnType<typeof prepareTokenExchange>>;
type MicrosoftTokenResult = Awaited<
    ReturnType<ConfidentialClientApplication["acquireTokenByCode"]>
>;
type MicrosoftIdentity = ReturnType<typeof validateMicrosoftIdentity>;

export async function finishConnection(input: MicrosoftCallbackInput) {
    const { actor, attempt, code } = await validateCallbackAttempt(input);
    const exchange = await prepareTokenExchange(actor, attempt, code);
    const result = await exchangeAuthorizationCode(exchange);
    const identity = validateMicrosoftIdentity(result, attempt, exchange.config);
    assertTeamsPermissions(identity.scopes);
    await saveMicrosoftConnection(actor, input.state, exchange, identity);
    return actor;
}

async function validateCallbackAttempt(input: MicrosoftCallbackInput) {
    // Atomic consumption prevents replay; retain the row until completion so disconnect/new sign-in can cancel an in-flight exchange.
    const now = new Date();
    const attempts = await prisma.microsoftAuthAttempt.updateManyAndReturn({
        where: {
            id: input.state,
            browserHash: hash(input.browserSecret),
            expiresAt: { gt: now },
            consumedAt: null,
        },
        data: { consumedAt: now },
        select: {
            organizationId: true,
            userId: true,
            tenantId: true,
            clientId: true,
            verifierCiphertext: true,
            nonce: true,
        },
    });
    const attempt = attempts[0];
    if (!attempt)
        throw new TeamsError(
            "invalid_attempt",
            "Die Anmeldung ist abgelaufen oder ungültig. Bitte erneut verbinden.",
        );
    const actor = {
        organizationId: attempt.organizationId,
        userId: attempt.userId,
    };
    await assertActiveMember(actor);
    if (input.error || !input.code)
        throw new TeamsError(
            "consent_cancelled",
            "Die Microsoft-Anmeldung wurde abgebrochen. Bitte erneut verbinden.",
        );
    return { actor, attempt, code: input.code };
}

async function prepareTokenExchange(
    actor: Actor,
    attempt: SignInAttempt,
    code: string,
) {
    const config = await teamsConfig(actor.organizationId);
    if (
        config.clientId !== attempt.clientId ||
        config.tenantId !== attempt.tenantId
    ) {
        throw new TeamsError(
            "configuration_changed",
            "Die Microsoft-Einstellungen wurden geändert. Bitte erneut verbinden.",
        );
    }
    const verifier = decryptIntegrationSecret(attempt.verifierCiphertext);
    if (!verifier)
        throw new TeamsError(
            "invalid_attempt",
            "Die Anmeldung ist ungültig. Bitte erneut verbinden.",
        );
    const client = msalClient(config);
    return {
        config,
        client,
        request: {
            scopes: AUTH_SCOPES,
            code,
            redirectUri: callbackUri(),
            codeVerifier: verifier,
            nonce: attempt.nonce,
        },
    };
}

async function exchangeAuthorizationCode({ client, request }: TokenExchange) {
    try {
        return await client.acquireTokenByCode(request);
    } catch {
        // Microsoft may have redeemed the code even when its response is lost.
        // Never retry the exchange or make the consumed attempt reusable.
        throw new TeamsError(
            "token_exchange_failed",
            "Microsoft konnte nicht verbunden werden. Bitte erneut verbinden.",
            503,
        );
    }
}

function validateMicrosoftIdentity(
    result: MicrosoftTokenResult,
    attempt: SignInAttempt,
    config: TeamsConfig,
) {
    const claims = result?.idTokenClaims as
        | { nonce?: string; tid?: string; oid?: string }
        | undefined;
    if (
        !result?.account ||
        claims?.nonce !== attempt.nonce ||
        claims?.tid?.toLowerCase() !== config.tenantId.toLowerCase() ||
        !claims.oid
    ) {
        throw new TeamsError(
            "identity_mismatch",
            "Die Microsoft-Identität gehört nicht zur erwarteten Organisation.",
        );
    }
    return {
        account: result.account,
        microsoftUserId: claims.oid,
        scopes: result.scopes,
    };
}

function assertTeamsPermissions(scopes: string[]) {
    if (
        !GRAPH_SCOPES.every((scope) =>
            scopes.some(
                (granted) =>
                    granted
                        .toLowerCase()
                        .replace("https://graph.microsoft.com/", "") ===
                    scope.toLowerCase(),
            ),
        )
    ) {
        throw new TeamsError(
            "consent_required",
            "Die benötigten Teams-Berechtigungen wurden nicht vollständig freigegeben.",
        );
    }
}

async function saveMicrosoftConnection(
    actor: Actor,
    state: string,
    exchange: TokenExchange,
    identity: MicrosoftIdentity,
) {
    const retryDelays = [150, 300];
    for (let attempt = 0; ; attempt++) {
        try {
            await saveConnectionTransaction(actor, state, exchange, identity);
            return;
        } catch (error) {
            // Cancellation, membership and configuration checks must stop retries.
            if (error instanceof TeamsError) throw error;
            if (
                attempt >= retryDelays.length ||
                !isRetryableConnectionSaveError(error)
            ) {
                throw new TeamsError(
                    "connection_save_failed",
                    "Verbindung konnte nicht gespeichert werden. Bitte erneut verbinden.",
                    503,
                );
            }
            await delay(retryDelays[attempt]);
        }
    }
}

function isRetryableConnectionSaveError(error: unknown) {
    if (error instanceof Prisma.PrismaClientInitializationError) {
        return ["P1001", "P1002"].includes(error.errorCode ?? "");
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Retry unavailable connections, pool timeouts and rolled-back conflicts.
        // Connection loss during commit can be ambiguous and is not retried.
        return ["P1001", "P1002", "P2024", "P2034"].includes(error.code);
    }
    return false;
}

async function saveConnectionTransaction(
    actor: Actor,
    state: string,
    { config, client }: TokenExchange,
    identity: MicrosoftIdentity,
) {
    await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`teams-connection:${actor.organizationId}:${actor.userId}`}, 0))`;
        await assertActiveMember(actor, tx);
        const pending = await tx.microsoftAuthAttempt.findFirst({
            where: {
                id: state,
                ...actor,
                consumedAt: { not: null },
                expiresAt: { gt: new Date() },
            },
        });
        if (!pending)
            throw new TeamsError(
                "invalid_attempt",
                "Die Anmeldung wurde abgebrochen oder ist abgelaufen. Bitte erneut verbinden.",
            );
        const currentConfig = await teamsConfig(actor.organizationId, tx);
        if (
            currentConfig.clientId !== config.clientId ||
            currentConfig.tenantId !== config.tenantId
        )
            throw new TeamsError(
                "configuration_changed",
                "Bitte erneut verbinden.",
            );
        const data = {
            tenantId: config.tenantId,
            clientId: config.clientId,
            homeAccountId: identity.account.homeAccountId,
            microsoftUserId: identity.microsoftUserId,
            displayName: identity.account.name || identity.account.username,
            username: identity.account.username,
            scopes: identity.scopes,
            cacheCiphertext: encryptIntegrationSecret(
                client.getTokenCache().serialize(),
            ),
            reconnectRequired: false,
        };
        await tx.microsoftUserConnection.upsert({
            where: { organizationId_userId: actor },
            create: { ...actor, ...data },
            update: data,
        });
        await tx.microsoftAuthAttempt.deleteMany({
            where: { id: state },
        });
        await tx.microsoftConnectionEvent.create({
            data: { ...actor, action: "connected" },
        });
    });
}

export async function disconnect(actor: Actor) {
    await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`teams-connection:${actor.organizationId}:${actor.userId}`}, 0))`;
        await assertActiveMember(actor, tx);
        await tx.microsoftUserConnection.deleteMany({ where: actor });
        await tx.microsoftAuthAttempt.deleteMany({ where: actor });
        await tx.microsoftConnectionEvent.create({
            data: { ...actor, action: "disconnected" },
        });
    });
}

export async function disconnectAndGetStatus(actor: Actor) {
    await disconnect(actor);
    return connectionStatus(actor);
}

export async function accessToken(actor: Actor) {
    // A PostgreSQL transaction lock works across server processes and protects refresh-token rotation.
    const outcome = await prisma.$transaction(
        async (tx) => {
            await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`teams-connection:${actor.organizationId}:${actor.userId}`}, 0))`;
            await assertActiveMember(actor, tx);
            const config = await teamsConfig(actor.organizationId, tx);
            const row = await tx.microsoftUserConnection.findUnique({
                where: { organizationId_userId: actor },
            });
            if (!row)
                throw new TeamsError(
                    "connection_required",
                    "Bitte Microsoft Teams unter Einstellungen → Integrationen verbinden.",
                );
            if (
                row.reconnectRequired ||
                row.clientId !== config.clientId ||
                row.tenantId !== config.tenantId
            )
                return { reconnect: true as const };
            const cache = decryptIntegrationSecret(row.cacheCiphertext);
            const client = msalClient(config);
            try {
                if (!cache)
                    throw new InteractionRequiredAuthError(
                        "interaction_required",
                        "Reconnect required",
                    );
                client.getTokenCache().deserialize(cache);
                const account = await client
                    .getTokenCache()
                    .getAccountByHomeId(row.homeAccountId);
                if (!account)
                    throw new InteractionRequiredAuthError(
                        "interaction_required",
                        "Reconnect required",
                    );
                const result = await client.acquireTokenSilent({
                    account,
                    scopes: GRAPH_SCOPES,
                });
                if (
                    !result?.accessToken ||
                    !GRAPH_SCOPES.every((scope) =>
                        result.scopes.some(
                            (granted) =>
                                granted
                                    .toLowerCase()
                                    .replace(
                                        "https://graph.microsoft.com/",
                                        "",
                                    ) === scope.toLowerCase(),
                        ),
                    )
                )
                    throw new InteractionRequiredAuthError(
                        "interaction_required",
                        "Reconnect required",
                    );
                await tx.microsoftUserConnection.update({
                    where: { id: row.id },
                    data: {
                        cacheCiphertext: encryptIntegrationSecret(
                            client.getTokenCache().serialize(),
                        ),
                        scopes: result.scopes,
                    },
                });
                return { token: result.accessToken, connection: row };
            } catch (error) {
                const errorCode =
                    error && typeof error === "object" && "errorCode" in error
                        ? String(error.errorCode)
                        : "";
                if (
                    !(error instanceof InteractionRequiredAuthError) &&
                    ![
                        "invalid_grant",
                        "interaction_required",
                        "consent_required",
                        "login_required",
                    ].includes(errorCode)
                )
                    throw new TeamsError(
                        "authentication_failed",
                        "Microsoft ist derzeit nicht erreichbar. Bitte später erneut versuchen.",
                        503,
                    );
                await tx.microsoftUserConnection.update({
                    where: { id: row.id },
                    data: { reconnectRequired: true },
                });
                await tx.microsoftConnectionEvent.create({
                    data: { ...actor, action: "reconnect_required" },
                });
                return { reconnect: true as const };
            }
        },
        { timeout: 45_000, maxWait: 10_000 },
    );
    if ("reconnect" in outcome)
        throw new TeamsError(
            "reconnect_required",
            "Bitte Microsoft Teams unter Einstellungen → Integrationen erneut verbinden.",
        );
    return outcome;
}
