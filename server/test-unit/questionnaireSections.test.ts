import {
  ensureSectionHeadlines,
  isOptionalQuestionnaireSection,
  membersUnderSection,
  placeSectionHeadline,
  questionnaireSectionHeading,
  sectionIsOmitted,
  setSectionMembers,
  setSectionOmitted,
  withSectionHeadlines,
  withoutOmittedSections,
} from "../../shared/questionnaireSections";
import {
  definitionForWorker,
  parseQuestionnaireDefinition,
  presentQuestions,
  seedQuestionnaireDefinition,
} from "@/services/questionnaireDefinition";

const VWL = "VWL - nur notwendig, wenn Vertrag vorliegt";

describe("optional questionnaire sections", () => {
  it("treats VWL as optional and shortens the heading", () => {
    expect(isOptionalQuestionnaireSection(VWL)).toBe(true);
    expect(isOptionalQuestionnaireSection("Steuer")).toBe(false);
    expect(questionnaireSectionHeading(VWL)).toEqual({
      title: "VWL",
      hint: "Nur notwendig, wenn ein Vertrag vorliegt",
    });
  });

  it("marks and clears omitFromWorker for every item in a section", () => {
    const items = [
      { key: "taxId", section: "Steuer" },
      { key: "vwlAmount", section: "VWL" },
      { key: "vwlIban", section: "VWL" },
    ];
    const omitted = setSectionOmitted(items, "VWL", true);
    expect(sectionIsOmitted(omitted, "VWL")).toBe(true);
    expect(omitted.find((item) => item.key === "taxId")?.omitFromWorker).toBeUndefined();
    expect(withoutOmittedSections(omitted).map((item) => item.key)).toEqual(["taxId"]);
    expect(
      setSectionOmitted(omitted, "VWL", false).every((item) => !item.omitFromWorker),
    ).toBe(true);
  });

  it("drops omitted VWL fields from the worker-facing definition", () => {
    const seed = seedQuestionnaireDefinition();
    const withOmit = {
      ...seed,
      items: setSectionOmitted(seed.items, "VWL", true),
    };
    const parsed = parseQuestionnaireDefinition(JSON.parse(JSON.stringify(withOmit)));
    expect(parsed.items.some((item) => item.omitFromWorker)).toBe(true);
    const forWorker = definitionForWorker(parsed);
    expect(
      forWorker.items.some(
        (item) =>
          (item.kind === "section" && item.title === "VWL") ||
          (item.kind !== "section" && item.section === "VWL"),
      ),
    ).toBe(false);
    expect(presentQuestions(parsed).some((item) => item.section === "VWL")).toBe(false);
  });

  it("seeds explicit section headlines with the right children", () => {
    const seed = seedQuestionnaireDefinition();
    expect(seed.items.some((item) => item.kind === "section")).toBe(true);
    const vwl = seed.items.find(
      (item) => item.kind === "section" && item.title === "VWL",
    );
    expect(vwl).toMatchObject({ optional: true });
    expect(membersUnderSection(seed.items, vwl!.key)).toEqual(
      expect.arrayContaining([
        "vwlRecipient",
        "vwlAmount",
        "vwlSince",
        "vwlContractNumber",
        "vwlIban",
        "vwlBic",
      ]),
    );
    expect(
      seed.items.some(
        (item) => item.kind === "section" && item.title === "Persönliche Angaben",
      ),
    ).toBe(true);
    expect(
      seed.items.some((item) => item.kind === "section" && item.title === "Steuer"),
    ).toBe(true);
  });

  it("places a headline and moves selected questions under it", () => {
    const items = [
      { kind: "field" as const, key: "a", section: "Alt" },
      { kind: "field" as const, key: "b", section: "Alt" },
      { kind: "field" as const, key: "c", section: "Alt" },
    ];
    const next = placeSectionHeadline(
      items,
      1,
      { key: "section.neu", title: "Neu", optional: true },
      ["b", "c"],
    );
    expect(next.map((item) => item.key)).toEqual([
      "a",
      "section.neu",
      "b",
      "c",
    ]);
    expect(next[2]).toMatchObject({ section: "Neu" });
  });

  it("lets an existing headline change its members", () => {
    const items = [
      { kind: "section" as const, key: "section.vwl", title: "VWL" },
      { kind: "field" as const, key: "vwlAmount", section: "VWL" },
      { kind: "field" as const, key: "taxId", section: "Steuer" },
    ];
    const next = setSectionMembers(items, "section.vwl", ["vwlAmount", "taxId"]);
    expect(membersUnderSection(next, "section.vwl")).toEqual(["vwlAmount", "taxId"]);
    expect(next.find((item) => item.key === "taxId")).toMatchObject({ section: "VWL" });
  });

  it("ensures headlines for fragebogen items that still lack them", () => {
    const ensured = ensureSectionHeadlines([
      { kind: "field" as const, key: "taxId", section: "Steuer" },
      { kind: "field" as const, key: "vwlAmount", section: VWL },
    ]);
    expect(ensured.map((item) => item.key)).toEqual([
      "section.steuer",
      "taxId",
      "section.vwl",
      "vwlAmount",
    ]);
    expect(ensured.find((item) => item.key === "vwlAmount")).toMatchObject({
      section: "VWL",
    });
  });

  it("parses a custom section headline", () => {
    const definition = parseQuestionnaireDefinition({
      items: [
        { kind: "section", key: "section.steuer", title: "Steuer" },
        { kind: "field", key: "taxId", section: "Steuer" },
      ],
    });
    expect(definition.items[0]).toMatchObject({
      kind: "section",
      title: "Steuer",
    });
    expect(withSectionHeadlines(definition.items).filter((item) => item.kind === "section")).toHaveLength(1);
  });
});
