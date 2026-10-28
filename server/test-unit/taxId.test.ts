import { isValidTaxId, taxIdInput } from "../../shared/taxId";
import { QUESTIONNAIRE_FIELDS, questionnaireAnswerSchema } from "@/services/questionnaireForm";
import { parseQuestionnaireDefinition } from "@/services/questionnaireDefinition";

describe("Steuer-ID validation", () => {
    // Official ELSTER illustrations, used only for local validation tests.
    it.each(["86095742719", "47036892816", "65929970489", "57549285017", "25768131411"])(
        "accepts the official example %s, including triple digit patterns",
        (value) => expect(isValidTaxId(value)).toBe(true),
    );

    it.each(["", "abc", "8609574271", "860957427199", "86095742718", "02476291358", "00000000000", "86-095-742-719"])(
        "rejects malformed numbers and incorrect checksums: %s",
        (value) => expect(isValidTaxId(value)).toBe(false),
    );

    it("rejects invalid digit patterns even when the checksum matches", () => {
        function withChecksum(body: string) {
            let product = 10;
            for (const digit of body) product = (2 * ((Number(digit) + product) % 10 || 10)) % 11;
            return body + String((11 - product) % 10);
        }
        for (const body of ["1234567890", "1122345678", "1112345678", "1111234567"]) {
            expect(isValidTaxId(withChecksum(body))).toBe(false);
        }
    });

    it("normalizes spaces without hiding invalid characters or extra digits", () => {
        expect(taxIdInput(" 86 095\u00a0742 719 ")).toBe("86095742719");
        expect(isValidTaxId("86 095 742 719")).toBe(true);
        expect(taxIdInput("86095742719x")).toBe("86095742719x");
    });

    it("validates submissions and stores compact digits", () => {
        const schema = questionnaireAnswerSchema(QUESTIONNAIRE_FIELDS.filter((field) => field.key === "taxId"), []);
        expect(schema.parse({ taxId: "86 095 742 719" })).toEqual({ taxId: "86095742719" });
        expect(schema.parse({ taxId: "" })).toEqual({ taxId: "" });
        expect(() => schema.parse({ taxId: "86095742718" })).toThrow("Steuer-ID");
        const required = questionnaireAnswerSchema([{ key: "taxId", label: "Steuer-ID", section: "Steuer", type: "text", required: true }], []);
        expect(() => required.parse({ taxId: " " })).toThrow("erforderlich");
    });

    it("validates and normalizes employer defaults", () => {
        const definition = parseQuestionnaireDefinition({ items: [{ kind: "field", key: "taxId", defaultValue: "86 095 742 719" }] });
        expect(definition.items[0]).toMatchObject({ defaultValue: "86095742719" });
        expect(() => parseQuestionnaireDefinition({ items: [{ kind: "field", key: "taxId", defaultValue: "abc" }] })).toThrow("Steuer-ID");
    });
});
