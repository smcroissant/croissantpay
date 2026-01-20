import { z } from "zod";

// Re-export shared schemas
export {
  createAppSchema,
  appleConfigSchema,
  googleConfigSchema,
  type CreateAppFormData,
  type AppleConfigFormData,
  type GoogleConfigFormData,
} from "@/components/app-setup";

// Onboarding-specific schemas
export const createProductSchema = z.object({
  identifier: z.string().min(1, "Product ID is required"),
  displayName: z.string().min(1, "Display name is required"),
  platform: z.enum(["ios", "android"]),
  type: z.enum(["auto_renewable_subscription", "consumable", "non_consumable"]),
});

export type CreateProductFormData = z.infer<typeof createProductSchema>;
