import { createHash } from "node:crypto";
import { GOTENBERG_URL } from "@/constants/env";
import { BAD_REQUEST, SERVICE_UNAVAILABLE } from "@/constants/http";
import AppError from "@/utils/AppError";
import { loadDocumentFonts } from "@/services/documentFonts";
import { DOCUMENT_CSS, renderNode } from "../../../shared/documentRendering";
import type { StyledDocument } from "../../../shared/document";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

function fontFilename(name: string) {
  const family = /calibri|carlito/i.test(name)
    ? "Calibri"
    : /arial/i.test(name)
      ? "Arial"
      : /helvetica/i.test(name)
        ? "Helvetica"
        : /times.*roman/i.test(name)
          ? "TimesNewRoman"
          : /wingdings/i.test(name)
            ? "Wingdings"
            : /apple.?symbols/i.test(name)
              ? "AppleSymbols"
              : /symbol/i.test(name)
                ? "Symbol"
                : null;
  const bold = /bold/i.test(name);
  const italic = /italic|oblique/i.test(name);
  return family
    ? family +
        (bold && italic
          ? "-BoldItalic"
          : bold
            ? "-Bold"
            : italic
              ? "-Italic"
              : "") +
        ".ttf"
    : null;
}

function acceptedEmbeddedFont(
  filename: string | null,
  fontName: string,
  expected: string[],
) {
  if (filename && expected.includes(filename)) return true;
  if (!/carlito/i.test(fontName) || !filename?.startsWith("Calibri"))
    return false;
  const variant = filename.match(/-(BoldItalic|Bold|Italic)\.ttf$/)?.[1] ?? "";
  return expected.some((file) => {
    const expectedVariant =
      file.match(/-(BoldItalic|Bold|Italic)\.ttf$/)?.[1] ?? "";
    return (
      /^(Arial|Helvetica|TimesNewRoman|Calibri)(-|\.)/.test(file) &&
      variant === expectedVariant
    );
  });
}

async function verifyPdfFonts(bytes: Buffer, expected: string[]) {
  const task = getDocument({
    data: new Uint8Array(bytes),
    fontExtraProperties: true,
    useSystemFonts: false,
  });
  try {
    const pdf = await task.promise;
    for (let index = 1; index <= pdf.numPages; index++) {
      const page = await pdf.getPage(index);
      await page.getOperatorList();
      const text = await page.getTextContent();
      for (const item of text.items) {
        if (!("str" in item) || !item.str.trim()) continue;
        const font = page.commonObjs.get(item.fontName) as {
          name?: string;
          data?: Uint8Array;
          missingFile?: boolean;
        };
        const fontName =
          font.name ?? text.styles[item.fontName]?.fontFamily ?? "";
        const filename = fontFilename(fontName);
        if (
          !acceptedEmbeddedFont(filename, fontName, expected) ||
          !font.data?.length ||
          font.missingFile
        ) {
          console.error("Embedded font rejected", {
            fontName,
            missingFile: font.missingFile === true,
          });
          throw new AppError(
            BAD_REQUEST,
            "Die PDF-Schrift wurde ersetzt oder nicht eingebettet. Bitte dieselben vollständigen Schriftdateien im PDF-Dienst installieren.",
          );
        }
      }
    }
  } finally {
    await task.destroy();
  }
}

