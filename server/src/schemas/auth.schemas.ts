import z from "zod";

export const emailSchema = z
    .string()
    .min(1, { message: "Please enter your email address." })
    .email({ message: "Please enter a valid email address." })
    .max(255, { message: "Email must be 255 characters or fewer." });

const passwordSchema = z
    .string()
    .min(1, { message: "Please enter your password." })
    .min(6, { message: "Password must be at least 6 characters long." })
    .max(255, { message: "Password must be 255 characters or fewer." });

const loginSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    userAgent: z.string().optional(),
});

export const registerSchema = loginSchema
    .extend({
        confirmPassword: z
            .string()
            .min(1, { message: "Please confirm your password." })
            .min(6, {
                message: "Confirm password must be at least 6 characters long.",
            })
            .max(255, {
                message: "Confirm password must be 255 characters or fewer.",
            }),
        firstName: z
            .string()
            .min(1, { message: "Please enter your first name." })
            .max(255, {
                message: "First name must be 255 characters or fewer.",
            }),
        lastName: z
            .string()
            .min(1, { message: "Please enter your last name." })
            .max(255, {
                message: "Last name must be 255 characters or fewer.",
            }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match. Please check both fields.",
        path: ["confirmPassword"],
    });

export const verificationCodeSchema = z
    .string()
    .min(1, { message: "Verification code is required." })
    .max(25, { message: "Verification code must be 25 characters or fewer." });

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
