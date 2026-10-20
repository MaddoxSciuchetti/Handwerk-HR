let sendGraphMail: typeof import("./graphMail").sendGraphMail;

jest.mock("@/constants/env", () => ({ MICROSOFT_GRAPH_TOKEN: "static", MICROSOFT_GRAPH_MAILBOX: "sender@example.de" }));
jest.mock("./graphMailToken", () => ({
    ...jest.requireActual("./graphMailToken"),
    graphMailCredentials: jest.fn(() => ({ tenantId: "tenant", clientId: "client", clientSecret: "secret" })),
}));
const mail = { to: "recipient@example.de", subject: "Test", html: "Hello" };
const json = (body: unknown, status = 200) => new Response(body === null ? null : JSON.stringify(body), { status });
beforeEach(() => {
    jest.isolateModules(() => { sendGraphMail = require("./graphMail").sendGraphMail; });
});
afterEach(() => jest.restoreAllMocks());

it("renews on Graph 401 and retries the rejected operation without duplicating the draft", async () => {
    const fetcher = jest.spyOn(global, "fetch")
        .mockResolvedValueOnce(json({ access_token: "first", expires_in: 3600 }))
        .mockResolvedValueOnce(json({ id: "draft", conversationId: "conversation" }, 201))
        .mockResolvedValueOnce(json({ error: { code: "InvalidAuthenticationToken" } }, 401))
        .mockResolvedValueOnce(json({ access_token: "renewed", expires_in: 3600 }))
        .mockResolvedValueOnce(json(null, 202));
    expect(await sendGraphMail(mail)).toEqual({ conversationId: "conversation" });
    const urls = fetcher.mock.calls.map(([url]) => String(url));
    expect(urls.filter(url => url.endsWith("/messages"))).toHaveLength(1);
    expect(urls.filter(url => url.endsWith("/send"))).toHaveLength(2);
    expect(fetcher.mock.calls[4][1]?.headers).toEqual(expect.objectContaining({ Authorization: "Bearer renewed" }));
});

it("does not renew or retry a permissions rejection", async () => {
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    const fetcher = jest.spyOn(global, "fetch")
        .mockResolvedValueOnce(json({ access_token: "first", expires_in: 3600 }))
        .mockResolvedValueOnce(json({ error: { code: "ErrorAccessDenied", message: "private details" } }, 403));
    await expect(sendGraphMail(mail)).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(log).toHaveBeenCalledWith("Microsoft Graph request failed", 403, "ErrorAccessDenied");
    expect(JSON.stringify(log.mock.calls)).not.toContain("private details");
});

it("stops after a second 401", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    const fetcher = jest.spyOn(global, "fetch")
        .mockResolvedValueOnce(json({ access_token: "first", expires_in: 3600 }))
        .mockResolvedValueOnce(json({}, 401))
        .mockResolvedValueOnce(json({ access_token: "still-invalid", expires_in: 3600 }))
        .mockResolvedValueOnce(json({}, 401));
    await expect(sendGraphMail(mail)).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(4);
});

it("requires a mailbox for application authentication", async () => {
    const fetcher = jest.spyOn(global, "fetch");
    await expect(sendGraphMail({ ...mail, senderAddress: "" })).rejects.toThrow("Absenderadresse");
    expect(fetcher).not.toHaveBeenCalled();
});

it("does not retry an ambiguous send timeout", async () => {
    const fetcher = jest.spyOn(global, "fetch")
        .mockResolvedValueOnce(json({ access_token: "first", expires_in: 3600 }))
        .mockResolvedValueOnce(json({ id: "draft", conversationId: "conversation" }, 201))
        .mockRejectedValueOnce(new Error("Request timed out"));
    await expect(sendGraphMail(mail)).rejects.toThrow("timed out");
    expect(fetcher).toHaveBeenCalledTimes(3);
});
