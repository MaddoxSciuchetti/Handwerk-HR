import { prisma } from "@/lib/prisma";
import { accessToken } from "./connection";
import {
    graphChannelPath,
    listChannels,
    paginationPath,
    postChannelMessage,
    retryDate,
} from "./graph";
jest.mock("./connection", () => {
    const real = jest.requireActual("./connection");
    return { ...real, accessToken: jest.fn() };
});
jest.mock("@/lib/prisma", () => ({
    prisma: {
        $transaction: jest.fn(),
        microsoftUserConnection: { updateMany: jest.fn() },
        microsoftConnectionEvent: { create: jest.fn() },
    },
}));
const fetchMock = jest.fn();
const originalFetch = global.fetch;
beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock;
    (prisma.$transaction as jest.Mock).mockImplementation((fn) => fn(prisma));
    (prisma.microsoftUserConnection.updateMany as jest.Mock).mockResolvedValue({
        count: 1,
    });
    (accessToken as jest.Mock).mockResolvedValue({ token: "alice-token" });
});
afterAll(() => {
    global.fetch = originalFetch;
});
const response = (
    status: number,
    body: unknown = {},
    headers: Record<string, string> = {},
) => new Response(JSON.stringify(body), { status, headers });

it("discovers paginated teams and channels without email and uses owning IDs for shared channels", async () => {
    fetchMock
        .mockResolvedValueOnce(
            response(200, {
                value: [{ id: "team-a", displayName: "A" }],
                "@odata.nextLink":
                    "https://graph.microsoft.com/v1.0/me/teamwork/associatedTeams?$skiptoken=next",
            }),
        )
        .mockResolvedValueOnce(
            response(200, { value: [{ id: "team-b", displayName: "B" }] }),
        )
        .mockResolvedValueOnce(
            response(200, {
                value: [
                    { id: "private", displayName: "Private" },
                    {
                        id: "archived",
                        displayName: "Archived",
                        isArchived: true,
                    },
                ],
                "@odata.nextLink":
                    "https://graph.microsoft.com/v1.0/teams/team-a/allChannels?$skiptoken=next",
            }),
        )
        .mockResolvedValueOnce(
            response(200, {
                value: [
                    {
                        id: "shared",
                        displayName: "Shared",
                        "@odata.id":
                            "https://graph.microsoft.com/v1.0/teams/owner/channels/shared",
                    },
                ],
            }),
        )
        .mockResolvedValueOnce(response(200, { value: [] }));
    const result = await listChannels({
        organizationId: "org-a",
        userId: "alice",
    });
    expect(result.channels).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ teamId: "team-a", channelId: "private" }),
            expect.objectContaining({ teamId: "owner", channelId: "shared" }),
        ]),
    );
    expect(result.channels).toHaveLength(2);
    expect(
        fetchMock.mock.calls.every(
            ([, options]) =>
                options.headers.Authorization === "Bearer alice-token",
        ),
    ).toBe(true);
});
it("does not follow a Graph pagination URL to another host", () => {
    expect(() =>
        paginationPath("https://attacker.example/v1.0/collect"),
    ).toThrow();
});
it("encodes channel IDs in Graph requests", () =>
    expect(graphChannelPath("team", "19:abc@thread.tacv2")).toBe(
        "/teams/team/channels/19%3Aabc%40thread.tacv2",
    ));
it("posts plain text without a client-selected sender", async () => {
    fetchMock.mockResolvedValue(
        response(201, {
            id: "message-1",
            webUrl: "https://teams.microsoft.com/message-1",
        }),
    );
    expect(
        await postChannelMessage("alice-token", "team", "channel", "Hello"),
    ).toMatchObject({ status: "sent", graphMessageId: "message-1" });
    const request = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(request).toEqual({
        body: { contentType: "text", content: "Hello" },
    });
});
it.each([403, 404])(
    "keeps a rejected %s delivery retryable",
    async (status) => {
        fetchMock.mockResolvedValue(response(status));
        expect(
            await postChannelMessage("token", "team", "channel", "Hello"),
        ).toMatchObject({ status: "failed" });
    },
);
it("honors throttling without immediately reposting", async () => {
    fetchMock.mockResolvedValue(response(429, {}, { "Retry-After": "120" }));
    const result = await postChannelMessage(
        "token",
        "team",
        "channel",
        "Hello",
    );
    expect(result.status).toBe("failed");
    expect(result.retryAfter!.getTime()).toBeGreaterThan(Date.now() + 119_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
});
it("parses HTTP-date throttling headers", () =>
    expect(retryDate("Wed, 21 Oct 2026 12:00:00 GMT", 0).toISOString()).toBe(
        "2026-10-21T12:00:00.000Z",
    ));
it.each([500, 503, 408])(
    "flags %s as uncertain rather than retrying a possibly delivered post",
    async (status) => {
        fetchMock.mockResolvedValue(response(status));
        expect(
            await postChannelMessage("token", "team", "channel", "Hello"),
        ).toMatchObject({ status: "unknown" });
        expect(fetchMock).toHaveBeenCalledTimes(1);
    },
);
it("flags network failures as uncertain", async () => {
    fetchMock.mockRejectedValue(new Error("timeout"));
    expect(
        await postChannelMessage("token", "team", "channel", "Hello"),
    ).toMatchObject({ status: "unknown" });
});

it("marks and audits the employee connection when Graph rejects its token", async () => {
    fetchMock.mockResolvedValue(response(401));
    const actor = { organizationId: "org-a", userId: "alice" };
    await expect(listChannels(actor)).rejects.toMatchObject({
        code: "reconnect_required",
    });
    expect(prisma.microsoftConnectionEvent.create).toHaveBeenCalledWith({
        data: { ...actor, action: "reconnect_required" },
    });
});
