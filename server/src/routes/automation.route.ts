import { Router } from "express";
import {
    getArbeitszeugnisPreview,
    prepareArbeitszeugnis,
    saveArbeitszeugnisValues,
    getAutomationDocument,
    getDepartureMail,
    getMicrosoft365Automation,
    getQuestionnaireTemplate,
    getWelcomeMail,
    postArbeitszeugnis,
    postTaskAutomation,
    putAutomationDocument,
    putDepartureMail,
    putQuestionnaireTemplate,
    putWelcomeMail,
} from "@/controllers/automation.controller";

const automationRoutes = Router();

automationRoutes.get("/microsoft-365", getMicrosoft365Automation);
automationRoutes.get("/questionnaire", getQuestionnaireTemplate);
automationRoutes.put("/questionnaire", putQuestionnaireTemplate);
automationRoutes.get("/welcome-mail", getWelcomeMail);
automationRoutes.put("/welcome-mail", putWelcomeMail);
automationRoutes.get("/departure-mail", getDepartureMail);
automationRoutes.put("/departure-mail", putDepartureMail);
automationRoutes.get("/documents/:automation", getAutomationDocument);
automationRoutes.put("/documents/:automation", putAutomationDocument);
automationRoutes.get(
    "/issues/:issueId/arbeitszeugnis",
    getArbeitszeugnisPreview,
);
automationRoutes.post(
    "/issues/:issueId/arbeitszeugnis/prepare-pdf",
    prepareArbeitszeugnis,
);
automationRoutes.put(
    "/issues/:issueId/arbeitszeugnis/draft",
    saveArbeitszeugnisValues,
);
automationRoutes.post("/issues/:issueId/arbeitszeugnis", postArbeitszeugnis);
automationRoutes.post("/issues/:issueId/run", postTaskAutomation);

export { automationRoutes };
