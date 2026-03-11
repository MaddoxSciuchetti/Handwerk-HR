import { deleteTestEmail } from "@/controllers/test.controller";
import { Router } from "express";

const testRoutes = Router();

testRoutes.post("/cleanupEmail", deleteTestEmail);

export default testRoutes;
