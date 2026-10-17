import { BAD_REQUEST } from "@/constants/http";
import AppError from "@/utils/AppError";

const RESERVED = new Set([
    "personalausweis",
    "führerschein",
    "krankenkassenkarte",
    "fragebogen",
    "vertrag",
]);

export function personnelFolderLabel(value: string): string {
    const label = value.trim().replace(/\s+/g, " ");
    if (!label) {
        throw new AppError(BAD_REQUEST, "Der Ordner braucht einen Namen.");
    }
    if (label.length > 80) {
        throw new AppError(
            BAD_REQUEST,
            "Der Ordnername darf höchstens 80 Zeichen haben.",
        );
    }
    if (RESERVED.has(label.toLocaleLowerCase("de-DE"))) {
        throw new AppError(BAD_REQUEST, "Dieser Ordner existiert bereits.");
    }
    return label;
}
