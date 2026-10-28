import { prisma } from "@/lib/prisma";
import {
    createCrewmeisterAccount,
    deleteCrewmeisterMembership,
} from "./crewmeisterAccount";

jest.mock("@/lib/prisma", () => ({
    prisma: {
        worker: { findFirst: jest.fn() },
        workerExternalAccount: { deleteMany: jest.fn(), upsert: jest.fn() },
    },
}));
const db = prisma as any;
const input = {
    organizationId: "org",
    workerId: "worker",
    auth: { token: "jwt", crewId: "42" },
};
const member = {
    id: 99,
    crewId: 42,
    userId: 7,
    email: "ada@example.com",
    disabled: true,
};
const json = (body: unknown, status = 200) =>
    ({
        ok: status >= 200 && status < 300,
        status,
        text: async () => JSON.stringify(body),
    }) as Response;
const receipt = { resourceBeforeWrite: member, resourceAfterWrite: null };
const originalLive = process.env.INTEGRATIONS_LIVE;
let fetcher: jest.SpyInstance;
let current: typeof member | null;
beforeEach(() => {
    jest.clearAllMocks();
    process.env.INTEGRATIONS_LIVE = "true";
    current = { ...member };
    db.worker.findFirst.mockResolvedValue({
        id: "worker",
        email: member.email,
        firstName: "Ada",
        lastName: "Lovelace",
    });
    db.workerExternalAccount.deleteMany.mockResolvedValue({ count: 1 });
    db.workerExternalAccount.upsert.mockResolvedValue({});
    fetcher = jest
        .spyOn(global, "fetch")
        .mockImplementation(async (path, init) => {
            const url = new URL(String(path));
            expect(url.origin).toBe("https://api.crewmeister.com");
            expect(init?.headers).toMatchObject({
                Authorization: "Bearer jwt",
                "X-Write-Async": "false",
            });
            if (url.pathname.endsWith("/crews"))
                return json({ content: [{ id: 42 }] });
            if (url.pathname.endsWith("/members")) {
                expect(url.searchParams.get("filter")).toBe(
                    'crewId==42;email=="ada@example.com"',
                );
                return json({ content: current ? [current] : [] });
            }
            if (/\/members\/(99|100)$/.test(url.pathname)) {
                if (init?.method === "DELETE") {
                    current = null;
                    return json(receipt);
                }
                return current ? json(current) : json({}, 404);
            }
            if (
                url.pathname === "/api/v2/crew/42/invite/with-email" &&
                init?.method === "POST"
            ) {
                expect(current).toBeNull();
                current = { ...member, id: 100, disabled: false };
                return json({ statusCode: 201, payload: { id: 100 } });
            }
            throw new Error("Unexpected Crewmeister request");
        });
});
afterEach(() => {
    if (originalLive === undefined) delete process.env.INTEGRATIONS_LIVE;
    else process.env.INTEGRATIONS_LIVE = originalLive;
    jest.restoreAllMocks();
});
it("deletes only a verified disabled membership and clears only its local mapping after readback", async () => {
    expect(await deleteCrewmeisterMembership(input)).toEqual({
        status: "completed",
    });
    expect(
        fetcher.mock.calls.map(([url, init]) => [
            new URL(String(url)).pathname,
            init?.method ?? "GET",
        ]),
    ).toEqual([
        ["/api/v3/platform-app/crews", "GET"],
        ["/api/v3/platform-app/members", "GET"],
        ["/api/v3/platform-app/members/99", "GET"],
        ["/api/v3/platform-app/members/99", "DELETE"],
        ["/api/v3/platform-app/members", "GET"],
    ]);
    expect(db.workerExternalAccount.deleteMany).toHaveBeenCalledWith({
        where: {
            workerId: "worker",
            provider: "crewmeister",
            externalId: "99",
        },
    });
});
it("can invite the same email again after membership removal", async () => {
    await deleteCrewmeisterMembership(input);
    expect(
        await createCrewmeisterAccount({
            ...input,
            engagementId: "engagement",
        }),
    ).toEqual({ status: "created", externalId: "100" });
    expect(db.workerExternalAccount.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
            update: { externalId: "100", status: "active" },
        }),
    );
});
it.each([
    { name: "enabled member", value: { ...member, disabled: false } },
    { name: "foreign crew", value: { ...member, crewId: 43 } },
    { name: "foreign email", value: { ...member, email: "other@example.com" } },
    { name: "missing login link", value: { ...member, userId: null } },
    { name: "invalid member ID", value: { ...member, id: "../users/7" } },
])("refuses to delete $name", async ({ value }) => {
    current = value as typeof member;
    expect(await deleteCrewmeisterMembership(input)).toMatchObject({
        status: "failed",
    });
    expect(fetcher.mock.calls.every(([, init]) => !init?.method)).toBe(true);
    expect(db.workerExternalAccount.deleteMany).not.toHaveBeenCalled();
});
it.each([{ members: [] }, { members: [member, { ...member, id: 100 }] }])(
    "refuses missing or ambiguous matches",
    async ({ members }) => {
        fetcher
            .mockReset()
            .mockResolvedValueOnce(json({ content: [{ id: 42 }] }))
            .mockResolvedValueOnce(json({ content: members }));
        expect(await deleteCrewmeisterMembership(input)).toMatchObject({
            status: "failed",
        });
        expect(fetcher).toHaveBeenCalledTimes(2);
        expect(db.workerExternalAccount.deleteMany).not.toHaveBeenCalled();
    },
);
it.each([
    { ...member, crewId: 43 },
    { ...member, userId: 8 },
    { ...member, email: "other@example.com" },
    { ...member, disabled: false },
])(
    "checks identity and disabled state again immediately before deletion",
    async (changed) => {
        fetcher
            .mockReset()
            .mockResolvedValueOnce(json({ content: [{ id: 42 }] }))
            .mockResolvedValueOnce(json({ content: [member] }))
            .mockResolvedValueOnce(json(changed));
        expect(await deleteCrewmeisterMembership(input)).toMatchObject({
            status: "failed",
        });
        expect(fetcher).toHaveBeenCalledTimes(3);
    },
);
it.each([
    {
        name: "permission denied",
        status: 403,
        body: { code: "PERMISSION_DENIED" },
    },
    { name: "not found or not authorized", status: 404, body: {} },
    { name: "asynchronous job only", status: 202, body: {} },
    { name: "missing receipt", status: 200, body: {} },
    {
        name: "wrong membership in receipt",
        status: 200,
        body: { ...receipt, resourceBeforeWrite: { ...member, id: 100 } },
    },
])("does not clear the local mapping after $name", async ({ status, body }) => {
    fetcher
        .mockReset()
        .mockResolvedValueOnce(json({ content: [{ id: 42 }] }))
        .mockResolvedValueOnce(json({ content: [member] }))
        .mockResolvedValueOnce(json(member))
        .mockResolvedValueOnce(json(body, status));
    expect(await deleteCrewmeisterMembership(input)).toMatchObject({
        status: "failed",
    });
    expect(db.workerExternalAccount.deleteMany).not.toHaveBeenCalled();
});
it.each([
    { name: "member still present", body: { content: [member] }, status: 200 },
    { name: "malformed readback", body: {}, status: 200 },
    { name: "failed readback", body: {}, status: 403 },
])("requires a confirmed readback: $name", async ({ body, status }) => {
    fetcher
        .mockReset()
        .mockResolvedValueOnce(json({ content: [{ id: 42 }] }))
        .mockResolvedValueOnce(json({ content: [member] }))
        .mockResolvedValueOnce(json(member))
        .mockResolvedValueOnce(json(receipt))
        .mockResolvedValueOnce(json(body, status));
    expect(await deleteCrewmeisterMembership(input)).toMatchObject({
        status: "failed",
    });
    expect(db.workerExternalAccount.deleteMany).not.toHaveBeenCalled();
});
it("does not use Crewmeister without configuration, a worker, or live execution", async () => {
    expect(
        await deleteCrewmeisterMembership({ ...input, auth: null }),
    ).toMatchObject({ status: "skipped" });
    delete process.env.INTEGRATIONS_LIVE;
    expect(await deleteCrewmeisterMembership(input)).toMatchObject({
        status: "skipped",
        reason: "not_live",
    });
    db.worker.findFirst.mockResolvedValue(null);
    expect(await deleteCrewmeisterMembership(input)).toMatchObject({
        status: "failed",
    });
    expect(fetcher).not.toHaveBeenCalled();
});
