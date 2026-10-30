import { CLOTHING_PRINT_TYPES } from "../../../shared/clothing";
import { z } from "zod";

const nameSchema = z
    .string()
    .trim()
    .min(1, "Artikel fehlt.")
    .max(255, "Artikel ist zu lang.");

const sizeSchema = z.string().trim().max(32, "Größe ist zu lang.");

const printTypeSchema = z.enum(CLOTHING_PRINT_TYPES, {
    error: "Typ fehlt.",
});

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

const issuedAtSchema = z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Datum muss im Format JJJJ-MM-TT sein.")
    .refine((value) => {
        const date = new Date(`${value}T00:00:00Z`);
        return (
            Number.isFinite(date.getTime()) &&
            date.toISOString().slice(0, 10) === value
        );
    }, "Ungültiges Datum.");

export const createEngagementClothingSchema = z
    .object({
        stockItemId: z.string().trim().min(1).optional(),
        name: nameSchema.optional(),
        size: sizeSchema.optional(),
        printType: printTypeSchema.optional(),
        productUrl: productUrlSchema.optional(),
        quantity: quantitySchema,
        issuedAt: issuedAtSchema.optional(),
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
