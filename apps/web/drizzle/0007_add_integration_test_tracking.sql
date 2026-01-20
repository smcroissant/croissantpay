-- Add integration test tracking fields to app table
ALTER TABLE "app" ADD COLUMN "last_integration_test" timestamp;
ALTER TABLE "app" ADD COLUMN "last_integration_test_platform" text;
ALTER TABLE "app" ADD COLUMN "last_integration_test_version" text;
