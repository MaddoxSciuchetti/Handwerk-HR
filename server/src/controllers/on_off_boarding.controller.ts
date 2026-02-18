import type { Request, Response } from "express-serve-static-core";
import z from "zod";

import { generatePresignedUrl, uploadFileToS3 } from "../config/aws";
import PDFDocument from "pdfkit";
import { OK } from "../constants/http";
import { emailSchema } from "./auth.Schemas";
import {
    addExtraFormFieldDB,
    createUser,
    deleteFiles,
    deleteUser,
    editdata,
    fetchFileData,
    fetchUser,
    getHistoryData,
    getUserFormData,
    insertFileData,
    insertHistoryData,
    sendEmployeeEmail,
} from "@/services/on_off_boarding.auth";
import resolveOwner from "@/utils/resolverOwner";
export const postOffboardingData = async (req: Request, res: Response) => {
    // validate the request
    try {
        const request = {
            ...req.body.data,
        };

        // business logic

        const { user } = await createUser(request);
        return res.status(201).json({ success: user });
    } catch (error) {
        // return the response
        console.log(error);
        return res.status(500).json({ error: "internal error" });
    }
};

export const addExtraField = async (req: Request, res: Response) => {
    try {
        const request = {
            ...req.body,
        };

        const newField = await addExtraFormFieldDB(request);
        return res.status(201).json({ success: newField });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "internal error" });
    }
};

export const fetchOffboardingData = async (req: Request, res: Response) => {
    const request = {
        ...req.body,
    };
    const { user_information } = await fetchUser();
    return res.status(201).json(user_information);
};

export const offboardingDeletebyId = async (req: Request, res: Response) => {
    const id = +req.params.id;

    const delete_user = await deleteUser(id);

    return res.status(204).json(delete_user);
};

// formfetch

export const offboardingGetuserbyId = async (req: Request, res: Response) => {
    const id = +req.params.id;
    const param1 = req.query.param1;

    const user = await getUserFormData(id);
    if (!user) {
        throw new Error("error occued");
    }

    const form = user.employee_forms.find((f: any) => f.form_type === param1);

    if (!form) {
        return res
            .status(404)
            .json({ message: "Offboarding form is not found" });
    }

    const response = {
        user: {
            id: user.id,
            vorname: user.vorname,
            nachname: user.nachname,
        },
        form: {
            id: form.id,
            type: form.form_type,
            fields: form.form_inputs.map((input) => {
                const resolvedOwner = resolveOwner(input.form_fields.auth_user);
                return {
                    id: input.id,
                    form_field_id: input.form_field_id,
                    description: input.form_fields.description,
                    owner: resolvedOwner.vorname + " " + resolvedOwner.nachname,
                    owner_id: resolvedOwner.id,
                    is_substitute: resolvedOwner.isSubstitute,
                    status: input.status,
                    edit: input.edit,
                };
            }),
        },
    };

    return res.status(200).json(response);
};

const requestschema = z.object({
    id: z.coerce.number().int().positive(),
    editcomment: z.string(),
    select_option: z.string(),
});

export const offboardingEditdata = async (req: Request, res: Response) => {
    // validate request

    const request = requestschema.parse(req.body);

    // business log

    const editresponse = await editdata(request);

    return res.status(200).json(editresponse);
};

export const historySchemaget = z.object({
    id: z.coerce.number(),
});

export const historySchema = z.object({
    result: z.object({
        id: z.coerce.number(),
        editcomment: z.string(),
        select_option: z.string(),
    }),
    user: z.object({
        id: z.string(),
        email: z.string(),
        verified: z.boolean(),
    }),
});

export type HistorySchemaType = z.infer<typeof historySchema>;

export const gethistoryData = async (req: Request, res: Response) => {
    const id = req.params.id;

    const parsedId = z.coerce.number().parse(id);

    const HistoryData = await getHistoryData(parsedId);

    return res.status(200).json(HistoryData);
};

export const postHistoryData = async (req: Request, res: Response) => {
    const result = historySchema.parse(req.body);

    const HistoryData = await insertHistoryData(result);

    return res.status(200).json(HistoryData || []);
};

export const postFileData = async (req: Request, res: Response) => {
    console.log("=== Express ===");
    console.log("this is the body of EXpress", req.body);
    const id = req.params.id;
    const formId = Array.isArray(id) ? id[0] : id;

    const files = req.files as Express.Multer.File[];
    console.log("Received file", files?.length);
    console.log(files);

    if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploded" });
    }
    const uploadFiles: Array<any> = [];
    for (const file of files) {
        const uploadResult = await uploadFileToS3(file, formId);

        if (uploadResult.success && uploadResult.key && uploadResult.url) {
            const fileData = {
                userId: parseInt(formId),
                original_filename: file.originalname,
                file_size: file.size,
                content_type: file.mimetype,
                cloud_url: uploadResult.url,
                cloud_key: uploadResult.key,
            };
            console.log("=== FileData ===");
            console.log(fileData);
            const savedfile = await insertFileData(fileData);

            const sanitizedFile = {
                ...savedfile,
                id: savedfile.id.toString(),
                employee_form_id: Number(savedfile.employee_form_id),
                file_size: Number(savedfile.file_size),
            };
            uploadFiles.push(sanitizedFile);
        }
    }

    res.json({
        success: true,
        files: uploadFiles,
        count: uploadFiles.length,
    });
};

export const getFileData = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const parsedId = z.coerce.number().parse(id);
        const files = await fetchFileData(parsedId);

        const presignedUrl = await Promise.all(
            files.map(async (file) => ({
                ...file,
                id: file.id.toString(),
                employee_form_id: file.employee_form_id.toString(),
                cloud_url: await generatePresignedUrl(file.cloud_key),
            })),
        );
        console.log("THESE ARE THE FILES");
        console.log(files);
        return res.status(200).json(presignedUrl);
    } catch (error) {
        console.log(error);
    }
};

export const getProcessData = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;

        const formData = await getUserFormData(id);
        console.log("=== FORMDATA ====");
        console.log(formData);
        return res.status(200).send({ formData });
    } catch (error) {}
};

export const deleteFileData = async (req: Request, res: Response) => {
    try {
        const id = +req.params.id;
        console.log(id);
        const response = deleteFiles(id);

        return res.status(200).json({ sucess: true });
    } catch (error) {
        console.log(error);
    }
};

export const sendReminder = async (req: Request, res: Response) => {
    try {
        console.log(req.body);
        console.log(req.body.email);
        const email = req.body.email;

        await sendEmployeeEmail(email);
        return res.status(OK).json({ sucess: "the email has been sent" });
    } catch (error) {
        console.log(error);
    }
};
