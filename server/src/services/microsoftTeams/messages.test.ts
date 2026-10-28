import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { accessToken } from "./connection";
import { graphFetch, listChannels, postChannelMessage } from "./graph";
import { reviewDestination, sendTeams, teamsPreview } from "./messages";
jest.mock("@/lib/prisma", () => ({
    prisma: {
        $transaction: jest.fn(),
        $queryRaw: jest.fn(),
        issue: {
            findFirst: jest.fn(),
            findUniqueOrThrow: jest.fn(),
            update: jest.fn(),
        },
        teamsSend: {
            findUnique: jest.fn(),
            findUniqueOrThrow: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        teamsSendDestination: {
            count: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
        },
        issueAuditLog: { create: jest.fn() },
    },
}));
jest.mock("./connection", () => ({
    ...jest.requireActual("./connection"),
    accessToken: jest.fn(),
    assertActiveMember: jest.fn(),
    connectionStatus: jest.fn(async () => ({ status: "connected" })),
}));
jest.mock("./graph", () => ({
    ...jest.requireActual("./graph"),
    graphFetch: jest.fn(),
    listChannels: jest.fn(),
    postChannelMessage: jest.fn(),
    authenticationRejected: jest.fn(),
}));
jest.mock("@/services/engagementMail", () => ({
    applyEngagementMailTemplate: (body: string, values: any) =>
        body.replace("{{Vorname}}", values.firstName),
}));
jest.mock("@/services/welcomeMail", () => ({
    formatWelcomeEntryDate: () => "",
}));
const actor = { organizationId: "org", userId: "alice" };
const choices = [
    { teamId: "team", channelId: "channel-a", label: "Team · A" },
    { teamId: "team", channelId: "channel-b", label: "Team · B" },
];
let op: any;
let issue: any;
const copy = (value: any) => (value ? structuredClone(value) : value);
beforeEach(() => {
    jest.clearAllMocks();
    process.env.INTEGRATIONS_LIVE = "true";
    op = null;
    issue = {
        id: "issue",
        status: "open",
        sequence: "microsoft_send_teams_message",
        mailTemplate: { organizationId: "org", body: "Hello {{Vorname}}" },
        workerEngagement: {
            organizationId: "org",
            worker: { firstName: "Ada", lastName: "Lovelace" },
        },
    };
    (prisma.$transaction as jest.Mock).mockImplementation((fn) => fn(prisma));
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ locked: true }]);
    (prisma.issue.findFirst as jest.Mock).mockImplementation(() =>
        Promise.resolve(copy(issue)),
    );
    (prisma.issue.findUniqueOrThrow as jest.Mock).mockImplementation(() =>
        Promise.resolve(copy(issue)),
    );
    (prisma.issue.update as jest.Mock).mockImplementation(({ data }) => {
        Object.assign(issue, data);
        return Promise.resolve(issue);
    });
    (prisma.teamsSend.findUnique as jest.Mock).mockImplementation(() =>
        Promise.resolve(copy(op)),
    );
    (prisma.teamsSend.findUniqueOrThrow as jest.Mock).mockImplementation(() =>
        Promise.resolve(copy(op)),
    );
    (prisma.teamsSend.create as jest.Mock).mockImplementation(({ data }) => {
        op = {
            ...data,
            destinations: data.destinations.create.map((d: any) => ({
                ...d,
                id: randomUUID(),
                status: "pending",
            })),
        };
        return Promise.resolve(copy(op));
    });
    (prisma.teamsSend.update as jest.Mock).mockImplementation(({ data }) => {
        Object.assign(op, data);
        return Promise.resolve(copy(op));
    });
    (prisma.teamsSendDestination.update as jest.Mock).mockImplementation(
        ({ where, data }) => {
            const dest = op.destinations.find((d: any) => d.id === where.id);
            Object.assign(dest, data);
            return Promise.resolve(copy(dest));
        },
    );
    (prisma.teamsSendDestination.updateMany as jest.Mock).mockImplementation(
        ({ where, data }) => {
            op.destinations.forEach((d: any) => {
                if (
                    typeof where.status === "string"
                        ? d.status === where.status
                        : where.status.in.includes(d.status)
                )
                    Object.assign(d, data);
            });
            return Promise.resolve({ count: 0 });
        },
    );
    (prisma.teamsSendDestination.count as jest.Mock).mockImplementation(() =>
        Promise.resolve(
            op.destinations.filter((d: any) => d.status !== "sent").length,
        ),
    );
    (accessToken as jest.Mock).mockImplementation(async (who) => ({
        token: `${who.userId}-token`,
        connection: {
            microsoftUserId: `ms-${who.userId}`,
            tenantId: "tenant",
            displayName: who.userId,
        },
    }));
    (listChannels as jest.Mock).mockResolvedValue({
        channels: choices,
        warnings: [],
    });
    (graphFetch as jest.Mock).mockImplementation(
        async () =>
            new Response(JSON.stringify({ isArchived: false }), {
                status: 200,
            }),
    );
    (postChannelMessage as jest.Mock).mockResolvedValue({
        status: "sent",
        graphMessageId: "message",
    });
});
afterAll(() => {
    delete process.env.INTEGRATIONS_LIVE;
});
const input = () => ({
    idempotencyKey: randomUUID(),
    destinations: choices.map(({ teamId, channelId }) => ({
        teamId,
        channelId,
    })),
});
it("renders placeholders, sends under the clicking employee, and completes only after every destination succeeds", async () => {
    const result = await sendTeams(actor, "issue", input());
    expect(result.status).toBe("completed");
    expect(postChannelMessage).toHaveBeenCalledWith(
        "alice-token",
        "team",
        "channel-a",
        "Hello Ada",
    );
    expect(postChannelMessage).toHaveBeenCalledTimes(2);
    expect(issue.status).toBe("done");
    expect(prisma.issue.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
            where: expect.objectContaining({
                workerEngagement: { organizationId: "org" },
                OR: [{ assigneeOnly: false }, { assigneeUserId: "alice" }],
            }),
        }),
    );
});
it("uses Bob’s identity for a task Bob sends", async () => {
    await sendTeams({ ...actor, userId: "bob" }, "issue", input());
    expect(postChannelMessage).toHaveBeenCalledWith(
        "bob-token",
        "team",
        "channel-a",
        "Hello Ada",
    );
    expect(op.actorUserId).toBe("bob");
});
it("retains successful destinations and retries only known failures", async () => {
    const request = input();
    (postChannelMessage as jest.Mock)
        .mockResolvedValueOnce({ status: "sent", graphMessageId: "a" })
        .mockResolvedValueOnce({ status: "failed", error: "No access" });
    await sendTeams(actor, "issue", request);
    expect(issue.status).toBe("open");
    expect(op.destinations.map((d: any) => d.status)).toEqual([
        "sent",
        "failed",
    ]);
    await sendTeams(actor, "issue", request);
    expect(postChannelMessage).toHaveBeenCalledTimes(3);
    expect((postChannelMessage as jest.Mock).mock.calls[2][2]).toBe(
        "channel-b",
    );
    expect(issue.status).toBe("done");
});
it("does not resend after duplicate success", async () => {
    const request = input();
    await sendTeams(actor, "issue", request);
    await sendTeams(actor, "issue", request);
    expect(postChannelMessage).toHaveBeenCalledTimes(2);
});
it("requires an explicit review before repeating an uncertain destination", async () => {
    const request = input();
    (postChannelMessage as jest.Mock).mockResolvedValueOnce({
        status: "unknown",
        error: "Timeout",
    });
    await sendTeams(actor, "issue", request);
    await sendTeams(actor, "issue", request);
    expect(postChannelMessage).toHaveBeenCalledTimes(2);
    await reviewDestination(actor, "issue", op.destinations[0].id, false);
    await sendTeams(actor, "issue", request);
    expect(postChannelMessage).toHaveBeenCalledTimes(3);
    expect(issue.status).toBe("done");
});
it("never falls back to another employee connection or discloses their private destinations", async () => {
    const request = input();
    await sendTeams(actor, "issue", request);
    const bob = { ...actor, userId: "bob" };
    await expect(sendTeams(bob, "issue", request)).rejects.toMatchObject({
        code: "different_sender",
    });
    await expect(teamsPreview(bob, "issue")).rejects.toMatchObject({
        code: "different_sender",
    });
    expect(postChannelMessage).toHaveBeenCalledTimes(2);
});
it("blocks concurrent requests before any Graph post", async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ locked: false }]);
    await expect(sendTeams(actor, "issue", input())).rejects.toMatchObject({
        code: "send_in_progress",
    });
    expect(postChannelMessage).not.toHaveBeenCalled();
});
it("stops a throttled batch, honors the retry time, and leaves the task open", async () => {
    const request = input();
    (postChannelMessage as jest.Mock).mockResolvedValue({
        status: "failed",
        error: "Throttle",
        retryAfter: new Date(Date.now() + 120000),
    });
    await sendTeams(actor, "issue", request);
    await sendTeams(actor, "issue", request);
    expect(postChannelMessage).toHaveBeenCalledTimes(1);
    expect(issue.status).toBe("open");
});
it("does not post to an archived channel", async () => {
    (graphFetch as jest.Mock).mockImplementation(
        async () =>
            new Response(JSON.stringify({ isArchived: true }), { status: 200 }),
    );
    await sendTeams(actor, "issue", input());
    expect(postChannelMessage).not.toHaveBeenCalled();
    expect(issue.status).toBe("open");
});
it("honors the live integration switch", async () => {
    process.env.INTEGRATIONS_LIVE = "false";
    await expect(sendTeams(actor, "issue", input())).rejects.toMatchObject({
        code: "not_live",
    });
    expect(postChannelMessage).not.toHaveBeenCalled();
});
