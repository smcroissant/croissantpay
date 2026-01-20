-- Add environment field to webhook_event table
-- Values: 'Sandbox', 'Production', or 'Test'
ALTER TABLE "webhook_event" ADD COLUMN "environment" text DEFAULT 'production';
