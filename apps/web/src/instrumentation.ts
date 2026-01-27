/**
 * Next.js instrumentation file
 * 
 * This file runs once when the server starts.
 * Use it to validate environment variables and set up monitoring.
 */

export async function register() {
  // Only run validation in production or when explicitly enabled
  if (process.env.NODE_ENV === "production" || process.env.VALIDATE_ENV === "true") {
    const { validateAndExit } = await import("@/lib/validate-env");
    validateAndExit();
  }
}
