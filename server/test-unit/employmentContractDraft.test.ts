import {
    getEngagementContract,
    resyncEngagementContractFromQuestionnaire,
    saveEngagementContractDraft,
} from "@/services/employmentContract.service";
import { prisma } from "@/lib/prisma";
import { fromSegments } from "../../shared/document";
import { invalidatePreparedDocuments } from "@/services/preparedDocument";
import { QUESTIONNAIRE_FIELDS } from "@/services/questionnaireForm";
import { Prisma } from "@prisma/client";

jest.mock("@/lib/prisma", () => ({
    prisma: {
        employmentContract: {
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            findFirstOrThrow: jest.fn(),
            update: jest.fn(),
        },
        employmentContractValue: {
            deleteMany: jest.fn(),
            createMany: jest.fn(),
        },
        $transaction: jest.fn(),
        $queryRaw: jest.fn(),
        documentMaster: { findFirst: jest.fn() },
        questionnaireSubmission: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
        issue: {
            findFirst: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            deleteMany: jest.fn(),
        },
        issueAuditLog: { create: jest.fn() },
        worker: { findFirst: jest.fn() },
        preparedDocument: { findFirst: jest.fn(), update: jest.fn() },
    },
}));
jest.mock("@/services/preparedDocument", () => ({
    invalidatePreparedDocuments: jest.fn(),
    outgoingPdfUrl: jest.fn().mockResolvedValue(null),
    currentPreparation: jest.fn().mockResolvedValue(null),
    DeliveryRejected: class extends Error {},
}));
jest.mock("@/utils/sendMail", () => ({ sendMail: jest.fn() }));
jest.mock("@/services/graphMail", () => ({ sendGraphMail: jest.fn() }));
jest.mock("@/config/aws", () => ({ generatePresignedUrl: jest.fn() }));

const params = {
    organizationId: "org",
    workerId: "worker",
    engagementId: "eng",
};
const body = fromSegments([
    { type: "input", key: "contract.vorname", label: "Vorname" },
    { type: "input", key: "contract.vorname", label: "Name nochmal" },
]);
let contract: any;
beforeEach(() => {
    jest.clearAllMocks();
    contract = {
        id: "contract",
        engagementId: "eng",
        masterId: "master",
        status: "draft",
        body: null,
        fileUrl: null,
        outgoingPdfId: null,
        sentAt: null,
        master: { name: "Vertrag", body },
        values: [],
        engagement: { questionnaireSubmission: null, worker: { email: "ada@example.com" } },
    };
    (prisma.$transaction as jest.Mock).mockImplementation((callback) =>
        callback(prisma),
    );
    for (const method of [
        "findFirst",
        "findUnique",
        "findFirstOrThrow",
    ] as const)
        (prisma.employmentContract[method] as jest.Mock).mockImplementation(
            async () => contract,
        );
    (prisma.employmentContractValue.deleteMany as jest.Mock).mockImplementation(
        async () => {
            contract.values = [];
        },
    );
    (prisma.employmentContractValue.createMany as jest.Mock).mockImplementation(
        async ({ data }) => {
            contract.values = data;
        },
    );
    (prisma.employmentContract.update as jest.Mock).mockImplementation(
        async ({ data }) => {
            const next = { ...data };
            if (next.body === Prisma.DbNull) next.body = null;
            Object.assign(contract, next);
            return contract;
        },
    );
    (prisma.documentMaster.findFirst as jest.Mock).mockResolvedValue(null);
});
it("keeps a worker's selected template when the organisation default changes", async () => {
    (prisma.documentMaster.findFirst as jest.Mock).mockResolvedValue({
        id: "primary-master",
    });
    const view = await getEngagementContract(params);
    expect(view?.masterId).toBe("master");
    expect(prisma.documentMaster.findFirst).not.toHaveBeenCalled();
    expect(prisma.employmentContract.update).not.toHaveBeenCalled();
});

it("keeps a sent contract on the master it was sent with", async () => {
    contract.sentAt = new Date();
    (prisma.documentMaster.findFirst as jest.Mock).mockResolvedValue({
        id: "primary-master",
    });

    await getEngagementContract(params);

    expect(prisma.documentMaster.findFirst).not.toHaveBeenCalled();
    expect(prisma.employmentContract.update).not.toHaveBeenCalled();
});

