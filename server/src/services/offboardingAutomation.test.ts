import { prisma } from "@/lib/prisma";
import { microsoftGraphToken } from "@/services/microsoft365Account";
import {
    arbeitszeugnisPreview,
    confirmArbeitszeugnis,
    runTaskAutomation,
} from "@/services/offboardingAutomation";

jest.mock("@/lib/prisma", () => ({
    prisma: {
        issue: { findFirst: jest.fn(), update: jest.fn() },
        worker: { findFirst: jest.fn(), update: jest.fn() },
        departureMailSettings: { findUnique: jest.fn() },
        welcomeMailSettings: { findUnique: jest.fn() },
        workerEngagement: { findFirst: jest.fn() },
        automationDocumentSetting: { findUnique: jest.fn() },
        arbeitszeugnis: { upsert: jest.fn() },
        $transaction: jest.fn(),
    },
}));

jest.mock("@/services/microsoft365Account", () => ({
    microsoftGraphToken: jest.fn(),
}));

const findIssue = prisma.issue.findFirst as jest.Mock;
const updateIssue = prisma.issue.update as jest.Mock;
const findWorker = prisma.worker.findFirst as jest.Mock;
const updateWorker = prisma.worker.update as jest.Mock;
const findDepartureSettings = prisma.departureMailSettings.findUnique as jest.Mock;
const findWelcomeSettings = prisma.welcomeMailSettings.findUnique as jest.Mock;
const findEngagement = prisma.workerEngagement.findFirst as jest.Mock;
const findDocumentSetting = prisma.automationDocumentSetting.findUnique as jest.Mock;
const upsertCertificate = prisma.arbeitszeugnis.upsert as jest.Mock;
const transaction = prisma.$transaction as jest.Mock;
const token = microsoftGraphToken as jest.Mock;

const departureWorker = {
    id: "worker-1",
    firstName: "Ada",
    lastName: "Lovelace",
    workEmail: "ada@firma.de",
    position: "Maler",
    exitDate: new Date("2026-10-01T00:00:00.000Z"),
    departureMailSentAt: null as Date | null,
};

const departureSettings = {
    senderAddress: "admin@firma.de",
    groupId: "group-bsb",
    groupName: "BSB",
    subject: "Entlassung {{Vorname}} {{Nachname}}",
    body: "{{Vorname}} {{Nachname}} wurde entlassen.\n{{Entlassung}}",
};

const issue = {
    id: "issue-1",
    status: "open",
    workerEngagement: {
        id: "engagement-1",
        worker: {
            id: "worker-1",
            workEmail: "ada@firma.de",
            externalAccounts: [{ externalId: "graph-user-1" }],
        },
    },
};

function jsonResponse(body: unknown, status = 200) {
    return {
        ok: status >= 200 && status < 300,
        status,
        text: async () => (body == null ? "" : JSON.stringify(body)),
    } as Response;
}

