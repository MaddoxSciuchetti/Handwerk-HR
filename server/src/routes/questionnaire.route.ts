import express from "express";
import { upload } from "../middleware/fileparser";
import * as questionnaireController from "../controllers/questionnaire.controller";

const questionnaireRoutes = express.Router();

questionnaireRoutes.get("/:token", questionnaireController.getQuestionnaire);
questionnaireRoutes.post(
    "/:token/file",
    upload.single("file"),
    questionnaireController.uploadQuestionnaireFile,
);
questionnaireRoutes.post("/:token", questionnaireController.submitQuestionnaire);

export { questionnaireRoutes };