it("persists a manual correction across closing/reopening and field movement without changing the master", async () => {
    await saveEngagementContractDraft({
        ...params,
        values: { "contract.vorname": "Jörg Müller" },
    });
    const moved = structuredClone(body);
    moved.content.content![0].content!.reverse();
    contract.master.body = moved;
    const reopened = await getEngagementContract(params);
    expect(reopened?.values).toEqual({ "contract.vorname": "Jörg Müller" });
    expect(reopened?.document).toEqual(moved);
    expect(reopened?.followsMaster).toBe(true);
    expect(body.content.content![0].content![0].attrs?.key).toBe(
        "contract.vorname",
    );
});
it("loads the draft and its saved response with joined relations to avoid repeated remote reads", async () => {
    const saved = await saveEngagementContractDraft({
        ...params,
        values: { "contract.vorname": "Ada" },
    });

    expect(saved.values).toEqual({ "contract.vorname": "Ada" });
    expect(prisma.employmentContract.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ relationLoadStrategy: "join" }),
    );
    expect(prisma.employmentContract.findFirstOrThrow).toHaveBeenCalledWith(
        expect.objectContaining({ relationLoadStrategy: "join" }),
    );
});
it("keeps sent/signed snapshots locked and rejects foreign keys", async () => {
    await expect(
        saveEngagementContractDraft({
            ...params,
            values: { foreign: "value" },
        }),
    ).rejects.toThrow("gehört nicht");
    contract.status = "signed";
    contract.signedBody = {
        version: 2,
        segments: [{ type: "text", text: "Signed historical snapshot" }],
    };
    const before = structuredClone(contract.signedBody);
    await expect(
        saveEngagementContractDraft({
            ...params,
            values: { "contract.vorname": "Changed" },
        }),
    ).rejects.toThrow("kein Entwurf");
    expect(contract.signedBody).toEqual(before);
});

it("replaces contract values from the Fragebogen and drops removed fields", async () => {
    contract.master = {
        name: "Vertrag",
        revision: 4,
        body: fromSegments([
            { type: "input", key: "contract.nachname", label: "Nachname" },
        ]),
    };
    contract.matchedMasterRevision = 2;
    contract.values = [
        { key: "contract.gehalt", value: "4000" },
        { key: "contract.nachname", value: "Alt" },
    ];
    contract.engagement = {
        questionnaireSubmission: {
            id: "submission", revision: 0,
            status: "completed",
            formDefinition: { intro: "", items: [{ kind: "field", key: "lastName", label: "Nachname", section: "Person", type: "text", contractFieldKey: "contract.nachname" }] },
            answers: [
                { key: "lastName", value: "Lovelace" },
                { key: "firstName", value: "Ada" },
            ],
        },
        worker: { email: "ada@example.com" },
    };

    const view = await resyncEngagementContractFromQuestionnaire(params);

    expect(prisma.employmentContractValue.deleteMany).toHaveBeenCalled();
    expect(prisma.employmentContractValue.createMany).toHaveBeenCalledWith({
        data: [
            {
                employmentContractId: "contract",
                key: "contract.nachname",
                value: "Lovelace",
            },
        ],
    });
    expect(view.values).toEqual({ "contract.nachname": "Lovelace" });
    expect(view.matchedMasterRevision).toBe(4);
    expect(view.masterRevision).toBe(4);
});

