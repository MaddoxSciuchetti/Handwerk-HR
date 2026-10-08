import mammoth from "mammoth";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { BAD_REQUEST } from "@/constants/http";
import AppError from "@/utils/AppError";

const DOCX_MIME =
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export async function extractDocumentText(
    file: Express.Multer.File,
): Promise<string> {
    const name = file.originalname.toLowerCase();
    let text = "";

    if (name.endsWith(".txt") || file.mimetype === "text/plain") {
        text = file.buffer.toString("utf8");
    } else if (name.endsWith(".docx") || file.mimetype === DOCX_MIME) {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        text = result.value;
    } else if (name.endsWith(".pdf") || file.mimetype === "application/pdf") {
        text = await extractPdfText(file.buffer);
    } else {
        throw new AppError(
            BAD_REQUEST,
            "Erlaubt sind PDF, DOCX und TXT.",
        );
    }

    const trimmed = text.trim();
    if (trimmed.length === 0) {
        throw new AppError(
            BAD_REQUEST,
            "Aus dem Dokument konnte kein Text gelesen werden.",
        );
    }

    return trimmed;
}

async function extractPdfText(buffer: Buffer): Promise<string> {
    const document = await getDocument({
        data: new Uint8Array(buffer),
        useSystemFonts: true,
    }).promise;

    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        const page = await document.getPage(pageNumber);
        const content = await page.getTextContent();
        const line = content.items
            .map((item) => ("str" in item ? item.str : ""))
            .join(" ");
        pages.push(line);
    }

    return pages.join("\n");
}
