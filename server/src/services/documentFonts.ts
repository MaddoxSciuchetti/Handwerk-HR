import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { DOCUMENT_FONT_DIR } from "@/constants/env";
import { BAD_REQUEST } from "@/constants/http";
import AppError from "@/utils/AppError";
import { requiredFonts } from "../../../shared/documentRendering";
import type { StyledDocument } from "../../../shared/document";

// Full, licensed font files are deployment assets, never extracted PDF subsets.
export const FONT_FILES: Record<string, string> = {
    "Symbol:400:normal": "Symbol.ttf",
    "Apple Symbols:400:normal": "AppleSymbols.ttf",
    "Wingdings:400:normal": "Wingdings.ttf",
    "Calibri:400:normal": "Calibri.ttf",
    "Calibri:700:normal": "Calibri-Bold.ttf",
    "Calibri:400:italic": "Calibri-Italic.ttf",
    "Calibri:700:italic": "Calibri-BoldItalic.ttf",
    "Arial:400:normal": "Arial.ttf",
    "Arial:700:normal": "Arial-Bold.ttf",
    "Arial:400:italic": "Arial-Italic.ttf",
    "Arial:700:italic": "Arial-BoldItalic.ttf",
    "Helvetica:400:normal": "Helvetica.ttf",
    "Helvetica:700:normal": "Helvetica-Bold.ttf",
    "Helvetica:400:italic": "Helvetica-Italic.ttf",
    "Helvetica:700:italic": "Helvetica-BoldItalic.ttf",
    "Times New Roman:400:normal": "TimesNewRoman.ttf",
    "Times New Roman:700:normal": "TimesNewRoman-Bold.ttf",
    "Times New Roman:400:italic": "TimesNewRoman-Italic.ttf",
    "Times New Roman:700:italic": "TimesNewRoman-BoldItalic.ttf",
};

export async function loadDocumentFonts(document: StyledDocument) {
    if (!DOCUMENT_FONT_DIR)
        throw new AppError(
            BAD_REQUEST,
            "Die vollständigen BSB-Schriftdateien sind noch nicht eingerichtet.",
        );
    const keys = new Set(
        requiredFonts(document).map(
            (f) =>
                f.family +
                ":" +
                (f.bold ? 700 : 400) +
                ":" +
                (f.italic ? "italic" : "normal"),
        ),
    );
    keys.add(document.page.fontFamily + ":400:normal");
    const assets: { filename: string; bytes: Buffer; hash: string }[] = [];
    const css: string[] = [];
    const checks: string[] = [];
    for (const key of keys) {
        const filename = FONT_FILES[key];
        if (!filename)
            throw new AppError(
                BAD_REQUEST,
                "Nicht unterstützte Schrift: " + key,
            );
        let bytes: Buffer;
        try {
            bytes = await readFile(join(DOCUMENT_FONT_DIR, filename));
        } catch {
            throw new AppError(BAD_REQUEST, "Schriftdatei fehlt: " + filename);
        }
        const [family, weight, style] = key.split(":");
        checks.push(style + " " + weight + " 11px " + JSON.stringify(family));
        assets.push({
            filename,
            bytes,
            hash: createHash("sha256").update(bytes).digest("hex"),
        });
        css.push(
            '@font-face{font-family:"' +
                family +
                '";font-weight:' +
                weight +
                ";font-style:" +
                style +
                ';src:url("' +
                filename +
                '") format("truetype")}',
        );
    }
    return { assets, css: css.join(""), checks };
}

export async function fontStatus() {
    const available = DOCUMENT_FONT_DIR
        ? await readdir(DOCUMENT_FONT_DIR).catch(() => [])
        : [];
    return {
        available,
        required: ["Calibri.ttf", "Calibri-Bold.ttf", "Calibri-Italic.ttf"],
        ready: ["Calibri.ttf", "Calibri-Bold.ttf", "Calibri-Italic.ttf"].every(
            (f) => available.includes(f),
        ),
    };
}

export async function fontBytes(filename: string) {
    if (!Object.values(FONT_FILES).includes(filename) || !DOCUMENT_FONT_DIR)
        throw new AppError(BAD_REQUEST, "Schrift nicht verfügbar.");
    try {
        return await readFile(join(DOCUMENT_FONT_DIR, filename));
    } catch {
        throw new AppError(BAD_REQUEST, "Schriftdatei fehlt.");
    }
}
