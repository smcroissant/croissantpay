import { db } from "@/lib/db";
import {
  app,
  organization,
  organizationMember,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { generateApiKey, generateWebhookId } from "@/lib/utils";

export interface CreateAppInput {
  organizationId: string;
  name: string;
  bundleId?: string;
  packageName?: string;
}

export interface UpdateAppInput {
  name?: string;
  bundleId?: string | null;
  packageName?: string | null;
  appleTeamId?: string | null;
  appleKeyId?: string | null;
  appleIssuerId?: string | null;
  appleVendorNumber?: string | null;
  applePrivateKey?: string | null;
  appleSharedSecret?: string | null;
  googleServiceAccount?: string | null;
  webhookUrl?: string | null;
}

export async function createApp(input: CreateAppInput): Promise<typeof app.$inferSelect> {
  const publicKey = generateApiKey("mxp");
  const secretKey = generateApiKey("mxs");
  const appleWebhookId = generateWebhookId("apple");
  const googleWebhookId = generateWebhookId("google");

  const [newApp] = await db
    .insert(app)
    .values({
      organizationId: input.organizationId,
      name: input.name,
      bundleId: input.bundleId,
      packageName: input.packageName,
      publicKey,
      secretKey,
      appleWebhookId,
      googleWebhookId,
    })
    .returning();

  return newApp;
}

export async function getApp(appId: string): Promise<typeof app.$inferSelect | null> {
  const [foundApp] = await db
    .select()
    .from(app)
    .where(eq(app.id, appId))
    .limit(1);

  return foundApp || null;
}

export async function getAppsByOrganization(
  organizationId: string
): Promise<Array<typeof app.$inferSelect>> {
  return db
    .select()
    .from(app)
    .where(eq(app.organizationId, organizationId));
}

export async function updateApp(
  appId: string,
  input: UpdateAppInput
): Promise<typeof app.$inferSelect> {
  const [updatedApp] = await db
    .update(app)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(app.id, appId))
    .returning();

  return updatedApp;
}

export async function deleteApp(appId: string): Promise<void> {
  await db.delete(app).where(eq(app.id, appId));
}

export async function regenerateApiKeys(
  appId: string
): Promise<{ publicKey: string; secretKey: string }> {
  const publicKey = generateApiKey("mxp");
  const secretKey = generateApiKey("mxs");

  await db
    .update(app)
    .set({
      publicKey,
      secretKey,
      updatedAt: new Date(),
    })
    .where(eq(app.id, appId));

  return { publicKey, secretKey };
}

export async function configureAppleStore(
  appId: string,
  config: {
    teamId: string;
    keyId: string;
    issuerId: string;
    privateKey: string;
    sharedSecret?: string;
  }
): Promise<void> {
  await db
    .update(app)
    .set({
      appleTeamId: config.teamId,
      appleKeyId: config.keyId,
      appleIssuerId: config.issuerId,
      applePrivateKey: config.privateKey,
      appleSharedSecret: config.sharedSecret,
      updatedAt: new Date(),
    })
    .where(eq(app.id, appId));
}

export async function configureGooglePlay(
  appId: string,
  serviceAccountJson: string
): Promise<void> {
  await db
    .update(app)
    .set({
      googleServiceAccount: serviceAccountJson,
      updatedAt: new Date(),
    })
    .where(eq(app.id, appId));
}

export async function configureWebhook(
  appId: string,
  webhookUrl: string
): Promise<string> {
  const webhookSecret = generateApiKey("whsec");

  await db
    .update(app)
    .set({
      webhookUrl,
      webhookSecret,
      updatedAt: new Date(),
    })
    .where(eq(app.id, appId));

  return webhookSecret;
}

export async function regenerateWebhookIds(
  appId: string,
  platform?: "apple" | "google"
): Promise<{ appleWebhookId?: string; googleWebhookId?: string }> {
  const updates: { appleWebhookId?: string; googleWebhookId?: string; updatedAt: Date } = {
    updatedAt: new Date(),
  };

  if (!platform || platform === "apple") {
    updates.appleWebhookId = generateWebhookId("apple");
  }
  if (!platform || platform === "google") {
    updates.googleWebhookId = generateWebhookId("google");
  }

  await db.update(app).set(updates).where(eq(app.id, appId));

  return {
    appleWebhookId: updates.appleWebhookId,
    googleWebhookId: updates.googleWebhookId,
  };
}

export async function getAppByAppleWebhookId(
  webhookId: string
): Promise<typeof app.$inferSelect | null> {
  const [foundApp] = await db
    .select()
    .from(app)
    .where(eq(app.appleWebhookId, webhookId))
    .limit(1);

  return foundApp || null;
}

export async function getAppByGoogleWebhookId(
  webhookId: string
): Promise<typeof app.$inferSelect | null> {
  const [foundApp] = await db
    .select()
    .from(app)
    .where(eq(app.googleWebhookId, webhookId))
    .limit(1);

  return foundApp || null;
}

// Check if user has access to app
export async function userHasAppAccess(
  userId: string,
  appId: string
): Promise<boolean> {
  const [result] = await db
    .select()
    .from(app)
    .innerJoin(organization, eq(app.organizationId, organization.id))
    .innerJoin(
      organizationMember,
      eq(organization.id, organizationMember.organizationId)
    )
    .where(
      and(eq(app.id, appId), eq(organizationMember.userId, userId))
    )
    .limit(1);

  return !!result;
}

