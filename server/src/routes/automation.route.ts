import { Router } from "express";
import {
    getDepartureMail,
    getMicrosoft365Automation,
    getWelcomeMail,
    postTaskAutomation,
    putDepartureMail,
    putWelcomeMail,
} from "@/controllers/automation.controller";

const automationRoutes = Router();

automationRoutes.get("/microsoft-365", getMicrosoft365Automation);
automationRoutes.get("/welcome-mail", getWelcomeMail);
automationRoutes.put("/welcome-mail", putWelcomeMail);
automationRoutes.get("/departure-mail", getDepartureMail);
automationRoutes.put("/departure-mail", putDepartureMail);
automationRoutes.post("/issues/:issueId/run", postTaskAutomation);

export { automationRoutes };
