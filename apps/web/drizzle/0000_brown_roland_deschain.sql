CREATE TYPE "public"."experiment_status" AS ENUM('draft', 'running', 'paused', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('ios', 'android');--> statement-breakpoint
CREATE TYPE "public"."product_type" AS ENUM('consumable', 'non_consumable', 'auto_renewable_subscription', 'non_renewing_subscription');--> statement-breakpoint
CREATE TYPE "public"."promo_code_type" AS ENUM('percentage_discount', 'fixed_discount', 'free_trial_extension', 'free_subscription');--> statement-breakpoint
CREATE TYPE "public"."purchase_status" AS ENUM('pending', 'completed', 'failed', 'refunded', 'deferred');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'canceled', 'expired', 'in_grace_period', 'in_billing_retry', 'paused', 'revoked');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"bundle_id" text,
	"package_name" text,
	"public_key" text NOT NULL,
	"secret_key" text NOT NULL,
	"apple_team_id" text,
	"apple_key_id" text,
	"apple_issuer_id" text,
	"apple_private_key" text,
	"apple_shared_secret" text,
	"google_service_account" text,
	"webhook_url" text,
	"webhook_secret" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "app_public_key_unique" UNIQUE("public_key"),
	CONSTRAINT "app_secret_key_unique" UNIQUE("secret_key")
);
--> statement-breakpoint
CREATE TABLE "entitlement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" uuid NOT NULL,
	"identifier" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experiment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"hypothesis" text,
	"status" "experiment_status" DEFAULT 'draft' NOT NULL,
	"target_audience" jsonb,
	"traffic_allocation" integer DEFAULT 100 NOT NULL,
	"started_at" timestamp,
	"ended_at" timestamp,
	"primary_metric" text DEFAULT 'conversion_rate' NOT NULL,
	"secondary_metrics" text[],
	"winning_variant_id" uuid,
	"confidence_level" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experiment_assignment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"experiment_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"subscriber_id" uuid NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"converted" boolean DEFAULT false NOT NULL,
	"converted_at" timestamp,
	"conversion_type" text,
	"revenue" integer DEFAULT 0,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "experiment_variant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"experiment_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_control" boolean DEFAULT false NOT NULL,
	"weight" integer DEFAULT 50 NOT NULL,
	"offering_id" uuid,
	"custom_products" jsonb,
	"paywall_config" jsonb,
	"impressions" integer DEFAULT 0 NOT NULL,
	"conversions" integer DEFAULT 0 NOT NULL,
	"revenue" integer DEFAULT 0 NOT NULL,
	"trials" integer DEFAULT 0 NOT NULL,
	"trial_conversions" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offering" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" uuid NOT NULL,
	"identifier" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"is_current" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offering_product" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offering_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "organization_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" uuid NOT NULL,
	"identifier" text NOT NULL,
	"store_product_id" text NOT NULL,
	"platform" "platform" NOT NULL,
	"type" "product_type" NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"subscription_group_id" text,
	"trial_duration" text,
	"subscription_period" text,
	"metadata" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_entitlement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"entitlement_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promo_code" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" "promo_code_type" NOT NULL,
	"discount_percent" integer,
	"discount_amount" integer,
	"free_trial_days" integer,
	"free_period" text,
	"product_ids" text[],
	"entitlement_ids" text[],
	"max_redemptions" integer,
	"max_redemptions_per_user" integer DEFAULT 1,
	"current_redemptions" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"starts_at" timestamp,
	"expires_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promo_code_redemption" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"promo_code_id" uuid NOT NULL,
	"subscriber_id" uuid NOT NULL,
	"redeemed_at" timestamp DEFAULT now() NOT NULL,
	"applied_discount" integer,
	"granted_entitlements" text[],
	"granted_trial_days" integer,
	"purchase_id" uuid,
	"subscription_id" uuid,
	"status" text DEFAULT 'applied' NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscriber_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"platform" "platform" NOT NULL,
	"store_transaction_id" text NOT NULL,
	"original_transaction_id" text,
	"receipt_data" text,
	"status" "purchase_status" DEFAULT 'pending' NOT NULL,
	"price_amount_micros" integer,
	"price_currency_code" varchar(3),
	"purchase_date" timestamp NOT NULL,
	"expires_date" timestamp,
	"store_response" jsonb,
	"environment" text DEFAULT 'production',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "subscriber" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" uuid NOT NULL,
	"app_user_id" text NOT NULL,
	"aliases" jsonb DEFAULT '[]'::jsonb,
	"attributes" jsonb,
	"original_app_user_id" text,
	"first_seen_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriber_entitlement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscriber_id" uuid NOT NULL,
	"entitlement_id" uuid NOT NULL,
	"product_id" uuid,
	"subscription_id" uuid,
	"purchase_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_date" timestamp,
	"granted_by" text,
	"grant_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscriber_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"platform" "platform" NOT NULL,
	"original_transaction_id" text NOT NULL,
	"latest_transaction_id" text,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"purchase_date" timestamp NOT NULL,
	"original_purchase_date" timestamp NOT NULL,
	"expires_date" timestamp,
	"grace_period_expires_date" timestamp,
	"billing_retry_expires_date" timestamp,
	"auto_renew_enabled" boolean DEFAULT true NOT NULL,
	"auto_renew_product_id" uuid,
	"is_trial_period" boolean DEFAULT false NOT NULL,
	"is_in_intro_offer_period" boolean DEFAULT false NOT NULL,
	"canceled_at" timestamp,
	"cancellation_reason" text,
	"store_response" jsonb,
	"environment" text DEFAULT 'production',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "webhook_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"app_id" uuid NOT NULL,
	"platform" "platform" NOT NULL,
	"event_type" text NOT NULL,
	"event_id" text,
	"payload" jsonb NOT NULL,
	"processed_at" timestamp,
	"error" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app" ADD CONSTRAINT "app_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entitlement" ADD CONSTRAINT "entitlement_app_id_app_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiment" ADD CONSTRAINT "experiment_app_id_app_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiment_assignment" ADD CONSTRAINT "experiment_assignment_experiment_id_experiment_id_fk" FOREIGN KEY ("experiment_id") REFERENCES "public"."experiment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiment_assignment" ADD CONSTRAINT "experiment_assignment_variant_id_experiment_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."experiment_variant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiment_assignment" ADD CONSTRAINT "experiment_assignment_subscriber_id_subscriber_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."subscriber"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiment_variant" ADD CONSTRAINT "experiment_variant_experiment_id_experiment_id_fk" FOREIGN KEY ("experiment_id") REFERENCES "public"."experiment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiment_variant" ADD CONSTRAINT "experiment_variant_offering_id_offering_id_fk" FOREIGN KEY ("offering_id") REFERENCES "public"."offering"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offering" ADD CONSTRAINT "offering_app_id_app_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offering_product" ADD CONSTRAINT "offering_product_offering_id_offering_id_fk" FOREIGN KEY ("offering_id") REFERENCES "public"."offering"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offering_product" ADD CONSTRAINT "offering_product_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_member" ADD CONSTRAINT "organization_member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_member" ADD CONSTRAINT "organization_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_app_id_app_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_entitlement" ADD CONSTRAINT "product_entitlement_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_entitlement" ADD CONSTRAINT "product_entitlement_entitlement_id_entitlement_id_fk" FOREIGN KEY ("entitlement_id") REFERENCES "public"."entitlement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_code" ADD CONSTRAINT "promo_code_app_id_app_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_code_redemption" ADD CONSTRAINT "promo_code_redemption_promo_code_id_promo_code_id_fk" FOREIGN KEY ("promo_code_id") REFERENCES "public"."promo_code"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_code_redemption" ADD CONSTRAINT "promo_code_redemption_subscriber_id_subscriber_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."subscriber"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_code_redemption" ADD CONSTRAINT "promo_code_redemption_purchase_id_purchase_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchase"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_code_redemption" ADD CONSTRAINT "promo_code_redemption_subscription_id_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscription"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase" ADD CONSTRAINT "purchase_subscriber_id_subscriber_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."subscriber"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase" ADD CONSTRAINT "purchase_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriber" ADD CONSTRAINT "subscriber_app_id_app_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriber_entitlement" ADD CONSTRAINT "subscriber_entitlement_subscriber_id_subscriber_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."subscriber"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriber_entitlement" ADD CONSTRAINT "subscriber_entitlement_entitlement_id_entitlement_id_fk" FOREIGN KEY ("entitlement_id") REFERENCES "public"."entitlement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriber_entitlement" ADD CONSTRAINT "subscriber_entitlement_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriber_entitlement" ADD CONSTRAINT "subscriber_entitlement_subscription_id_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscription"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriber_entitlement" ADD CONSTRAINT "subscriber_entitlement_purchase_id_purchase_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchase"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_subscriber_id_subscriber_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."subscriber"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_auto_renew_product_id_product_id_fk" FOREIGN KEY ("auto_renew_product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_event" ADD CONSTRAINT "webhook_event_app_id_app_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."app"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "app_org_idx" ON "app" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "entitlement_app_idx" ON "entitlement" USING btree ("app_id");--> statement-breakpoint
