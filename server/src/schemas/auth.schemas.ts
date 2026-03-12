import z from "zod";
import { VALIDATION_MESSAGES } from "../constants/validationMessages";

export const emailSchema = z
    .string()
    .min(1, { message: VALIDATION_MESSAGES.required("Email") })
    .email({ message: VALIDATION_MESSAGES.invalidEmail })
    .max(255, { message: VALIDATION_MESSAGES.maxLength("Email", 255) });

const passwordSchema = z
    .string()
    .min(1, { message: VALIDATION_MESSAGES.required("Password") })
    .min(6, { message: VALIDATION_MESSAGES.minLength("Password", 6) })
    .max(255, { message: VALIDATION_MESSAGES.maxLength("Password", 255) });

const loginSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    userAgent: z.string().optional(),
});

export const registerSchema = loginSchema
    .extend({
        confirmPassword: z
            .string()
            .min(1, {
                message: VALIDATION_MESSAGES.required("Confirm password"),
            })
            .min(6, {
                message: VALIDATION_MESSAGES.minLength("Confirm password", 6),
            })
            .max(255, {
                message: VALIDATION_MESSAGES.maxLength("Confirm password", 255),
            }),
        firstName: z
            .string()
            .min(1, { message: VALIDATION_MESSAGES.required("First name") })
            .max(255, {
                message: VALIDATION_MESSAGES.maxLength("First name", 255),
            }),
        lastName: z
            .string()
            .min(1, { message: VALIDATION_MESSAGES.required("Last name") })
            .max(255, {
                message: VALIDATION_MESSAGES.maxLength("Last name", 255),
            }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: VALIDATION_MESSAGES.valuesMustMatch(
            "Password",
            "Confirm password",
        ),
        path: ["confirmPassword"],
    });

export const verificationCodeSchema = z
    .string()
    .min(1, { message: VALIDATION_MESSAGES.required("Verification code") })
    .max(25, {
        message: VALIDATION_MESSAGES.maxLength("Verification code", 25),
    });

export const resetPasswordSchema = z.object({
    password: passwordSchema,
    verificationCode: verificationCodeSchema,
});

export type LoginFormValues = Omit<z.infer<typeof loginSchema>, "userAgent">;
export type RegisterFormValues = Omit<
    z.infer<typeof registerSchema>,
    "userAgent"
>;

export { loginSchema };