export async function generateDocumentPdf(
  document: StyledDocument,
  values: Record<string, string>,
) {
  if (!GOTENBERG_URL)
    throw new AppError(
      BAD_REQUEST,
      "Der PDF-Dienst ist noch nicht eingerichtet.",
    );
  const fonts = await loadDocumentFonts(document);
  const page = document.page;
  const familyMap = fonts.familyMap ?? {};
  const printFamily = (family: string) => familyMap[family] ?? family;
  const printHtml = (html: string) => {
    const names = Object.keys(familyMap).sort((a, b) => b.length - a.length);
    return names.reduce(
      (current, name) =>
        current.replaceAll(
          "font-family:" + name,
          'font-family:&quot;' + familyMap[name] + '&quot;',
        ),
      html,
    );
  };
  const inlineFonts = fonts.css.replace(
    /url\("([^"]+)"\)/g,
    (_all, file) =>
      'url("data:font/ttf;base64,' +
      fonts.assets.find((f) => f.filename === file)!.bytes.toString("base64") +
      '")',
  );
  const css =
    inlineFonts +
    DOCUMENT_CSS +
    'body{margin:0;font-family:"' +
    printFamily(page.fontFamily) +
    '";font-size:' +
    page.fontSize +
    "pt}li::marker{font-family:inherit;font-weight:inherit}";
  const html =
    '<!doctype html><html lang="de"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; font-src data:; img-src data:"><style>' +
    css +
    "</style></head><body>" +
    printHtml(renderNode(document.content, values)) +
    "</body></html>";
  const form = new FormData();
  form.append("files", new Blob([html], { type: "text/html" }), "index.html");
  for (const part of ["header", "footer"] as const) {
    if (
      !document[part].content?.some(
        (node) => node.content?.length || node.type === "image",
      )
    )
      continue;
    // Header templates cannot reliably await web fonts. The same full fonts must
    // be installed in the renderer (see compose.documents.yml), not fetched here.
    form.append(
      "files",
      new Blob([
        '<!doctype html><html><head><meta charset="utf-8"><style>' +
          DOCUMENT_CSS +
          "html,body{height:100%;overflow:hidden}img{max-height:100%;object-fit:contain;object-position:left bottom}" +
          '</style></head><body style="margin:0;width:100%"><div style="box-sizing:border-box;width:100%;height:100%;overflow:hidden;font-family:&quot;' +
          printFamily(page.fontFamily) +
          '&quot;' +
          ";font-size:" +
          page.fontSize +
          "pt;padding:0 " +
          page.marginRight +
          "mm 0 " +
          page.marginLeft +
          'mm">' +
          printHtml(renderNode(document[part], values)).replace(
            /(<span class="(?:pageNumber|totalPages)"[^>]*>)[^<]*(<\/span>)/g,
            "$1$2",
          ) +
          "</div></body></html>",
      ]),
      part + ".html",
    );
  }
  for (const asset of fonts.assets)
    form.append(
      "files",
      new Blob([new Uint8Array(asset.bytes)], { type: "font/ttf" }),
      asset.filename,
    );
  form.append("paperWidth", page.width / 10 + "cm");
  form.append("paperHeight", page.height / 10 + "cm");
  for (const key of [
    "marginTop",
    "marginBottom",
    "marginLeft",
    "marginRight",
  ] as const)
    form.append(key, page[key] / 10 + "cm");
  form.append("printBackground", "true");
  form.append("generateTaggedPdf", "true");
  // A decoded/loaded face is required; document.fonts.ready alone also resolves on failures.
  form.append(
    "waitForExpression",
    "(async()=>{await document.fonts.ready;const faces=await Promise.all(" +
      JSON.stringify(fonts.checks) +
      ".map(font=>document.fonts.load(font)));return faces.every(list=>list.length>0&&list.every(face=>face.status==='loaded'))})()",
  );
  let response: Response;
  try {
    response = await fetch(
      GOTENBERG_URL.replace(/\/$/, "") + "/forms/chromium/convert/html",
      { method: "POST", body: form, signal: AbortSignal.timeout(60_000) },
    );
  } catch {
    throw new AppError(
      SERVICE_UNAVAILABLE,
      "Der PDF-Dienst ist nicht erreichbar oder antwortet nicht rechtzeitig. Bitte den PDF-Dienst starten und erneut versuchen.",
    );
  }
  if (!response.ok)
    throw new AppError(
      BAD_REQUEST,
      "PDF-Erstellung fehlgeschlagen. Bitte erneut versuchen.",
    );
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > 2_500_000)
    throw new AppError(
      BAD_REQUEST,
      "Das PDF überschreitet die unterstützte E-Mail-Anhanggröße von 2,5 MB.",
    );
  if (bytes.subarray(0, 5).toString() !== "%PDF-")
    throw new AppError(
      BAD_REQUEST,
      "Der PDF-Dienst hat keine gültige PDF-Datei geliefert.",
    );
  await verifyPdfFonts(
    bytes,
    fonts.assets.map((asset) => asset.filename),
  );
  return {
    bytes,
    hash: createHash("sha256").update(bytes).digest("hex"),
    fonts: fonts.assets.map(({ filename, hash }) => ({ filename, hash })),
    fontAssets: fonts.assets,
  };
}
