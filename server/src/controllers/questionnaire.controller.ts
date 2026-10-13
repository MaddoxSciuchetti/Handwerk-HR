import * as questionnaireService from "@/services/questionnaire.service";
import catchErrors from "@/utils/catchErrors";
import { Request, Response } from "express";

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
        const result = await questionnaireService.submitPublicQuestionnaire(
            param(req, "token"),
            req.body,
        );
        return res.status(200).json({
            success: true,
            data: result,
        });
    },
);
