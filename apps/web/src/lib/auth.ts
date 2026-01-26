import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization as organizationPlugin, twoFactor, lastLoginMethod } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { stripe } from "@better-auth/stripe";
import Stripe from "stripe";
import { db } from "./db";
import * as schema from "./db/schema";
import { and, eq } from "drizzle-orm";
import { isCloudMode, PLANS } from "./config";
import { sendRawEmail } from "./services/email";

// Only initialize Stripe in cloud mode
const stripeClient = isCloudMode() && process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-12-15.clover",
    })
  : null;

// Build plugins array dynamically
function getPlugins() {
  const pluginList = [];

  // Add Last Login Method plugin
  // See: https://www.better-auth.com/docs/plugins/last-login-method
  pluginList.push(
    lastLoginMethod({
      storeInDatabase: true,
    })
  );

  // Add Two-Factor Authentication plugin
  // See: https://www.better-auth.com/docs/plugins/2fa
  pluginList.push(
    twoFactor({
      issuer: "CroissantPay",
      otpOptions: {
        async sendOTP({ user, otp }) {
          await sendRawEmail({
            to: user.email,
            subject: "Your CroissantPay verification code",
            html: `
              <h2>Verification Code</h2>
              <p>Your one-time password is:</p>
              <h1 style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #6366f1;">${otp}</h1>
              <p>This code expires in 3 minutes.</p>
              <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
            `,
          });
        },
      },
    })
  );

  // Add Passkey plugin for passwordless authentication
  // See: https://www.better-auth.com/docs/plugins/passkey
  pluginList.push(
    passkey({
      rpID: process.env.PASSKEY_RP_ID || "localhost",
      rpName: "CroissantPay",
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    })
  );
  
  // Add organization plugin with full configuration
  // See: https://www.better-auth.com/docs/plugins/organization
  pluginList.push(
    organizationPlugin({
      // Allow any authenticated user to create organizations
      allowUserToCreateOrganization: true,
      // Creator becomes owner by default
      creatorRole: "owner",
      // Maximum 100 members per organization
      membershipLimit: 100,
      // Invitation expires in 7 days (in seconds)
      invitationExpiresIn: 60 * 60 * 24 * 7,
      // Send invitation email
      sendInvitationEmail: async (data) => {
        const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/invite/${data.id}`;
        await sendRawEmail({
          to: data.email,
          subject: `You've been invited to join ${data.organization.name}`,
          html: `
            <h2>You've been invited!</h2>
            <p>${data.inviter.user.name || data.inviter.user.email} has invited you to join <strong>${data.organization.name}</strong> on CroissantPay.</p>
            <p>Click the link below to accept the invitation:</p>
            <a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px;">Accept Invitation</a>
            <p style="margin-top: 20px; color: #666;">This invitation expires in 7 days.</p>
          `,
        });
      },
      // Map schema to match our existing tables
      schema: {
        organization: {
          modelName: "organization",
          fields: {
            // Map Better Auth fields to our schema
            id: "id",
            name: "name",
            slug: "slug",
            createdAt: "createdAt",
          },
          // Add custom fields for onboarding
          additionalFields: {
            onboardingCompleted: {
              type: "boolean",
              required: false,
              defaultValue: false,
            },
            onboardingStep: {
              type: "number",
              required: false,
              defaultValue: 0,
            },
          },
        },
        member: {
          modelName: "organization_member",
          fields: {
            id: "id",
            organizationId: "organizationId",
            userId: "userId",
            role: "role",
            createdAt: "createdAt",
          },
        },
        invitation: {
          modelName: "organization_invitation",
          fields: {
            id: "id",
            organizationId: "organizationId",
            email: "email",
            role: "role",
            status: "status",
            expiresAt: "expiresAt",
            createdAt: "createdAt",
            inviterId: "invitedBy",
          },
        },
      },
    })
  );

  // Add Stripe plugin only in cloud mode
  if (isCloudMode() && stripeClient) {
    pluginList.push(
      stripe({
        stripeClient,
        stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
        createCustomerOnSignUp: true,
        subscription: {
          enabled: true,
          plans: PLANS.filter(p => p.id !== "free" && p.id !== "enterprise").map(plan => ({
            name: plan.id,
            priceId: process.env[`STRIPE_PRICE_${plan.id.toUpperCase()}_MONTHLY`] || "",
            annualDiscountPriceId: process.env[`STRIPE_PRICE_${plan.id.toUpperCase()}_YEARLY`],
            limits: {
              maxApps: plan.features.maxApps,
              maxSubscribers: plan.features.maxSubscribers,
              maxApiRequests: plan.features.maxApiRequests,
              teamMembers: plan.features.teamMembers,
            },
            freeTrial: plan.id === "starter" ? { days: 14 } : undefined,
          })),
          // Verify user has permission to manage organization subscriptions
          authorizeReference: async ({ user, referenceId }) => {
            // Check if user is owner or admin of the organization
            const member = await db
              .select()
              .from(schema.organizationMember)
              .where(
                and(
                  eq(schema.organizationMember.userId, user.id),
                  eq(schema.organizationMember.organizationId, referenceId)
                )
              )
              .limit(1);
            
            return member.length > 0 && (member[0].role === "owner" || member[0].role === "admin");
          },
        },
        // Support organizations as billing entities
        organization: {
          enabled: true,
        },
      })
    );
  }
  
  return pluginList;
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true, // Enable in production
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
  ],
  plugins: getPlugins(),
});

export type Session = typeof auth.$Infer.Session;

