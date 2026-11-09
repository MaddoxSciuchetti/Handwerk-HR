import { sendContactInquiry } from "./contactInquiry.service";
import { sendMail } from "@/utils/sendMail";

jest.mock("@/utils/sendMail", () => ({
    sendMail: jest.fn(),
}));

const mail = sendMail as jest.Mock;

describe("sendContactInquiry", () => {
    beforeEach(() => {
        mail.mockReset();
        delete process.env.CONTACT_INQUIRY_TO;
    });

    it("skips honeypot submissions without sending mail", async () => {
        const result = await sendContactInquiry({
            email: "visitor@example.com",
            message: "Hallo",
            companyWebsite: "https://spam.example",
        });

        expect(result).toEqual({ ok: true, skipped: true });
        expect(mail).not.toHaveBeenCalled();
    });

    it("sends inquiry mail via Resend to the configured inbox", async () => {
        process.env.CONTACT_INQUIRY_TO = "inbox@example.com";
        mail.mockResolvedValue({ data: { id: "mail-1" }, error: null });

        const result = await sendContactInquiry({
            email: "visitor@example.com",
            message: "Bitte um Rückruf",
            companyWebsite: "",
        });

        expect(result).toEqual({
            ok: true,
            skipped: false,
            id: "mail-1",
        });
        expect(mail).toHaveBeenCalledWith(
            expect.objectContaining({
                to: "inbox@example.com",
                replyTo: "visitor@example.com",
                via: "resend",
                subject: "Hadox Anfrage",
            }),
        );
    });
});