it("keeps manual pay, allowances, checkboxes and description points when syncing questionnaire fields", async () => {
    contract.master = {
        name: "Vertrag",
        revision: 4,
        body: fromSegments([
            { type: "input", key: "contract.nachname", label: "Nachname" },
            { type: "input", key: "contract.gehalt", label: "Gehalt" },
            { type: "input", key: "contract.freiwillige_zulage", label: "Freiwillige Zulage" },
            { type: "input", key: "contract.zulage_im_einzelfall", label: "Zulage im Einzelfall" },
            { type: "input", key: "contract.total", label: "Brutto-Arbeitsentgelt insgesamt" },
            { type: "input", key: "contract.hourly", label: "Je Stunde", fieldType: "checkbox" },
            {
                type: "input",
                key: "contract.taetigkeiten",
                label: "Tätigkeiten",
                fieldType: "points",
            },
        ]),
    };
    contract.values = [
        { key: "contract.nachname", value: "Alt" },
        { key: "contract.taetigkeiten", value: "Montage\nWartung" },
        { key: "contract.gehalt", value: "4000" },
        { key: "contract.freiwillige_zulage", value: "200" },
        { key: "contract.zulage_im_einzelfall", value: "0" },
        { key: "contract.total", value: "4200" },
        { key: "contract.hourly", value: "false" },
    ];
    contract.engagement = {
        questionnaireSubmission: {
            id: "submission", revision: 0,
            status: "completed",
            formDefinition: { intro: "", items: [{ kind: "field", key: "lastName", label: "Nachname", section: "Person", type: "text", contractFieldKey: "contract.nachname" }] },
            answers: [{ key: "lastName", value: "Lovelace" }],
        },
        worker: { email: "ada@example.com" },
    };

    const view = await resyncEngagementContractFromQuestionnaire(params);

    expect(prisma.employmentContractValue.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
            {
                employmentContractId: "contract",
                key: "contract.nachname",
                value: "Lovelace",
            },
            {
                employmentContractId: "contract",
                key: "contract.taetigkeiten",
                value: "Montage\nWartung",
            },
        ]),
    });
    expect(view.values).toEqual({
        "contract.nachname": "Lovelace",
        "contract.taetigkeiten": "Montage\nWartung",
        "contract.gehalt": "4000",
        "contract.freiwillige_zulage": "200",
        "contract.zulage_im_einzelfall": "0",
        "contract.total": "4200",
        "contract.hourly": "false",
    });
});

it("refuses to resync a contract that was already sent", async () => {
    contract.sentAt = new Date();
    contract.engagement = {
        questionnaireSubmission: {
            status: "completed",
            answers: [{ key: "lastName", value: "Lovelace" }],
        },
        worker: { email: "ada@example.com" },
    };

    await expect(
        resyncEngagementContractFromQuestionnaire(params),
    ).rejects.toThrow("bereits versendet");
    expect(prisma.employmentContractValue.deleteMany).not.toHaveBeenCalled();
});

it("keeps saved contracts open and syncable without completing the task", async () => {
    contract.master.revision = 1;
    const saved = await saveEngagementContractDraft({
        ...params,
        values: { "contract.vorname": "Ada" },
    });
    expect(saved).toMatchObject({
        status: "draft", sentAt: null, followsMaster: true,
    });
    expect((await getEngagementContract(params))?.values).toEqual({
        "contract.vorname": "Ada",
    });
    contract.engagement.questionnaireSubmission = {
        id: "submission", revision: 2, status: "completed",
        formDefinition: {
            intro: "",
            items: [{
                kind: "field", key: "firstName", label: "Vorname",
                section: "Person", type: "text",
                contractFieldKey: "contract.vorname",
            }],
        },
        answers: [{ key: "firstName", value: "Augusta" }],
    };
    expect((await getEngagementContract(params))?.questionnaireSyncNeeded).toBe(true);
    const synced = await resyncEngagementContractFromQuestionnaire(params);
    expect(synced).toMatchObject({
        status: "draft", sentAt: null, followsMaster: true,
        values: { "contract.vorname": "Augusta" },
    });
    await saveEngagementContractDraft({
        ...params, values: { "contract.vorname": "Augusta Ada" },
    });
    expect((await getEngagementContract(params))?.values).toEqual({
        "contract.vorname": "Augusta Ada",
    });
    expect(prisma.issue.update).not.toHaveBeenCalled();
    expect(prisma.issue.deleteMany).not.toHaveBeenCalled();
    expect(prisma.issueAuditLog.create).not.toHaveBeenCalled();
    expect(prisma.preparedDocument.update).not.toHaveBeenCalled();
});

