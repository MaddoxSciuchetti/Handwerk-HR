import * as engagementMaterialService from "@/services/engagementMaterial.service";
import catchErrors from "@/utils/catchErrors";
import { Request, Response } from "express";

function param(req: Request, key: string): string {
    const val = req.params[key];
    return Array.isArray(val) ? val[0] : String(val);
}

function scope(req: Request) {
    return {
        organizationId: req.orgId,
        workerId: param(req, "workerId"),
        engagementId: param(req, "engagementId"),
    };
}

export const listEngagementMaterials = catchErrors(
    async (req: Request, res: Response) => {
        const data = await engagementMaterialService.listEngagementMaterials(
            scope(req),
        );
        return res.status(200).json({ success: true, data });
    },
);

export const uploadEngagementMaterial = catchErrors(
    async (req: Request, res: Response) => {
        const file = req.file;
        if (!file) {
            return res
                .status(400)
                .json({ success: false, message: "Datei fehlt." });
        }

        const data = await engagementMaterialService.uploadEngagementMaterial({
            ...scope(req),
            file,
        });
        return res.status(201).json({ success: true, data });
    },
);

export const updateEngagementMaterial = catchErrors(
    async (req: Request, res: Response) => {
        const data = await engagementMaterialService.updateEngagementMaterial({
            ...scope(req),
            materialId: param(req, "materialId"),
            body: req.body ?? {},
        });
        return res.status(200).json({ success: true, data });
    },
);

export const deleteEngagementMaterial = catchErrors(
    async (req: Request, res: Response) => {
        await engagementMaterialService.deleteEngagementMaterial({
            ...scope(req),
            materialId: param(req, "materialId"),
        });
        return res.status(200).json({ success: true });
    },
);
