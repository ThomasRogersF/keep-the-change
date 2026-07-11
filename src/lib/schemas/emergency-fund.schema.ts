import { z } from "zod";

export const emergencyFundSchema = z.object({
  name: z.string().min(1, "Name is required"),
  monthlyExpenses: z.number().positive("Monthly expenses must be positive"),
  targetMonths: z
    .number()
    .positive("Target months must be positive")
    .max(60, "Target months must be 60 or fewer"),
});

export type EmergencyFundFormData = z.infer<typeof emergencyFundSchema>;

// Create flow also bundles a new linked WealthAccount — the account is the
// single source of truth for the fund's balance (see plan decision D1/D2).
export const createEmergencyFundSchema = emergencyFundSchema.extend({
  openingBalance: z.number().min(0, "Opening balance cannot be negative"),
  institution: z.string().optional().or(z.literal("")),
});

export type CreateEmergencyFundFormData = z.infer<typeof createEmergencyFundSchema>;

export const emergencyWithdrawalReasons = [
  "medical",
  "job_loss",
  "car_repair",
  "home_repair",
  "family_emergency",
  "travel_emergency",
  "other",
] as const;

export const EMERGENCY_WITHDRAWAL_REASON_LABELS: Record<
  (typeof emergencyWithdrawalReasons)[number],
  string
> = {
  medical: "Medical",
  job_loss: "Job Loss / Income Interruption",
  car_repair: "Vehicle Repair",
  home_repair: "Home Repair",
  family_emergency: "Family Emergency",
  travel_emergency: "Travel Emergency",
  other: "Other",
};

export const emergencyContributionSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format"),
  note: z.string().optional().or(z.literal("")),
});

export type EmergencyContributionFormData = z.infer<typeof emergencyContributionSchema>;

export const emergencyWithdrawalSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format"),
  reason: z.enum(emergencyWithdrawalReasons),
  note: z.string().optional().or(z.literal("")),
});

export type EmergencyWithdrawalFormData = z.infer<typeof emergencyWithdrawalSchema>;
