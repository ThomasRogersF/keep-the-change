import { z } from "zod";

export const accountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["main", "external"]),
  currency: z.string().min(1, "Currency is required"),
});

export type AccountFormData = z.infer<typeof accountSchema>;
