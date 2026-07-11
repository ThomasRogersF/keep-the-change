import { z } from "zod";

export const internalTransferSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format"),
    amount: z.number().positive("Amount must be positive"),
    fromType: z.enum(["account", "wealthAccount"]),
    fromId: z.string().min(1, "Source account is required"),
    toType: z.enum(["account", "wealthAccount"]),
    toId: z.string().min(1, "Destination account is required"),
    note: z.string().optional().or(z.literal("")),
  })
  .refine((data) => !(data.fromType === data.toType && data.fromId === data.toId), {
    message: "Source and destination accounts must be different",
    path: ["toId"],
  });

export type InternalTransferFormData = z.infer<typeof internalTransferSchema>;
