import { Router } from "express";
import {
    login,
    logout,
    refresh,
    register,
    resetPassword,
    sendPassword,
    verifyEmail,
} from "../controllers/auth.controller";

const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.get("/refresh", refresh);
authRoutes.get("/logout", logout);
authRoutes.get("/email/verify/:code", verifyEmail);
authRoutes.post("/password/forgot", sendPassword);
authRoutes.post("/password/reset", resetPassword);

export default authRoutes;
