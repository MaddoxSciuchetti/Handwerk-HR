import {
    importStyledDocument,
    reconstructLines,
} from "@/services/importStyledDocument";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

jest.mock("pdfjs-dist/legacy/build/pdf.mjs", () => ({
    getDocument: jest.fn(),
    OPS: { paintImageXObject: 85 },
}));
jest.mock("linkedom", () => ({ parseHTML: jest.fn() }));
const fragment = (text: string, x: number, y: number, font = "Calibri") => ({
    text,
    x,
    y,
    width: text.length * 5,
    size: 11,
    font,
});

describe("deterministic document import", () => {
    it("retains formatting and reconstructs aligned basic tables", () => {
        const nodes = reconstructLines(
            [
                fragment("Name", 50, 700, "Calibri-Bold"),
                fragment("Jörg Müller", 250, 700),
                fragment("Beginn", 50, 685),
                fragment("09.10.2026", 250, 685),
                fragment("Vertragstext", 50, 650, "Calibri-Italic"),
            ],
            595,
        );
        expect(nodes[0].type).toBe("table");
        expect(nodes[0].content).toHaveLength(2);
        expect(
            nodes[0].content![0].content![0].content![0].content![0].marks,
        ).toContainEqual({ type: "bold" });
        expect(nodes[1].content![0].marks).toContainEqual({ type: "italic" });
    });
    it("imports TXT as paragraphs and rejects Pages", async () => {
        const file = {
            originalname: "draft.txt",
            buffer: Buffer.from("Zeile eins\nZeile zwei"),
        } as Express.Multer.File;
        expect(
            (await importStyledDocument(file)).document.content.content,
        ).toHaveLength(2);
        await expect(
            importStyledDocument({ ...file, originalname: "draft.pages" }),
        ).rejects.toThrow("Pages");
    });
    it("rejects scanned PDFs and releases their resources", async () => {
        const destroy = jest.fn();
        (getDocument as jest.Mock).mockReturnValue({
            destroy,
            promise: Promise.resolve({
                numPages: 1,
                getPage: async () => ({
                    getViewport: () => ({ width: 595, height: 842 }),
                    getOperatorList: async () => ({
                        fnArray: [],
                        argsArray: [],
                    }),
                    getTextContent: async () => ({ items: [], styles: {} }),
                }),
            }),
        });
        await expect(
            importStyledDocument({
                originalname: "scan.pdf",
                buffer: Buffer.from("fake"),
            } as Express.Multer.File),
        ).rejects.toThrow("keinen lesbaren Text");
        expect(destroy).toHaveBeenCalled();
    });
});
