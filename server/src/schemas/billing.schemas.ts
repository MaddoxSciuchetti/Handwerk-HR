import { z } from "zod";

export const createCheckoutSessionSchema = z.object({
    price: z.string().min(1),
});
