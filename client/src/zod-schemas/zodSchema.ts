import z from "zod";
import { DateSchema } from "./schema";

export const formValidation = z.object({
  type: z.literal("Onboarding"),
  vorname: z.string().min(1, "erforderlich"),
  nachname: z.string().min(1, "erforderlich"),
  email: z
    .string()
    .min(1, "erforderlich")
    .email("Ungültige email")
    .toLowerCase(),
  geburtsdatum: DateSchema,
  adresse: z.string().min(1, "erforderlich"),
  eintrittsdatum: DateSchema,
  position: z.string().min(1, "Position erforderlich"),
});

export const formValidation1 = z.object({
  type: z.literal("Offboarding"),
  vorname: z.string().min(1, "erforderlich"),
  nachname: z.string().min(1, "erforderlich"),
  email: z
    .string()
    .min(1, "erforderlich")
    .email("Ungültige email")
    .toLowerCase(),
  geburtsdatum: DateSchema.min(1, "erforderlich"),
  adresse: z.string().min(1, "erforderlich"),
  eintrittsdatum: DateSchema,
  position: z.string().min(1, "erforderlich"),
  austrittsdatum: z.string().min(1, "erforderlich"),
});

export const formSchema = z.discriminatedUnion("type", [
  formValidation,
  formValidation1,
]);

export type FormInputs = z.infer<typeof formSchema>;
