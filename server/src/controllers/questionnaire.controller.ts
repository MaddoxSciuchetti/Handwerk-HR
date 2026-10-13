import {
    QUESTIONNAIRE_FIELDS,
    QUESTIONNAIRE_INTRO,
    questionnaireAnswerSchema,
    type QuestionnaireAnswers,
} from "@/services/questionnaireForm";
import * as questionnaireService from "@/services/questionnaire.service";
import catchErrors from "@/utils/catchErrors";
import { Request, Response } from "express";

const answerSchema = questionnaireAnswerSchema();

function param(req: Request, key: string): string {
    const val = req.params[key];
    return Array.isArray(val) ? val[0] : String(val);
}

export const getQuestionnaire = catchErrors(async (req: Request, res: Response) => {
    const questionnaire = await questionnaireService.getPublicQuestionnaire(
        param(req, "token"),
    );
    if (!questionnaire) {
        return res
            .status(404)
            .json({ success: false, message: "Formular nicht gefunden." });
    }
    return res.status(200).json({ success: true, data: questionnaire });
});

export const submitQuestionnaire = catchErrors(
    async (req: Request, res: Response) => {
        const answers = answerSchema.parse(req.body) as QuestionnaireAnswers;
        const result = await questionnaireService.submitPublicQuestionnaire(
            param(req, "token"),
            answers,
        );
        return res.status(200).json({
            success: true,
            data: { ...result, intro: QUESTIONNAIRE_INTRO, questions: QUESTIONNAIRE_FIELDS },
        });
    },
);
