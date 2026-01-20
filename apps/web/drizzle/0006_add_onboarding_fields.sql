-- Add onboarding fields to organization table
ALTER TABLE "organization" ADD COLUMN "onboarding_completed" boolean NOT NULL DEFAULT false;
ALTER TABLE "organization" ADD COLUMN "onboarding_step" integer NOT NULL DEFAULT 0;
