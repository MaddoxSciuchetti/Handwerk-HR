import z from "zod";
import { VALIDATION_MESSAGES } from "../constants/validationMessages";

export const createInviteSchema = z.object({
    email: z
        .string()
        .min(1, { message: VALIDATION_MESSAGES.required("Email") })
        .email({ message: VALIDATION_MESSAGES.invalidEmail })
        .max(255),
    invitedMembershipRole: z.enum(["admin", "worker"]).optional(),
});

export const acceptInviteSchema = z
    .object({
        displayName: z
            .string()
            .min(1, { message: VALIDATION_MESSAGES.required("Display name") })
            .max(255),
        firstName: z
            .string()
            .min(1, { message: VALIDATION_MESSAGES.required("First name") })
            .max(255),
        lastName: z
            .string()
            .min(1, { message: VALIDATION_MESSAGES.required("Last name") })
            .max(255),
        password: z
            .string()
            .min(6, { message: VALIDATION_MESSAGES.minLength("Password", 6) })
            .max(255),
        confirmPassword: z
            .string()
            .min(1, {
                message: VALIDATION_MESSAGES.required("Confirm password"),
            })
            .max(255),
        userAgent: z.string().optional(),
        ipAddress: z.string().optional(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: VALIDATION_MESSAGES.valuesMustMatch(
            "Password",
            "Confirm password",
        ),
        path: ["confirmPassword"],
    });

export type CreateInviteInput = z.infer<typeof createInviteSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
