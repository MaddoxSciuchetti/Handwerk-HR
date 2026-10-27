import { prisma } from "@/lib/prisma";
import { deactivateCrewmeisterAccount } from "./crewmeisterAccount";
jest.mock("@/lib/prisma", () => ({
    prisma: {
        worker: { findFirst: jest.fn() },
        workerExternalAccount: { upsert: jest.fn() },
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
    disabled: false,
};
const json = (body: unknown, status = 200) =>
    ({
        ok: status >= 200 && status < 300,
        status,
        text: async () => JSON.stringify(body),
    }) as Response;
const originalLive = process.env.INTEGRATIONS_LIVE;
let fetcher: jest.SpyInstance;
beforeEach(() => {
    process.env.INTEGRATIONS_LIVE = "true";
    db.worker.findFirst.mockResolvedValue({
        id: "worker",
        email: "ada@example.com",
    });
    db.workerExternalAccount.upsert.mockResolvedValue({});
    let disabled = false;
    fetcher = jest
        .spyOn(global, "fetch")
        .mockImplementation(async (path, init) => {
            const url = new URL(String(path));
            expect(init?.headers).toMatchObject({
                Authorization: "Bearer jwt",
            });
            if (url.pathname.endsWith("/crews"))
                return json({ content: [{ id: 42 }] });
            if (url.pathname.endsWith("/members")) {
                expect(url.searchParams.get("filter")).toBe(
                    'crewId==42;email=="ada@example.com"',
                );
                return json({ content: [{ ...member, disabled }] });
            }
            if (url.pathname.endsWith("/members/99")) {
                if (init?.method === "PATCH") {
                    expect(JSON.parse(String(init.body))).toEqual({
                        disabled: true,
                    });
                    disabled = true;
                    return json({
                        resourceAfterWrite: { ...member, disabled },
                    });
                }
                return json({ ...member, disabled });
            }
            throw new Error("Unexpected request");
        });
});
afterEach(() => {
    if (originalLive === undefined) delete process.env.INTEGRATIONS_LIVE;
    else process.env.INTEGRATIONS_LIVE = originalLive;
    jest.restoreAllMocks();
});
it("deactivates only the matched member and records success after readback", async () => {
    expect(await deactivateCrewmeisterAccount(input)).toEqual({
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
        ["/api/v3/platform-app/members/99", "PATCH"],
        ["/api/v3/platform-app/members/99", "GET"],
    ]);
    expect(db.workerExternalAccount.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
            update: { externalId: "99", status: "disabled" },
        }),
    );
});
it("confirms an already disabled member without writing to Crewmeister again", async () => {
    fetcher
        .mockReset()
        .mockResolvedValueOnce(json({ content: [{ id: 42 }] }))
        .mockResolvedValueOnce(
            json({ content: [{ ...member, disabled: true }] }),
        )
        .mockResolvedValueOnce(json({ ...member, disabled: true }));
    expect(await deactivateCrewmeisterAccount(input)).toEqual({
        status: "completed",
    });
    expect(fetcher.mock.calls.every(([, init]) => !init?.method)).toBe(true);
    expect(db.workerExternalAccount.upsert).toHaveBeenCalledTimes(1);
});
it.each([
    { label: "not found", body: { content: [] } },
    { label: "duplicate", body: { content: [member, { ...member, id: 100 }] } },
    { label: "foreign crew", body: { content: [{ ...member, crewId: 43 }] } },
    {
        label: "foreign email",
        body: { content: [{ ...member, email: "other@example.com" }] },
    },
])("does not deactivate an unresolved member: $label", async ({ body }) => {
    fetcher
        .mockReset()
        .mockResolvedValueOnce(json({ content: [{ id: 42 }] }))
        .mockResolvedValueOnce(json(body));
    expect(await deactivateCrewmeisterAccount(input)).toMatchObject({
        status: "failed",
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(db.workerExternalAccount.upsert).not.toHaveBeenCalled();
});
it.each([
    {
        label: "changed identity",
        body: { ...member, email: "other@example.com" },
    },
    { label: "changed crew", body: { ...member, crewId: 43 } },
    { label: "changed ID", body: { ...member, id: 100 } },
])("checks identity immediately before a write: $label", async ({ body }) => {
    fetcher
        .mockReset()
        .mockResolvedValueOnce(json({ content: [{ id: 42 }] }))
        .mockResolvedValueOnce(json({ content: [member] }))
        .mockResolvedValueOnce(json(body));
    expect(await deactivateCrewmeisterAccount(input)).toMatchObject({
        status: "failed",
    });
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(db.workerExternalAccount.upsert).not.toHaveBeenCalled();
});
it.each([false, true])(
    "does not report success after an unconfirmed or rejected write (rejected=%s)",
    async (rejected) => {
        fetcher
            .mockReset()
            .mockResolvedValueOnce(json({ content: [{ id: 42 }] }))
            .mockResolvedValueOnce(json({ content: [member] }))
            .mockResolvedValueOnce(json(member));
        fetcher.mockResolvedValueOnce(
            rejected
                ? json({ message: "Permission denied" }, 403)
                : json({ resourceAfterWrite: { ...member, disabled: true } }),
        );
        if (!rejected) fetcher.mockResolvedValueOnce(json(member));
        expect(await deactivateCrewmeisterAccount(input)).toMatchObject({
            status: "failed",
        });
        expect(db.workerExternalAccount.upsert).not.toHaveBeenCalled();
    },
);
it("does not use the API without configuration, a worker, or live execution", async () => {
    expect(
        await deactivateCrewmeisterAccount({ ...input, auth: null }),
    ).toMatchObject({ status: "skipped", reason: "not_configured" });
    delete process.env.INTEGRATIONS_LIVE;
    expect(await deactivateCrewmeisterAccount(input)).toMatchObject({
        status: "skipped",
        reason: "not_live",
    });
    db.worker.findFirst.mockResolvedValue(null);
    expect(await deactivateCrewmeisterAccount(input)).toMatchObject({
        status: "failed",
    });
    expect(fetcher).not.toHaveBeenCalled();
});
