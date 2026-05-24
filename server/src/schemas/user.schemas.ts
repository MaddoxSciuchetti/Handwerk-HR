import z from "zod";
import { VALIDATION_MESSAGES } from "@/constants/validationMessages";
import { emailSchema } from "./auth.schemas";

export const updateProfileInformationSchema = z.object({
    displayName: z
        .string()
        .trim()
        .min(2, { message: VALIDATION_MESSAGES.minLength("Display name", 2) })
        .max(255, {
            message: VALIDATION_MESSAGES.maxLength("Display name", 255),
        }),
    firstName: z
        .string()
        .trim()
        .min(2, { message: VALIDATION_MESSAGES.minLength("First name", 2) })
        .max(255, {
            message: VALIDATION_MESSAGES.maxLength("First name", 255),
        }),
    lastName: z
        .string()
        .trim()
        .min(2, { message: VALIDATION_MESSAGES.minLength("Last name", 2) })
        .max(255, {
            message: VALIDATION_MESSAGES.maxLength("Last name", 255),
        }),
    email: emailSchema,
});

export type UpdateProfileInformationInput = z.infer<
    typeof updateProfileInformationSchema
>;
