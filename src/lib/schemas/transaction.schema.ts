import { z } from "zod";

export const transactionSchema = z.object({
  date: z.date(),
  amount: z.number().positive("Amount must be positive"),
  type: z.enum(["expense", "income"]),
  categoryId: z.string().optional(),
  merchantId: z.string().optional(),
  accountId: z.string().min(1, "Account is required"),
  note: z.string().optional(),
  tags: z.array(z.string()),
});

export type TransactionFormData = z.infer<typeof transactionSchema>;
