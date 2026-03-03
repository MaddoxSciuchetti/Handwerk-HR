import { OK } from "@/constants/http";
import {
    insertTemplateTask,
    modifyTemplateTask,
    queryTask,
    removeTemplateTask,
} from "@/services/template.service";

import catchErrors from "@/utils/catchErrors";
import { Request, Response } from "express";

export const deleteTemplateTask = catchErrors(async (req, res) => {
    const id = +req.params.id;

    const deletedData = await removeTemplateTask(id);

    return res.status(OK).json(deletedData);
});

export const getTask = catchErrors(async (req, res) => {
    const id = req.userId;

    const descriptionData = await queryTask();

    return res.status(OK).json(descriptionData);
});

export const createTemplateTask = async (req: Request, res: Response) => {
    try {
        const request = {
            ...req.body,
        };

        const newField = await insertTemplateTask(request);
        return res.status(201).json({ success: newField });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "internal error" });
    }
};

export const updateTemplateTask = catchErrors(async (req, res) => {
    const id = +req.params.id;

    const { form_field_id, owner, description, template_type } = req.body;

    const updatedDescription = await modifyTemplateTask(
        form_field_id,
        owner,
        description,
    );

    return res.status(OK).json(updatedDescription);
});
