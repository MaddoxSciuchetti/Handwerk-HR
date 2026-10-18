import {
  fromSegments,
  documentSegments,
  documentFields,
  filledDocument,
} from "../../shared/document";
import {
  renderNode,
  requiredFonts,
  validateFieldValues,
} from "../../shared/documentRendering";
import { parseStyledDocument } from "@/services/styledDocument";
import { contractValuesFromAnswers } from "@/services/contractFieldMatch";
import type { QuestionnaireAnswers } from "@/services/questionnaireForm";

const template = () =>
  fromSegments([
    { type: "text", text: "Vertrag mit " },
    { type: "input", key: "contract.vorname", label: "Vorname" },
    { type: "text", text: "\nName erneut: " },
    { type: "input", key: "contract.vorname", label: "Vorname" },
    {
      type: "input",
      key: "contract.accept",
      label: "Bestätigung",
      fieldType: "checkbox",
      required: false,
    },
  ]);

describe("styled document compatibility and rendering", () => {
  it("defaults new checkboxes to optional and validates real dates", () => {
    const document = fromSegments([
      {
        type: "input",
        key: "check",
        label: "Check",
        fieldType: "checkbox",
      },
      { type: "input", key: "date", label: "Datum", fieldType: "date" },
    ]);
    expect(validateFieldValues(document, { date: "09.10.2026" })).toEqual({
      check: "false",
      date: "09.10.2026",
    });
    expect(() => validateFieldValues(document, { date: "2026-02-31" })).toThrow(
      "Datum",
    );
  });
  it("preserves field keys and existing alias matching after migration and movement", () => {
    const document = template();
    const first = document.content.content![0];
    document.content.content!.reverse();
    first.content![1].marks = [
      { type: "bold" },
      { type: "textStyle", attrs: { fontFamily: "Arial", fontSize: 12 } },
    ];
    const answers = {
      firstName: "Jörg",
      lastName: "Müller",
      birthday: "1990-01-01",
      street: "",
      city: "",
      postalCode: "",
      children: [],
      priorEmployment: [],
    } as unknown as QuestionnaireAnswers;
    const entries = contractValuesFromAnswers(
      documentSegments(document),
      answers,
    );
    expect(entries).toEqual([{ key: "contract.vorname", value: "Jörg" }]);
    expect(documentFields(document)).toHaveLength(2);
  });
  it("renders values as escaped styled text without editor controls", () => {
    const document = template();
    const field = document.content.content![0].content![1];
    field.marks = [
      { type: "bold" },
      {
        type: "textStyle",
        attrs: { fontFamily: "Calibri", fontSize: 11 },
      },
    ];
    const html = renderNode(document.content, {
      "contract.vorname": "Jörg <script>alert(1)</script>",
      "contract.accept": "true",
    });
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("<strong>");
    expect(html).toContain("font-family:Calibri");
    expect(html).toContain("<svg");
    expect(html).not.toMatch(/<input|contenteditable|data-document-field/);
  });
  it("accepts unchecked optional checkboxes and rejects missing required values or unknown keys", () => {
    expect(
      validateFieldValues(template(), { "contract.vorname": "Ada" }),
    ).toEqual({ "contract.vorname": "Ada", "contract.accept": "false" });
    expect(() => validateFieldValues(template(), {})).toThrow("Vorname");
    expect(() => validateFieldValues(template(), { attacker: "x" })).toThrow(
      "Ungültiger",
    );
    expect(() =>
      validateFieldValues(template(), {
        "contract.vorname": "Ada",
        "contract.accept": "yes",
      }),
    ).toThrow("Kontrollkästchen");
  });
  it("includes fields from headers and footers and embeds all used font variants", () => {
    const document = template();
    document.header = fromSegments([
      {
        type: "input",
        key: "contract.date",
        label: "Datum",
        fieldType: "date",
      },
    ]).content;
    document.footer.content![0].content = [
      {
        type: "text",
        text: "Fußzeile",
        marks: [{ type: "italic" }, { type: "bold" }],
      },
    ];
    expect(documentFields(document).map((f) => f.key)).toContain(
      "contract.date",
    );
    expect(requiredFonts(document)).toContainEqual({
      family: "Calibri",
      bold: true,
      italic: true,
    });
    expect(
      renderNode(document.header, { "contract.date": "2026-10-09" }),
    ).toContain("09.10.2026");
  });
  it("rejects unsafe images, CSS font injection and inconsistent repeated fields", () => {
    const document = template();
    document.content.content!.push({
      type: "image",
      attrs: { src: "http://localhost/secret" },
    });
    expect(() => parseStyledDocument(document)).toThrow("PNG/JPEG");
    document.content.content!.pop();
    document.content.content![0].content![1].marks = [
      {
        type: "textStyle",
        attrs: { fontFamily: "Calibri; background:url(http://evil)" },
      },
    ];
    expect(() => parseStyledDocument(document)).toThrow("Schriftart");
    delete document.content.content![0].content![1].marks;
    document.content.content![1].content![1].attrs!.fieldType = "checkbox";
    expect(() => parseStyledDocument(document)).toThrow("identisch");
  });
  it("keeps keys and shared values when only a repeated field label is renamed", () => {
    const document = template();
    document.content.content![1].content![1].attrs!.label = "Name nochmal";
    expect(documentFields(parseStyledDocument(document))).toHaveLength(2);
    expect(
      renderNode(document.content, { "contract.vorname": "Jörg" }).match(
        /Jörg/g,
      ),
    ).toHaveLength(2);
  });
  it("renders description points as a list the sender fills in", () => {
    const document = fromSegments([{ type: "text", text: "Der Arbeitnehmer:" }]);
    document.content.content!.push({
      type: "descriptionPoints",
      attrs: {
        key: "contract.taetigkeiten",
        label: "Tätigkeiten",
        fieldType: "points",
        required: true,
      },
    });
    const parsed = parseStyledDocument(document);
    expect(documentFields(parsed)).toEqual([
      expect.objectContaining({
        key: "contract.taetigkeiten",
        fieldType: "points",
        required: true,
      }),
    ]);
    expect(() =>
      validateFieldValues(parsed, { "contract.taetigkeiten": "  " }),
    ).toThrow("Tätigkeiten");
    expect(
      validateFieldValues(parsed, {
        "contract.taetigkeiten": " Montage \n\n Wartung ",
      }),
    ).toEqual({ "contract.taetigkeiten": "Montage\nWartung" });
    const html = renderNode(parsed.content, {
      "contract.taetigkeiten": "Montage\nWartung <x>",
    });
    expect(html).toContain("<ul><li>Montage</li><li>Wartung &lt;x&gt;</li></ul>");
    const filled = filledDocument(parsed, {
      "contract.taetigkeiten": "Montage\nWartung",
    });
    expect(filled.content.content?.at(-1)?.type).toBe("bulletList");
  });
  it("creates a text snapshot for certificate history without changing the master", () => {
    const document = template();
    const filled = filledDocument(document, { "contract.vorname": "Ada" });
    expect(documentFields(filled)).toHaveLength(0);
    expect(documentFields(document)).toHaveLength(2);
    expect(renderNode(filled.content, {})).toContain("Ada");
  });
  it("renders and validates imported paragraph geometry and vector rules", () => {
    const document = fromSegments([{ type: "text", text: "Indented" }]);
    document.content.content![0].attrs = {
      marginLeft: 21.2,
      marginRight: 1.2,
      textIndent: -8,
    };
    document.content.content!.push({
      type: "lineGroup",
      attrs: {
        height: 23,
        marginTop: 10,
        lines: [
          {
            left: 8.4,
            top: 22.3,
            width: 208.7,
            thickness: 0.5,
            color: "#000000",
          },
        ],
        labels: [
          {
            left: 217,
            top: 0,
            text: "den",
            fontFamily: "Calibri",
            fontSize: 10,
            color: "#000000",
          },
        ],
      },
    });
    const parsed = parseStyledDocument(document);
    const html = renderNode(parsed.content, {});
    expect(html).toContain("margin-left:21.2pt");
    expect(html).toContain("text-indent:-8pt");
    expect(html).toContain('class="document-line-group"');
    expect(html).toContain("width:208.7pt");
    expect(html).toContain(">den</span>");
  });
  it("accepts letterhead labels stored as line nodes", () => {
    const document = fromSegments([{ type: "text", text: "Vertrag" }]);
    document.header.content = [
      {
        type: "lineGroup",
        attrs: {
          height: 20,
          lines: [],
          labels: [
            {
              left: 10,
              top: 2,
              text: "bsb",
              fontSize: 12,
              color: "#000000",
            },
          ],
        },
        content: [
          {
            type: "lineLabel",
            attrs: {
              left: 10,
              top: 2,
              fontSize: 12,
              fontFamily: "Arial",
              color: "#000000",
            },
            content: [{ type: "text", text: "bsb" }],
          },
        ],
      },
    ];
    expect(parseStyledDocument(document).header.content?.[0].type).toBe(
      "lineGroup",
    );
  });
});

