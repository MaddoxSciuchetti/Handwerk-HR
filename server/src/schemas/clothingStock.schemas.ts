import {
    CLOTHING_PRINT_TYPES,
    CLOTHING_SIZES,
} from "../../../shared/clothing";
import { z } from "zod";

const nameSchema = z
    .string()
    .trim()
    .min(1, "Beschreibung fehlt.")
    .max(255, "Beschreibung ist zu lang.");

const sizeSchema = z
    .string()
    .trim()
    .refine(
        (value) =>
            value.length === 0 ||
            (CLOTHING_SIZES as readonly string[]).includes(value),
        "Größe ist ungültig.",
    );

const printTypeSchema = z.enum(CLOTHING_PRINT_TYPES, {
    error: "Typ fehlt.",
});

const quantitySchema = z.coerce
    .number({ error: "Anzahl muss eine ganze Zahl ab 0 sein." })
    .int("Anzahl muss eine ganze Zahl ab 0 sein.")
    .min(0, "Anzahl muss eine ganze Zahl ab 0 sein.")
    .max(100000, "Anzahl ist zu hoch.");

export const clothingStockInputSchema = z.object({
    name: nameSchema,
    size: sizeSchema.default(""),
    printType: printTypeSchema,
    quantity: quantitySchema,
});

export const clothingStockPatchSchema = z
    .object({
        name: nameSchema.optional(),
        size: sizeSchema.optional(),
        printType: printTypeSchema.optional(),
        quantity: quantitySchema.optional(),
    })
    .refine(
        (value) =>
            value.name !== undefined ||
            value.size !== undefined ||
            value.printType !== undefined ||
            value.quantity !== undefined,
        { message: "Keine Änderung angegeben." },
    );

export type ClothingStockInput = z.infer<typeof clothingStockInputSchema>;
export type ClothingStockPatch = z.infer<typeof clothingStockPatchSchema>;
