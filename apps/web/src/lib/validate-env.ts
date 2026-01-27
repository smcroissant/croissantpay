/**
 * Environment variable validation for production
 * 
 * This should be called early in the application startup to fail fast
 * if critical configuration is missing or invalid.
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate production environment variables
 */
export function validateProductionEnv(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const isProduction = process.env.NODE_ENV === "production";

  // Required variables
  if (!process.env.DATABASE_URL) {
    errors.push("DATABASE_URL is required");
  } else if (!process.env.DATABASE_URL.startsWith("postgresql://")) {
    errors.push("DATABASE_URL must be a PostgreSQL connection string");
  }

  if (!process.env.BETTER_AUTH_SECRET) {
    errors.push("BETTER_AUTH_SECRET is required");
  } else {
    if (process.env.BETTER_AUTH_SECRET.length < 32) {
      errors.push("BETTER_AUTH_SECRET must be at least 32 characters");
    }
    if (isProduction && process.env.BETTER_AUTH_SECRET.includes("your-super-secret")) {
      errors.push("BETTER_AUTH_SECRET must be changed from default placeholder");
    }
    if (isProduction && process.env.BETTER_AUTH_SECRET === "change-me-in-production-min-32-chars") {
      errors.push("BETTER_AUTH_SECRET must be changed from Docker Compose default");
    }
  }

  if (!process.env.BETTER_AUTH_URL) {
    errors.push("BETTER_AUTH_URL is required");
  } else {
    try {
      const url = new URL(process.env.BETTER_AUTH_URL);
      if (isProduction && url.protocol !== "https:") {
        errors.push("BETTER_AUTH_URL must use HTTPS in production");
      }
      if (isProduction && (url.hostname === "localhost" || url.hostname === "127.0.0.1")) {
        errors.push("BETTER_AUTH_URL cannot be localhost in production");
      }
    } catch {
      errors.push("BETTER_AUTH_URL must be a valid URL");
    }
  }

  // Cloud mode specific
  const deploymentMode = process.env.CROISSANTPAY_DEPLOYMENT_MODE || "self-hosted";
  if (deploymentMode === "cloud") {
    if (!process.env.STRIPE_API_KEY) {
      errors.push("STRIPE_API_KEY is required in cloud mode");
    } else if (process.env.STRIPE_API_KEY.startsWith("sk_test_") && isProduction) {
      warnings.push("STRIPE_API_KEY appears to be a test key in production");
    } else if (process.env.STRIPE_API_KEY === "taeeeee") {
      errors.push("STRIPE_API_KEY appears to be a placeholder");
    }
  }

  // Optional but recommended
  if (isProduction && !process.env.REDIS_URL) {
    warnings.push("REDIS_URL is not set - rate limiting will use in-memory store (not recommended for production)");
  }

  // Email configuration (optional but recommended)
  if (process.env.RESEND_API_KEY && !process.env.EMAIL_FROM) {
    warnings.push("RESEND_API_KEY is set but EMAIL_FROM is not configured");
  }

  // Apple/Google credentials are optional (can be configured per-app)
  // But warn if neither is configured globally
  if (!process.env.APPLE_ISSUER_ID && !process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    warnings.push("No global Apple or Google credentials configured (can be set per-app)");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate and exit if invalid (for use in startup scripts)
 */
export function validateAndExit(): void {
  const result = validateProductionEnv();

  if (result.warnings.length > 0) {
    console.warn("⚠️  Environment warnings:");
    result.warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }

  if (result.errors.length > 0) {
    console.error("❌ Environment validation failed:");
    result.errors.forEach((error) => console.error(`  - ${error}`));
    console.error("\nPlease fix the above errors before starting the application.");
    process.exit(1);
  }

  if (result.warnings.length > 0) {
    console.log("✅ Environment validation passed with warnings");
  } else {
    console.log("✅ Environment validation passed");
  }
}
