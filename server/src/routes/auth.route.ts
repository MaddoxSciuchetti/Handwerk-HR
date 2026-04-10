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

import * as AuthV2 from "../controllers/auth.controllerV2";
const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/v2/register", AuthV2.register);
authRoutes.post("/v2/register/org", AuthV2.registerOrg);
authRoutes.post("/login", login);
authRoutes.post("/v2/login", AuthV2.login);
authRoutes.get("/refresh", refresh);
authRoutes.get("/v2/refresh", AuthV2.refresh);
authRoutes.get("/logout", logout);
authRoutes.get("/v2/logout", AuthV2.logout);
authRoutes.get("/email/verify/:code", verifyEmail);
authRoutes.get("/v2/email/verify/:code", AuthV2.verifyEmail);
authRoutes.post("/password/forgot", sendPassword);
authRoutes.post("/v2/password/forgot", AuthV2.sendPassword);
authRoutes.post("/password/reset", resetPassword);
authRoutes.post("/v2/password/reset", AuthV2.resetPassword);

export default authRoutes;
