import { postAnniversaryReminders } from "./controllers/anniversaryReminders.controller";
import { postScheduledDeactivations } from "./controllers/scheduledDeactivations.controller";
import { requireCronSecret } from "./middleware/requireCronSecret";
import dotenv from "dotenv";
dotenv.config();

import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import { APP_ORIGIN, PORT } from "./constants/env";
import { resendInboundHandler } from "./controllers/resendInbound.controller";
import { stripeWebhookHandler } from "./controllers/stripeWebhook.controller";
import * as Sentry from "@sentry/node";
import { accessLogMiddleware } from "./middleware/accessLog.middleware";
import authenticate from "./middleware/authenticate";
import errorHandler from "./middleware/errorHandler";
import {
    authLimiter,
    globalLimiter,
} from "./middleware/rateLimit.middleware";
import { requestIdMiddleware } from "./middleware/requestId.middleware";
import { sentryContextMiddleware } from "./middleware/sentryContext.middleware";
import requireSubscriptionAccess from "./middleware/requireSubscriptionAccess";
import { isSentryEnabled } from "./instrument";
import { logger } from "./observability/logger";
import { automationRoutes } from "./routes/automation.route";
import authRoutes from "./routes/auth.route";
import billingRoutes from "./routes/billing.route";
import { employeeRoutes } from "./routes/employee.route";
import { indexRoutes } from "./routes/index.route";
import contactRoutes from "./routes/contact.route";
import inviteRoutes from "./routes/invite.route";
import orgRoutes from "./routes/org.route";
import { questionnaireRoutes } from "./routes/questionnaire.route";
import { taskRoutes } from "./routes/tasks.route";
import { documentMasterRoutes } from "./routes/documentMaster.route";
import { getDocumentFont } from "./controllers/documentMaster.controller";
import { templateRoutes } from "./routes/template.route";
import testRoutes from "./routes/test.route";
import { userRoutes } from "./routes/user.route";
import { clothingStockRoutes } from "./routes/clothingStock.route";
import { worker } from "./routes/worker.route";
import { startReturnedContractPolling } from "./services/signedContractReturn.service";

const app = express();

// Render (and local proxies) terminate TLS; need the real client IP for rate limits.
app.set("trust proxy", 1);

app.use(requestIdMiddleware);
app.use(sentryContextMiddleware);
app.use(accessLogMiddleware);

app.post(
    "/webhooks/resend",
    express.raw({ type: "application/json" }),
    resendInboundHandler,
);

app.use(express.json({ limit: "8mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = APP_ORIGIN.split(",").map((o) => o.trim());

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            } else {
                return callback(
                    new Error(`CORS blocked for origin: ${origin}`),
                );
            }
        },
        credentials: true,
        exposedHeaders: ["X-Prepared-Pdf", "X-Request-Id"],
    }),
);

app.post(
    "/webhooks/stripe",
    express.raw({ type: "application/json" }),
    stripeWebhookHandler,
);

app.use(globalLimiter);

app.get("/", (req, res) => {
    res.send("here");
});

app.post("/internal/cron/scheduled-deactivations", requireCronSecret, postScheduledDeactivations);
app.post("/internal/cron/anniversary-reminders", requireCronSecret, postAnniversaryReminders);

app.use("/test", testRoutes);

app.use("/auth", authLimiter, authRoutes);
app.get("/document-fonts/:filename", getDocumentFont);
app.use(
    "/automation",
    authenticate,
    requireSubscriptionAccess,
    automationRoutes,
);

app.use("/billing", authenticate, billingRoutes);

app.use("/user", authenticate, userRoutes);
app.use("/template", authenticate, requireSubscriptionAccess, templateRoutes);
app.use(
    "/document-masters",
    authenticate,
    requireSubscriptionAccess,
    documentMasterRoutes,
);
app.use("/employee", authenticate, requireSubscriptionAccess, employeeRoutes);

app.use("/index", authenticate, requireSubscriptionAccess, indexRoutes);

app.use("/worker", authenticate, requireSubscriptionAccess, worker);
app.use(
    "/clothing-stock",
    authenticate,
    requireSubscriptionAccess,
    clothingStockRoutes,
);

app.use("/tasks", authenticate, requireSubscriptionAccess, taskRoutes);

app.use("/org", authenticate, requireSubscriptionAccess, orgRoutes);
app.use("/invites", inviteRoutes);
app.use("/fragebogen", questionnaireRoutes);
app.use("/contact", contactRoutes);

// After routes, before our JSON error formatter — links exceptions to the active transaction.
if (isSentryEnabled) {
    Sentry.setupExpressErrorHandler(app);
}

app.use(errorHandler);

app.listen(PORT, () => {
    logger.info("HTTP server listening", {
        event: "server.listen",
        outcome: "ok",
        port: Number(PORT),
    });
    startReturnedContractPolling();
});
