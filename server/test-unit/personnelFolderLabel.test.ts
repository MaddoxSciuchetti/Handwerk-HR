import { personnelFolderLabel } from "@/services/personnelFolderLabel";

describe("personnel folder label", () => {
    it("keeps a trimmed folder name", () => {
        expect(personnelFolderLabel("  Zeugnisse  ")).toBe("Zeugnisse");
    });

    it("rejects an empty name, a reserved name, and a name past 80 characters", () => {
        expect(() => personnelFolderLabel("   ")).toThrow(
            "Der Ordner braucht einen Namen.",
        );
        expect(() => personnelFolderLabel("Personalausweis")).toThrow(
            "Dieser Ordner existiert bereits.",
        );
        expect(() => personnelFolderLabel("Vertrag")).toThrow(
            "Dieser Ordner existiert bereits.",
        );
        expect(() => personnelFolderLabel("a".repeat(81))).toThrow(
            "Der Ordnername darf höchstens 80 Zeichen haben.",
        );
    });
});
