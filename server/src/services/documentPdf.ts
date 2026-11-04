import { createHash } from "node:crypto";
import { DOCUMENT_FONT_DIR } from "@/constants/env";
import { BAD_REQUEST, SERVICE_UNAVAILABLE } from "@/constants/http";
import AppError from "@/utils/AppError";
import { loadDocumentFonts } from "@/services/documentFonts";
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
  // React-PDF embeds Carlito under its real name when substituting.
  if (!/carlito/i.test(fontName)) return false;
  const variant =
    filename?.match(/-(BoldItalic|Bold|Italic)\.ttf$/)?.[1] ??
    (/bold/i.test(fontName) && /italic|oblique/i.test(fontName)
      ? "BoldItalic"
      : /bold/i.test(fontName)
        ? "Bold"
        : /italic|oblique/i.test(fontName)
          ? "Italic"
          : "");
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
            "Die PDF-Schrift wurde ersetzt oder nicht eingebettet. Bitte dieselben vollständigen Schriftdateien im Dokumentenschriften-Verzeichnis bereitstellen.",
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
  if (!DOCUMENT_FONT_DIR && process.env.NODE_ENV !== "development")
    throw new AppError(
      BAD_REQUEST,
      "Die Dokumentschriften sind noch nicht eingerichtet.",
    );
  const fonts = await loadDocumentFonts(document);
  let bytes: Buffer;
  try {
    const { renderStyledDocumentPdf } = await import(
      "@/services/documentPdfNative"
    );
    bytes = await renderStyledDocumentPdf(document, values, {
      assets: fonts.assets,
      familyMap: fonts.familyMap ?? {},
    });
  } catch (error) {
    console.error("Native PDF render failed", error);
    throw new AppError(
      SERVICE_UNAVAILABLE,
      "PDF-Erstellung ist fehlgeschlagen. Bitte erneut versuchen.",
    );
  }
  if (bytes.length > 2_500_000)
    throw new AppError(
      BAD_REQUEST,
      "Das PDF überschreitet die unterstützte E-Mail-Anhanggröße von 2,5 MB.",
    );
  if (bytes.subarray(0, 5).toString() !== "%PDF-")
    throw new AppError(
      BAD_REQUEST,
      "Die PDF-Erstellung hat keine gültige PDF-Datei geliefert.",
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
