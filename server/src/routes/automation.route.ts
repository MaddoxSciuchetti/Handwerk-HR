import { Router } from "express";
import { getMicrosoft365Automation } from "@/controllers/automation.controller";

const automationRoutes = Router();

automationRoutes.get("/microsoft-365", getMicrosoft365Automation);

export { automationRoutes };
