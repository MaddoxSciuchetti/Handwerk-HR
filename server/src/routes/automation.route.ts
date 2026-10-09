import { Router } from "express";
import {
    getMicrosoft365Automation,
    getWelcomeMail,
    postTaskAutomation,
    putWelcomeMail,
} from "@/controllers/automation.controller";

const automationRoutes = Router();

automationRoutes.get("/microsoft-365", getMicrosoft365Automation);
automationRoutes.get("/welcome-mail", getWelcomeMail);
automationRoutes.put("/welcome-mail", putWelcomeMail);
automationRoutes.post("/issues/:issueId/run", postTaskAutomation);

export { automationRoutes };
