import express from "express";
import * as questionnaireController from "../controllers/questionnaire.controller";

const questionnaireRoutes = express.Router();

questionnaireRoutes.get("/:token", questionnaireController.getQuestionnaire);
questionnaireRoutes.post("/:token", questionnaireController.submitQuestionnaire);

export { questionnaireRoutes };
