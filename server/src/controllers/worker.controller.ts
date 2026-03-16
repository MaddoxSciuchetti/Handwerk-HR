import { generatePresignedUrl, uploadFileToS3 } from "@/config/aws";
import { CONFLICT } from "@/constants/http";
import { prisma } from "@/lib/prisma";
import {
    insertWorkerHistorySchema,
    updateWorkerSchema,
} from "@/schemas/worker.schemas";
import {
    archiveWorker,
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
    unarchiveWorker,
} from "@/services/worker.service";
import { notifyEmployeesAboutWorkerCreated } from "@/services/worker.notification.service";
import appAssert from "@/utils/appAssert";
import resolveOwner from "@/utils/resolverOwner";
import { Request, Response } from "express";
import z from "zod";

export const createWorker = async (req: Request, res: Response) => {
    const request = {
        ...req.body.data,
    };

    // verify existing worker does not exists
    const existingWorker = await prisma.users.findUnique({
        where: {
            email: request.email.toLocaleLowerCase(),
        },
    });

    appAssert(!existingWorker, CONFLICT, "Email wird bereits verwendet");

    const { worker } = await insertWorker(request);

    await notifyEmployeesAboutWorkerCreated({
        workerName: `${worker.vorname} ${worker.nachname}`,
        lifecycleType: request.type,
    });

    return res.status(201).json({ success: worker });
};

export const getWorkerData = async (req: Request, res: Response) => {
    const mode = req.query.mode === "archived" ? "archived" : "active";
    const { worker } = await queryWorkerData(mode);
    return res.status(201).json(worker);
};

export const archiveWorkerById = async (req: Request, res: Response) => {
    const id = +req.params.id;
    const archivedBy = req.userId;

    const worker = await archiveWorker(id, archivedBy);
    return res.status(200).json({ success: worker });
};

export const unarchiveWorkerById = async (req: Request, res: Response) => {
    const id = +req.params.id;

    const worker = await unarchiveWorker(id);
    return res.status(200).json({ success: worker });
};

export const deleteWorker = async (req: Request, res: Response) => {
    const id = +req.params.id;

    const worker = await removeWorker(id);

    return res.status(204).json(worker);
};

export const getWorkerById = async (req: Request, res: Response) => {
    const id = +req.params.id;
    const lifecycleType = req.query.lifecycleType;

    const worker = await queryWorkerById(id);
    if (!worker) {
        throw new Error("error occued");
    }

    const form = worker.employee_forms.find(
        (f: any) => f.form_type === lifecycleType,
    );

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

export const getWorkerHistory = async (req: Request, res: Response) => {
    const id = req.params.id;

    const parsedId = z.coerce.number().parse(id);

    const historyData = await queryWorkerHistory(parsedId);

    const historyWithPresignedUrls = await Promise.all(
        historyData.map(async (entry) => {
            if (!entry.auth_user?.cloud_url) return entry;

            const key = new URL(entry.auth_user.cloud_url).pathname.slice(1);
            return {
                ...entry,
                auth_user: {
                    ...entry.auth_user,
                    cloud_url: await generatePresignedUrl(key),
                },
            };
        }),
    );

    return res.status(200).json(historyWithPresignedUrls);
};

export const updateWorkerHistory = async (req: Request, res: Response) => {
    const data = insertWorkerHistorySchema.parse(req.body);

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
        return res.status(200).json(presignedUrl);
    } catch (error) {
        console.log(error);
    }
};

export const getCloudUrl = async (req: Request, res: Response) => {
    const cloud_key = decodeURIComponent(req.query.cloud_key as string);
    const fullUrl = `https://your-bucket.s3.amazonaws.com/${cloud_key}`;
    const response = await fetch(fullUrl);
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
};

export const deleteWorkerFile = async (req: Request, res: Response) => {
    try {
        const id = +req.params.id;
        await removeWorkerFile(id);
        return res.status(200).json({ sucess: true });
    } catch (error) {
        console.log(error);
        return res.status(404).json({ error: "File not found" });
    }
};