it("returns placed questionnaire answers so clearing a local field can restore its sidebar chip", async () => {
    contract.values = [{ key: "contract.vorname", value: "Lukas" }];
    contract.engagement = {
        questionnaireSubmission: {
            status: "completed",
            answers: [
                { key: "firstName", value: "Lukas" },
                { key: "lastName", value: "Muster" },
            ],
        },
        worker: { email: "lukas@example.test" },
    };
    const view = await getEngagementContract(params);
    expect(view?.values).toEqual({ "contract.vorname": "Lukas" });
    expect(view?.unmatchedAnswers.map((answer) => answer.key)).toEqual([
        "lastName",
    ]);
    expect(view?.questionnaireAnswers.map((answer) => answer.key)).toEqual([
        "firstName",
        "lastName",
    ]);
});

describe("changing a worker's contract template", () => {
    const replacement = {
        id: "other-master",
        name: "Anderer Arbeitsvertrag",
        revision: 7,
        body: fromSegments([
            { type: "input", key: "other.name", label: "Name" },
            { type: "input", key: "other.birthday", label: "Geburtsdatum" },
            { type: "input", key: "contract.gehalt", label: "Gehalt" },
            {
                type: "input",
                key: "contract.duties",
                label: "Tätigkeiten",
                fieldType: "points",
            },
        ]),
    };
    beforeEach(() => {
        contract.engagement = {
            questionnaireSubmission: {
                status: "completed",
                answers: [
                    { key: "firstName", value: "Lukas" },
                    { key: "lastName", value: "Muster" },
                    { key: "birthday", value: "1990-04-01" },
                ],
            },
            worker: { email: "lukas@example.test" },
        };
        contract.values = [
            { key: "old.field", value: "Alte manuelle Eingabe" },
            { key: "contract.duties", value: "Alte Tätigkeiten" },
            { key: "contract.gehalt", value: "4000" },
        ];
        contract.outgoingPdfId = "old-pdf";
        (prisma.documentMaster.findFirst as jest.Mock).mockResolvedValue(
            replacement,
        );
        (prisma.employmentContract.update as jest.Mock).mockImplementation(
            async ({ data }) => {
                const next = { ...data };
                if (next.body === Prisma.DbNull) next.body = null;
                Object.assign(contract, next);
                if (data.masterId === replacement.id)
                    contract.master = replacement;
                return contract;
            },
        );
    });
    it("applies questionnaire answers to the new template, drops old inputs and retains the choice on reopening", async () => {
        const view = await resyncEngagementContractFromQuestionnaire({
            ...params,
            masterId: replacement.id,
        });
        expect(view).toMatchObject({
            masterId: replacement.id,
            name: replacement.name,
            matchedMasterRevision: 7,
            values: {
                "other.name": "Lukas Muster",
                "other.birthday": "01.04.1990",
                "contract.gehalt": "4000",
            },
        });
        expect(view.values).not.toHaveProperty("old.field");
        expect(view.values).not.toHaveProperty("contract.duties");
        expect(contract.outgoingPdfId).toBeNull();
        expect(contract.status).toBe("draft");
        expect((await getEngagementContract(params))?.masterId).toBe(
            replacement.id,
        );
        expect(prisma.documentMaster.findFirst).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    id: replacement.id,
                    organizationId: "org",
                    kind: "employment_contract",
                    deletedAt: null,
                }),
            }),
        );
    });
    it("rejects foreign, deleted or non-contract templates before changing the contract", async () => {
        (prisma.documentMaster.findFirst as jest.Mock).mockResolvedValue(null);
        await expect(
            resyncEngagementContractFromQuestionnaire({
                ...params,
                masterId: "unavailable",
            }),
        ).rejects.toThrow("Vertragsvorlage nicht gefunden");
        expect(prisma.employmentContract.update).not.toHaveBeenCalled();
        expect(
            prisma.employmentContractValue.deleteMany,
        ).not.toHaveBeenCalled();
    });
    it.each(["sent", "signed"])("rejects a %s contract", async (state) => {
        if (state === "signed") contract.status = "signed";
        else contract.sentAt = new Date();
        await expect(
            resyncEngagementContractFromQuestionnaire({
                ...params,
                masterId: replacement.id,
            }),
        ).rejects.toThrow("bereits versendet");
        expect(prisma.employmentContract.update).not.toHaveBeenCalled();
    });
    it("rejects a template changed during matching", async () => {
        (prisma.documentMaster.findFirst as jest.Mock)
            .mockResolvedValueOnce(replacement)
            .mockResolvedValueOnce(null);
        await expect(
            resyncEngagementContractFromQuestionnaire({
                ...params,
                masterId: replacement.id,
            }),
        ).rejects.toThrow("hat sich geändert");
        expect(prisma.employmentContract.update).not.toHaveBeenCalled();
    });
});

