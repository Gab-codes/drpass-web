import { z } from "zod";

export const questionFormSchema = z.object({
  year: z.number().int().min(1970).max(2100),
  subject: z.string().trim().min(1, "Subject is required"),
  text: z.string().trim().min(1, "Question text is required"),
  source: z.enum(["JAMB", "WAEC", "NECO", "GCE", "AI_GENERATED"]),
  questionType: z.enum([
    "SINGLE_CHOICE",
    "MULTIPLE_CHOICE",
    "TRUE_FALSE",
    "NUMERIC",
    "SHORT_ANSWER",
  ]),
  options: z
    .array(z.object({ key: z.string(), text: z.string().trim().min(1) }))
    .min(1),
  correctAnswer: z.union([z.string(), z.number(), z.array(z.string())]),
});

export type QuestionFormInput = z.input<typeof questionFormSchema>;
export type QuestionFormValues = z.output<typeof questionFormSchema>;