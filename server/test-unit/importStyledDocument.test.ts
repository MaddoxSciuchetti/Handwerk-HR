import {
    importStyledDocument,
    reconstructLines,
} from "@/services/importStyledDocument";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

jest.mock("pdfjs-dist/legacy/build/pdf.mjs", () => ({
    getDocument: jest.fn(),
    OPS: {
        paintImageXObject: 85,
        save: 10,
        restore: 11,
        setFillRGBColor: 59,
        setFillColorN: 55,
        showText: 44,
        showSpacedText: 45,
    },
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
    it("makes each bullet its own item and joins only hanging-indent continuation lines", () => {
        const nodes = reconstructLines(
            [
                {
                    ...fragment("•", 68, 700, "Arial"),
                    size: 10,
                    width: 5,
                    color: "#ee0000",
                },
                {
                    ...fragment("First task", 86, 700),
                    size: 7,
                    color: "#ee0000",
                },
                {
                    ...fragment("continuation", 86, 688),
                    size: 7,
                    color: "#ee0000",
                },
                {
                    ...fragment("•", 68, 676, "Arial"),
                    size: 10,
                    width: 5,
                    color: "#ee0000",
                },
                {
                    ...fragment("Second task", 86, 676),
                    size: 7,
                    color: "#ee0000",
                },
            ],
            595,
        );
        expect(nodes).toHaveLength(1);
        expect(nodes[0].type).toBe("bulletList");
        expect(nodes[0].content).toHaveLength(2);
        const text = (node: (typeof nodes)[number]): string =>
            node.text ?? node.content?.map(text).join("") ?? "";
        expect(text(nodes[0].content![0])).toBe("First task continuation");
        expect(text(nodes[0].content![1])).toBe("Second task");
        expect(text(nodes[0])).not.toContain("•");
        expect(
            nodes[0].content![1].content![0].content!.at(-1)!.marks,
        ).toContainEqual({
            type: "textStyle",
            attrs: { fontFamily: "Calibri", fontSize: 7, color: "#ee0000" },
        });
    });
    it("retains ordered-list restarts and does not center isolated indented body text", () => {
        const nodes = reconstructLines(
            [
                fragment("Body at left", 50, 760),
                fragment("More body", 50, 730),
                { ...fragment("Indented body", 247.5, 700), width: 100 },
                fragment("3. Third clause", 50, 650),
                fragment("4. Fourth clause", 50, 630),
            ],
            595,
        );
        expect(nodes[2].attrs?.textAlign).toBe("left");
        expect(nodes[3].type).toBe("orderedList");
        expect(nodes[3].attrs?.start).toBe(3);
        expect(nodes[3].content).toHaveLength(2);
    });
    it("does not center full-width body lines or table-cell text", () => {
        const nodes = reconstructLines(
            [
                { ...fragment("Full width body text", 50, 700), width: 495 },
                fragment("Continuation of the body", 50, 685),
                fragment("Next paragraph", 50, 650),
            ],
            595,
        );
        expect(nodes[0].attrs?.textAlign).toBe("left");
        expect(nodes[0].content?.map((node) => node.text).join("")).toContain(
            "Continuation",
        );
        const cell = reconstructLines(
            [{ ...fragment("Cell", 250, 700), width: 95 }],
            595,
            false,
        );
        expect(cell[0].attrs?.textAlign).toBe("left");
    });
    it("retains clearly centered short headings with a distinct body margin", () => {
        const nodes = reconstructLines(
            [
                {
                    ...fragment("Arbeitsvertrag", 247.5, 760, "Calibri-Bold"),
                    width: 100,
                },
                fragment("First body paragraph", 50, 700),
                fragment("Second body paragraph", 50, 650),
            ],
            595,
        );
        expect(nodes[0].attrs?.textAlign).toBe("center");
        expect(nodes[1].attrs?.textAlign).toBe("left");
    });
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
    it("keeps signature strokes with the words that sit on them", () => {
        const rule = (
            x: number,
            y: number,
            width: number,
        ) => ({ x, y, width, thickness: 0.5, color: "#000000" });
        const nodes = reconstructLines(
            [
                fragment("den", 176, 584),
                fragment("den", 443, 584),
                fragment("(Ort)", 106, 575),
                fragment("(Datum)", 221, 575),
                fragment("(Arbeitgeber)", 145, 530),
                fragment("Vertragstext", 57, 500),
            ],
            595,
            true,
            [
                rule(58, 583, 113),
                rule(329, 583, 108),
                rule(58, 536, 209),
            ],
        );
        const signed = nodes.find((node) => node.type === "lineGroup");
        const labels = (signed?.attrs?.labels ?? []) as { text: string; top: number }[];
        expect(labels.map((label) => label.text)).toEqual([
            "den",
            "den",
            "(Ort)",
            "(Datum)",
        ]);
        expect(labels[2].top).toBeGreaterThan(labels[0].top);
        const roles = nodes.filter((node) => node.type === "lineGroup");
        const roleLabels = (roles[1]?.attrs?.labels ?? []) as { text: string }[];
        expect(roleLabels.map((label) => label.text)).toEqual(["(Arbeitgeber)"]);
        expect(
            nodes.some(
                (node) =>
                    node.type === "paragraph" &&
                    node.content?.some((child) => child.text === "Vertragstext"),
            ),
        ).toBe(true);
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
    it("accepts PDFs consisting only of semantic list items", async () => {
        (getDocument as jest.Mock).mockReturnValue({
            destroy: jest.fn(),
            promise: Promise.resolve({
                numPages: 1,
                getPage: async () => ({
                    getViewport: () => ({ width: 595, height: 842 }),
                    getOperatorList: async () => ({
                        fnArray: [],
                        argsArray: [],
                    }),
                    getTextContent: async () => ({
                        styles: { f1: { fontFamily: "Calibri" } },
                        items: [
                            {
                                str: "• First task",
                                transform: [11, 0, 0, 11, 50, 700],
                                width: 70,
                                height: 11,
                                fontName: "f1",
                            },
                        ],
                    }),
                    commonObjs: { get: () => ({ name: "Calibri" }) },
                }),
            }),
        });
        const result = await importStyledDocument({
            originalname: "tasks.pdf",
            buffer: Buffer.from("fake"),
        } as Express.Multer.File);
        expect(result.document.content.content?.[0].type).toBe("bulletList");
    });
});
