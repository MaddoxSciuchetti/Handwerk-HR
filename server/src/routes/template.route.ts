import {
    createTemplateTask,
    deleteTemplateTask,
    getTask,
    updateTemplateTask,
} from "@/controllers/template.controller";
import { checkChef } from "@/utils/checkChef";
import express from "express";

const templateRoutes = express.Router();

// prefix /template

templateRoutes.delete("/task/:id", checkChef, deleteTemplateTask);
templateRoutes.get("/getTask", checkChef, getTask);
templateRoutes.post("/createTask", createTemplateTask);
templateRoutes.put("/updateTask/:id", checkChef, updateTemplateTask);

export { templateRoutes };
