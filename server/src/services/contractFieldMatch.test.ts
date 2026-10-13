import {
    acceptModelMatches,
    unmatchedQuestionnaireAnswers,
} from "@/services/contractFieldMatch";
import type { DocumentSegment } from "@/services/documentBody";

const segments: DocumentSegment[] = [
    { type: "text", text: "Name: " },
    { type: "input", key: "contract.vorname", label: "Vorname" },
    { type: "text", text: " " },
    { type: "input", key: "contract.nachname", label: "Nachname" },
];

describe("unmatchedQuestionnaireAnswers", () => {
    it("lists answers that are not already written into a contract field", () => {
        const unmatched = unmatchedQuestionnaireAnswers(
            segments,
            { "contract.vorname": "Ada" },
            [
                { key: "firstName", value: "Ada" },
                { key: "lastName", value: "Lovelace" },
                { key: "iban", value: "DE89" },
            ],
        );

        expect(unmatched).toEqual([
            { key: "lastName", label: "Familienname", value: "Lovelace" },
            { key: "iban", label: "IBAN", value: "DE89" },
        ]);
    });

    it("hides name parts when the contract already contains the full name", () => {
        const unmatched = unmatchedQuestionnaireAnswers(
            [{ type: "input", key: "contract.name", label: "Name" }],
            { "contract.name": "Ada Lovelace" },
            [
                { key: "firstName", value: "Ada" },
                { key: "lastName", value: "Lovelace" },
            ],
        );

        expect(unmatched).toEqual([]);
    });

    it("formats a birthday for the chip the user drops", () => {
        const unmatched = unmatchedQuestionnaireAnswers(
            [],
            {},
            [{ key: "birthday", value: "1990-02-01" }],
        );

        expect(unmatched).toEqual([
            { key: "birthday", label: "Geburtsdatum", value: "01.02.1990" },
        ]);
    });
});

describe("acceptModelMatches", () => {
    const fields = [{ key: "contract.iban" }, { key: "contract.steuer" }];
    const answers = [{ value: "DE89" }, { value: "123" }];

    it("keeps only keys on the template and values copied from the answers", () => {
        expect(
            acceptModelMatches(fields, answers, {
                matches: [
                    { key: "contract.iban", value: "DE89" },
                    { key: "contract.unknown", value: "DE89" },
                    { key: "contract.steuer", value: "erfunden" },
                    { key: "contract.iban", value: "123" },
                ],
            }),
        ).toEqual([{ key: "contract.iban", value: "DE89" }]);
    });
});
