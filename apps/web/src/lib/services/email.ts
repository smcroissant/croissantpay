import { Resend } from "resend";

// Initialize Resend client
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Email templates
export type EmailTemplate =
  | "welcome"
  | "password-reset"
  | "subscription-created"
  | "subscription-canceled"
  | "subscription-expired"
  | "payment-failed"
  | "usage-warning"
  | "usage-limit-reached"
  | "team-invite";

interface EmailData {
  to: string;
  template: EmailTemplate;
  data: Record<string, unknown>;
}

const TEMPLATES: Record<EmailTemplate, { subject: string; text: (data: Record<string, unknown>) => string }> = {
  welcome: {
    subject: "Welcome to CroissantPay! 🚀",
    text: (data) => `
Hi ${data.name},

Welcome to CroissantPay! We're excited to have you on board.

You can now start integrating in-app purchases into your React Native apps. Here's how to get started:

1. Create your first app in the dashboard
2. Add your App Store and Play Store credentials
3. Install our React Native SDK
4. Start selling!

Dashboard: ${data.dashboardUrl}
Documentation: ${data.docsUrl}

If you have any questions, just reply to this email.

Best,
The CroissantPay Team
    `.trim(),
  },

  "password-reset": {
    subject: "Reset your CroissantPay password",
    text: (data) => `
Hi,

We received a request to reset your password. Click the link below to create a new password:

${data.resetUrl}

This link will expire in 1 hour.

If you didn't request this, you can safely ignore this email.

Best,
The CroissantPay Team
    `.trim(),
  },

  "subscription-created": {
    subject: "Thanks for subscribing to CroissantPay! 🎉",
    text: (data) => `
Hi ${data.name},

Thank you for subscribing to CroissantPay ${data.planName}!

Your subscription is now active. Here's a summary:

Plan: ${data.planName}
Price: ${data.price}${data.billingCycle === "yearly" ? "/year" : "/month"}
Next billing date: ${data.nextBillingDate}

You now have access to:
${data.features}

Manage your subscription: ${data.billingUrl}

Thanks for choosing CroissantPay!

Best,
The CroissantPay Team
    `.trim(),
  },

  "subscription-canceled": {
    subject: "Your CroissantPay subscription has been canceled",
    text: (data) => `
Hi ${data.name},

Your CroissantPay subscription has been canceled.

Your access will continue until: ${data.accessUntil}

After that, your account will be downgraded to the Free plan with:
- 1 app
- 100 subscribers
- 10,000 API requests/month

Your data will be preserved, but you may need to upgrade to access it if you exceed Free limits.

Changed your mind? You can reactivate anytime: ${data.billingUrl}

We'd love to hear your feedback on why you canceled. Just reply to this email.

Best,
The CroissantPay Team
    `.trim(),
  },

  "subscription-expired": {
    subject: "Your CroissantPay subscription has expired",
    text: (data) => `
Hi ${data.name},

Your CroissantPay subscription has expired and your account has been downgraded to the Free plan.

If you were using features that exceed Free limits, some functionality may be restricted.

To restore full access, upgrade your plan: ${data.upgradeUrl}

Best,
The CroissantPay Team
    `.trim(),
  },

  "payment-failed": {
    subject: "⚠️ Payment failed for your CroissantPay subscription",
    text: (data) => `
Hi ${data.name},

We couldn't process your payment for CroissantPay ${data.planName}.

Amount: ${data.amount}
Reason: ${data.reason}

Please update your payment method to avoid service interruption:

${data.updatePaymentUrl}

If you have questions, just reply to this email.

Best,
The CroissantPay Team
    `.trim(),
  },

  "usage-warning": {
    subject: "⚠️ You're approaching your CroissantPay limits",
    text: (data) => `
Hi ${data.name},

You're using ${data.percentUsed}% of your ${data.metric} limit on your ${data.planName} plan.

Current usage: ${data.currentUsage}
Limit: ${data.limit}

Consider upgrading to get more capacity: ${data.upgradeUrl}

Best,
The CroissantPay Team
    `.trim(),
  },

  "usage-limit-reached": {
    subject: "🚨 You've reached your CroissantPay limits",
    text: (data) => `
Hi ${data.name},

You've reached your ${data.metric} limit on your ${data.planName} plan.

To continue without interruption, please upgrade your plan: ${data.upgradeUrl}

Best,
The CroissantPay Team
    `.trim(),
  },

  "team-invite": {
    subject: "You've been invited to join a team on CroissantPay",
    text: (data) => `
Hi,

${data.inviterName} has invited you to join ${data.organizationName} on CroissantPay.

Click the link below to accept the invitation:

${data.inviteUrl}

This invitation will expire in 7 days.

Best,
The CroissantPay Team
    `.trim(),
  },
};

export async function sendEmail(emailData: EmailData): Promise<boolean> {
  if (!resend) {
    console.log("Email service not configured. Would send:", emailData);
    return false;
  }

  const template = TEMPLATES[emailData.template];
  if (!template) {
    console.error(`Unknown email template: ${emailData.template}`);
    return false;
  }

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "CroissantPay <noreply@croissantpay.dev>",
      to: emailData.to,
      subject: template.subject,
      text: template.text(emailData.data),
    });

    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

// Convenience functions
export async function sendWelcomeEmail(
  to: string,
  name: string
): Promise<boolean> {
  return sendEmail({
    to,
    template: "welcome",
    data: {
      name,
      dashboardUrl: `${process.env.BETTER_AUTH_URL}/dashboard`,
      docsUrl: `${process.env.BETTER_AUTH_URL}/docs`,
    },
  });
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<boolean> {
  return sendEmail({
    to,
    template: "password-reset",
    data: { resetUrl },
  });
}

export async function sendSubscriptionCreatedEmail(
  to: string,
  data: {
    name: string;
    planName: string;
    price: string;
    billingCycle: string;
    nextBillingDate: string;
    features: string;
  }
): Promise<boolean> {
  return sendEmail({
    to,
    template: "subscription-created",
    data: {
      ...data,
      billingUrl: `${process.env.BETTER_AUTH_URL}/dashboard/settings?tab=billing`,
    },
  });
}

export async function sendUsageWarningEmail(
  to: string,
  data: {
    name: string;
    metric: string;
    percentUsed: number;
    currentUsage: string;
    limit: string;
    planName: string;
  }
): Promise<boolean> {
  return sendEmail({
    to,
    template: "usage-warning",
    data: {
      ...data,
      upgradeUrl: `${process.env.BETTER_AUTH_URL}/pricing`,
    },
  });
}

export async function sendTeamInviteEmail(
  to: string,
  data: {
    inviterName: string;
    organizationName: string;
    inviteToken: string;
  }
): Promise<boolean> {
  return sendEmail({
    to,
    template: "team-invite",
    data: {
      ...data,
      inviteUrl: `${process.env.BETTER_AUTH_URL}/invite/${data.inviteToken}`,
    },
  });
}

