import { z } from "zod";

export const incomeSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Must be YYYY-MM format"),
  source: z.string().min(1, "Source is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  note: z.string().optional(),
});

export type IncomeFormData = z.infer<typeof incomeSchema>;
