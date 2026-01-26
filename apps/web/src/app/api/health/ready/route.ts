import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

/**
 * GET /api/health/ready
 * 
 * Readiness probe endpoint that checks if the service is ready to accept traffic.
 * Verifies database connectivity by executing a simple query.
 * 
 * Returns:
 * - 200: Service is ready (database is accessible)
 * - 503: Service is not ready (database is unavailable)
 */
export async function GET() {
  try {
    // Check database connection with a simple query
    await db.execute(sql`SELECT 1`);
    
    return Response.json({
      status: "ready",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Readiness check failed:", error);
    
    return Response.json(
      {
        status: "not ready",
        error: "Database unavailable",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
