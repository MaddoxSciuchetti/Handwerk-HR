import { createInviteHandler } from "@/controllers/invite.controller";
import {
    createOrgStatusHandler,
    deleteOrgStatusHandler,
    listOrgStatusesHandler,
    updateOrgStatusHandler,
} from "@/controllers/orgStatus.controller";
import authenticate from "@/middleware/authenticate";
import { Router } from "express";

const orgRoutes = Router();

orgRoutes.use(authenticate);

orgRoutes.post("/invite", createInviteHandler);
orgRoutes.get("/statuses", listOrgStatusesHandler);
orgRoutes.post("/statuses", createOrgStatusHandler);
orgRoutes.patch("/statuses/:id", updateOrgStatusHandler);
orgRoutes.delete("/statuses/:id", deleteOrgStatusHandler);

export default orgRoutes;
