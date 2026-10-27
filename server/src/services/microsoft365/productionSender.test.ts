import { mailboxOnConfiguredDomain } from "./productionSender";

it("keeps a mailbox that already uses the domain from the Microsoft app", () => {
    expect(mailboxOnConfiguredDomain("buero@firma.de", "firma.de")).toBe(
        "buero@firma.de",
    );
});

it("sends from the Microsoft app domain instead of an onmicrosoft mailbox", () => {
    expect(
        mailboxOnConfiguredDomain("buero@contoso.onmicrosoft.com", " @Firma.DE "),
    ).toBe("buero@firma.de");
});

it("leaves an explicitly chosen mailbox outside onmicrosoft unchanged", () => {
    expect(mailboxOnConfiguredDomain("buero@other.de", "firma.de")).toBe(
        "buero@other.de",
    );
});
