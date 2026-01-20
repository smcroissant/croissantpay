-- Add status field to organization_invitation for Better Auth
ALTER TABLE "organization_invitation" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'pending' NOT NULL;

-- Add activeOrganizationId to session for Better Auth organization plugin
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "active_organization_id" text;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS "invitation_org_idx" ON "organization_invitation" ("organization_id");
CREATE INDEX IF NOT EXISTS "invitation_email_idx" ON "organization_invitation" ("email");
CREATE INDEX IF NOT EXISTS "session_user_idx" ON "session" ("user_id");
