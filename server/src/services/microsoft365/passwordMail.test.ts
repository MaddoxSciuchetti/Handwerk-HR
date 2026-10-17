import { sendMail } from "@/utils/sendMail";
import { passwordMail, sendPasswordMail } from "./passwordMail";

jest.mock("@/utils/sendMail", () => ({ sendMail: jest.fn() }));
const mail = jest.mocked(sendMail);
const input = {
    firstName: " Ada ",
    workEmail: "ada@firma.de",
    password: "temporary-password",
};
afterEach(() => jest.restoreAllMocks());

it("includes the login, temporary password and required password change", () => {
    const template = passwordMail(input);
    expect(template.subject).toBe("Dein Microsoft-365-Zugang");
    expect(template.text).toContain("Hallo Ada,");
    expect(template.text).toContain("Arbeits-E-Mail: ada@firma.de");
    expect(template.text).toContain("Temporäres Passwort: temporary-password");
    expect(template.text).toContain(
        "Bitte ändere das Passwort bei der ersten Anmeldung.",
    );
});

it("escapes interpolated HTML while retaining plain text", () => {
    const template = passwordMail({
        ...input,
        firstName: "<Ada & Co>",
        password: "A&<b>",
    });
    expect(template.html).toContain("Hallo &lt;Ada &amp; Co&gt;,");
    expect(template.html).toContain("A&amp;&lt;b&gt;");
    expect(template.html).not.toContain("<Ada");
    expect(template.text).toContain("A&<b>");
});

it("uses a neutral greeting for a missing first name", () => {
    expect(passwordMail({ ...input, firstName: " " }).text).toMatch(/^Hallo,/);
});

it("sends credentials to the contact email instead of the new work mailbox", async () => {
    mail.mockResolvedValue({ data: { id: "mail-1" }, error: null });
    expect(
        await sendPasswordMail({ ...input, to: "private@example.test" }),
    ).toBe(true);
    expect(mail).toHaveBeenCalledWith({
        to: "private@example.test",
        ...passwordMail(input),
    });
});

it.each([
    { data: null, error: { name: "MailError", message: "rejected" } },
    { data: null, error: null },
])("reports unsuccessful mail delivery", async (result) => {
    mail.mockResolvedValue(result);
    expect(
        await sendPasswordMail({ ...input, to: "private@example.test" }),
    ).toBe(false);
});

it("reports transport exceptions as unsuccessful delivery", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    mail.mockRejectedValue(new Error("mail unavailable"));
    expect(
        await sendPasswordMail({ ...input, to: "private@example.test" }),
    ).toBe(false);
});
