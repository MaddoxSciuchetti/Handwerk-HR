import type { Request, Response } from "express-serve-static-core";
import { google } from "googleapis";
import { Readable } from "stream";
import z from "zod";

import {
    InsertWorkerHistorySchema,
    updateWorkerSchema,
} from "@/schemas/zod.controller";
import {
    addExtraFormFieldDB,
    insertWorker,
    insertWorkerFile,
    insertWorkerHistory,
    modifyWorker,
    queryWorkerById,
    queryWorkerData,
    queryWorkerFiles,
    queryWorkerHistory,
    removeWorker,
    removeWorkerFile,
    sendEmployeeEmail,
} from "@/services/on_off_boarding.auth";
import resolveOwner from "@/utils/resolverOwner";
import { generatePresignedUrl, uploadFileToS3 } from "../config/aws";
import { INTERNAL_SERVER_ERROR, OK } from "../constants/http";
export const createWorker = async (req: Request, res: Response) => {
    try {
        const request = {
            ...req.body.data,
        };

        const { worker } = await insertWorker(request);
        return res.status(201).json({ success: worker });
    } catch (error) {
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

export const getWorkerData = async (req: Request, res: Response) => {
    const { worker } = await queryWorkerData();
    return res.status(201).json(worker);
};

export const deleteWorker = async (req: Request, res: Response) => {
    const id = +req.params.id;

    const worker = await removeWorker(id);

    return res.status(204).json(worker);
};

// formfetch

export const getWorkerById = async (req: Request, res: Response) => {
    const id = +req.params.id;
    const param1 = req.query.param1;

    const worker = await queryWorkerById(id);
    if (!worker) {
        throw new Error("error occued");
    }

    const form = worker.employee_forms.find((f: any) => f.form_type === param1);

    if (!form) {
        return res
            .status(404)
            .json({ message: "Offboarding form is not found" });
    }

    const response = {
        worker: {
            id: worker.id,
            vorname: worker.vorname,
            nachname: worker.nachname,
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
                    officialOwner:
                        input.form_fields.auth_user.vorname +
                        " " +
                        input.form_fields.auth_user.nachname,
                    substituteOwner:
                        resolvedOwner.vorname + " " + resolvedOwner.nachname,
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

export const updateWorker = async (req: Request, res: Response) => {
    const request = updateWorkerSchema.parse(req.body);
    const modifyWorkerResponse = await modifyWorker(request);
    return res.status(200).json(modifyWorkerResponse);
};

export const historySchemaget = z.object({
    id: z.coerce.number(),
});

export const getWorkerHistory = async (req: Request, res: Response) => {
    const id = req.params.id;

    const parsedId = z.coerce.number().parse(id);

    const HistoryData = await queryWorkerHistory(parsedId);

    return res.status(200).json(HistoryData);
};

export const updateWorkerHistory = async (req: Request, res: Response) => {
    const data = InsertWorkerHistorySchema.parse(req.body);

    const result = await insertWorkerHistory(data);

    return res.status(200).json(result || []);
};

export const createWorkerFile = async (req: Request, res: Response) => {
    const id = req.params.id;
    const formId = Array.isArray(id) ? id[0] : id;

    const files = req.files as Express.Multer.File[];
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
            const savedfile = await insertWorkerFile(fileData);

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

export const getWorkerFiles = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const parsedId = z.coerce.number().parse(id);
        const files = await queryWorkerFiles(parsedId);

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

        const formData = await queryWorkerById(id);
        console.log("=== FORMDATA ====");
        console.log(formData);
        return res.status(200).send({ formData });
    } catch (error) {}
};

export const deleteWorkerFile = async (req: Request, res: Response) => {
    try {
        const id = +req.params.id;
        const response = removeWorkerFile(id);
        return res.status(200).json({ sucess: true });
    } catch (error) {
        console.log(error);
    }
};

export const sendReminder = async (req: Request, res: Response) => {
    try {
        const email = req.body.email;

        await sendEmployeeEmail(email);
        return res.status(OK).json({ success: true });
    } catch (error) {
        console.log(error);
        return res.status(INTERNAL_SERVER_ERROR).json({ success: false });
    }
};

export const getCloudUrl = async (req: Request, res: Response) => {
    const cloud_key = decodeURIComponent(req.query.cloud_key as string);
    const fullUrl = `https://your-bucket.s3.amazonaws.com/${cloud_key}`;
    const response = await fetch(fullUrl);
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
};

const getOAuthClient = () => {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_OAUTH_CLIENT_ID,
        process.env.GOOGLE_OAUTH_CLIENT_SECRET,
        process.env.GOOGLE_OAUTH_REDIRECT_URI,
    );

    oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
    });

    return oauth2Client;
};

export const postFeature = async (req: Request, res: Response) => {
    const { importance, text } = req.body;
    const files = req.files as Express.Multer.File[];
    const fileUrls: string[] = [];

    const auth = getOAuthClient();

    if (files?.length) {
        const drive = google.drive({ version: "v3", auth });

        for (const file of files) {
            const driveResponse = await drive.files.create({
                requestBody: {
                    name: file.originalname,
                    parents: ["1mQBgb6Xzh4vxHKBZ2n18tzyolgRAmqra"],
                },
                media: {
                    mimeType: file.mimetype,
                    body: Readable.from(file.buffer),
                },
                fields: "id",
            });
            fileUrls.push(
                `https://drive.google.com/file/d/${driveResponse.data.id}`,
            );
        }
    }

    const sheets = google.sheets({ version: "v4", auth });
    await sheets.spreadsheets.values.append({
        spreadsheetId: "1oUL_P3L20PIcktjeEFw7phMGu8Es27ioUnRMIjWoqXg",
        range: "Sheet1!A:C",
        valueInputOption: "RAW",
        requestBody: {
            values: [[importance, text, fileUrls.join(", ")]],
        },
    });

    res.json({ success: true });
};