it("rejects a draft save racing with a template switch instead of overwriting the new values", async () => {
    (prisma.employmentContract.findUnique as jest.Mock).mockResolvedValue({
        ...contract,
        masterId: "other-master",
    });
    await expect(
        saveEngagementContractDraft({
            ...params,
            values: { "contract.vorname": "Alt" },
        }),
    ).rejects.toThrow("inzwischen geändert");
    expect(prisma.employmentContractValue.deleteMany).not.toHaveBeenCalled();
});

it.each([
    ["ja", "true"],
    ["nein", "false"],
])(
    "persists questionnaire checkbox answer %s as %s when refreshing the contract",
    async (answer, expected) => {
        const field = QUESTIONNAIRE_FIELDS.find(
            (field) =>
                field.type === "single" &&
                field.options?.includes("ja") &&
                field.options?.includes("nein"),
        )!;
        contract.master = {
            name: "Vertrag",
            revision: 4,
            body: fromSegments([
                {
                    type: "input",
                    key: "contract.checkbox",
                    label: field.label,
                    fieldType: "checkbox",
                    required: false,
                },
            ]),
        };
        contract.engagement = {
            questionnaireSubmission: {
                status: "completed",
                answers: [{ key: field.key, value: answer }],
            },
            worker: { email: "test@example.com" },
        };
        const view = await resyncEngagementContractFromQuestionnaire(params);
        expect(prisma.employmentContractValue.createMany).toHaveBeenCalledWith({
            data: [
                {
                    employmentContractId: "contract",
                    key: "contract.checkbox",
                    value: expected,
                },
            ],
        });
        expect(view.values).toEqual({ "contract.checkbox": expected });
    },
);
it("reports newer questionnaire revisions until the contract has been synchronized", async () => {
    contract.matchedQuestionnaireRevision = 1;
    contract.engagement.questionnaireSubmission = {
        id: "submission", revision: 2, status: "completed", formDefinition: { intro: "", items: [{ kind: "field", key: "firstName", label: "Vorname", section: "Person", type: "text", contractFieldKey: "contract.vorname" }] },
        answers: [{ key: "firstName", value: "Augusta" }],
    };
    expect((await getEngagementContract(params))?.questionnaireSyncNeeded).toBe(true);
    const synced = await resyncEngagementContractFromQuestionnaire(params);
    expect(synced.values).toEqual({ "contract.vorname": "Augusta" });
    expect(synced.questionnaireSyncNeeded).toBe(false);
    expect(synced.matchedQuestionnaireRevision).toBe(2);
    expect(prisma.questionnaireSubmission.updateMany).toHaveBeenCalledWith({
        where: { id: "submission", revision: 2, status: "completed" }, data: { revision: 2 },
    });
});

it("does not mark a newer correction as synchronized when matching used an older revision", async () => {
    contract.engagement.questionnaireSubmission = {
        id: "submission", revision: 2, status: "completed", formDefinition: null,
        answers: [{ key: "firstName", value: "Augusta" }],
    };
    (prisma.questionnaireSubmission.updateMany as jest.Mock).mockResolvedValueOnce({ count: 0 });
    await expect(resyncEngagementContractFromQuestionnaire(params)).rejects.toThrow("inzwischen geändert");
    expect(prisma.employmentContractValue.deleteMany).not.toHaveBeenCalled();
});


it("keeps the prepared PDF when saving identical values", async () => {
    contract.values = [{ key: "contract.vorname", value: "Ada" }];
    await saveEngagementContractDraft({
        ...params,
        values: { "contract.vorname": "Ada" },
    });
    expect(invalidatePreparedDocuments).not.toHaveBeenCalled();
    expect(prisma.employmentContractValue.deleteMany).not.toHaveBeenCalled();
});

it("invalidates the prepared PDF when saved values change", async () => {
    contract.values = [{ key: "contract.vorname", value: "Ada" }];
    await saveEngagementContractDraft({
        ...params,
        values: { "contract.vorname": "Grace" },
    });
    expect(invalidatePreparedDocuments).toHaveBeenCalled();
    expect(contract.values).toEqual([
        expect.objectContaining({ key: "contract.vorname", value: "Grace" }),
    ]);
});

