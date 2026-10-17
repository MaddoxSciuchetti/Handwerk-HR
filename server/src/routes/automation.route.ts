import { Router } from "express";
import {
    getArbeitszeugnisPreview,
    prepareArbeitszeugnis,
    saveArbeitszeugnisValues,
    getAutomationDocument,
    getDepartureMail,
    getIntegrations,
    getMicrosoft365Automation,
    postIssueSequence,
    putIntegration,
    getQuestionnaireTemplate,
    getWelcomeMail,
    postArbeitszeugnis,
    postTaskAutomation,
    putAutomationDocument,
    putDepartureMail,
    putQuestionnaireTemplate,
    putWelcomeMail,
} from "@/controllers/automation.controller";
import {
    getMailTemplate,
    getMailTemplates,
    postMailTemplate,
    putMailTemplateContent,
    putMailTemplateDetails,
    removeMailTemplate,
} from "@/controllers/mailTemplate.controller";

const automationRoutes = Router();

automationRoutes.get("/microsoft-365", getMicrosoft365Automation);
automationRoutes.get("/integrations", getIntegrations);
automationRoutes.put("/integrations/:provider", putIntegration);
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
automationRoutes.post("/issues/:issueId/sequence", postIssueSequence);
automationRoutes.get("/mail-templates", getMailTemplates);
automationRoutes.post("/mail-templates", postMailTemplate);
automationRoutes.get("/mail-templates/:id", getMailTemplate);
automationRoutes.put("/mail-templates/:id/details", putMailTemplateDetails);
automationRoutes.put("/mail-templates/:id", putMailTemplateContent);
automationRoutes.delete("/mail-templates/:id", removeMailTemplate);

export { automationRoutes };
