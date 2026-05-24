import { createInviteHandler } from "@/controllers/invite.controller";
import { listOrgEngagementsHandler } from "@/controllers/orgEngagement.controller";
import { Router } from "express";

const orgRoutes = Router();

orgRoutes.post("/invite", createInviteHandler);
orgRoutes.get("/engagements", listOrgEngagementsHandler);

export default orgRoutes;