CREATE UNIQUE INDEX "entitlement_app_identifier" ON "entitlement" USING btree ("app_id","identifier");--> statement-breakpoint
CREATE INDEX "experiment_app_idx" ON "experiment" USING btree ("app_id");--> statement-breakpoint
CREATE INDEX "experiment_status_idx" ON "experiment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "assignment_experiment_idx" ON "experiment_assignment" USING btree ("experiment_id");--> statement-breakpoint
CREATE INDEX "assignment_subscriber_idx" ON "experiment_assignment" USING btree ("subscriber_id");--> statement-breakpoint
CREATE UNIQUE INDEX "assignment_unique" ON "experiment_assignment" USING btree ("experiment_id","subscriber_id");--> statement-breakpoint
CREATE INDEX "variant_experiment_idx" ON "experiment_variant" USING btree ("experiment_id");--> statement-breakpoint
CREATE INDEX "offering_app_idx" ON "offering" USING btree ("app_id");--> statement-breakpoint
CREATE UNIQUE INDEX "offering_app_identifier" ON "offering" USING btree ("app_id","identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "offering_product_unique" ON "offering_product" USING btree ("offering_id","product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "org_member_unique" ON "organization_member" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "product_app_idx" ON "product" USING btree ("app_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_store_unique" ON "product" USING btree ("app_id","store_product_id","platform");--> statement-breakpoint
CREATE UNIQUE INDEX "product_entitlement_unique" ON "product_entitlement" USING btree ("product_id","entitlement_id");--> statement-breakpoint
CREATE INDEX "promo_code_app_idx" ON "promo_code" USING btree ("app_id");--> statement-breakpoint
CREATE UNIQUE INDEX "promo_code_app_code_unique" ON "promo_code" USING btree ("app_id","code");--> statement-breakpoint
CREATE INDEX "promo_redemption_code_idx" ON "promo_code_redemption" USING btree ("promo_code_id");--> statement-breakpoint
CREATE INDEX "promo_redemption_subscriber_idx" ON "promo_code_redemption" USING btree ("subscriber_id");--> statement-breakpoint
CREATE UNIQUE INDEX "promo_redemption_unique" ON "promo_code_redemption" USING btree ("promo_code_id","subscriber_id");--> statement-breakpoint
CREATE INDEX "purchase_subscriber_idx" ON "purchase" USING btree ("subscriber_id");--> statement-breakpoint
CREATE INDEX "purchase_product_idx" ON "purchase" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "purchase_transaction_unique" ON "purchase" USING btree ("platform","store_transaction_id");--> statement-breakpoint
CREATE INDEX "subscriber_app_idx" ON "subscriber" USING btree ("app_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subscriber_app_user" ON "subscriber" USING btree ("app_id","app_user_id");--> statement-breakpoint
CREATE INDEX "sub_entitlement_subscriber_idx" ON "subscriber_entitlement" USING btree ("subscriber_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sub_entitlement_unique" ON "subscriber_entitlement" USING btree ("subscriber_id","entitlement_id");--> statement-breakpoint
CREATE INDEX "subscription_subscriber_idx" ON "subscription" USING btree ("subscriber_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_original_tx" ON "subscription" USING btree ("platform","original_transaction_id");--> statement-breakpoint
CREATE INDEX "webhook_event_app_idx" ON "webhook_event" USING btree ("app_id");--> statement-breakpoint
CREATE INDEX "webhook_event_type_idx" ON "webhook_event" USING btree ("event_type");