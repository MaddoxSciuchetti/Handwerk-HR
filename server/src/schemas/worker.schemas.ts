import z from "zod";

export const updateWorkerSchema = z.object({
    id: z.coerce.number().int().positive(),
    editcomment: z.string(),
    select_option: z.string(),
});

export const userSchema = z.object({
    id: z.string(),
    email: z.string(),
    verified: z.boolean(),
});

export const insertWorkerHistorySchema = z.object({
    result: updateWorkerSchema,
    user: userSchema,
});

export type InsertWorkerHistory = z.infer<typeof insertWorkerHistorySchema>;
