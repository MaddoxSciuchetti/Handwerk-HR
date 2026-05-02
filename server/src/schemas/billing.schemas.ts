import { z } from "zod";

export const createCheckoutSessionSchema = z.object({
    lookup_key: z.string().min(1),
});
