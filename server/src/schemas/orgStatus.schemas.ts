import { z } from "zod";

export const createOrgStatusSchema = z.object({
    name: z.string().min(1).max(120),
});

export const updateOrgStatusSchema = z.object({
    name: z.string().min(1).max(120).optional(),
});