describe("automatic current-date fields", () => {
  afterEach(() => jest.useRealTimers());

  const datedTemplate = () => fromSegments([
    { type: "input", key: "contract.today", label: "Vertragsdatum", fieldType: "date", dateMode: "today" },
    { type: "input", key: "contract.start", label: "Eintrittsdatum", fieldType: "date" },
  ]);

  it("persists the setting and resolves the German calendar date on each use, ignoring stale draft values", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-10-17T22:30:00Z"));
    const document = parseStyledDocument(datedTemplate());
    expect(documentFields(document)[0].dateMode).toBe("today");
    const first = validateFieldValues(document, { "contract.today": "2000-01-01", "contract.start": "2026-11-01" });
    expect(first).toEqual({ "contract.today": "2026-10-18", "contract.start": "2026-11-01" });
    const snapshot = filledDocument(document, first);
    expect(renderNode(document.content, first)).toContain("18.10.2026");
    jest.setSystemTime(new Date("2026-10-19T10:00:00Z"));
    expect(validateFieldValues(document, first)["contract.today"]).toBe("2026-10-19");
    expect(renderNode(snapshot.content, {})).toContain("2026-10-18");
  });

  it("fills automatic dates without a supplied value, while ordinary dates remain required", () => {
    const document = datedTemplate();
    expect(() => validateFieldValues(document, {})).toThrow("Eintrittsdatum");
    expect(validateFieldValues(document, { "contract.start": "2026-11-01" })["contract.today"]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("rejects automatic dates on non-date fields and inconsistent repeated keys", () => {
    const document = datedTemplate();
    document.content.content![0].content![0].attrs!.fieldType = "text";
    expect(() => parseStyledDocument(document)).toThrow();
    const repeated = datedTemplate();
    repeated.content.content![0].content!.push({ type: "documentField", attrs: { key: "contract.today", label: "Date", fieldType: "date" } });
    expect(() => parseStyledDocument(repeated)).toThrow("Wiederholte Felder");
  });
});
