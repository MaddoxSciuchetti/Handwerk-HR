import { generateDocumentPdf } from "@/services/documentPdf";
import { loadDocumentFonts } from "@/services/documentFonts";
import { renderStyledDocumentPdf } from "@/services/documentPdfNative";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { fromSegments } from "../../shared/document";

jest.mock("@/constants/env", () => ({
  DOCUMENT_FONT_DIR: "/tmp/fonts",
}));
jest.mock("@/services/documentFonts", () => ({ loadDocumentFonts: jest.fn() }));
jest.mock("@/services/documentPdfNative", () => ({
  renderStyledDocumentPdf: jest.fn(),
}));
jest.mock("pdfjs-dist/legacy/build/pdf.mjs", () => ({
  getDocument: jest.fn(),
}));

const bytes = Buffer.from("%PDF-fixture");
let font: { name: string; data?: Uint8Array; missingFile?: boolean };
const document = fromSegments([{ type: "input", key: "name", label: "Name" }]);
document.page.fontFamily = "Arial";
document.header = fromSegments([{ type: "text", text: "BSB" }]).content;

beforeEach(() => {
  jest.resetAllMocks();
  font = {
    name: "AAAAAA+ArialMT",
    data: new Uint8Array([1]),
    missingFile: false,
  };
  (loadDocumentFonts as jest.Mock).mockResolvedValue({
    assets: [
      {
        filename: "Arial.ttf",
        bytes: Buffer.from("font"),
        hash: "font-hash",
      },
    ],
    css: '@font-face{font-family:"Arial";src:url("Arial.ttf")}',
    checks: ['normal 400 11px "Arial"'],
    familyMap: {},
  });
  (getDocument as jest.Mock).mockReturnValue({
    destroy: jest.fn(),
    promise: Promise.resolve({
      numPages: 1,
      getPage: async () => ({
        getOperatorList: async () => ({}),
        getTextContent: async () => ({
          items: [{ str: "Ada", fontName: "font-1" }],
          styles: {},
        }),
        commonObjs: { get: () => font },
      }),
    }),
  });
  (renderStyledDocumentPdf as jest.Mock).mockResolvedValue(bytes);
});

it("renders via the native PDF engine and verifies embedded fonts", async () => {
  const result = await generateDocumentPdf(document, {
    name: "Jörg <script>",
  });
  expect(result.bytes).toEqual(bytes);
  expect(renderStyledDocumentPdf).toHaveBeenCalledWith(
    document,
    { name: "Jörg <script>" },
    expect.objectContaining({
      assets: expect.any(Array),
      familyMap: expect.any(Object),
    }),
  );
});

it("blocks substituted or unembedded fonts and renderer failures", async () => {
  font.name = "DejaVuSans";
  await expect(generateDocumentPdf(document, { name: "Ada" })).rejects.toThrow(
    "ersetzt",
  );
  font.name = "ArialMT";
  font.data = undefined;
  await expect(generateDocumentPdf(document, { name: "Ada" })).rejects.toThrow(
    "eingebettet",
  );
  (renderStyledDocumentPdf as jest.Mock).mockRejectedValue(new Error("boom"));
  await expect(generateDocumentPdf(document, { name: "Ada" })).rejects.toThrow(
    "fehlgeschlagen",
  );
});

it("blocks missing font assets before rendering", async () => {
  (loadDocumentFonts as jest.Mock).mockRejectedValue(
    new Error("Calibri-Bold.ttf missing"),
  );
  await expect(generateDocumentPdf(document, { name: "Ada" })).rejects.toThrow(
    "missing",
  );
  expect(renderStyledDocumentPdf).not.toHaveBeenCalled();
});

it("accepts Carlito when Arial and Times files are absent", async () => {
  font.name = "AAAAAA+Carlito-BoldItalic";
  (loadDocumentFonts as jest.Mock).mockResolvedValue({
    assets: [
      {
        filename: "Arial-BoldItalic.ttf",
        bytes: Buffer.from("font"),
        hash: "hash",
      },
      {
        filename: "TimesNewRoman.ttf",
        bytes: Buffer.from("font"),
        hash: "hash",
      },
    ],
    css: "",
    checks: [],
    familyMap: { Arial: "Carlito", "Times New Roman": "Carlito" },
  });
  await expect(
    generateDocumentPdf(document, { name: "Ada" }),
  ).resolves.toHaveProperty("bytes", bytes);
});

it("accepts the configured embedded Carlito replacement for Calibri", async () => {
  font.name = "AAAAAA+Carlito";
  (loadDocumentFonts as jest.Mock).mockResolvedValue({
    assets: [
      { filename: "Calibri.ttf", bytes: Buffer.from("font"), hash: "hash" },
    ],
    css: "",
    checks: [],
    familyMap: { Calibri: "Carlito" },
  });
  await expect(
    generateDocumentPdf(document, { name: "Ada" }),
  ).resolves.toHaveProperty("bytes", bytes);
});

it("returns an actionable service error when rendering fails", async () => {
  (renderStyledDocumentPdf as jest.Mock).mockRejectedValue(
    new TypeError("render failed"),
  );
  await expect(
    generateDocumentPdf(document, { name: "Ada" }),
  ).rejects.toMatchObject({
    statusCode: 503,
    message: expect.stringContaining("fehlgeschlagen"),
  });
});
