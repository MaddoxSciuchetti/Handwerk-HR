import {
    getEngagementContract,
    resyncEngagementContractFromQuestionnaire,
    saveEngagementContractDraft,
    sendFilledEmploymentContract,
} from "@/services/employmentContract.service";
import { prisma } from "@/lib/prisma";
import { fromSegments } from "../../shared/document";
import { sendPreparedDocument } from "@/services/preparedDocument";
import { QUESTIONNAIRE_FIELDS } from "@/services/questionnaireForm";

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
        documentMaster: { findFirst: jest.fn() },
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
    sendPreparedDocument: jest.fn(),
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
        engagement: { questionnaireSubmission: null },
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
            Object.assign(contract, data);
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
            status: "completed",
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

it("keeps engagement description points when the Fragebogen match replaces other fields", async () => {
    contract.master = {
        name: "Vertrag",
        revision: 4,
        body: fromSegments([
            { type: "input", key: "contract.nachname", label: "Nachname" },
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
    ];
    contract.engagement = {
        questionnaireSubmission: {
            status: "completed",
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

describe("contract send task status", () => {
    const sendParams = {
        ...params,
        actorUserId: "actor",
        issueId: "send-task",
        artifactId: "pdf",
    };

    it("marks the print task done without emailing the contract", async () => {
        (prisma.issue.findFirst as jest.Mock).mockResolvedValue({
            id: "send-task",
            status: "in_progress",
            kind: "contract_send",
        });
        (prisma.preparedDocument.findFirst as jest.Mock).mockResolvedValue({
            id: "pdf",
            masterId: "master",
        });

        await sendFilledEmploymentContract(sendParams);

        expect(sendPreparedDocument).not.toHaveBeenCalled();
        expect(prisma.preparedDocument.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: "pdf" },
                data: expect.objectContaining({
                    status: "sent",
                    providerId: "office-print",
                }),
            }),
        );
        expect(prisma.employmentContract.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: "contract" },
                data: expect.objectContaining({
                    outgoingPdfId: "pdf",
                    status: "ready",
                }),
            }),
        );
        expect(prisma.issue.update).toHaveBeenCalledWith({
            where: { id: "send-task" },
            data: { status: "done" },
        });
        expect(prisma.issueAuditLog.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    issueId: "send-task",
                    newValue: { status: "done" },
                }),
            }),
        );
        expect(prisma.issue.deleteMany).not.toHaveBeenCalled();
    });
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
        ];
        contract.outgoingPdfId = "old-pdf";
        (prisma.documentMaster.findFirst as jest.Mock).mockResolvedValue(
            replacement,
        );
        (prisma.employmentContract.update as jest.Mock).mockImplementation(
            async ({ data }) => {
                Object.assign(contract, data);
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
