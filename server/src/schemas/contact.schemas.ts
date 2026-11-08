import { z } from "zod";

export const contactInquirySchema = z.object({
    email: z.string().trim().email().max(254),
    message: z.string().trim().min(1).max(5000),
    // Honeypot — bots fill this; humans never see it.
    companyWebsite: z.string().max(200).optional().default(""),
});

export type ContactInquiryInput = z.infer<typeof contactInquirySchema>;
