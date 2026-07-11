import { z } from "zod";

export const assetHoldingSchema = z.object({
  wealthAccountId: z.string().min(1, "Account is required"),
  assetType: z.enum(["etf", "stock", "crypto"]),
  symbol: z.string().min(1, "Symbol is required").toUpperCase(),
  name: z.string().optional().or(z.literal("")),
  currentPricePerUnit: z.number().nonnegative("Price cannot be negative"),
});

export type AssetHoldingFormData = z.infer<typeof assetHoldingSchema>;

export const manualPriceUpdateSchema = z.object({
  pricePerUnit: z.number().positive("Price must be positive"),
});

export type ManualPriceUpdateFormData = z.infer<typeof manualPriceUpdateSchema>;
