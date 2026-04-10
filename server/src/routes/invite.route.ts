import {
    acceptInviteHandler,
    getInviteHandler,
} from "@/controllers/invite.controller";
import { Router } from "express";

const inviteRoutes = Router();

// GET  /invites/:token — validate token, return org name + email (public)
inviteRoutes.get("/:token", getInviteHandler);

// POST /invites/:token/accept — create account + join org (public)
inviteRoutes.post("/:token/accept", acceptInviteHandler);

export default inviteRoutes;
