import { prisma } from "@/lib/prisma";
import { saveCompletedQuestionnaire } from "@/services/questionnaireCorrections.service";
import {
  encodeFileAnswer,
  questionnaireAnswersFromStored,
} from "@/services/questionnaireForm";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    questionnaireSubmission: { findFirst: jest.fn(), updateMany: jest.fn() },
    questionnaireAnswer: { deleteMany: jest.fn(), createMany: jest.fn() },
    questionnaireChange: { create: jest.fn() },
    worker: { update: jest.fn() },
    $transaction: jest.fn(),
  },
}));
const params = {
  organizationId: "org",
  workerId: "worker",
  engagementId: "eng",
  changedByUserId: "editor",
};
const fileValue = encodeFileAnswer("ID.pdf", "questionnaires/sub/file.pdf");
const submission = () => ({
  id: "sub",
  revision: 0,
  formDefinition: null,
  answers: [
    { key: "firstName", value: "Ada" },
    { key: "legacy", value: "Keep me" },
    { key: "idFile", value: fileValue },
  ],
});
beforeEach(() => {
  jest.clearAllMocks();
  (prisma.questionnaireSubmission.findFirst as jest.Mock).mockResolvedValue(
    submission(),
  );
  (prisma.questionnaireSubmission.updateMany as jest.Mock).mockResolvedValue({
    count: 1,
  });
  (prisma.$transaction as jest.Mock).mockImplementation((callback) =>
    callback(prisma),
  );
});

it("saves a correction, preserves files and historical data, and audits the editor and old/new values", async () => {
  await saveCompletedQuestionnaire({
    ...params,
    input: { revision: 0, answers: { firstName: "Augusta" } },
  });
  expect(prisma.questionnaireSubmission.findFirst).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        engagementId: "eng",
        status: "completed",
        engagement: { workerId: "worker", organizationId: "org" },
      },
    }),
  );
  expect(prisma.questionnaireSubmission.updateMany).toHaveBeenCalledWith({
    where: { id: "sub", revision: 0, status: "completed" },
    data: { revision: { increment: 1 } },
  });
  expect(prisma.questionnaireChange.create).toHaveBeenCalledWith({
    data: {
      submissionId: "sub",
      revision: 1,
      changedByUserId: "editor",
      changes: [{ key: "firstName", before: "Ada", after: "Augusta" }],
    },
  });
  expect(prisma.questionnaireAnswer.createMany).toHaveBeenCalledWith({
    data: expect.arrayContaining([
      { submissionId: "sub", key: "firstName", value: "Augusta" },
    ]),
  });
  expect(prisma.questionnaireAnswer.deleteMany).toHaveBeenCalledWith({
    where: {
      submissionId: "sub",
      OR: [{ key: { in: ["firstName"] } }],
    },
  });
  expect(prisma.worker.update).toHaveBeenCalledWith({
    where: { id: "worker" },
    data: { firstName: "Augusta" },
  });
});

it("does not create a revision or audit entry when normalized values are unchanged", async () => {
  await saveCompletedQuestionnaire({
    ...params,
    input: { revision: 0, answers: { firstName: " Ada " } },
  });
  expect(prisma.$transaction).not.toHaveBeenCalled();
});

it("rejects stale edits before changing any data", async () => {
  await expect(
    saveCompletedQuestionnaire({
      ...params,
      input: { revision: 1, answers: { firstName: "Augusta" } },
    }),
  ).rejects.toThrow("inzwischen geändert");
  expect(prisma.$transaction).not.toHaveBeenCalled();
});

it("rejects a competing save that wins the revision claim", async () => {
  (prisma.questionnaireSubmission.updateMany as jest.Mock).mockResolvedValue({
    count: 0,
  });
  await expect(
    saveCompletedQuestionnaire({
      ...params,
      input: { revision: 0, answers: { firstName: "Augusta" } },
    }),
  ).rejects.toThrow("inzwischen geändert");
  expect(prisma.questionnaireAnswer.deleteMany).not.toHaveBeenCalled();
  expect(prisma.questionnaireChange.create).not.toHaveBeenCalled();
});

