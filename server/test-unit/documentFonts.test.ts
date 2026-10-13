import { readFile, readdir } from "node:fs/promises";
import {
    fontBytes,
    fontStatus,
    loadDocumentFonts,
} from "@/services/documentFonts";
import { fromSegments } from "../../shared/document";

jest.mock("node:fs/promises", () => ({
    readFile: jest.fn(),
    readdir: jest.fn(),
}));
jest.mock("@/constants/env", () => ({ DOCUMENT_FONT_DIR: "/licensed-fonts" }));
beforeEach(() => jest.resetAllMocks());
it("loads and hashes exact font assets for every used variant", async () => {
    (readFile as jest.Mock).mockResolvedValue(Buffer.from("full-font-fixture"));
    const document = fromSegments([{ type: "text", text: "BSB" }]);
    document.content.content![0].content![0].marks = [
        { type: "bold" },
        { type: "italic" },
    ];
    const fonts = await loadDocumentFonts(document);
    expect(fonts.assets.map((asset) => asset.filename)).toEqual([
        "Calibri-BoldItalic.ttf",
        "Calibri.ttf",
    ]);
    expect(fonts.assets[0].hash).toHaveLength(64);
    expect(fonts.css).toContain("font-weight:700;font-style:italic");
});
it("blocks missing variants and refuses arbitrary public font paths", async () => {
    (readFile as jest.Mock).mockRejectedValue(new Error("missing"));
    await expect(
        loadDocumentFonts(fromSegments([{ type: "text", text: "BSB" }])),
    ).rejects.toThrow("Calibri.ttf");
    await expect(fontBytes("../secret")).rejects.toThrow("nicht verfügbar");
    (readdir as jest.Mock).mockResolvedValue([
        "Calibri.ttf",
        "Calibri-Bold.ttf",
    ]);
    expect((await fontStatus()).ready).toBe(false);
});
it("serves Carlito for Calibri only when the licensed file is missing", async () => {
    (readFile as jest.Mock).mockImplementation(async (path: string) => {
        if (path.endsWith("Carlito-Regular.ttf")) return Buffer.from("carlito");
        throw new Error("missing");
    });
    expect((await fontBytes("Calibri.ttf")).toString()).toBe("carlito");
    (readdir as jest.Mock).mockResolvedValue([
        "Carlito-Regular.ttf",
        "Carlito-Bold.ttf",
        "Carlito-Italic.ttf",
    ]);
    expect(await fontStatus()).toMatchObject({
        ready: true,
        substitute: "Carlito",
    });
    (readdir as jest.Mock).mockResolvedValue([
        "Calibri.ttf",
        "Calibri-Bold.ttf",
        "Calibri-Italic.ttf",
        "Carlito-Regular.ttf",
    ]);
    expect(await fontStatus()).toMatchObject({ ready: true, substitute: null });
});
it("serves Carlito for Arial and Times New Roman when those files are missing", async () => {
    (readFile as jest.Mock).mockImplementation(async (filePath: string) => {
        if (String(filePath).endsWith("Carlito-Regular.ttf"))
            return Buffer.from("carlito-regular");
        if (String(filePath).endsWith("Carlito-BoldItalic.ttf"))
            return Buffer.from("carlito-bold-italic");
        throw new Error("missing");
    });
    expect((await fontBytes("Arial.ttf")).toString()).toBe("carlito-regular");
    expect((await fontBytes("TimesNewRoman.ttf")).toString()).toBe(
        "carlito-regular",
    );
    expect((await fontBytes("Arial-BoldItalic.ttf")).toString()).toBe(
        "carlito-bold-italic",
    );
});
