import { z } from "zod";

export const merchantSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export type MerchantFormData = z.infer<typeof merchantSchema>;
