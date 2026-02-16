import { z } from "zod";

export const subscriptionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  cadence: z.enum(["weekly", "monthly", "yearly"]),
  nextRenewalDate: z.coerce.date(),
  accountId: z.string().min(1, "Account is required"),
  categoryId: z.string().optional(),
  merchantId: z.string().optional(),
  active: z.boolean().default(true),
});

export type SubscriptionFormData = z.infer<typeof subscriptionSchema>;
