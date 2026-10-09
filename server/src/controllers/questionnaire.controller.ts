import {
    QUESTIONNAIRE_FIELDS,
    type QuestionnaireAnswers,
} from "@/services/questionnaireForm";
import * as questionnaireService from "@/services/questionnaire.service";
import catchErrors from "@/utils/catchErrors";
import { Request, Response } from "express";
import z from "zod";

const answerSchema = z.object({
    firstName: z.string().trim().min(1).max(120),
    lastName: z.string().trim().min(1).max(120),
    street: z.string().trim().min(1).max(255),
    postalCode: z.string().trim().min(1).max(24),
    city: z.string().trim().min(1).max(120),
    birthday: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
    trouserSize: z.string().trim().min(1).max(32),
    tshirtSize: z.string().trim().min(1).max(32),
});

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
            data: { ...result, questions: QUESTIONNAIRE_FIELDS },
        });
    },
);
