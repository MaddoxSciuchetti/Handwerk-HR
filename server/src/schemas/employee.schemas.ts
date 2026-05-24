import { AbsenceType } from "@prisma/client";
import { z } from "zod";

export const editAbsenceBodySchema = z
    .object({
        userId: z.string().min(1, "userId is required"),
        absenceType: z.enum(AbsenceType),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        substituteId: z.string().min(1).optional(),
    })
    .refine((data) => data.startDate <= data.endDate, {
        message: "startDate must be on or before endDate",
        path: ["startDate"],
    });

export type EditAbsenceBody = z.infer<typeof editAbsenceBodySchema>;
