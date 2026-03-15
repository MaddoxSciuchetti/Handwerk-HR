import {
    clearTestEmails,
    deleteTestEmail,
    getTestEmails,
} from "@/controllers/test.controller";
import { Router } from "express";

const testRoutes = Router();

testRoutes.delete("/deleteTestUser", deleteTestEmail);
testRoutes.get("/emails", getTestEmails);
testRoutes.delete("/emails", clearTestEmails);

export default testRoutes;
