import dotenv from "dotenv";
dotenv.config();

import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import { APP_ORIGIN } from "./constants/env";
import { stripeWebhookHandler } from "./controllers/stripeWebhook.controller";
import authenticate from "./middleware/authenticate";
import errorHandler from "./middleware/errorHandler";
import requireSubscriptionAccess from "./middleware/requireSubscriptionAccess";
import authRoutes from "./routes/auth.route";
import billingRoutes from "./routes/billing.route";
import { employeeRoutes } from "./routes/employee.route";
import { indexRoutes } from "./routes/index.route";
import inviteRoutes from "./routes/invite.route";
import orgRoutes from "./routes/org.route";
import { taskRoutes } from "./routes/tasks.route";
import { templateRoutes } from "./routes/template.route";
import testRoutes from "./routes/test.route";
import { userRoutes } from "./routes/user.route";
import { worker } from "./routes/worker.route";

const PORT = process.env.PORT || 3000;

const app = express();

app.post(
    "/webhooks/stripe",
    express.raw({ type: "application/json" }),
    stripeWebhookHandler,
);

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = APP_ORIGIN.split(",").map((o) => o.trim());
console.log("TESTING TESTING");
console.log("Parsed origins:", allowedOrigins);

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
    }),
);

app.use((req, res, next) => {
    res.on("finish", () => {
        const headers = res.getHeaders();
        if (headers["access-control-allow-origin"]) {
            console.log(
                "Final Access-Control-Allow-Origin:",
                headers["access-control-allow-origin"],
            );
        }
    });
    next();
});
app.get("/", (req, res) => {
    res.send("here");
});


app.use("/test", testRoutes);


app.use("/auth", authRoutes);


app.use("/billing", authenticate, billingRoutes);

app.use("/user", authenticate, userRoutes);
app.use("/template", authenticate, requireSubscriptionAccess, templateRoutes);
app.use("/employee", authenticate, requireSubscriptionAccess, employeeRoutes);

app.use("/index", authenticate, requireSubscriptionAccess, indexRoutes);

app.use("/worker", authenticate, requireSubscriptionAccess, worker);

app.use("/tasks", authenticate, requireSubscriptionAccess, taskRoutes);

app.use("/org", authenticate, requireSubscriptionAccess, orgRoutes);
app.use("/invites", inviteRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`port running on ${PORT}`);
});
