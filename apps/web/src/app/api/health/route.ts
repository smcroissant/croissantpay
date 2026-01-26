/**
 * GET /api/health
 * 
 * Basic health check endpoint for liveness probes.
 * Returns a simple OK status to indicate the service is running.
 */
export async function GET() {
  return Response.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
