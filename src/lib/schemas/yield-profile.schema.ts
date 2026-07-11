import { z } from "zod";

const HIGH_RATE_WARNING_THRESHOLD = 25;

export const yieldProfileSchema = z.object({
  rateType: z.enum(["APY", "APR"]),
  currentRate: z
    .number()
    .min(0, "Rate cannot be negative")
    .max(1000, "Rate must be a realistic percentage"),
});

export type YieldProfileFormData = z.infer<typeof yieldProfileSchema>;

export function isUnusuallyHighRate(rate: number): boolean {
  return rate > HIGH_RATE_WARNING_THRESHOLD;
}

export const yieldProfileCreateSchema = z.object({
  rateType: z.enum(["APY", "APR"]),
  currentRate: z.number().min(0, "Rate cannot be negative").max(1000, "Rate must be a realistic percentage"),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format"),
});

export type YieldProfileCreateFormData = z.infer<typeof yieldProfileCreateSchema>;

export const yieldRateUpdateSchema = z.object({
  rate: z.number().min(0, "Rate cannot be negative").max(1000, "Rate must be a realistic percentage"),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format"),
  note: z.string().optional().or(z.literal("")),
});

export type YieldRateUpdateFormData = z.infer<typeof yieldRateUpdateSchema>;
