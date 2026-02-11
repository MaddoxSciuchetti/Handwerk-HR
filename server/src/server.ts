// import { createApp } from "./createApp.js";

import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import { offboarding_router } from "./routes/on_off_boarding.route";
import authRoutes from "./routes/auth.route";
import sessionRoutes from "./routes/session_route";
import authenticate from "./middleware/authenticate";
import { APP_ORIGIN } from "./constants/env";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.route";
import errorHandler from "./middleware/errorHandler";

dotenv.config();
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
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
