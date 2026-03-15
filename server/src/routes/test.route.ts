import {
    clearTestEmails,
    deleteTestEmail,
    deleteTestTask,
    deleteTestWorker,
    getTestEmails,
} from "@/controllers/test.controller";
import { Router } from "express";

const testRoutes = Router();

testRoutes.delete("/deleteTestUser", deleteTestEmail);
testRoutes.delete("/deleteTestWorker", deleteTestWorker);
testRoutes.get("/emails", getTestEmails);
testRoutes.delete("/emails", clearTestEmails);
testRoutes.delete("/deleteTestTask", deleteTestTask);

export default testRoutes;
