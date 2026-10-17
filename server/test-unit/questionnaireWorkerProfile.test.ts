import {
    fillWorkerProfileFromQuestionnaires,
    workerProfileFromQuestionnaire,
} from "@/services/questionnaireWorkerProfile";
import { questionnaireAnswersFromStored } from "@/services/questionnaireForm";

const answers = [
    { key: "firstName", value: "Lukas" },
    { key: "birthday", value: "1992-03-04" },
    { key: "street", value: "Musterstraße 12" },
    { key: "postalCode", value: "10115" },
    { key: "city", value: "Berlin" },
    { key: "jobTitle", value: "Monteur" },
    { key: "entryDate", value: "2026-11-01" },
];
const completed = {
    status: "completed",
    completedAt: new Date("2026-10-17"),
    answers,
};

it("maps questionnaire data into the worker profile, including both dates and position", () => {
    expect(
        workerProfileFromQuestionnaire(
            answers,
            questionnaireAnswersFromStored(answers),
        ),
    ).toEqual({
        firstName: "Lukas",
        birthday: new Date("1992-03-04T00:00:00Z"),
        street: "Musterstraße 12",
        postalCode: "10115",
        city: "Berlin",
        position: "Monteur",
        entryDate: new Date("2026-11-01T00:00:00Z"),
    });
});

it("fills missing historical profile fields without overwriting corrections or mutating the worker", () => {
    const worker = {
        firstName: "Manuell",
        birthday: null,
        street: "Neue Straße 1",
        city: " ",
        postalCode: null,
        position: null,
        entryDate: null,
    };
    const result = fillWorkerProfileFromQuestionnaires(worker, [completed]);
    expect(result).toMatchObject({
        firstName: "Manuell",
        street: "Neue Straße 1",
        city: "Berlin",
        postalCode: "10115",
        birthday: new Date("1992-03-04T00:00:00Z"),
        position: "Monteur",
        entryDate: new Date("2026-11-01T00:00:00Z"),
    });
    expect(worker.birthday).toBeNull();
    expect(worker.city).toBe(" ");
});

it("uses the newest completed questionnaire and ignores unsent answers and invalid dates", () => {
    const older = {
        ...completed,
        completedAt: new Date("2025-01-01"),
        answers: [{ key: "city", value: "Alt" }],
    };
    const pending = {
        ...completed,
        status: "sent",
        completedAt: new Date("2027-01-01"),
        answers: [{ key: "city", value: "Nicht abgeschickt" }],
    };
    expect(
        fillWorkerProfileFromQuestionnaires({ city: null }, [
            older,
            pending,
            completed,
        ]).city,
    ).toBe("Berlin");
    const invalid = [
        { key: "birthday", value: "1992-02-31" },
        { key: "entryDate", value: "not-a-date" },
    ];
    expect(() =>
        workerProfileFromQuestionnaire(
            invalid,
            questionnaireAnswersFromStored(invalid),
        ),
    ).toThrow("ungültig");
    expect(
        fillWorkerProfileFromQuestionnaires(
            { birthday: null, entryDate: null },
            [{ ...completed, answers: invalid }],
        ),
    ).toEqual({ birthday: null, entryDate: null });
});

it("ignores custom answers and fields missing from the form", () => {
    const rows = [{ key: "custom.city", value: "Other" }];
    expect(
        workerProfileFromQuestionnaire(
            rows,
            questionnaireAnswersFromStored([...rows, ...answers]),
        ),
    ).toEqual({});
    expect(
        workerProfileFromQuestionnaire(
            [{ key: "city" }],
            questionnaireAnswersFromStored([{ key: "city", value: " " }]),
        ),
    ).toEqual({});
});
