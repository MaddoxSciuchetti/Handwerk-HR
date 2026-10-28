import PDFDocument from "pdfkit";
import AppError from "@/utils/AppError";
import { NOT_FOUND } from "@/constants/http";
import {
    getPublicQuestionnaire,
    storeQuestionnaireFile,
    submitPublicQuestionnaire,
} from "@/services/questionnaire.service";
import { mockQuestionnaireValues } from "../../../shared/questionnaireMock";

export { mockQuestionnaireValues };

async function mockFile(): Promise<Express.Multer.File> {
    const pdf = new PDFDocument({ size: "A4" });
    const chunks: Buffer[] = [];
    const buffer = new Promise<Buffer>((resolve, reject) => {
        pdf.on("data", (chunk: Buffer) => chunks.push(chunk));
        pdf.on("end", () => resolve(Buffer.concat(chunks)));
        pdf.on("error", reject);
    });
    pdf.fontSize(18).text("TESTDOKUMENT - Fragebogen Mock");
    pdf.fontSize(12).text("Synthetischer Anhang fuer den Onboarding-Test.");
    pdf.end();
    const bytes = await buffer;
    return {
        buffer: bytes,
        size: bytes.length,
        originalname: "Testdokument.pdf",
        mimetype: "application/pdf",
    } as Express.Multer.File;
}

export async function completeMockQuestionnaire(token: string, email: string) {
    const form = await getPublicQuestionnaire(token);
    if (!form) throw new AppError(NOT_FOUND, "Formular nicht gefunden.");
    if (form.status === "completed") return;
    const values = mockQuestionnaireValues(form.questions, email);
    for (const field of form.questions) {
        if (field.type !== "file" || !field.required || values[field.key])
            continue;
        const stored = await storeQuestionnaireFile(token, await mockFile());
        values[field.key] = stored.value;
    }
    // The normal handler validates, stores answers, updates the worker, matches
    // the contract and creates its print task. Replays are idempotent there.
    await submitPublicQuestionnaire(token, values);
}
