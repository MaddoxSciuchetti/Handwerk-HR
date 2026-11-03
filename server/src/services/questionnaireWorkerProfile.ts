import {
    answerString,
    questionnaireAnswersFromStored,
    workerTextFromAnswers,
    type QuestionnaireAnswers,
} from "@/services/questionnaireForm";
import AppError from "@/utils/AppError";
import { BAD_REQUEST } from "@/constants/http";

type WorkerProfile = {
    firstName?: string;
    lastName?: string;
    street?: string;
    postalCode?: string;
    city?: string;
    birthday?: Date;
    position?: string;
    entryDate?: Date;
};

type WorkerStammdaten = {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    workEmail?: string | null;
    microsoftEmail?: string | null;
    phoneNumber?: string | null;
    street?: string | null;
    postalCode?: string | null;
    city?: string | null;
    birthday?: Date | null;
    position?: string | null;
    entryDate?: Date | null;
};

function isoDate(value: Date | null | undefined) {
    if (!value || Number.isNaN(value.getTime())) return "";
    return value.toISOString().slice(0, 10);
}

/** Map Handwerker-Informationen into questionnaire-shaped answers for document matching. */
export function questionnaireAnswersFromWorker(
    worker: WorkerStammdaten,
): QuestionnaireAnswers {
    const rows: { key: string; value: string }[] = [
        { key: "firstName", value: worker.firstName?.trim() ?? "" },
        { key: "lastName", value: worker.lastName?.trim() ?? "" },
        { key: "street", value: worker.street?.trim() ?? "" },
        { key: "postalCode", value: worker.postalCode?.trim() ?? "" },
        { key: "city", value: worker.city?.trim() ?? "" },
        { key: "birthday", value: isoDate(worker.birthday) },
        { key: "entryDate", value: isoDate(worker.entryDate) },
        { key: "jobTitle", value: worker.position?.trim() ?? "" },
        {
            key: "phone",
            value: worker.phoneNumber?.trim() ?? "",
        },
    ].filter((row) => row.value.length > 0);
    return questionnaireAnswersFromStored(rows);
}

export function workerHasStammdaten(worker: WorkerStammdaten) {
    return Boolean(
        worker.firstName?.trim() ||
            worker.lastName?.trim() ||
            worker.street?.trim() ||
            worker.postalCode?.trim() ||
            worker.city?.trim() ||
            worker.email?.trim() ||
            worker.workEmail?.trim() ||
            worker.phoneNumber?.trim() ||
            worker.position?.trim() ||
            worker.birthday ||
            worker.entryDate,
    );
}

export function workerMatchEmail(worker: WorkerStammdaten) {
    return (
        worker.email?.trim() ||
        worker.workEmail?.trim() ||
        worker.microsoftEmail?.trim() ||
        ""
    );
}

function dateAnswer(value: string): Date | undefined {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
        ? date
        : undefined;
}

export function workerProfileFromQuestionnaire(
    fields: readonly { key: string }[],
    answers: QuestionnaireAnswers,
    ignoreInvalidDates = false,
): WorkerProfile {
    const present = new Set(fields.map((field) => field.key));
    const { data, birthday } = workerTextFromAnswers([...fields], answers);
    const birthDate = dateAnswer(birthday);
    const entryValue = present.has("entryDate")
        ? answerString(answers, "entryDate").trim()
        : "";
    const entryDate = dateAnswer(entryValue);
    if (
        !ignoreInvalidDates &&
        ((birthday && !birthDate) || (entryValue && !entryDate))
    )
        throw new AppError(
            BAD_REQUEST,
            "Das Geburts- oder Eintrittsdatum ist ungültig.",
        );
    const position = present.has("jobTitle")
        ? answerString(answers, "jobTitle").trim()
        : "";
    return {
        ...data,
        ...(birthDate ? { birthday: birthDate } : {}),
        ...(entryDate ? { entryDate } : {}),
        // The worker profile column supports 160 characters, including for older forms.
        ...(position ? { position: position.slice(0, 160) } : {}),
    };
}

type WorkerWithProfile<T> = {
    [K in keyof T]: K extends keyof WorkerProfile
        ? T[K] | NonNullable<WorkerProfile[K]>
        : T[K];
};

/** Latest completed answers fill gaps, while stored profile corrections win. */
export function fillWorkerProfileFromQuestionnaires<T extends object>(
    worker: T,
    submissions: {
        status: string;
        completedAt: Date | null;
        answers: { key: string; value: string }[];
    }[],
): WorkerWithProfile<T> {
    const result = { ...worker } as WorkerWithProfile<T>;
    const completed = submissions
        .filter((submission) => submission.status === "completed")
        .sort(
            (a, b) =>
                (b.completedAt?.getTime() ?? 0) -
                (a.completedAt?.getTime() ?? 0),
        );
    for (const submission of completed) {
        const patch = workerProfileFromQuestionnaire(
            submission.answers,
            questionnaireAnswersFromStored(submission.answers),
            true,
        );
        for (const [key, value] of Object.entries(patch)) {
            const current = (result as Record<string, unknown>)[key];
            if (
                current == null ||
                (typeof current === "string" && !current.trim())
            )
                (result as Record<string, unknown>)[key] = value;
        }
    }
    return result;
}