it("stores person-specific contract text without changing the master", async () => {
    const personalized = fromSegments([
        { type: "text", text: "Nur für diese Person. " },
        { type: "input", key: "contract.vorname", label: "Vorname" },
    ]);
    const masterBefore = structuredClone(contract.master.body);
    const saved = await saveEngagementContractDraft({
        ...params,
        values: { "contract.vorname": "Ada" },
        document: personalized,
    });
    expect(saved.followsMaster).toBe(false);
    expect(saved.document).toEqual(personalized);
    expect(contract.body).toEqual(personalized);
    expect(contract.master.body).toEqual(masterBefore);
    const valuesOnly = await saveEngagementContractDraft({
        ...params,
        values: { "contract.vorname": "Augusta" },
    });
    expect(valuesOnly.followsMaster).toBe(false);
    expect(contract.body).toEqual(personalized);
    expect(valuesOnly.values).toEqual({ "contract.vorname": "Augusta" });
});

it("keeps person-specific text when questionnaire values are synced", async () => {
    const personalized = fromSegments([
        { type: "text", text: "Individuell. " },
        { type: "input", key: "contract.vorname", label: "Vorname" },
    ]);
    contract.body = personalized;
    contract.engagement.questionnaireSubmission = {
        id: "submission",
        revision: 2,
        status: "completed",
        formDefinition: {
            intro: "",
            items: [{
                kind: "field",
                key: "firstName",
                label: "Vorname",
                section: "Person",
                type: "text",
                contractFieldKey: "contract.vorname",
            }],
        },
        answers: [{ key: "firstName", value: "Augusta" }],
    };
    const synced = await resyncEngagementContractFromQuestionnaire(params);
    expect(synced.followsMaster).toBe(false);
    expect(contract.body).toEqual(personalized);
    expect(synced.values).toEqual({ "contract.vorname": "Augusta" });
});

it("offers matching for empty hours on an existing draft without a new questionnaire revision", async () => {
    contract.master.body = fromSegments([{ type: "input", key: "contract.hours", label: "Anzahl der Stunden" }]);
    contract.matchedQuestionnaireRevision = 3;
    contract.engagement.questionnaireSubmission = {
        id: "submission", revision: 3, status: "completed",
        formDefinition: { intro: "", items: [{ kind: "field", key: "employmentExtent", label: "Wöchentliche Arbeitszeit", section: "Beruf", type: "text" }] },
        answers: [{ key: "employmentExtent", value: "37,5" }],
    };
    const view = await getEngagementContract(params);
    expect(view?.questionnaireSyncNeeded).toBe(true);
    expect(view?.values).toEqual({});
    const synced = await resyncEngagementContractFromQuestionnaire(params);
    expect(synced.values).toEqual({ "contract.hours": "37,5" });
    expect(synced.questionnaireSyncNeeded).toBe(false);
});
it("does not flag existing manual hours for replacement at the same revision", async () => {
    contract.master.body = fromSegments([{ type: "input", key: "contract.hours", label: "Wochenstunden" }]);
    contract.values = [{ key: "contract.hours", value: "30" }];
    contract.matchedQuestionnaireRevision = 3;
    contract.engagement.questionnaireSubmission = {
        id: "submission", revision: 3, status: "completed",
        formDefinition: { intro: "", items: [{ kind: "field", key: "employmentExtent", label: "Wöchentliche Arbeitszeit", section: "Beruf", type: "text" }] },
        answers: [{ key: "employmentExtent", value: "40" }],
    };
    const view = await getEngagementContract(params);
    expect(view?.questionnaireSyncNeeded).toBe(false);
    expect(view?.values["contract.hours"]).toBe("30");
});
it("does not offer to rematch missing fields on a sent contract", async () => {
    contract.sentAt = new Date();
    contract.engagement.questionnaireSubmission = { id: "submission", revision: 3, status: "completed", answers: [{ key: "firstName", value: "Ada" }] };
    expect((await getEngagementContract(params))?.questionnaireSyncNeeded).toBe(false);
});
