import { z } from "zod";

export const orgStatusEntityTypeSchema = z.enum(["engagement", "issue"]);

export const createOrgStatusSchema = z.object({
    entityType: orgStatusEntityTypeSchema,
    name: z.string().min(1).max(120),
});

export const updateOrgStatusSchema = z.object({
    name: z.string().min(1).max(120).optional(),
});
