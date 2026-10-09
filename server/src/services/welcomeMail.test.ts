import { prisma } from "@/lib/prisma";
import { microsoftGraphToken } from "@/services/microsoft365Account";
import {
    applyWelcomeMailTemplate,
    formatWelcomeEntryDate,
    sendTeamWelcomeMail,
    welcomeRecipientAddresses,
} from "@/services/welcomeMail";

jest.mock("@/lib/prisma", () => ({
    prisma: {
        worker: { findFirst: jest.fn() },
        welcomeMailSettings: { findUnique: jest.fn() },
        $transaction: jest.fn(),
    },
}));

jest.mock("@/services/microsoft365Account", () => ({
    microsoftGraphToken: jest.fn(),
}));

const findWorker = prisma.worker.findFirst as jest.Mock;
const findSettings = prisma.welcomeMailSettings.findUnique as jest.Mock;
const transaction = prisma.$transaction as jest.Mock;
const token = microsoftGraphToken as jest.Mock;

const settings = {
    senderAddress: "admin@firma.de",
    groupId: "group-bsb",
    groupName: "BSB",
    subject: "Willkommen {{Vorname}}",
    body: "Hallo {{Vorname}} {{Nachname}}\n{{Arbeitsmail}}\n{{Position}}\n{{Eintritt}}",
};

const worker = {
    id: "worker-1",
    firstName: "Ada",
    lastName: "Lovelace",
    workEmail: "ada.lovelace@firma.de",
    position: "Maler",
    entryDate: new Date("2026-04-01T00:00:00.000Z"),
    welcomeMailSentAt: null,
};

function jsonResponse(body: unknown, status = 200) {
    return {
        ok: status >= 200 && status < 300,
        status,
        text: async () => (body == null ? "" : JSON.stringify(body)),
    } as Response;
}

describe("welcome mail", () => {
    beforeEach(() => {
        jest.spyOn(console, "error").mockImplementation(() => undefined);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("fills the placeholders", () => {
        expect(formatWelcomeEntryDate(worker.entryDate)).toBe("01.04.2026");
        expect(
            applyWelcomeMailTemplate(settings.body, {
                firstName: "Ada",
                lastName: "Lovelace",
                workEmail: "ada.lovelace@firma.de",
                position: "Maler",
                entryDate: "01.04.2026",
            }),
        ).toBe(
            "Hallo Ada Lovelace\nada.lovelace@firma.de\nMaler\n01.04.2026",
        );
    });

    it("keeps mail addresses and falls back to the principal name", () => {
        expect(
            welcomeRecipientAddresses([
                { mail: "A@Firma.de" },
                { mail: "a@firma.de" },
                { userPrincipalName: "b@firma.de" },
                { mail: " ", userPrincipalName: "" },
                { mail: "ohne-domain" },
            ]),
        ).toEqual(["a@firma.de", "b@firma.de"]);
    });

    it("sends nothing when the welcome mail is not configured", async () => {
        findWorker.mockResolvedValue(worker);
        findSettings.mockResolvedValue(null);
        const fetchSpy = jest
            .spyOn(global, "fetch")
            .mockRejectedValue(new Error("should not call"));

        const result = await sendTeamWelcomeMail({
            organizationId: "org-1",
            workerId: "worker-1",
            engagementId: "engagement-1",
            actorUserId: "user-1",
        });

        expect(result).toEqual({ status: "skipped", reason: "not_configured" });
        expect(token).not.toHaveBeenCalled();
        expect(fetchSpy).not.toHaveBeenCalled();
        expect(transaction).not.toHaveBeenCalled();
    });

    it("sends one mail to the team and does not send again", async () => {
        findWorker
            .mockResolvedValueOnce(worker)
            .mockResolvedValueOnce({
                ...worker,
                welcomeMailSentAt: new Date("2026-04-02T08:00:00.000Z"),
            });
        findSettings.mockResolvedValue(settings);
        token.mockResolvedValue("token");
        const updateWorker = jest.fn();
        const updateIssue = jest.fn();
        const createAudit = jest.fn();
        transaction.mockImplementation(async (run: (tx: unknown) => unknown) =>
            run({
                worker: { update: updateWorker },
                issue: {
                    findMany: jest
                        .fn()
                        .mockResolvedValue([{ id: "issue-1", status: "open" }]),
                    update: updateIssue,
                },
                issueAuditLog: { create: createAudit },
            }),
        );

        const fetchSpy = jest.spyOn(global, "fetch").mockImplementation(async (input, init) => {
            const url = String(input);
            if (url.includes("/transitiveMembers/")) {
                return jsonResponse({
                    value: [
                        { mail: "A@Firma.de" },
                        { userPrincipalName: "b@firma.de" },
                        { mail: null },
                    ],
                });
            }
            if (url.endsWith("/sendMail") && init?.method === "POST") {
                return jsonResponse(null, 202);
            }
            throw new Error(`unexpected ${init?.method ?? "GET"} ${url}`);
        });

        const sent = await sendTeamWelcomeMail({
            organizationId: "org-1",
            workerId: "worker-1",
            engagementId: "engagement-1",
            actorUserId: "user-1",
        });

        expect(sent).toEqual({ status: "sent" });
        expect(fetchSpy).toHaveBeenCalledTimes(2);
        const sendCall = fetchSpy.mock.calls[1];
        expect(String(sendCall[0])).toBe(
            "https://graph.microsoft.com/v1.0/users/admin%40firma.de/sendMail",
        );
        const body = JSON.parse(String(sendCall[1]?.body)) as {
            saveToSentItems: boolean;
            message: {
                subject: string;
                body: { content: string };
                toRecipients: { emailAddress: { address: string } }[];
            };
        };
        expect(body.saveToSentItems).toBe(true);
        expect(body.message.subject).toBe("Willkommen Ada");
        expect(body.message.body.content).toContain("01.04.2026");
        expect(body.message.toRecipients.map((item) => item.emailAddress.address)).toEqual([
            "a@firma.de",
            "b@firma.de",
        ]);
        expect(updateWorker).toHaveBeenCalledWith({
            where: { id: "worker-1" },
            data: { welcomeMailSentAt: expect.any(Date) },
        });
        expect(updateIssue).toHaveBeenCalledWith({
            where: { id: "issue-1" },
            data: { status: "done" },
        });
        expect(createAudit).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    issueId: "issue-1",
                    actorUserId: "user-1",
                    action: "issue.updated",
                }),
            }),
        );

        const again = await sendTeamWelcomeMail({
            organizationId: "org-1",
            workerId: "worker-1",
            engagementId: "engagement-1",
            actorUserId: "user-1",
        });

        expect(again).toEqual({ status: "skipped", reason: "already_sent" });
        expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
});