it("rejects missing/inaccessible submissions and unknown or file fields", async () => {
  await expect(
    saveCompletedQuestionnaire({
      ...params,
      input: { revision: 0, answers: { idFile: "forged" } },
    }),
  ).rejects.toThrow("nicht bearbeitet");
  await expect(
    saveCompletedQuestionnaire({
      ...params,
      input: { revision: 0, answers: { unknown: "forged" } },
    }),
  ).rejects.toThrow("nicht bearbeitet");
  (prisma.questionnaireSubmission.findFirst as jest.Mock).mockResolvedValue(
    null,
  );
  await expect(
    saveCompletedQuestionnaire({
      ...params,
      input: { revision: 0, answers: {} },
    }),
  ).rejects.toThrow("nicht gefunden");
  expect(prisma.$transaction).not.toHaveBeenCalled();
});

it("validates corrected values", async () => {
  await expect(
    saveCompletedQuestionnaire({
      ...params,
      input: { revision: 0, answers: { firstName: 123 } },
    }),
  ).rejects.toThrow();
  await expect(
    saveCompletedQuestionnaire({
      ...params,
      input: { revision: 0, answers: { birthday: "not-a-date" } },
    }),
  ).rejects.toThrow();
  expect(prisma.$transaction).not.toHaveBeenCalled();
});

it("can remove repeated rows without retaining their old flattened answers", async () => {
  (prisma.questionnaireSubmission.findFirst as jest.Mock).mockResolvedValue({
    ...submission(),
    answers: [
      ...submission().answers,
      { key: "child.1.firstName", value: "Anne" },
    ],
  });
  await saveCompletedQuestionnaire({
    ...params,
    input: { revision: 0, answers: { children: [] } },
  });
  expect(prisma.questionnaireAnswer.createMany).not.toHaveBeenCalled();
  expect(prisma.questionnaireAnswer.deleteMany).toHaveBeenCalledWith({
    where: {
      submissionId: "sub",
      OR: [{ key: { in: [] } }, { key: { startsWith: "child." } }],
    },
  });
  expect(prisma.questionnaireChange.create).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        changes: [
          {
            key: "children",
            before: [{ firstName: "Anne", lastName: "", birthday: "" }],
            after: [],
          },
        ],
      }),
    }),
  );
});

it("reconstructs custom table rows in order for editing and contract synchronization", () => {
  const result = questionnaireAnswersFromStored([
    { key: "rows.abcdefgh.2.name", value: "Second" },
    { key: "rows.abcdefgh.1.name", value: "First" },
  ]) as Record<string, unknown>;
  expect(result["rows.abcdefgh"]).toEqual([
    { name: "First" },
    { name: "Second" },
  ]);
  expect(result["rows.abcdefgh.1.name"]).toBe("First");
});

it("does not allow replacing an uploaded file through the correction endpoint", async () => {
  (prisma.questionnaireSubmission.findFirst as jest.Mock).mockResolvedValue({
    ...submission(),
    formDefinition: {
      intro: "",
      items: [
        {
          kind: "field",
          key: "custom.identity",
          label: "Ausweis",
          section: "Person",
          type: "file",
        },
      ],
    },
  });
  await expect(
    saveCompletedQuestionnaire({
      ...params,
      input: { revision: 0, answers: { "custom.identity": "forged" } },
    }),
  ).rejects.toThrow("nicht bearbeitet");
  expect(prisma.$transaction).not.toHaveBeenCalled();
});

it("replaces custom table answers without changing unrelated answers", async () => {
  (prisma.questionnaireSubmission.findFirst as jest.Mock).mockResolvedValue({
    ...submission(),
    formDefinition: {
      intro: "",
      items: [
        {
          kind: "repeater",
          key: "rows.abcdefgh",
          section: "History",
          columns: [{ key: "name", label: "Name", type: "text" }],
        },
      ],
    },
    answers: [
      ...submission().answers,
      { key: "rows.abcdefgh.1.name", value: "Old" },
    ],
  });
  await saveCompletedQuestionnaire({
    ...params,
    input: { revision: 0, answers: { "rows.abcdefgh": [{ name: "Correct" }] } },
  });
  expect(prisma.questionnaireAnswer.createMany).toHaveBeenCalledWith({
    data: [
      { submissionId: "sub", key: "rows.abcdefgh.1.name", value: "Correct" },
    ],
  });
  expect(prisma.questionnaireAnswer.deleteMany).toHaveBeenCalledWith({
    where: {
      submissionId: "sub",
      OR: [{ key: { in: [] } }, { key: { startsWith: "rows.abcdefgh." } }],
    },
  });
});
