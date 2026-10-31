import { getDeactivationSchedule, patchDeactivationSchedule } from "@/controllers/scheduledDeactivations.controller";
import { Router } from "express";
import {
    getArbeitszeugnisPreview,
    prepareArbeitszeugnis,
    saveArbeitszeugnisValues,
    getAutomationDocument,
    getDepartureMail,
    getIntegrations,
    getMicrosoft365Automation,
    getMicrosoft365Licenses,
    postMicrosoftLicensePing,
    getEngagementMailRecipients,
    getIssueMailPreview,
    getMicrosoftMailAddresses,
    postIssueSequence,
    putEngagementMailRecipients,
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

import { getConnection, deleteConnection, postConnection, getChannels, getTeamsPreview, postTeamsSend, postDeliveryReview } from "@/controllers/microsoftTeams.controller";
const automationRoutes = Router();
automationRoutes.get("/microsoft-teams/connection", getConnection);
automationRoutes.post("/microsoft-teams/connection", postConnection);
automationRoutes.delete("/microsoft-teams/connection", deleteConnection);
automationRoutes.get("/microsoft-teams/channels", getChannels);
automationRoutes.get("/issues/:issueId/teams-preview", getTeamsPreview);
automationRoutes.post("/issues/:issueId/teams-send", postTeamsSend);
automationRoutes.post("/issues/:issueId/teams-review", postDeliveryReview);


automationRoutes.get("/microsoft-365", getMicrosoft365Automation);
automationRoutes.get("/microsoft-365/licenses", getMicrosoft365Licenses);
automationRoutes.post("/engagements/:engagementId/microsoft-license-ping", postMicrosoftLicensePing);
automationRoutes.get("/microsoft-addresses", getMicrosoftMailAddresses);
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
automationRoutes.get("/issues/:issueId/deactivation-schedule", getDeactivationSchedule);
automationRoutes.patch("/issues/:issueId/deactivation-schedule", patchDeactivationSchedule);
automationRoutes.get("/issues/:issueId/mail-preview", getIssueMailPreview);
automationRoutes.get(
    "/engagements/:engagementId/mail-recipients",
    getEngagementMailRecipients,
);
automationRoutes.put(
    "/engagements/:engagementId/mail-recipients",
    putEngagementMailRecipients,
);
automationRoutes.get("/mail-templates", getMailTemplates);
automationRoutes.post("/mail-templates", postMailTemplate);
automationRoutes.get("/mail-templates/:id", getMailTemplate);
automationRoutes.put("/mail-templates/:id/details", putMailTemplateDetails);
automationRoutes.put("/mail-templates/:id", putMailTemplateContent);
automationRoutes.delete("/mail-templates/:id", removeMailTemplate);

export { automationRoutes };
