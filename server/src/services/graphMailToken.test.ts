import { createGraphMailTokenProvider, graphMailCredentials } from "./graphMailToken";

const credentials = { tenantId: "tenant", clientId: "client", clientSecret: "secret" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

function setup() {
    let clock = 0;
    const fetcher = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();
    const tokens = createGraphMailTokenProvider(() => credentials, () => "old-static-token", fetcher, () => clock);
    return { fetcher, tokens, advance: (ms: number) => { clock += ms; } };
}

it("acquires a token with application credentials and shares concurrent renewals", async () => {
    const { tokens, fetcher } = setup();
    fetcher.mockResolvedValue(json({ access_token: "first", expires_in: 3600 }));
    expect(await Promise.all([tokens.getToken(), tokens.getToken()])).toEqual(["first", "first"]);
    expect(await tokens.getToken()).toBe("first");
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("https://login.microsoftonline.com/tenant/oauth2/v2.0/token");
    expect(Object.fromEntries(init?.body as URLSearchParams)).toEqual({
        client_id: "client", client_secret: "secret",
        scope: "https://graph.microsoft.com/.default", grant_type: "client_credentials",
    });
});

it("renews before expiry and after a long idle period", async () => {
    const { tokens, fetcher, advance } = setup();
    fetcher.mockResolvedValueOnce(json({ access_token: "first", expires_in: 3600 }))
        .mockResolvedValueOnce(json({ access_token: "second", expires_in: 3600 }))
        .mockResolvedValueOnce(json({ access_token: "third", expires_in: 3600 }));
    await tokens.getToken();
    advance(3540_000);
    expect(await tokens.getToken()).toBe("second");
    advance(24 * 3600_000);
    expect(await tokens.getToken()).toBe("third");
});

it("refreshes rejected tokens once across concurrent requests", async () => {
    const { tokens, fetcher } = setup();
    fetcher.mockResolvedValueOnce(json({ access_token: "first", expires_in: 3600 }))
        .mockResolvedValueOnce(json({ access_token: "second", expires_in: 3600 }));
    await tokens.getToken();
    expect(await Promise.all([tokens.getToken("first"), tokens.getToken("first")])).toEqual(["second", "second"]);
    expect(await tokens.getToken("first")).toBe("second");
    expect(fetcher).toHaveBeenCalledTimes(2);
});

it.each([
    () => json({ error_description: "secret" }, 401),
    () => json({ access_token: "token" }),
    () => json({ access_token: "token", expires_in: -1 }),
])("recovers after a failed renewal without falling back to a static token", async (failure) => {
    const { tokens, fetcher } = setup();
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
        fetcher.mockResolvedValueOnce(failure())
            .mockResolvedValueOnce(json({ access_token: "recovered", expires_in: 3600 }));
        await expect(tokens.getToken()).rejects.toThrow();
        expect(JSON.stringify(log.mock.calls)).not.toContain("secret");
        expect(await tokens.getToken()).toBe("recovered");
    } finally { log.mockRestore(); }
});

it("retains static-token compatibility without application credentials", async () => {
    const fetcher = jest.fn();
    const tokens = createGraphMailTokenProvider(() => null, () => "static", fetcher);
    expect(tokens.canRenew()).toBe(false);
    expect(await tokens.getToken()).toBe("static");
    expect(fetcher).not.toHaveBeenCalled();
    await expect(createGraphMailTokenProvider(() => null, () => "").getToken()).rejects.toThrow("not configured");
});

it("rejects partial application credentials", () => {
    const previous = process.env;
    process.env = { ...previous, MICROSOFT_365_TENANT_ID: "tenant", MICROSOFT_365_CLIENT_ID: "", MICROSOFT_365_CLIENT_SECRET: "" };
    try { expect(() => graphMailCredentials()).toThrow("together"); }
    finally { process.env = previous; }
});
