import {
    isAssignablePersonnelDocumentName,
    isPersonnelDocumentName,
    personnelDocumentLabel,
} from "@/services/personnelDocumentNames";

describe("personnel document names", () => {
    it("accepts the three document names a user can assign", () => {
        expect(isPersonnelDocumentName("personalausweis")).toBe(true);
        expect(isPersonnelDocumentName("fuehrerschein")).toBe(true);
        expect(isPersonnelDocumentName("krankenkassenkarte")).toBe(true);
        expect(isPersonnelDocumentName("pass")).toBe(false);
        expect(isPersonnelDocumentName("ordner")).toBe(true);
        expect(isAssignablePersonnelDocumentName("personalausweis")).toBe(true);
        expect(isAssignablePersonnelDocumentName("fragebogen")).toBe(false);
        expect(isAssignablePersonnelDocumentName("ordner")).toBe(false);
    });

    it("labels each stored name in German", () => {
        expect(personnelDocumentLabel("personalausweis")).toBe("Personalausweis");
        expect(personnelDocumentLabel("fuehrerschein")).toBe("Führerschein");
        expect(personnelDocumentLabel("krankenkassenkarte")).toBe(
            "Krankenkassenkarte",
        );
        expect(personnelDocumentLabel("ordner")).toBe("Ordner");
    });
});
