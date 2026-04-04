import {
    createTemplateTask,
    deleteTemplateTask,
    getTask,
    updateTemplateTask,
} from "@/controllers/template.controller";
import { checkChef } from "@/utils/checkChef";
import express from "express";
import * as TemplateV2 from "../controllers/template.controllerV2";

const templateRoutes = express.Router();

// prefix /template

templateRoutes.delete("/task/:id", TemplateV2.deleteTemplateTask);
templateRoutes.get("/getTask", checkChef, getTask);
templateRoutes.post("/createTask", createTemplateTask);
templateRoutes.put("/updateTask/:id", checkChef, updateTemplateTask);

templateRoutes.delete("/:id", TemplateV2.deleteTemplate);
templateRoutes.post("/", TemplateV2.createTemplate);
templateRoutes.get("/", TemplateV2.getTemplates);
templateRoutes.get("/:id", TemplateV2.getTemplateById);

templateRoutes.post("/:templateId/task", TemplateV2.createTemplateTask);
templateRoutes.get("/:templateId/tasks", TemplateV2.getTemplateTasks);
templateRoutes.put("/task/:id", TemplateV2.updateTemplateTask);

export { templateRoutes };