describe("offboarding microsoft automation", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "error").mockImplementation(() => undefined);
        findIssue.mockResolvedValue(issue);
        updateIssue.mockResolvedValue({});
        token.mockResolvedValue("graph-token");
        transaction.mockImplementation(async (run: (tx: unknown) => unknown) => {
            const tx = {
                workerExternalAccount: { upsert: jest.fn() },
                issue: { update: jest.fn() },
                issueAuditLog: { create: jest.fn() },
            };
            await run(tx);
            return tx;
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("blocks sign-in and marks the chosen task done", async () => {
        const fetchMock = jest
            .spyOn(global, "fetch")
            .mockResolvedValueOnce(
                jsonResponse({ id: "graph-user-1", accountEnabled: true }),
            )
            .mockResolvedValueOnce(jsonResponse(null, 204))
            .mockResolvedValueOnce(
                jsonResponse({ id: "graph-user-1", accountEnabled: false }),
            );

        const result = await runTaskAutomation({
            organizationId: "org-1",
            issueId: "issue-1",
            actorUserId: "user-1",
            automation: "o365-block-signin",
        });

        expect(result).toEqual({ status: "completed", alreadyBlocked: false });
        expect(fetchMock).toHaveBeenNthCalledWith(
            2,
            "https://graph.microsoft.com/v1.0/users/graph-user-1",
            expect.objectContaining({
                method: "PATCH",
                body: JSON.stringify({ accountEnabled: false }),
            }),
        );
        expect(updateIssue).toHaveBeenCalledWith({
            where: { id: "issue-1" },
            data: { automation: "o365-block-signin" },
        });
        const tx = await transaction.mock.results[0].value;
        expect(tx.issue.update).toHaveBeenCalledWith({
            where: { id: "issue-1" },
            data: { status: "done" },
        });
        expect(tx.workerExternalAccount.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                update: { externalId: "graph-user-1", status: "disabled" },
            }),
        );
    });

    it("treats an already blocked account as success", async () => {
        jest.spyOn(global, "fetch").mockResolvedValueOnce(
            jsonResponse({ id: "graph-user-1", accountEnabled: false }),
        );

        const result = await runTaskAutomation({
            organizationId: "org-1",
            issueId: "issue-1",
            actorUserId: "user-1",
            automation: "o365-block-signin",
        });

        expect(result).toEqual({ status: "completed", alreadyBlocked: true });
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("leaves the task open when Microsoft rejects the block", async () => {
        jest.spyOn(global, "fetch")
            .mockResolvedValueOnce(
                jsonResponse({ id: "graph-user-1", accountEnabled: true }),
            )
            .mockResolvedValueOnce(jsonResponse({ error: "denied" }, 403));

        const result = await runTaskAutomation({
            organizationId: "org-1",
            issueId: "issue-1",
            actorUserId: "user-1",
            automation: "o365-block-signin",
        });

        expect(result).toEqual({
            status: "failed",
            message: "Microsoft Graph hat die Sperre abgelehnt.",
        });
        expect(transaction).not.toHaveBeenCalled();
    });

    it("sends the departure notice and marks the chosen task done", async () => {
        findWorker.mockResolvedValue(departureWorker);
        findDepartureSettings.mockResolvedValue(departureSettings);
        updateWorker.mockResolvedValue({});
        const fetchMock = jest.spyOn(global, "fetch").mockImplementation(async (input, init) => {
            const url = String(input);
            if (url.includes("/transitiveMembers/")) {
                return jsonResponse({
                    value: [{ mail: "team@firma.de" }],
                });
            }
            if (url.endsWith("/sendMail") && init?.method === "POST") {
                return jsonResponse(null, 202);
            }
            throw new Error(`unexpected ${init?.method ?? "GET"} ${url}`);
        });

        const result = await runTaskAutomation({
            organizationId: "org-1",
            issueId: "issue-1",
            actorUserId: "user-1",
            automation: "team-departure-mail",
        });

        expect(result).toEqual({ status: "completed", alreadyBlocked: false });
        expect(fetchMock).toHaveBeenCalledTimes(2);
        const sendCall = fetchMock.mock.calls.find((call) =>
            String(call[0]).endsWith("/sendMail"),
        );
        const body = JSON.parse(String(sendCall?.[1]?.body)) as {
            message: { subject: string; body: { content: string } };
        };
        expect(body.message.subject).toBe("Entlassung Ada Lovelace");
        expect(body.message.body.content).toContain("01.10.2026");
        expect(updateIssue).toHaveBeenCalledWith({
            where: { id: "issue-1" },
            data: { automation: "team-departure-mail" },
        });
        expect(updateWorker).toHaveBeenCalledWith({
            where: { id: "worker-1" },
            data: { departureMailSentAt: expect.any(Date) },
        });
        const tx = await transaction.mock.results[0].value;
        expect(tx.issue.update).toHaveBeenCalledWith({
            where: { id: "issue-1" },
            data: { status: "done" },
        });
        expect(tx.workerExternalAccount.upsert).not.toHaveBeenCalled();
    });

    it("completes the task without a second departure mail", async () => {
        findWorker.mockResolvedValue({
            ...departureWorker,
            departureMailSentAt: new Date("2026-10-02T08:00:00.000Z"),
        });
        const fetchMock = jest.spyOn(global, "fetch");

        const result = await runTaskAutomation({
            organizationId: "org-1",
            issueId: "issue-1",
            actorUserId: "user-1",
            automation: "team-departure-mail",
        });

        expect(result).toEqual({ status: "completed", alreadyBlocked: false });
        expect(fetchMock).not.toHaveBeenCalled();
        expect(updateWorker).not.toHaveBeenCalled();
        const tx = await transaction.mock.results[0].value;
        expect(tx.issue.update).toHaveBeenCalledWith({
            where: { id: "issue-1" },
            data: { status: "done" },
        });
    });

    it("does not send the reference letter from Go", async () => {
        const fetchMock = jest.spyOn(global, "fetch");

        const result = await runTaskAutomation({
            organizationId: "org-1",
            issueId: "issue-1",
            actorUserId: "user-1",
            automation: "arbeitszeugnis",
        });

        expect(result).toEqual({
            status: "failed",
            message: "Bitte prüfen Sie das Arbeitszeugnis vor dem Versand.",
        });
        expect(fetchMock).not.toHaveBeenCalled();
        expect(transaction).not.toHaveBeenCalled();
    });

    it("fills the reference letter, sends it, and stores the snapshot", async () => {
        findEngagement.mockResolvedValue({
            id: "engagement-1",
            workerId: "worker-1",
            endDate: new Date("2026-10-01T00:00:00.000Z"),
            arbeitszeugnis: null,
            worker: {
                firstName: "Ada",
                lastName: "Lovelace",
                email: "ada.privat@example.de",
                workEmail: "ada@firma.de",
                phoneNumber: null,
                birthday: null,
                position: "Maler",
                street: null,
                city: null,
                postalCode: null,
                entryDate: new Date("2020-01-15T00:00:00.000Z"),
                exitDate: null,
                engagements: [],
            },
        });
        findDocumentSetting.mockResolvedValue({
            documentMaster: {
                id: "master-1",
                name: "Arbeitszeugnis Maler",
                kind: "arbeitszeugnis",
                body: {
                    version: 2,
                    segments: [
                        { type: "text", text: "Frau " },
                        { type: "input", key: "contract.vorname", label: "Vorname" },
                        { type: "text", text: " trat ein am " },
                        { type: "input", key: "contract.eintritt", label: "Eintritt" },
                        { type: "text", text: " und aus am " },
                        { type: "input", key: "contract.austritt", label: "Austritt" },
                        { type: "text", text: "." },
                    ],
                },
            },
        });
        findDepartureSettings.mockResolvedValue(departureSettings);
        upsertCertificate.mockResolvedValue({});

        const preview = await arbeitszeugnisPreview({
            organizationId: "org-1",
            issueId: "issue-1",
        });
        expect(preview.status).toBe("ready");
        if (preview.status !== "ready") return;
        expect(preview.preview.values["contract.vorname"]).toBe("Ada");
        expect(preview.preview.unmatched).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ label: "Position", value: "Maler" }),
            ]),
        );

        const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue(jsonResponse(null, 202));
        const result = await confirmArbeitszeugnis({
            organizationId: "org-1",
            issueId: "issue-1",
            actorUserId: "user-1",
            values: preview.preview.values,
        });

        expect(result).toEqual({ status: "completed", alreadyBlocked: false });
        expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
            "https://graph.microsoft.com/v1.0/users/admin%40firma.de/sendMail",
        );
        const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)) as {
            message: {
                subject: string;
                body: { content: string };
                toRecipients: { emailAddress: { address: string } }[];
            };
        };
        expect(body.message.subject).toBe("Ihr Arbeitszeugnis");
        expect(body.message.toRecipients[0]?.emailAddress.address).toBe(
            "ada.privat@example.de",
        );
        expect(body.message.body.content).toContain("Ada");
        expect(body.message.body.content).toContain("15.01.2020");
        expect(body.message.body.content).toContain("01.10.2026");
        expect(upsertCertificate).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { engagementId: "engagement-1" },
                create: expect.objectContaining({
                    masterId: "master-1",
                    sentAt: expect.any(Date),
                    body: {
                        version: 2,
                        segments: [
                            { type: "text", text: "Frau " },
                            { type: "text", text: "Ada" },
                            { type: "text", text: " trat ein am " },
                            { type: "text", text: "15.01.2020" },
                            { type: "text", text: " und aus am " },
                            { type: "text", text: "01.10.2026" },
                            { type: "text", text: "." },
                        ],
                    },
                }),
            }),
        );
        const tx = await transaction.mock.results[0].value;
        expect(tx.issue.update).toHaveBeenCalledWith({
            where: { id: "issue-1" },
            data: { status: "done" },
        });
    });

    it("completes the task without sending the reference letter again", async () => {
        findEngagement.mockResolvedValue({
            id: "engagement-1",
            workerId: "worker-1",
            endDate: null,
            arbeitszeugnis: { sentAt: new Date("2026-10-02T08:00:00.000Z") },
            worker: {
                firstName: "Ada",
                lastName: "Lovelace",
                email: "ada.privat@example.de",
                workEmail: null,
                phoneNumber: null,
                birthday: null,
                position: null,
                street: null,
                city: null,
                postalCode: null,
                entryDate: null,
                exitDate: null,
                engagements: [],
            },
        });
        const fetchMock = jest.spyOn(global, "fetch");

        const result = await confirmArbeitszeugnis({
            organizationId: "org-1",
            issueId: "issue-1",
            actorUserId: "user-1",
            values: {},
        });

        expect(result).toEqual({ status: "completed", alreadyBlocked: false });
        expect(fetchMock).not.toHaveBeenCalled();
        expect(upsertCertificate).not.toHaveBeenCalled();
        expect(findWelcomeSettings).not.toHaveBeenCalled();
        const tx = await transaction.mock.results[0].value;
        expect(tx.issue.update).toHaveBeenCalledWith({
            where: { id: "issue-1" },
            data: { status: "done" },
        });
    });

    it("leaves the task open when a placeholder has no value", async () => {
        findEngagement.mockResolvedValue({
            id: "engagement-1",
            workerId: "worker-1",
            endDate: null,
            arbeitszeugnis: null,
            worker: {
                firstName: "Ada",
                lastName: "Lovelace",
                email: "ada.privat@example.de",
                workEmail: null,
                phoneNumber: null,
                birthday: null,
                position: null,
                street: null,
                city: null,
                postalCode: null,
                entryDate: null,
                exitDate: null,
                engagements: [],
            },
        });
        findDocumentSetting.mockResolvedValue({
            documentMaster: {
                id: "master-1",
                name: "Arbeitszeugnis Maler",
                kind: "arbeitszeugnis",
                body: {
                    version: 2,
                    segments: [
                        { type: "input", key: "contract.farbe", label: "Lieblingsfarbe" },
                        { type: "input", key: "contract.austritt", label: "Austritt" },
                    ],
                },
            },
        });
        const fetchMock = jest.spyOn(global, "fetch");

        const preview = await arbeitszeugnisPreview({
            organizationId: "org-1",
            issueId: "issue-1",
        });
        expect(preview).toEqual(
            expect.objectContaining({
                status: "ready",
                preview: expect.objectContaining({
                    unresolved: [{ key: "contract.farbe", label: "Lieblingsfarbe" }],
                }),
            }),
        );

        const result = await confirmArbeitszeugnis({
            organizationId: "org-1",
            issueId: "issue-1",
            actorUserId: "user-1",
            values: {},
        });

        expect(result).toEqual({
            status: "failed",
            message: "Diese Platzhalter konnten nicht gefüllt werden: Lieblingsfarbe, Austritt.",
        });
        expect(fetchMock).not.toHaveBeenCalled();
        expect(upsertCertificate).not.toHaveBeenCalled();
        expect(transaction).not.toHaveBeenCalled();
    });
});
