import { Request, Response } from "express";
import { getEngagementContract } from "@/services/employmentContract.service";
import { generateDocumentPdf } from "@/services/documentPdf";
import catchErrors from "@/utils/catchErrors";
import AppError from "@/utils/AppError";
import { CONFLICT, NOT_FOUND } from "@/constants/http";

export const printEmploymentContract = catchErrors(async (req: Request, res: Response) => {
    const contract = await getEngagementContract({
        organizationId: req.orgId,
        workerId: String(req.params.workerId),
        engagementId: String(req.params.engagementId),
    });
    if (!contract) throw new AppError(NOT_FOUND, "Vertrag nicht gefunden.");
    if (contract.sentAt || contract.status === "signed") {
        throw new AppError(CONFLICT, "Bitte drucken Sie das gespeicherte Vertrags-PDF.");
    }
    // Render the saved draft without preparing, storing or updating it.
    const pdf = await generateDocumentPdf(contract.document, contract.values);
    res.setHeader("Content-Disposition", 'inline; filename="Arbeitsvertrag.pdf"');
    res.setHeader("Cache-Control", "no-store");
    return res.type("application/pdf").send(pdf.bytes);
});
