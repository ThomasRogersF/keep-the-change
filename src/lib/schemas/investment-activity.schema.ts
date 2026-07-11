import { z } from "zod";

export const investmentActivitySchema = z
  .object({
    type: z.enum(["buy", "sell", "dividend", "fee", "priceUpdate"]),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format"),
    assetHoldingId: z.string().optional(),
    quantity: z.number().positive("Quantity must be positive").optional(),
    pricePerUnit: z.number().positive("Price must be positive").optional(),
    amount: z.number().positive("Amount must be positive").optional(),
    note: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    const requireField = (field: "assetHoldingId" | "quantity" | "pricePerUnit" | "amount", message: string) => {
      if (data[field] === undefined || data[field] === "") {
        ctx.addIssue({ code: "custom", path: [field], message });
      }
    };

    if (data.type === "buy" || data.type === "sell") {
      requireField("assetHoldingId", "Holding is required");
      requireField("quantity", "Quantity is required");
      requireField("pricePerUnit", "Price per unit is required");
    } else if (data.type === "priceUpdate") {
      requireField("assetHoldingId", "Holding is required");
      requireField("pricePerUnit", "Price per unit is required");
    } else if (data.type === "dividend" || data.type === "fee") {
      requireField("amount", "Amount is required");
    }
  });

export type InvestmentActivityFormData = z.infer<typeof investmentActivitySchema>;
