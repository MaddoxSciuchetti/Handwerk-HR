import { z } from "zod";

export const orgStatusEntityTypeSchema = z.enum(["engagement", "issue"]);

export const createOrgStatusSchema = z.object({
    entityType: orgStatusEntityTypeSchema,
    name: z.string().min(1).max(120),
    color: z.string().max(32).optional().nullable(),
});

export const updateOrgStatusSchema = z.object({
    name: z.string().min(1).max(120).optional(),
    color: z.string().max(32).optional().nullable(),
});
