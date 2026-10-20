import { prisma } from "@/lib/prisma";
import { BAD_REQUEST } from "@/constants/http";
import appAssert from "@/utils/appAssert";
import {
  DEFAULT_DESCRIPTION_SENTENCES,
  DESCRIPTION_SENTENCE_MAX,
  descriptionSentenceKey,
  mergeDescriptionSentences,
  normalizeDescriptionSentence,
} from "../../../shared/descriptionSentences";

export async function listDescriptionSentences(organizationId: string) {
  const rows = await prisma.descriptionSentence.findMany({
    where: { organizationId },
    select: { sentence: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  return mergeDescriptionSentences(rows.map((row) => row.sentence));
}

export async function addDescriptionSentence(
  organizationId: string,
  input: unknown,
) {
  appAssert(
    typeof input === "string",
    BAD_REQUEST,
    "Beschreibungspunkt fehlt.",
  );
  appAssert(
    !/[\r\n]/.test(input),
    BAD_REQUEST,
    "Bitte nur einen Beschreibungspunkt hinzufügen.",
  );
  const sentence = normalizeDescriptionSentence(input);
  appAssert(
    sentence.length > 0 && sentence.length <= DESCRIPTION_SENTENCE_MAX,
    BAD_REQUEST,
    "Beschreibungspunkte müssen zwischen 1 und 500 Zeichen enthalten.",
  );
  const normalized = descriptionSentenceKey(sentence);
  if (
    !DEFAULT_DESCRIPTION_SENTENCES.some(
      (value) => descriptionSentenceKey(value) === normalized,
    )
  ) {
    await prisma.descriptionSentence.upsert({
      where: { organizationId_normalized: { organizationId, normalized } },
      create: { organizationId, sentence, normalized },
      update: {},
    });
  }
  return listDescriptionSentences(organizationId);
}
