import { Router } from "express";

import * as AuthV2 from "../controllers/auth.controller";
const authRoutes = Router();

authRoutes.post("/v2/register", AuthV2.register);
authRoutes.post("/v2/register/org", AuthV2.registerOrg);
authRoutes.post("/v2/login", AuthV2.login);
authRoutes.get("/v2/refresh", AuthV2.refresh);
authRoutes.get("/v2/logout", AuthV2.logout);
authRoutes.get("/v2/email/verify/:code", AuthV2.verifyEmail);
authRoutes.post("/v2/password/forgot", AuthV2.sendPassword);
authRoutes.post("/v2/password/reset", AuthV2.resetPassword);

export default authRoutes;
