import { prisma } from "@/lib/prisma";
import {
  addDescriptionSentence,
  listDescriptionSentences,
} from "@/services/descriptionSentences.service";
import { DEFAULT_DESCRIPTION_SENTENCES } from "../../shared/descriptionSentences";

jest.mock("@/lib/prisma", () => ({
  prisma: { descriptionSentence: { findMany: jest.fn(), upsert: jest.fn() } },
}));
beforeEach(() => {
  jest.clearAllMocks();
  (prisma.descriptionSentence.findMany as jest.Mock).mockResolvedValue([]);
});

it("returns the three preset sentences and only reads custom sentences for the organization", async () => {
  (prisma.descriptionSentence.findMany as jest.Mock).mockResolvedValue([
    { sentence: "Eigener Satz" },
    { sentence: " montage von Hygieneartikeln " },
  ]);
  expect(await listDescriptionSentences("org-a")).toEqual([
    ...DEFAULT_DESCRIPTION_SENTENCES,
    "Eigener Satz",
  ]);
  expect(prisma.descriptionSentence.findMany).toHaveBeenCalledWith(
    expect.objectContaining({ where: { organizationId: "org-a" } }),
  );
});

it("normalizes custom sentences and upserts them without duplicates within the organization", async () => {
  await addDescriptionSentence("org-b", "  Prüfen   von Anlagen  ");
  expect(prisma.descriptionSentence.upsert).toHaveBeenCalledWith({
    where: {
      organizationId_normalized: {
        organizationId: "org-b",
        normalized: "prüfen von anlagen",
      },
    },
    create: {
      organizationId: "org-b",
      sentence: "Prüfen von Anlagen",
      normalized: "prüfen von anlagen",
    },
    update: {},
  });
});

it("does not store preset sentences again", async () => {
  await addDescriptionSentence("org-a", " MONTAGE von Hygieneartikeln ");
  expect(prisma.descriptionSentence.upsert).not.toHaveBeenCalled();
});

it.each(["", "   ", "a\nb", "a\rb", "x".repeat(501), undefined, 123])(
  "rejects invalid sentences before writing",
  async (value) => {
    await expect(addDescriptionSentence("org-a", value)).rejects.toThrow();
    expect(prisma.descriptionSentence.upsert).not.toHaveBeenCalled();
  },
);
