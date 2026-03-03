import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";

import cookieParser from "cookie-parser";
import { APP_ORIGIN } from "./constants/env";
import authenticate from "./middleware/authenticate";
import errorHandler from "./middleware/errorHandler";
import authRoutes from "./routes/auth.route";
import { employeeRoutes } from "./routes/employee.route";
import { indexRoutes } from "./routes/index.route";
import sessionRoutes from "./routes/session.route";
import { templateRoutes } from "./routes/template.route";
import { userRoutes } from "./routes/user.route";
import { worker } from "./routes/worker.route";

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = APP_ORIGIN.split(",").map((o) => o.trim());
console.log("TESTING TESTING");
console.log("Parsed origins:", allowedOrigins);

app.use(
    cors({
        origin: function (origin, callback) {
            // Allow undefined origins (like local tools or server-to-server requests)
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
                "✅ Final Access-Control-Allow-Origin:",
                headers["access-control-allow-origin"],
            );
        }
    });
    next();
});
// home page
app.get("/", (req, res) => {
    res.send("here");
});

// auth routes

app.use("/auth", authRoutes);
app.use("/sessions", authenticate, sessionRoutes);

// protected routes

app.use("/user", authenticate, userRoutes);
app.use("/template", authenticate, templateRoutes);
app.use("/employee", authenticate, employeeRoutes);

app.use("/index", authenticate, indexRoutes);

// worker
app.use("/worker", worker);

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`port running on ${PORT}`);
});
