import { createInviteHandler } from "@/controllers/invite.controller";
import authenticate from "@/middleware/authenticate";
import { Router } from "express";

const orgRoutes = Router();

// POST /org/invite — send an invite to a new member (uses req.orgId from auth)
orgRoutes.post("/invite", authenticate, createInviteHandler);

export default orgRoutes;
