type Credentials = { tenantId: string; clientId: string; clientSecret: string };

export function graphMailCredentials(): Credentials | null {
    const tenantId = process.env.MICROSOFT_365_TENANT_ID?.trim() ?? "";
    const clientId = process.env.MICROSOFT_365_CLIENT_ID?.trim() ?? "";
    const clientSecret = process.env.MICROSOFT_365_CLIENT_SECRET?.trim() ?? "";
    if (!tenantId && !clientId && !clientSecret) return null;
    if (!tenantId || !clientId || !clientSecret) {
        throw new Error("Microsoft mail requires tenant ID, client ID and client secret together.");
    }
    return { tenantId, clientId, clientSecret };
}

// Renewal is lazy: no timer or user interaction is needed, including after idle periods.
export function createGraphMailTokenProvider(
    credentials: () => Credentials | null,
    fallback: () => string,
    fetcher: typeof fetch = (input, init) => fetch(input, init),
    now = Date.now,
) {
    let cached: { token: string; renewAt: number } | undefined;
    let pending: Promise<string> | undefined;

    async function acquire(config: Credentials) {
        const startedAt = now();
        const response = await fetcher(
            `https://login.microsoftonline.com/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/token`,
            {
                method: "POST",
                signal: AbortSignal.timeout(30_000),
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    client_id: config.clientId,
                    client_secret: config.clientSecret,
                    scope: "https://graph.microsoft.com/.default",
                    grant_type: "client_credentials",
                }),
            },
        );
        // Never expose the token response, credentials or provider error descriptions.
        if (!response.ok) {
            console.error("Microsoft mail token request failed", response.status);
            throw new Error("Microsoft mail authentication failed. Check the application credentials.");
        }
        const payload = await response.json() as { access_token?: unknown; expires_in?: unknown };
        if (typeof payload.access_token !== "string" || !payload.access_token ||
            typeof payload.expires_in !== "number" || !Number.isFinite(payload.expires_in) || payload.expires_in <= 0) {
            throw new Error("Microsoft mail returned an invalid token response.");
        }
        const lifetime = payload.expires_in * 1000;
        cached = {
            token: payload.access_token,
            renewAt: startedAt + lifetime - Math.min(60_000, lifetime / 2),
        };
        return cached.token;
    }

    return {
        canRenew: () => Boolean(credentials()),
        async getToken(rejectedToken?: string): Promise<string> {
            const config = credentials();
            if (!config) {
                const token = fallback();
                if (!token) throw new Error("Microsoft mail authentication is not configured.");
                return token;
            }
            // A concurrent request may already have replaced a rejected token.
            if (cached && cached.token !== rejectedToken && now() < cached.renewAt) return cached.token;
            if (!pending) {
                cached = undefined;
                pending = acquire(config).finally(() => { pending = undefined; });
            }
            return pending;
        },
    };
}
