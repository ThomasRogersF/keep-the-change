import { z } from "zod";

export const goalSchema = z.object({
  name: z.string().min(1, "Name is required"),
  targetAmount: z.number().positive("Target amount must be positive"),
  targetDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format")
    .optional()
    .or(z.literal("")),
  accountId: z.string().min(1, "Account is required"),
});

export type GoalFormData = z.infer<typeof goalSchema>;

export const allocationSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format"),
  amount: z.number().positive("Amount must be positive"),
  note: z.string().optional(),
});

export type AllocationFormData = z.infer<typeof allocationSchema>;

export const spendLinkSchema = z.object({
  transactionId: z.string().min(1, "Transaction is required"),
  amountApplied: z.number().positive("Amount must be positive"),
});

export type SpendLinkFormData = z.infer<typeof spendLinkSchema>;
