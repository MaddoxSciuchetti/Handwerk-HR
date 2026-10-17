import {
    buildUserPrincipalName,
    foldMailPart,
    temporaryPassword,
} from "./identity";

it.each([
    [" Jörg ", "joerg"],
    ["Müller", "mueller"],
    ["Straße", "strasse"],
    ["Élodie", "elodie"],
    ["Anna--Maria", "anna.maria"],
    [" ", "mitarbeiter"],
])("normalizes %p to %p", (name, normalized) => {
    expect(foldMailPart(name)).toBe(normalized);
});

it("normalizes the domain and adds collision suffixes", () => {
    expect(
        buildUserPrincipalName({
            firstName: "Jörg",
            lastName: "Müller",
            domain: " @Firma.DE ",
            attempt: 2,
        }),
    ).toBe("joerg.mueller2@firma.de");
});

it("generates distinct 16-character passwords with all required character classes", () => {
    const passwords = Array.from({ length: 10 }, () => temporaryPassword());
    for (const password of passwords) {
        expect(password).toHaveLength(16);
        expect(password).toMatch(/[A-Z]/);
        expect(password).toMatch(/[a-z]/);
        expect(password).toMatch(/[0-9]/);
        expect(password).toMatch(/[^A-Za-z0-9]/);
    }
    expect(new Set(passwords).size).toBe(passwords.length);
});
