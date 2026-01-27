import { createAuthClient } from "better-auth/react";
import { stripeClient } from "@better-auth/stripe/client";
import { organizationClient, twoFactorClient, lastLoginMethodClient } from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "https://croissantlabs.com",
  plugins: [
    // Organization plugin
    // See: https://www.better-auth.com/docs/plugins/organization
    organizationClient(),
    stripeClient({
      subscription: true, // Enable subscription management
    }),
    // Two-Factor Authentication plugin
    // See: https://www.better-auth.com/docs/plugins/2fa
    twoFactorClient({
      onTwoFactorRedirect() {
        // Redirect to 2FA verification page during sign-in
        window.location.href = "/login/verify-2fa";
      },
    }),
    // Passkey plugin for passwordless authentication
    // See: https://www.better-auth.com/docs/plugins/passkey
    passkeyClient(),
    // Last Login Method plugin to track and display last used auth method
    // See: https://www.better-auth.com/docs/plugins/last-login-method
    lastLoginMethodClient(),
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
