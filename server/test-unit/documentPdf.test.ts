import { generateDocumentPdf } from "@/services/documentPdf";
import { loadDocumentFonts } from "@/services/documentFonts";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { fromSegments } from "../../shared/document";
jest.mock("@/constants/env", () => ({
  GOTENBERG_URL: "http://local-renderer",
}));
jest.mock("@/services/documentFonts", () => ({ loadDocumentFonts: jest.fn() }));
jest.mock("pdfjs-dist/legacy/build/pdf.mjs", () => ({
  getDocument: jest.fn(),
}));
const bytes = Buffer.from("%PDF-fixture");
let fetchMock: jest.SpyInstance;
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
  fetchMock = jest
    .spyOn(global, "fetch")
    .mockImplementation(
      async () => new Response(new Uint8Array(bytes), { status: 200 }),
    );
});
afterEach(() => jest.restoreAllMocks());
it("renders escaped field text and native headers, and verifies embedded output fonts", async () => {
  const result = await generateDocumentPdf(document, {
    name: "Jörg <script>",
  });
  expect(result.bytes).toEqual(bytes);
  const form = fetchMock.mock.calls[0][1].body as FormData;
  const files = form.getAll("files") as File[];
  const main = await files.find((file) => file.name === "index.html")!.text();
  expect(main).toContain("Jörg &lt;script&gt;");
  expect(main).not.toContain("<input");
  expect(main).toContain("data:font/ttf;base64");
  const header = await files
    .find((file) => file.name === "header.html")!
    .text();
  expect(header).toContain("BSB");
  expect(header).not.toContain("@font-face");
  expect(form.get("marginTop")).toBe("2cm");
  expect(form.get("waitForExpression")).toContain("document.fonts.load");
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
  fetchMock.mockResolvedValue({ ok: false } as Response);
  await expect(generateDocumentPdf(document, { name: "Ada" })).rejects.toThrow(
    "fehlgeschlagen",
  );
});
it("blocks missing font assets before requesting the renderer", async () => {
  (loadDocumentFonts as jest.Mock).mockRejectedValue(
    new Error("Calibri-Bold.ttf missing"),
  );
  await expect(generateDocumentPdf(document, { name: "Ada" })).rejects.toThrow(
    "missing",
  );
  expect(fetchMock).not.toHaveBeenCalled();
});

it("sends dynamic page fields in a footer constrained to the printable width", async () => {
  const paginated = structuredClone(document);
  paginated.footer = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        attrs: { textAlign: "right" },
        content: [
          { type: "text", text: "Seite " },
          { type: "pageField", attrs: { kind: "page" } },
          { type: "text", text: " von " },
          { type: "pageField", attrs: { kind: "pages" } },
        ],
      },
    ],
  };
  await generateDocumentPdf(paginated, { name: "Ada" });
  const files = (fetchMock.mock.calls[0][1].body as FormData).getAll(
    "files",
  ) as File[];
  const footer = await files
    .find((file) => file.name === "footer.html")!
    .text();
  expect(footer).toMatch(/class="pageNumber"[^>]*><\/span>/);
  expect(footer).toMatch(/class="totalPages"[^>]*><\/span>/);
  expect(footer).not.toContain("‹Seiten›");
  expect(footer).toContain("text-align:right");
  expect(footer).toContain("box-sizing:border-box;width:100%");
  expect(footer).toContain("padding:0 20mm 0 20mm");
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
  });
  await expect(
    generateDocumentPdf(document, { name: "Ada" }),
  ).resolves.toHaveProperty("bytes", bytes);
});

it("preserves inline sizes and spacing when substituting a font family", async () => {
  (loadDocumentFonts as jest.Mock).mockResolvedValue({
    assets: [
      { filename: "Arial.ttf", bytes: Buffer.from("font"), hash: "hash" },
    ],
    css: '@font-face{font-family:"Carlito";src:url("Arial.ttf")}',
    checks: [],
    familyMap: { Arial: "Carlito" },
  });
  font.name = "Carlito";
  const contract = structuredClone(document);
  contract.content = {
    type: "doc",
    content: [
      {
        type: "lineGroup",
        attrs: {
          height: 9.45,
          lines: [],
          labels: [
            {
              text: "(Arbeitnehmer)",
              left: 100,
              top: 0,
              fontFamily: "Arial",
              fontSize: 7,
              color: "#000000",
            },
          ],
        },
      },
    ],
  };
  await generateDocumentPdf(contract, { name: "Ada" });
  const files = (fetchMock.mock.calls[0][1].body as FormData).getAll(
    "files",
  ) as File[];
  const html = await files.find((file) => file.name === "index.html")!.text();
  // Capture one intact HTML attribute: an unescaped font quote truncates it.
  const style = html.match(
    /<span style="([^"]+)">\(Arbeitnehmer\)<\/span>/,
  )?.[1];
  expect(style).toContain("font-family:&quot;Carlito&quot;");
  expect(style).toContain("font-size:7pt");
  expect(style).toContain("line-height:1.2");
  expect(style).toContain("color:#000000");
});

it("returns an actionable service error when the renderer is offline or times out", async () => {
  fetchMock.mockRejectedValue(new TypeError("fetch failed"));
  await expect(generateDocumentPdf(document, { name: "Ada" })).rejects.toMatchObject({
    statusCode: 503,
    message: expect.stringContaining("PDF-Dienst ist nicht erreichbar"),
  });
  fetchMock.mockRejectedValue(new DOMException("Timed out", "TimeoutError"));
  await expect(generateDocumentPdf(document, { name: "Ada" })).rejects.toMatchObject({
    statusCode: 503,
    message: expect.stringContaining("erneut versuchen"),
  });
});
