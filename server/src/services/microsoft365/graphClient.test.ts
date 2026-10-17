import { createMicrosoft365GraphClient } from "./graphClient";
import type { Microsoft365Config } from "./types";

const config: Microsoft365Config = {
    tenantId: "tenant/id",
    clientId: "client",
    clientSecret: "secret",
    domain: "firma.de",
    licenseSkuId: "f245ecc8-75af-4f8e-b61f-27d8114de5f3",
};
const createInput = {
    config,
    token: "token",
    firstName: "Jörg",
    lastName: "Müller",
    password: "temporary-password",
};
function setup() {
    const fetcher = jest.fn<
        ReturnType<typeof fetch>,
        Parameters<typeof fetch>
    >();
    return { fetcher, graph: createMicrosoft365GraphClient(fetcher) };
}
function json(body: unknown, status = 200) {
    return new Response(body === null ? null : JSON.stringify(body), {
        status,
    });
}

afterEach(() => jest.restoreAllMocks());

it("authenticates using client credentials and the Graph default scope", async () => {
    const { fetcher, graph } = setup();
    fetcher.mockResolvedValue(json({ access_token: "token" }));
    expect(await graph.getToken(config)).toBe("token");
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe(
        "https://login.microsoftonline.com/tenant%2Fid/oauth2/v2.0/token",
    );
    expect(init?.method).toBe("POST");
    expect(Object.fromEntries(init?.body as URLSearchParams)).toEqual({
        client_id: "client",
        client_secret: "secret",
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
    });
});

it("skips authentication without configuration", async () => {
    const { fetcher, graph } = setup();
    expect(await graph.getToken(null)).toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
});

it.each([
    json({ error: "invalid_client" }, 401),
    json({}),
    new Response("not json", { status: 502 }),
])("rejects failed or malformed token responses", async (response) => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    const { fetcher, graph } = setup();
    fetcher.mockResolvedValue(response);
    expect(await graph.getToken(config)).toBeNull();
});

it("sends the exact account parameters, with no personal email or client secret", async () => {
    const { fetcher, graph } = setup();
    fetcher.mockResolvedValue(
        json(
            { id: "graph-1", userPrincipalName: "joerg.mueller@firma.de" },
            201,
        ),
    );
    expect(await graph.createUser(createInput)).toEqual({
        ok: true,
        externalId: "graph-1",
        workEmail: "joerg.mueller@firma.de",
    });
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("https://graph.microsoft.com/v1.0/users");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toEqual({
        Authorization: "Bearer token",
        "Content-Type": "application/json",
    });
    expect(JSON.parse(String(init?.body))).toEqual({
        accountEnabled: true,
        displayName: "Jörg Müller",
        mailNickname: "joerg.mueller",
        userPrincipalName: "joerg.mueller@firma.de",
        usageLocation: "DE",
        passwordProfile: {
            forceChangePasswordNextSignIn: true,
            password: "temporary-password",
        },
    });
});

it("tries a numbered address after a conflict", async () => {
    const { fetcher, graph } = setup();
    fetcher
        .mockResolvedValueOnce(json({}, 409))
        .mockResolvedValueOnce(json({ id: "graph-2" }, 201));
    expect(await graph.createUser(createInput)).toMatchObject({
        ok: true,
        workEmail: "joerg.mueller2@firma.de",
    });
    expect(
        JSON.parse(String(fetcher.mock.calls[1][1]?.body)).userPrincipalName,
    ).toBe("joerg.mueller2@firma.de");
});

it("stops after twenty address conflicts", async () => {
    const { fetcher, graph } = setup();
    fetcher.mockImplementation(async () => json({}, 409));
    expect(await graph.createUser(createInput)).toEqual({
        ok: false,
        message: "Die Arbeits-E-Mail ist bereits vergeben.",
    });
    expect(fetcher).toHaveBeenCalledTimes(20);
});

it("does not retry permission errors", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    const { fetcher, graph } = setup();
    fetcher.mockResolvedValue(json({}, 403));
    expect(await graph.createUser(createInput)).toMatchObject({ ok: false });
    expect(fetcher).toHaveBeenCalledTimes(1);
});

it.each([{}, { id: 123 }, { id: " " }, null])(
    "rejects a successful response without a valid user ID: %p",
    async (body) => {
        const { fetcher, graph } = setup();
        fetcher.mockResolvedValue(json(body, 201));
        expect(await graph.createUser(createInput)).toEqual({
            ok: false,
            message: "Microsoft Graph hat keine Benutzerkennung geliefert.",
        });
    },
);

it("sends a separate license assignment for the created user", async () => {
    const { fetcher, graph } = setup();
    fetcher.mockResolvedValue(json({}));
    expect(
        await graph.assignLicense({
            token: "token",
            externalId: "user/id",
            licenseSkuId: config.licenseSkuId,
        }),
    ).toBe(true);
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe(
        "https://graph.microsoft.com/v1.0/users/user%2Fid/assignLicense",
    );
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({
        addLicenses: [{ skuId: config.licenseSkuId }],
        removeLicenses: [],
    });
});

it("reports license rejection", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    const { fetcher, graph } = setup();
    fetcher.mockResolvedValue(json({}, 400));
    expect(
        await graph.assignLicense({
            token: "token",
            externalId: "user",
            licenseSkuId: config.licenseSkuId,
        }),
    ).toBe(false);
});

it.each([204, 403])(
    "reports the cleanup outcome for HTTP %s",
    async (status) => {
        const { fetcher, graph } = setup();
        fetcher.mockResolvedValue(json(null, status));
        expect(await graph.deleteUser("token", "user/id")).toBe(status === 204);
        expect(fetcher).toHaveBeenCalledWith(
            "https://graph.microsoft.com/v1.0/users/user%2Fid",
            expect.objectContaining({ method: "DELETE" }),
        );
    },
);
