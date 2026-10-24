import PDFDocument from "pdfkit";
import AppError from "@/utils/AppError";
import { NOT_FOUND } from "@/constants/http";
import {
    getPublicQuestionnaire,
    storeQuestionnaireFile,
    submitPublicQuestionnaire,
} from "@/services/questionnaire.service";

type MockField = {
    key: string;
    type: string;
    defaultValue?: string;
    options?: readonly string[];
    max?: number;
    required?: boolean;
};

/** Generate answers for the actual sent form, including custom questions. */
export function mockQuestionnaireValues(
    fields: readonly MockField[],
    email: string,
) {
    const names = email
        .split("@")[0]
        .split("+")[0]
        .split(/[._-]+/)
        .map((part) => part.replace(/\d+$/g, "").replace(/[^a-zäöüß]/gi, ""))
        .filter(Boolean)
        .map(
            (part) => part.charAt(0).toLocaleUpperCase("de-DE") + part.slice(1),
        );
    const today = new Date().toISOString().slice(0, 10);
    const samples: Record<string, string> = {
        firstName: names[0] || "Lukas",
        lastName: names.slice(1).join(" ") || "Mustermann",
        street: "Musterstraße 12",
        postalCode: "10115",
        city: "Berlin",
        birthday: "1990-04-01",
        insuranceNumber: "10010490A443",
        jobTitle: "Anlagenmechaniker",
        entryDate: today,
        birthPlace: "Berlin, Deutschland",
        nationality: "deutsch",
        employeeNumber: "MOCK-001",
        iban: "DE89370400440532013000",
        bic: "COBADEFFXXX",
        taxId: "12345678911",
        taxClass: "1",
        childAllowance: "0",
        religion: "keine",
        healthInsurance: "Musterkrankenkasse",
        vwlAmount: "40",
        vwlContractNumber: "MOCK-VWL-001",
        vwlIban: "DE89370400440532013000",
        vwlBic: "COBADEFFXXX",
        hoursDistribution: "ja",
        hoursMonday: "8",
        hoursTuesday: "8",
        hoursWednesday: "8",
        hoursThursday: "8",
        hoursFriday: "8",
        hoursSaturday: "0",
        hoursSunday: "0",
    };
    return Object.fromEntries(
        fields.map((field) => {
            if (field.defaultValue?.trim())
                return [field.key, field.defaultValue];
            if (field.type === "file") return [field.key, ""];
            if (field.type === "date")
                return [field.key, samples[field.key] ?? today];
            if (field.type === "single" || field.type === "check")
                return [
                    field.key,
                    field.options?.[0] ?? (field.type === "check" ? "ja" : ""),
                ];
            return [
                field.key,
                (samples[field.key] ?? "Testwert").slice(0, field.max ?? 255),
            ];
        }),
    );
}

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
