-- Add webhook ID columns for secure webhook routing
ALTER TABLE "app" ADD COLUMN "apple_webhook_id" text;
ALTER TABLE "app" ADD COLUMN "google_webhook_id" text;

-- Add unique constraints
ALTER TABLE "app" ADD CONSTRAINT "app_apple_webhook_id_unique" UNIQUE ("apple_webhook_id");
ALTER TABLE "app" ADD CONSTRAINT "app_google_webhook_id_unique" UNIQUE ("google_webhook_id");

-- Generate webhook IDs for existing apps
UPDATE "app" SET 
  "apple_webhook_id" = 'wh_apple_' || encode(gen_random_bytes(16), 'hex'),
  "google_webhook_id" = 'wh_google_' || encode(gen_random_bytes(16), 'hex')
WHERE "apple_webhook_id" IS NULL OR "google_webhook_id" IS NULL;
