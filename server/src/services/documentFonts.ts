import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
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

// Carlito (SIL OFL) has Calibri's exact advance widths, so line breaks match
// the original. It is used only when the licensed Calibri file is absent.
const SUBSTITUTES: Record<string, string> = {
    "Calibri.ttf": "Carlito-Regular.ttf",
    "Calibri-Bold.ttf": "Carlito-Bold.ttf",
    "Calibri-Italic.ttf": "Carlito-Italic.ttf",
    "Calibri-BoldItalic.ttf": "Carlito-BoldItalic.ttf",
};

const REQUIRED = ["Calibri.ttf", "Calibri-Bold.ttf", "Calibri-Italic.ttf"];

function fontDirectories() {
    const candidates = [
        DOCUMENT_FONT_DIR,
        path.resolve(process.cwd(), "document-fonts"),
        path.resolve(process.cwd(), "server/document-fonts"),
    ].filter((dir): dir is string => Boolean(dir));
    return [...new Set(candidates)];
}

async function readNamedFont(filename: string) {
    let lastError: unknown;
    for (const directory of fontDirectories()) {
        try {
            return await readFile(path.join(directory, filename));
        } catch (error) {
            lastError = error;
        }
    }
    throw lastError instanceof Error ? lastError : new Error("missing font");
}

async function readFontFile(filename: string) {
    try {
        return await readNamedFont(filename);
    } catch (error) {
        const substitute = SUBSTITUTES[filename];
        if (!substitute) throw error;
        return await readNamedFont(substitute);
    }
}

async function availableFontFiles() {
    const names = new Set<string>();
    for (const directory of fontDirectories()) {
        const files = await readdir(directory).catch(() => []);
        for (const file of files) names.add(file);
    }
    return [...names];
}

export async function loadDocumentFonts(document: StyledDocument) {
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
            bytes = await readFontFile(filename);
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
    const available = await availableFontFiles();
    const licensed = REQUIRED.every((f) => available.includes(f));
    const substituted =
        !licensed &&
        REQUIRED.every(
            (f) => available.includes(f) || available.includes(SUBSTITUTES[f]),
        );
    return {
        available,
        required: REQUIRED,
        ready: licensed || substituted,
        substitute: substituted ? "Carlito" : null,
    };
}

export async function fontBytes(filename: string) {
    if (!Object.values(FONT_FILES).includes(filename))
        throw new AppError(BAD_REQUEST, "Schrift nicht verfügbar.");
    try {
        return await readFontFile(filename);
    } catch {
        throw new AppError(BAD_REQUEST, "Schriftdatei fehlt.");
    }
}
