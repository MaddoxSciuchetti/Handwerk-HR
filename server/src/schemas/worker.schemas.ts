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

export const createWorkerTaskSchema = z.object({
    description: z.string().min(6),
    template_type: z.enum(["ONBOARDING", "OFFBOARDING"]),
    owner: z.string(),
});

export type InsertWorkerHistory = z.infer<typeof insertWorkerHistorySchema>;
export type CreateWorkerTask = z.infer<typeof createWorkerTaskSchema>;

export const deleteWorkersSchema = z.object({
    workerIds: z.array(z.string().trim().min(1).max(120)).min(1),
});
