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

    it("creates a user and then a member", async () => {
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
                if (url.endsWith("/crews?pageSize=20")) {
                    return jsonResponse({ content: [{ id: 42 }] });
                }
                if (url.endsWith("/users") && init?.method === "PATCH") {
                    return jsonResponse([
                        { resourceAfterWrite: { id: 7 } },
                    ]);
                }
                if (url.endsWith("/members") && init?.method === "PATCH") {
                    const body = JSON.parse(String(init.body)) as {
                        method: string;
                        body: { userId: number; crewId: number };
                    }[];
                    expect(body[0].method).toBe("POST");
                    expect(body[0].body.userId).toBe(7);
                    expect(body[0].body.crewId).toBe(42);
                    return jsonResponse([
                        { resourceAfterWrite: { id: 99 } },
                    ]);
                }
                throw new Error(`unexpected ${init?.method ?? "GET"} ${url}`);
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
    });
});
