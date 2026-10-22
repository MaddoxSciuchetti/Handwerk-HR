import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import { microsoftCallback, postTeamsSend } from "./microsoftTeams.controller";
import {
    finishConnection,
    TeamsError,
} from "@/services/microsoftTeams/connection";
import { sendTeams } from "@/services/microsoftTeams/messages";
jest.mock("@/services/microsoftTeams/connection", () => ({
    ...jest.requireActual("@/services/microsoftTeams/connection"),
    finishConnection: jest.fn(),
}));
jest.mock("@/services/microsoftTeams/messages", () => ({
    sendTeams: jest.fn(),
    teamsPreview: jest.fn(),
    reviewDestination: jest.fn(),
}));
jest.mock("@/services/microsoftTeams/graph", () => ({
    listChannels: jest.fn(),
}));
jest.mock("@/lib/prisma", () => ({ prisma: {} }));
const state = "11111111-1111-4111-8111-111111111111";
function app() {
    const application = express();
    application.use(express.json(), cookieParser());
    application.get("/auth/microsoft/callback", microsoftCallback);
    application.post(
        "/send",
        (req, _res, next) => {
            req.orgId = "org";
            req.userId = "alice";
            next();
        },
        postTeamsSend,
    );
    return application;
}
beforeEach(() => jest.clearAllMocks());
it("accepts a bound callback without needing an unexpired app-session cookie and redirects without codes/tokens", async () => {
    (finishConnection as jest.Mock).mockResolvedValue({
        userId: "alice",
        organizationId: "org",
    });
    const result = await request(app())
        .get("/auth/microsoft/callback")
        .query({ state, code: "private-auth-code" })
        .set("Cookie", "microsoftTeamsAttempt=browser-binding");
    expect(finishConnection).toHaveBeenCalledWith({
        state,
        code: "private-auth-code",
        browserSecret: "browser-binding",
    });
    expect(result.status).toBe(303);
    expect(result.headers.location).toBe(
        "http://localhost:5173/settings/general?microsoft=connected",
    );
    expect(result.headers.location).not.toContain("private-auth-code");
    expect(result.headers["cache-control"]).toBe("no-store");
    expect(result.headers["set-cookie"][0]).toContain(
        "Expires=Thu, 01 Jan 1970",
    );
});
it("returns a useful cancellation state without exposing Microsoft details", async () => {
    (finishConnection as jest.Mock).mockRejectedValue(
        new TeamsError("consent_cancelled", "Cancelled"),
    );
    const result = await request(app())
        .get("/auth/microsoft/callback")
        .query({
            state,
            error: "access_denied",
            error_description: "private-details",
        })
        .set("Cookie", "microsoftTeamsAttempt=browser-binding");
    expect(result.headers.location).toContain("microsoft=consent_cancelled");
    expect(result.headers.location).not.toContain("private-details");
});
it("does not redeem an unbound callback", async () => {
    const result = await request(app())
        .get("/auth/microsoft/callback")
        .query({ state, code: "code" });
    expect(result.status).toBe(303);
    expect(finishConnection).not.toHaveBeenCalled();
});
it("rejects client-supplied sender identities", async () => {
    const result = await request(app())
        .post("/send")
        .send({
            idempotencyKey: state,
            destinations: [{ teamId: state, channelId: "channel" }],
            userId: "bob",
        });
    expect(result.status).toBe(400);
    expect(sendTeams).not.toHaveBeenCalled();
});
it("derives the sending actor from the authenticated request", async () => {
    (sendTeams as jest.Mock).mockResolvedValue({ status: "completed" });
    const payload = {
        idempotencyKey: state,
        destinations: [{ teamId: state, channelId: "channel" }],
    };
    const result = await request(app()).post("/send").send(payload);
    expect(result.status).toBe(200);
    expect(sendTeams).toHaveBeenCalledWith(
        { organizationId: "org", userId: "alice" },
        "undefined",
        payload,
    );
});
