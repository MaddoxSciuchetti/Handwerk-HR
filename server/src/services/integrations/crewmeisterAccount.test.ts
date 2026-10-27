import { prisma } from "@/lib/prisma";
import { createCrewmeisterAccount } from "@/services/integrations/crewmeisterAccount";
import { sendMail } from "@/utils/sendMail";

jest.mock("@/lib/prisma", () => ({
    prisma: {
        worker: { findFirst: jest.fn() },
        workerEngagement: { findFirst: jest.fn() },
        workerExternalAccount: { upsert: jest.fn() },
    },
}));

jest.mock("@/utils/sendMail", () => ({
    sendMail: jest.fn(),
}));

const findWorker = prisma.worker.findFirst as jest.Mock;
const findEngagement = prisma.workerEngagement.findFirst as jest.Mock;
const upsertAccount = prisma.workerExternalAccount.upsert as jest.Mock;
const mail = sendMail as jest.Mock;

function jsonResponse(body: unknown, status = 200) {
    return {
        ok: status >= 200 && status < 300,
        status,
        text: async () => JSON.stringify(body),
    } as Response;
}

describe("crewmeister account", () => {
    const original = process.env.INTEGRATIONS_LIVE;

    afterEach(() => {
        if (original === undefined) delete process.env.INTEGRATIONS_LIVE;
        else process.env.INTEGRATIONS_LIVE = original;
        jest.restoreAllMocks();
    });

    it("does not call Crewmeister when sequences are not live", async () => {
        delete process.env.INTEGRATIONS_LIVE;
        findWorker.mockResolvedValue({
            id: "worker-1",
            firstName: "Ada",
            lastName: "Lovelace",
            email: "ada@personal.test",
            entryDate: null,
            externalAccounts: [],
        });
        const fetchSpy = jest
            .spyOn(global, "fetch")
            .mockRejectedValue(new Error("should not call"));

        const result = await createCrewmeisterAccount({
            organizationId: "org-1",
            workerId: "worker-1",
            engagementId: "engagement-1",
            auth: { token: "jwt", crewId: "" },
        });

        expect(result).toEqual({ status: "skipped", reason: "not_live" });
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it.each([false, true])(
        "creates a user and then a member with synchronous POSTs (wrapped=%s)",
        async (wrapped) => {
            process.env.INTEGRATIONS_LIVE = "true";
            findWorker.mockResolvedValue({
                id: "worker-1",
                firstName: "Ada",
                lastName: "Lovelace",
                email: "ada@personal.test",
                entryDate: new Date("2026-04-01T00:00:00.000Z"),
                externalAccounts: [],
            });
            findEngagement.mockResolvedValue({
                startDate: new Date("2026-04-01T00:00:00.000Z"),
            });
            upsertAccount.mockResolvedValue({});
            mail.mockResolvedValue({ data: { id: "mail-1" }, error: null });
            const fetchSpy = jest
                .spyOn(global, "fetch")
                .mockImplementation(async (input, init) => {
                    const url = String(input);
                    expect(new URL(url).origin).toBe(
                        "https://api.crewmeister.com",
                    );
                    expect(init?.headers).toMatchObject({
                        Authorization: "Bearer jwt",
                        "X-Write-Async": "false",
                    });
                    if (url.endsWith("/crews?pageSize=20")) {
                        return jsonResponse({ content: [{ id: 42 }] });
                    }
                    if (url.endsWith("/users") && init?.method === "POST") {
                        expect(JSON.parse(String(init.body))).toMatchObject({
                            email: "ada@personal.test",
                            terms: true,
                        });
                        const result = { resourceAfterWrite: { id: 7 } };
                        return jsonResponse(
                            wrapped
                                ? [{ statusCode: 201, body: result }]
                                : result,
                            201,
                        );
                    }
                    if (url.endsWith("/members") && init?.method === "POST") {
                        const body = JSON.parse(String(init.body)) as {
                            userId: number;
                            crewId: number;
                        };
                        expect(body.userId).toBe(7);
                        expect(body.crewId).toBe(42);
                        const result = { resourceAfterWrite: { id: 99 } };
                        return jsonResponse(
                            wrapped
                                ? [{ statusCode: 201, body: result }]
                                : result,
                            201,
                        );
                    }
                    throw new Error(
                        `unexpected ${init?.method ?? "GET"} ${url}`,
                    );
                });

            const result = await createCrewmeisterAccount({
                organizationId: "org-1",
                workerId: "worker-1",
                engagementId: "engagement-1",
                auth: { token: "jwt", crewId: "" },
            });

            expect(result).toMatchObject({
                status: "created",
                externalId: "99",
                passwordMailSent: true,
            });
            expect(upsertAccount).toHaveBeenCalledWith(
                expect.objectContaining({
                    create: expect.objectContaining({
                        provider: "crewmeister",
                        externalId: "99",
                    }),
                }),
            );
            expect(fetchSpy).toHaveBeenCalledTimes(3);
        },
    );

    it.each([
        {
            payload: [
                {
                    statusCode: 403,
                    body: {
                        code: "PERMISSION_DENIED",
                        message: "No permission to create user.",
                    },
                },
            ],
            message: "No permission to create user.",
        },
        {
            payload: [
                {
                    statusCode: 409,
                    body: {
                        code: "INVALID_ARGUMENT",
                        message: "Invalid email format.",
                    },
                },
            ],
            message: "Invalid email format.",
        },
        {
            payload: {
                code: "INVALID_ARGUMENT",
                message: "Invalid user data.",
            },
            message: "Invalid user data.",
        },
        {
            payload: { job: { id: "job-id" } },
            message: "Crewmeister verarbeitet die Erstellung noch.",
        },
    ])(
        "reports write failures or pending jobs instead of a missing user ID: $message",
        async ({ payload, message }) => {
            process.env.INTEGRATIONS_LIVE = "true";
            findWorker.mockResolvedValue({
                id: "worker-1",
                firstName: "Ada",
                lastName: "Lovelace",
                email: "ada@personal.test",
                externalAccounts: [],
            });
            findEngagement.mockResolvedValue({ startDate: null });
            const fetchSpy = jest
                .spyOn(global, "fetch")
                .mockResolvedValueOnce(jsonResponse({ content: [{ id: 42 }] }))
                .mockResolvedValueOnce(jsonResponse(payload));
            expect(
                await createCrewmeisterAccount({
                    organizationId: "org-1",
                    workerId: "worker-1",
                    engagementId: "engagement-1",
                    auth: { token: "jwt", crewId: "" },
                }),
            ).toMatchObject({
                status: "failed",
                message: expect.stringContaining(message),
            });
            expect(fetchSpy).toHaveBeenCalledTimes(2);
            expect(upsertAccount).not.toHaveBeenCalled();
            expect(mail).not.toHaveBeenCalled();
        },
    );

    it.each(["missing", "active", "invisible", "disabled"])(
        "recovers an existing user without changing their password (membership=%s)",
        async (membership) => {
            process.env.INTEGRATIONS_LIVE = "true";
            findWorker.mockResolvedValue({
                id: "worker-1",
                firstName: "Ada",
                lastName: "Lovelace",
                email: "ada@personal.test",
                externalAccounts: [],
            });
            findEngagement.mockResolvedValue({ startDate: null });
            mail.mockResolvedValue({ data: { id: "mail-1" }, error: null });
            const fetchSpy = jest
                .spyOn(global, "fetch")
                .mockImplementation(async (input, init) => {
                    const url = new URL(String(input));
                    if (url.pathname.endsWith("/crews"))
                        return jsonResponse({ content: [{ id: 42 }] });
                    if (
                        url.pathname.endsWith("/users") &&
                        init?.method === "POST"
                    )
                        return jsonResponse(
                            {
                                code: "ALREADY_EXISTS",
                                message:
                                    "There is already a resource that has the value ada@personal.test for property email. Please use another value.",
                            },
                            409,
                        );
                    if (url.pathname.endsWith("/users") && !init?.method) {
                        expect(url.searchParams.get("filter")).toBe(
                            'email=="ada@personal.test"',
                        );
                        return jsonResponse({
                            content:
                                membership === "invisible"
                                    ? []
                                    : [{ id: 7, email: "ada@personal.test" }],
                        });
                    }
                    if (url.pathname.endsWith("/members") && !init?.method) {
                        expect(url.searchParams.get("filter")).toBe(
                            "crewId==42;userId==7",
                        );
                        return jsonResponse({
                            content:
                                membership === "missing"
                                    ? []
                                    : [
                                          {
                                              id: 99,
                                              crewId: 42,
                                              userId: 7,
                                              disabled:
                                                  membership === "disabled",
                                          },
                                      ],
                        });
                    }
                    if (
                        url.pathname.endsWith("/members") &&
                        init?.method === "POST"
                    ) {
                        expect(membership).toBe("missing");
                        expect(JSON.parse(String(init.body))).toMatchObject({
                            crewId: 42,
                            userId: 7,
                        });
                        return jsonResponse(
                            { resourceAfterWrite: { id: 99 } },
                            201,
                        );
                    }
                    throw new Error("Unexpected request");
                });
            const result = await createCrewmeisterAccount({
                organizationId: "org-1",
                workerId: "worker-1",
                engagementId: "engagement-1",
                auth: { token: "jwt", crewId: "" },
            });
            if (membership === "invisible" || membership === "disabled") {
                expect(result).toMatchObject({
                    status: "failed",
                    message: expect.stringContaining(
                        membership === "invisible"
                            ? "nicht eindeutig lesen"
                            : "deaktiviert",
                    ),
                });
                expect(upsertAccount).not.toHaveBeenCalled();
                expect(mail).not.toHaveBeenCalled();
            } else {
                expect(result).toMatchObject({
                    status: "created",
                    externalId: "99",
                });
                expect(mail).toHaveBeenCalledWith(
                    expect.objectContaining({
                        text: expect.stringContaining(
                            "bestehenden Crewmeister-Zugangsdaten",
                        ),
                    }),
                );
                expect(mail.mock.calls[0][0].text).not.toContain(
                    "Temporäres Passwort",
                );
            }
            expect(
                fetchSpy.mock.calls.filter(
                    ([, init]) => init?.method === "POST",
                ),
            ).toHaveLength(membership === "missing" ? 2 : 1);
        },
    );

    it.each([
        [401, "Token abgelehnt"],
        [403, "darf die Crews nicht lesen"],
        [404, "Crews nicht geliefert"],
    ])(
        "explains crew lookup failures without attempting account creation (HTTP %s)",
        async (status, message) => {
            process.env.INTEGRATIONS_LIVE = "true";
            findWorker.mockResolvedValue({
                id: "worker-1",
                firstName: "Ada",
                lastName: "Lovelace",
                email: "ada@personal.test",
                externalAccounts: [],
            });
            findEngagement.mockResolvedValue({ startDate: null });
            const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue({
                ok: false,
                status,
                text: async () => "<html>Request failed</html>",
            } as Response);
            const result = await createCrewmeisterAccount({
                organizationId: "org-1",
                workerId: "worker-1",
                engagementId: "engagement-1",
                auth: { token: "jwt", crewId: "" },
            });
            expect(result).toEqual({
                status: "failed",
                message: expect.stringContaining(String(message)),
            });
            expect(result).toMatchObject({
                message: expect.stringContaining(`HTTP ${status}`),
            });
            expect(fetchSpy).toHaveBeenCalledTimes(1);
        },
    );
});
