import { prisma } from "@/lib/prisma";
import { getCompletedQuestionnaire } from "@/services/completedQuestionnaire.service";

jest.mock("@/lib/prisma", () => ({
  prisma: { questionnaireSubmission: { findFirst: jest.fn() } },
}));

const params = {
  organizationId: "org",
  workerId: "worker",
  engagementId: "engagement",
};

it("reads only a completed submission belonging to the requested worker and organization", async () => {
  (prisma.questionnaireSubmission.findFirst as jest.Mock).mockResolvedValue(
    null,
  );
  await expect(getCompletedQuestionnaire(params)).rejects.toThrow(
    "Ausgefüllter Fragebogen nicht gefunden.",
  );
  expect(prisma.questionnaireSubmission.findFirst).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        engagementId: "engagement",
        status: "completed",
        engagement: { workerId: "worker", organizationId: "org" },
      },
    }),
  );
});

it("uses the sent definition and reconstructs saved scalar and repeated answers", async () => {
  (prisma.questionnaireSubmission.findFirst as jest.Mock).mockResolvedValue({
    id: "submission",
    completedAt: new Date("2026-10-14"),
    formDefinition: {
      name: "Personalbogen Baustelle",
      version: 1,
      intro: "Original introduction",
      items: [
        {
          kind: "field",
          key: "custom.saved-answer",
          label: "Original question",
          section: "Details",
          type: "text",
          required: true,
        },
      ],
    },
    answers: [
      { key: "custom.saved-answer", value: "Saved answer" },
      { key: "child.1.firstName", value: "Ann" },
      { key: "child.1.birthday", value: "2018-04-01" },
      { key: "prior.1.kind", value: "Aushilfe" },
    ],
  });
  const result = await getCompletedQuestionnaire(params);
  expect(result.intro).toBe("Original introduction");
  expect(result.name).toBe("Personalbogen Baustelle");
  expect(result.items[0]).toMatchObject({ label: "Original question" });
  expect(result.answers).toMatchObject({
    "custom.saved-answer": "Saved answer",
    children: [{ firstName: "Ann", birthday: "2018-04-01" }],
    priorEmployment: [{ kind: "Aushilfe" }],
  });
});

it("supports completed submissions from before definitions were stored", async () => {
  (prisma.questionnaireSubmission.findFirst as jest.Mock).mockResolvedValue({
    id: "legacy",
    completedAt: null,
    formDefinition: null,
    answers: [{ key: "firstName", value: "Ada" }],
  });
  const result = await getCompletedQuestionnaire(params);
  expect(result.items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ key: "firstName" }),
      expect.objectContaining({ key: "children", kind: "repeater" }),
    ]),
  );
  expect(result.answers.firstName).toBe("Ada");
});
