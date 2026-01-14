-- Add apple_vendor_number column to app table for importing products/prices from App Store Connect
ALTER TABLE "app" ADD COLUMN IF NOT EXISTS "apple_vendor_number" text;
