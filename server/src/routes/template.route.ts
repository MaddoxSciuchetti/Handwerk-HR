import express from "express";
import * as TemplateV2 from "../controllers/template.controller";

const templateRoutes = express.Router();

templateRoutes.delete("/task/:id", TemplateV2.deleteTemplateTask);

templateRoutes.delete("/:id", TemplateV2.deleteTemplate);
templateRoutes.post("/", TemplateV2.createTemplate);
templateRoutes.get("/", TemplateV2.getTemplates);
templateRoutes.get("/:id", TemplateV2.getTemplateById);
templateRoutes.put("/:id", TemplateV2.updateTemplate);

templateRoutes.post("/:templateId/task", TemplateV2.createTemplateTask);
templateRoutes.get("/:templateId/tasks", TemplateV2.getTemplateTasks);
templateRoutes.put("/task/:id", TemplateV2.updateTemplateTask);
templateRoutes.delete("/task/:id", TemplateV2.deleteTemplateTask);
export { templateRoutes };
