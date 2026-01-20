import { createAuthClient } from "better-auth/react";
import { stripeClient } from "@better-auth/stripe/client";
import { organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [
    // Organization plugin
    // See: https://www.better-auth.com/docs/plugins/organization
    organizationClient(),
    stripeClient({
      subscription: true, // Enable subscription management
    }),
  ],
});

// Re-export auth methods
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;

// Organization-specific methods available through authClient.organization:
// - authClient.organization.create({ name, slug })
// - authClient.organization.list()
// - authClient.organization.setActive({ organizationId })
// - authClient.organization.getFullOrganization()
// - authClient.organization.inviteMember({ email, role })
// - authClient.organization.acceptInvitation({ invitationId })
// - authClient.organization.rejectInvitation({ invitationId })
// - authClient.organization.removeMember({ memberId })
// - authClient.organization.updateMemberRole({ memberId, role })
