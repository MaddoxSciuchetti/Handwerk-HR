import { prisma } from "@/lib/prisma";
import { createCrewmeisterAccount } from "./crewmeisterAccount";
import { sendMail } from "@/utils/sendMail";
jest.mock("@/lib/prisma", () => ({
    prisma: {
        worker: { findFirst: jest.fn() },
        workerExternalAccount: { upsert: jest.fn() },
    },
}));
jest.mock("@/utils/sendMail", () => ({ sendMail: jest.fn() }));
const db = prisma as any;
const input = {
    organizationId: "org",
    workerId: "worker",
    engagementId: "engagement",
    auth: { token: "test-token", crewId: "" },
};
const member = {
    id: 99,
    crewId: 42,
    userId: 7,
    email: "ada@example.com",
    disabled: false,
    status: "INVITED",
};
const originalLive = process.env.INTEGRATIONS_LIVE;
const json = (body: unknown, status = 200) =>
    ({
        ok: status >= 200 && status < 300,
        status,
        text: async () => JSON.stringify(body),
    }) as Response;
let fetcher: jest.SpyInstance;
beforeEach(() => {
    process.env.INTEGRATIONS_LIVE = "true";
    db.worker.findFirst.mockResolvedValue({
        id: "worker",
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
        externalAccounts: [],
    });
    db.workerExternalAccount.upsert.mockResolvedValue({});
    fetcher = jest
        .spyOn(global, "fetch")
        .mockImplementation(async (path, init) => {
            const url = new URL(String(path));
            expect(url.origin).toBe("https://api.crewmeister.com");
            expect(init?.headers).toMatchObject({
                Authorization: "Bearer test-token",
            });
            if (url.pathname.endsWith("/crews"))
                return json({ content: [{ id: 42 }] });
            if (url.pathname.endsWith("/members")) {
                expect(url.searchParams.get("filter")).toBe(
                    'crewId==42;email=="ada@example.com"',
                );
                return json({ content: [] });
            }
            if (url.pathname.endsWith("/members/99")) return json(member);
            if (
                url.pathname === "/api/v2/crew/42/invite/with-email" &&
                init?.method === "POST"
            ) {
                expect(JSON.parse(String(init.body))).toEqual({
                    crewId: 42,
                    email: "ada@example.com",
                    name: "Ada Lovelace",
                    language: "de",
                });
                return json({
                    message: "Member created successfully",
                    statusCode: 201,
                    payload: { id: 99 },
                });
            }
            throw new Error("Unexpected Crewmeister request");
        });
});
afterEach(() => {
    if (originalLive === undefined) delete process.env.INTEGRATIONS_LIVE;
    else process.env.INTEGRATIONS_LIVE = originalLive;
    jest.restoreAllMocks();
});
it("invites through V2 and verifies membership before recording success, without creating a login or sending a password email", async () => {
    expect(await createCrewmeisterAccount(input)).toEqual({
        status: "created",
        externalId: "99",
    });
    expect(
        fetcher.mock.calls.map(([url, init]) => [
            new URL(String(url)).pathname,
            init?.method ?? "GET",
        ]),
    ).toEqual([
        ["/api/v3/platform-app/crews", "GET"],
        ["/api/v3/platform-app/members", "GET"],
        ["/api/v2/crew/42/invite/with-email", "POST"],
        ["/api/v3/platform-app/members/99", "GET"],
    ]);
    expect(db.workerExternalAccount.upsert).toHaveBeenCalledWith({
        where: {
            workerId_provider: { workerId: "worker", provider: "crewmeister" },
        },
        create: {
            workerId: "worker",
            provider: "crewmeister",
            externalId: "99",
            status: "active",
        },
        update: { externalId: "99", status: "active" },
    });
    expect(sendMail).not.toHaveBeenCalled();
});
it("reinvites after a saved membership was deleted externally", async () => {
    db.worker.findFirst.mockResolvedValue({
        id: "worker",
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
        externalAccounts: [{ externalId: "88" }],
    });
    expect(await createCrewmeisterAccount(input)).toEqual({
        status: "created",
        externalId: "99",
    });
    expect(db.workerExternalAccount.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
            update: { externalId: "99", status: "active" },
        }),
    );
});
it.each([false, true])(
    "reuses a verified membership without another invitation (saved=%s)",
    async (saved) => {
        if (saved)
            db.worker.findFirst.mockResolvedValue({
                id: "worker",
                email: "ada@example.com",
                externalAccounts: [{ externalId: "99" }],
            });
        fetcher
            .mockReset()
            .mockResolvedValueOnce(json({ content: [{ id: 42 }] }));
        fetcher.mockResolvedValueOnce(json({ content: [member] }));
        fetcher.mockResolvedValueOnce(json(member));
        expect(await createCrewmeisterAccount(input)).toEqual({
            status: "skipped",
            reason: "already_created",
        });
        expect(fetcher.mock.calls.every(([, init]) => !init?.method)).toBe(
            true,
        );
        expect(db.workerExternalAccount.upsert).toHaveBeenCalledTimes(1);
        expect(sendMail).not.toHaveBeenCalled();
    },
);
it.each([
    {
        label: "HTTP rejection",
        status: 403,
        body: { message: "Permission denied" },
    },
    {
        label: "business rejection",
        status: 200,
        body: { statusCode: 400, message: "Invalid invitation" },
    },
    { label: "missing receipt", status: 200, body: {} },
    {
        label: "missing member ID",
        status: 200,
        body: { statusCode: 201, payload: {} },
    },
    {
        label: "invalid member ID",
        status: 200,
        body: { statusCode: 201, payload: { id: "../users/7" } },
    },
])("rejects an invalid invitation result: $label", async ({ status, body }) => {
    fetcher
        .mockReset()
        .mockResolvedValueOnce(json({ content: [{ id: 42 }] }))
        .mockResolvedValueOnce(json({ content: [] }))
        .mockResolvedValueOnce(json(body, status));
    expect(await createCrewmeisterAccount(input)).toMatchObject({
        status: "failed",
    });
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(db.workerExternalAccount.upsert).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
});
it.each([
    { label: "missing", status: 404, body: {} },
    { label: "wrong crew", status: 200, body: { ...member, crewId: 43 } },
    {
        label: "wrong email",
        status: 200,
        body: { ...member, email: "other@example.com" },
    },
    { label: "wrong ID", status: 200, body: { ...member, id: 100 } },
    { label: "no user", status: 200, body: { ...member, userId: null } },
    { label: "disabled", status: 200, body: { ...member, disabled: true } },
])(
    "does not trust a successful invitation or saved ID without valid readback: $label",
    async ({ status, body }) => {
        for (const saved of [false, true]) {
            db.workerExternalAccount.upsert.mockClear();
            db.worker.findFirst.mockResolvedValue({
                id: "worker",
                firstName: "Ada",
                lastName: "Lovelace",
                email: "ada@example.com",
                externalAccounts: saved ? [{ externalId: "99" }] : [],
            });
            fetcher
                .mockReset()
                .mockResolvedValueOnce(json({ content: [{ id: 42 }] }));
            fetcher
                .mockResolvedValueOnce(json({ content: [] }))
                .mockResolvedValueOnce(
                    json({ statusCode: 201, payload: { id: 99 } }),
                );
            fetcher.mockResolvedValueOnce(json(body, status));
            expect(await createCrewmeisterAccount(input)).toMatchObject({
                status: "failed",
            });
            expect(db.workerExternalAccount.upsert).not.toHaveBeenCalled();
        }
    },
);
it.each([
    { label: "disabled", body: { content: [{ ...member, disabled: true }] } },
    { label: "ambiguous", body: { content: [member, { ...member, id: 100 }] } },
    { label: "malformed", body: {} },
])(
    "does not invite over an unresolved membership: $label",
    async ({ body }) => {
        fetcher
            .mockReset()
            .mockResolvedValueOnce(json({ content: [{ id: 42 }] }))
            .mockResolvedValueOnce(json(body));
        expect(await createCrewmeisterAccount(input)).toMatchObject({
            status: "failed",
        });
        expect(fetcher).toHaveBeenCalledTimes(2);
        expect(db.workerExternalAccount.upsert).not.toHaveBeenCalled();
    },
);
it.each([401, 403, 404])(
    "reports crew errors without inviting (HTTP %s)",
    async (status) => {
        fetcher.mockReset().mockResolvedValue(json({}, status));
        expect(await createCrewmeisterAccount(input)).toMatchObject({
            status: "failed",
            message: expect.stringContaining(`HTTP ${status}`),
        });
        expect(fetcher).toHaveBeenCalledTimes(1);
    },
);
it.each([{ crews: [] }, { crews: [{ id: 42 }, { id: 43 }] }])(
    "requires an unambiguous crew",
    async ({ crews }) => {
        fetcher.mockReset().mockResolvedValue(json({ content: crews }));
        expect(await createCrewmeisterAccount(input)).toMatchObject({
            status: "failed",
        });
        expect(fetcher).toHaveBeenCalledTimes(1);
    },
);
it("does not silently use another crew when the configured ID is unavailable", async () => {
    expect(
        await createCrewmeisterAccount({
            ...input,
            auth: { ...input.auth, crewId: "43" },
        }),
    ).toMatchObject({ status: "failed" });
    expect(fetcher).toHaveBeenCalledTimes(1);
});
it("uses the configured crew when several crews are visible", async () => {
    fetcher
        .mockReset()
        .mockResolvedValueOnce(json({ content: [{ id: 41 }, { id: 42 }] }))
        .mockResolvedValueOnce(json({ content: [] }))
        .mockResolvedValueOnce(json({ statusCode: 201, payload: { id: 99 } }))
        .mockResolvedValueOnce(json(member));
    expect(
        await createCrewmeisterAccount({
            ...input,
            auth: { ...input.auth, crewId: "42" },
        }),
    ).toMatchObject({ status: "created" });
    expect(String(fetcher.mock.calls[2][0])).toContain(
        "/crew/42/invite/with-email",
    );
});
it("does not call Crewmeister with execution off", async () => {
    delete process.env.INTEGRATIONS_LIVE;
    expect(await createCrewmeisterAccount(input)).toEqual({
        status: "skipped",
        reason: "not_live",
    });
    expect(fetcher).not.toHaveBeenCalled();
});
it("does not call Crewmeister without configuration or a worker", async () => {
    expect(await createCrewmeisterAccount({ ...input, auth: null })).toEqual({
        status: "skipped",
        reason: "not_configured",
    });
    db.worker.findFirst.mockResolvedValue(null);
    expect(await createCrewmeisterAccount(input)).toMatchObject({
        status: "failed",
    });
    expect(fetcher).not.toHaveBeenCalled();
});
