import { Router } from "express";
import {
    createOrgChatMessage,
    fetchOrgChat,
} from "../controllers/orgChat.controller";

const orgChatRoutes = Router();

orgChatRoutes.get("/", fetchOrgChat);
orgChatRoutes.post("/", createOrgChatMessage);

export default orgChatRoutes;
