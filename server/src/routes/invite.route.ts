import {
    acceptInviteHandler,
    getInviteHandler,
} from "@/controllers/invite.controller";
import { Router } from "express";

const inviteRoutes = Router();

inviteRoutes.get("/:token", getInviteHandler);

inviteRoutes.post("/:token/accept", acceptInviteHandler);

export default inviteRoutes;
