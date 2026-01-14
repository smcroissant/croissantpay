-- API Request Logs table for tracking all API requests per organization
DO $$ BEGIN
    CREATE TYPE "public"."api_request_method" AS ENUM('GET', 'POST', 'PUT', 'PATCH', 'DELETE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "api_request_log" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" uuid NOT NULL,
    "app_id" uuid,
    "method" "api_request_method" NOT NULL,
    "path" text NOT NULL,
    "query" jsonb,
    "headers" jsonb,
    "body" jsonb,
    "status_code" integer NOT NULL,
    "response_body" jsonb,
    "response_time" integer,
    "ip_address" text,
    "user_agent" text,
    "api_key_type" text,
    "api_key_prefix" text,
    "subscriber_id" text,
    "app_user_id" text,
    "error_message" text,
    "error_stack" text,
    "created_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraints
DO $$ BEGIN
    ALTER TABLE "api_request_log" ADD CONSTRAINT "api_request_log_organization_id_organization_id_fk" 
    FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "api_request_log" ADD CONSTRAINT "api_request_log_app_id_app_id_fk" 
    FOREIGN KEY ("app_id") REFERENCES "public"."app"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS "api_log_org_idx" ON "api_request_log" USING btree ("organization_id");
CREATE INDEX IF NOT EXISTS "api_log_app_idx" ON "api_request_log" USING btree ("app_id");
CREATE INDEX IF NOT EXISTS "api_log_created_idx" ON "api_request_log" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "api_log_path_idx" ON "api_request_log" USING btree ("path");
CREATE INDEX IF NOT EXISTS "api_log_status_idx" ON "api_request_log" USING btree ("status_code");
