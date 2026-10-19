import { sendGraphMail } from "@/services/graphMail";
import { sendMail } from "@/utils/sendMail";
import resend from "@/config/resend";

jest.mock("@/services/preparedDocument", () => ({
    DeliveryRejected: class extends Error {},
}));
jest.mock("@/config/resend", () => ({
    __esModule: true,
    default: { emails: { send: jest.fn() } },
}));
jest.mock("@/utils/testEmailOutbox", () => ({ recordSentEmail: jest.fn() }));
jest.mock("@/constants/env", () => ({
    MICROSOFT_GRAPH_TOKEN: "test",
    MICROSOFT_GRAPH_MAILBOX: "sender@example.de",
    EMAIL_SENDER: "sender@example.de",
    USE_MICROSOFT_MAIL: false,
}));

const attachment = {
    filename: "Vertrag.pdf",
    contentType: "application/pdf",
    content: Buffer.from("%PDF-approved"),
};
afterEach(() => jest.restoreAllMocks());
it("attaches identical PDF bytes to Graph while retaining conversation tracking", async () => {
    const mock = jest
        .spyOn(global, "fetch")
        .mockResolvedValueOnce({
            ok: true,
            status: 201,
            text: async () =>
                JSON.stringify({ id: "draft", conversationId: "conversation" }),
        } as Response)
        .mockResolvedValueOnce({ ok: true, status: 202 } as Response);
    expect(
        await sendGraphMail({
            to: "ada@example.de",
            subject: "Vertrag",
            html: "PDF",
            attachments: [attachment],
        }),
    ).toEqual({ conversationId: "conversation" });
    const draft = JSON.parse(String(mock.mock.calls[0][1]?.body));
    expect(Buffer.from(draft.attachments[0].contentBytes, "base64")).toEqual(
        attachment.content,
    );
    expect(draft.attachments[0]["@odata.type"]).toBe(
        "#microsoft.graph.fileAttachment",
    );
    expect(draft.attachments[0].contentType).toBe("application/pdf");
});
it("attaches identical PDF bytes to Resend with idempotency and reply tracking", async () => {
    (resend.emails.send as jest.Mock).mockResolvedValue({
        data: { id: "mail-1" },
        error: null,
    });
    await sendMail({
        to: "ada@example.de",
        subject: "Vertrag [token]",
        text: "PDF",
        html: "PDF",
        replyTo: "reply@example.de",
        attachments: [attachment],
        idempotencyKey: "pdf-1",
    });
    expect(resend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
            attachments: [attachment],
            replyTo: "reply@example.de",
        }),
        { idempotencyKey: "pdf-1" },
    );
});

it("uses the selected sender for Resend", async () => {
    (resend.emails.send as jest.Mock).mockResolvedValue({ data: { id: "mail-2" }, error: null });
    await sendMail({ to: "ada@example.de", senderAddress: "office@example.de", subject: "Fragebogen", text: "Link", html: "Link" });
    expect(resend.emails.send).toHaveBeenLastCalledWith(expect.objectContaining({ from: "office@example.de" }), undefined);
});

it("creates and sends Graph mail using the selected mailbox", async () => {
    const mock = jest.spyOn(global, "fetch")
        .mockResolvedValueOnce({ ok: true, status: 201, text: async () => JSON.stringify({ id: "draft", conversationId: "conversation" }) } as Response)
        .mockResolvedValueOnce({ ok: true, status: 202 } as Response);
    await sendGraphMail({ to: "ada@example.de", senderAddress: "office@example.de", subject: "Fragebogen", html: "Link" });
    expect(mock.mock.calls.map(([url]) => url)).toEqual([
        "https://graph.microsoft.com/v1.0/users/office%40example.de/messages",
        "https://graph.microsoft.com/v1.0/users/office%40example.de/messages/draft/send",
    ]);
});
