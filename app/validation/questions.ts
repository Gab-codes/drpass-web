import { z } from "zod";

export const questionFormSchema = z.object({
  year: z.number().int().min(1970).max(2100),
  subject: z.string().trim().min(1, "Subject is required"),
  text: z.string().trim().min(1, "Question text is required"),
  optionA: z.string().trim().min(1, "Option A is required"),
  optionB: z.string().trim().min(1, "Option B is required"),
  optionC: z.string().trim().min(1, "Option C is required"),
  optionD: z.string().trim().min(1, "Option D is required"),
  correctAnswer: z.enum(["A", "B", "C", "D"]),
});

export type QuestionFormInput = z.input<typeof questionFormSchema>;
export type QuestionFormValues = z.output<typeof questionFormSchema>;
