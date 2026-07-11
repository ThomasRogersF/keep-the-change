import { z } from "zod";

export const wealthAccountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["cash", "brokerage"]),
  assetClass: z.enum(["fiat", "crypto"]),
  balance: z.number().min(0, "Balance cannot be negative"),
  currency: z.string().min(1, "Currency is required"),
  institution: z.string().optional().or(z.literal("")),
  riskLevel: z.enum(["low", "medium", "high"]),
  liquidity: z.enum(["immediate", "short_term", "long_term"]),
  insuranceType: z.enum(["FDIC", "NCUA", "SIPC", "none"]),
  notes: z.string().optional().or(z.literal("")),
});

export type WealthAccountFormData = z.infer<typeof wealthAccountSchema>;
