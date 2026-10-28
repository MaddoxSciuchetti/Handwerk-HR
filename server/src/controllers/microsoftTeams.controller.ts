import type { RequestHandler, Request } from "express";
import { z } from "zod";
import { FRONTENDURL } from "@/constants/env";
import {
    CALLBACK_COOKIE,
    callbackUri,
    connectionStatus,
    disconnectAndGetStatus,
    finishConnection,
    microsoftAuthorizeUrl,
    startConnection,
    TeamsError,
    type Actor,
} from "@/services/microsoftTeams/connection";
import { listChannels } from "@/services/microsoftTeams/graph";
import {
    reviewDestination,
    sendTeams,
    teamsPreview,
} from "@/services/microsoftTeams/messages";

// Microsoft returns the browser with a top-level navigation. Lax is sent on that
// navigation and is stored on staging; SameSite=None is treated as a third-party
// cookie and dropped between the two onrender.com sites.
const callbackCookieOptions = () => ({
    secure: process.env.NODE_ENV !== "development",
    sameSite: "lax" as const,
    path: "/auth/microsoft/callback",
});
const actor = (req: Request): Actor => {
    if (!req.orgId || !req.userId)
        throw new TeamsError("access_denied", "Bitte erneut anmelden.", 403);
    return { organizationId: req.orgId, userId: req.userId };
};
const endpoint =
    (fn: (req: Request) => Promise<unknown>): RequestHandler =>
    async (req, res) => {
        res.setHeader("Cache-Control", "no-store");
        try {
            res.json({ success: true, data: await fn(req) });
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    message: "Ungültige Teams-Anfrage.",
                    code: "invalid_request",
                });
                return;
            }
            const known = error instanceof TeamsError;
            res.status(known ? error.statusCode : 503).json({
                message: known
                    ? error.message
                    : "Microsoft Teams ist derzeit nicht verfügbar. Bitte erneut versuchen.",
                code: known ? error.code : "teams_unavailable",
            });
        }
    };
export const getConnection = endpoint((req) => connectionStatus(actor(req)));
export const deleteConnection = endpoint((req) =>
    disconnectAndGetStatus(actor(req)),
);
export const postConnection: RequestHandler = async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    try {
        const result = await startConnection(actor(req));
        const bridge = new URL(
            "/auth/microsoft/bridge",
            new URL(callbackUri()).origin,
        );
        bridge.searchParams.set("state", result.state);
        bridge.searchParams.set("bind", result.browserSecret);
        res.json({ success: true, data: { url: bridge.toString() } });
    } catch (error) {
        res.status(error instanceof TeamsError ? error.statusCode : 503).json({
            code:
                error instanceof TeamsError ? error.code : "connection_failed",
            message:
                error instanceof TeamsError
                    ? error.message
                    : "Die Microsoft-Anmeldung konnte nicht gestartet werden.",
        });
    }
};
export const microsoftBridge: RequestHandler = async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Referrer-Policy", "no-referrer");
    const redirect = new URL("/settings/integrations", FRONTENDURL);
    try {
        const { state, bind } = z
            .object({
                state: z.string().uuid(),
                bind: z.string().min(1).max(200),
            })
            .parse(req.query);
        const url = await microsoftAuthorizeUrl(state, bind);
        res.cookie(CALLBACK_COOKIE, bind, {
            ...callbackCookieOptions(),
            httpOnly: true,
            maxAge: 600_000,
        });
        res.redirect(303, url);
    } catch (error) {
        redirect.searchParams.set(
            "microsoft",
            error instanceof TeamsError ? error.code : "connection_failed",
        );
        res.redirect(303, redirect.toString());
    }
};
export const microsoftCallback: RequestHandler = async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Referrer-Policy", "no-referrer");
    const redirect = new URL("/settings/integrations", FRONTENDURL);
    try {
        const input = z
            .object({
                state: z.string().uuid(),
                code: z.string().max(10_000).optional(),
                error: z.string().max(200).optional(),
            })
            .parse(req.query);
        const browserSecret = z
            .string()
            .min(1)
            .max(200)
            .parse(req.cookies[CALLBACK_COOKIE]);
        await finishConnection({ ...input, browserSecret });
        redirect.searchParams.set("microsoft", "connected");
    } catch (error) {
        // Return only our own error codes, never Microsoft's raw response or authorization code.
        console.error(
            "microsoft callback failed",
            error instanceof TeamsError
                ? error.code
                : error instanceof z.ZodError
                  ? error.issues
                        .map((issue) => issue.path.join(".") || issue.code)
                        .join(",")
                  : error instanceof Error
                    ? error.name
                    : "unknown",
        );
        redirect.searchParams.set(
            "microsoft",
            error instanceof TeamsError ? error.code : "connection_failed",
        );
    }
    res.clearCookie(CALLBACK_COOKIE, callbackCookieOptions());
    res.redirect(303, redirect.toString());
};
export const getChannels = endpoint((req) => listChannels(actor(req)));
export const getTeamsPreview = endpoint((req) =>
    teamsPreview(actor(req), String(req.params.issueId)),
);
const destination = z
    .object({
        teamId: z.string().uuid(),
        channelId: z.string().min(1).max(255),
    })
    .strict();
export const postTeamsSend = endpoint((req) =>
    sendTeams(
        actor(req),
        String(req.params.issueId),
        z
            .object({
                idempotencyKey: z.string().uuid(),
                destinations: z.array(destination).min(1).max(30),
            })
            .strict()
            .parse(req.body),
    ),
);
export const postDeliveryReview = endpoint((req) => {
    const input = z
        .object({ destinationId: z.string().uuid(), delivered: z.boolean() })
        .strict()
        .parse(req.body);
    return reviewDestination(
        actor(req),
        String(req.params.issueId),
        input.destinationId,
        input.delivered,
    );
});
