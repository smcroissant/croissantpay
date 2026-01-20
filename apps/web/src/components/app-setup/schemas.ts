import { z } from "zod";

export const createAppSchema = z.object({
  name: z.string().min(1, "App name is required"),
  bundleId: z.string().optional(),
  packageName: z.string().optional(),
});

export const appleConfigSchema = z.object({
  appleIssuerId: z.string().optional(),
  appleKeyId: z.string().optional(),
  applePrivateKey: z.string().optional(),
  appleSharedSecret: z.string().optional(),
  appleVendorNumber: z.string().optional(),
});

export const googleConfigSchema = z.object({
  googleServiceAccount: z.string().optional(),
});

export type CreateAppFormData = z.infer<typeof createAppSchema>;
export type AppleConfigFormData = z.infer<typeof appleConfigSchema>;
export type GoogleConfigFormData = z.infer<typeof googleConfigSchema>;
