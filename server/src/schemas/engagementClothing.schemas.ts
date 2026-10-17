import { z } from "zod";

const nameSchema = z
    .string()
    .trim()
    .min(1, "Artikel fehlt.")
    .max(255, "Artikel ist zu lang.");

const sizeSchema = z.string().trim().max(32, "Größe ist zu lang.");

const quantitySchema = z.coerce
    .number({ error: "Anzahl muss eine ganze Zahl ab 1 sein." })
    .int("Anzahl muss eine ganze Zahl ab 1 sein.")
    .min(1, "Anzahl muss eine ganze Zahl ab 1 sein.")
    .max(100000, "Anzahl ist zu hoch.");

const productUrlSchema = z
    .string()
    .trim()
    .max(2048, "Link ist zu lang.")
    .refine(
        (value) => value.length === 0 || /^https?:\/\/\S+$/i.test(value),
        "Link muss mit http:// oder https:// beginnen.",
    );

export const createEngagementClothingSchema = z
    .object({
        stockItemId: z.string().trim().min(1).optional(),
        name: nameSchema.optional(),
        size: sizeSchema.optional(),
        productUrl: productUrlSchema.optional(),
        quantity: quantitySchema,
    })
    .superRefine((value, ctx) => {
        if (!value.stockItemId && !value.name) {
            ctx.addIssue({
                code: "custom",
                path: ["name"],
                message: "Artikel fehlt.",
            });
        }
    });

export const returnEngagementClothingSchema = z.object({
    quantity: quantitySchema.optional(),
});

export type CreateEngagementClothingInput = z.infer<
    typeof createEngagementClothingSchema
>;
export type ReturnEngagementClothingInput = z.infer<
    typeof returnEngagementClothingSchema
>;
