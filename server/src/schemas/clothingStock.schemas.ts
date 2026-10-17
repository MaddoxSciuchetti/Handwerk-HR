import { z } from "zod";

const nameSchema = z
    .string()
    .trim()
    .min(1, "Artikel fehlt.")
    .max(255, "Artikel ist zu lang.");

const sizeSchema = z
    .string()
    .trim()
    .max(32, "Größe ist zu lang.");

const quantitySchema = z.coerce
    .number({ error: "Anzahl muss eine ganze Zahl ab 0 sein." })
    .int("Anzahl muss eine ganze Zahl ab 0 sein.")
    .min(0, "Anzahl muss eine ganze Zahl ab 0 sein.")
    .max(100000, "Anzahl ist zu hoch.");

export const clothingStockInputSchema = z.object({
    name: nameSchema,
    size: sizeSchema.default(""),
    quantity: quantitySchema,
});

export const clothingStockPatchSchema = z
    .object({
        name: nameSchema.optional(),
        size: sizeSchema.optional(),
        quantity: quantitySchema.optional(),
    })
    .refine(
        (value) =>
            value.name !== undefined ||
            value.size !== undefined ||
            value.quantity !== undefined,
        { message: "Keine Änderung angegeben." },
    );

export type ClothingStockInput = z.infer<typeof clothingStockInputSchema>;
export type ClothingStockPatch = z.infer<typeof clothingStockPatchSchema>;
