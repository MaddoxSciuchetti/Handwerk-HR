import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import { offboarding_router } from "./routes/on_off_boarding.route";
import authRoutes from "./routes/auth.route";
import sessionRoutes from "./routes/session_route";
import authenticate from "./middleware/authenticate";
import { APP_ORIGIN } from "./constants/env";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.route";
import errorHandler from "./middleware/errorHandler";
import { checkChef } from "./utils/checkChef";

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = APP_ORIGIN.split(",").map((o) => o.trim());

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
// home page
app.get("/", (req, res) => {
    res.send("here");
});

// auth routes

app.use("/auth", authRoutes);
app.use("/sessions", authenticate, sessionRoutes);

// protected routes

app.use("/user", authenticate, userRoutes);

// worker
app.use("/offboarding", offboarding_router);

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`port running on ${PORT}`);
});
