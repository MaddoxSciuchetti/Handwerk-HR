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
    .max(40, {
        message: VALIDATION_MESSAGES.maxLength("Verification code", 40),
    });

export const resetPasswordSchema = z.object({
    password: passwordSchema,
    verificationCode: verificationCodeSchema,
});

export const registerOrgSchema = registerSchema
    .extend({
        orgName: z
            .string()
            .min(1, { message: VALIDATION_MESSAGES.required("Company name") })
            .max(255, {
                message: VALIDATION_MESSAGES.maxLength("Company name", 255),
            }),
        orgDescription: z.string().max(1000).optional(),
        orgEmail: z
            .string()
            .email({ message: VALIDATION_MESSAGES.invalidEmail })
            .max(255)
            .optional()
            .or(z.literal("")),
        orgPhoneNumber: z.string().max(50).optional(),
        orgWebsiteUrl: z
            .string()
            .url({ message: "Must be a valid URL" })
            .optional()
            .or(z.literal("")),
        orgCountry: z.string().max(100).optional(),
        orgIndustry: z.string().max(100).optional(),
        orgSize: z
            .enum(["1-10", "11-50", "51-200", "201-500", "500+"])
            .optional(),
        ipAddress: z.string().optional(),
    });

export type RegisterOrgInput = z.infer<typeof registerOrgSchema>;

export type LoginFormValues = Omit<z.infer<typeof loginSchema>, "userAgent">;
export type RegisterFormValues = Omit<
    z.infer<typeof registerSchema>,
    "userAgent"
>;

export { loginSchema };
