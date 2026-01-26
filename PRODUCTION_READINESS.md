# Production Readiness Checklist

## 🚨 CRITICAL - Must Fix Before Launch

### 1. Apple Webhook JWS Signature Verification
**Status:** ✅ COMPLETED  
**Location:** `apps/web/src/lib/stores/apple.ts` (static method `verifyAndDecodeJWS`)  
**Issue:** Apple webhooks are decoded without verifying JWS signatures  
**Risk:** HIGH - Accepts fake webhooks, security vulnerability  
**Fix Applied:**
- Implemented JWS signature verification using Apple's x5c certificate chain from JWS header
- Extracts certificate from `x5c` header parameter (embedded in JWS, not fetched separately)
- Uses `jose` library to verify ES256 signature with Apple's public key
- Updated both webhook routes (`/api/webhooks/apple/route.ts` and `/api/webhooks/apple/[webhookId]/route.ts`) to use verification
- Returns 401 error if signature verification fails

**Implementation Details:**
- Certificate chain is embedded in JWS header (x5c parameter)
- Uses first certificate in chain (leaf certificate) to verify signature
- Proper error handling for invalid signatures
- Works for both Sandbox and Production environments

**Reference:** Apple documentation requires JWS verification for production

---

### 2. Enable Email Verification
**Status:** ✅ COMPLETED  
**Location:** `apps/web/src/lib/auth.ts:205`  
**Issue:** `requireEmailVerification: false` with comment "Enable in production"  
**Risk:** MEDIUM - Unverified accounts can access the system  
**Fix Applied:**
```typescript
emailAndPassword: {
  enabled: true,
  requireEmailVerification: true, // Enable in production
},
```

---

### 3. Redis-Based Rate Limiting
**Status:** ✅ COMPLETED  
**Location:** `apps/web/src/lib/api/rate-limit.ts`, `apps/web/src/lib/redis.ts`  
**Fix Applied:**
- Replaced in-memory Map with Redis when `REDIS_URL` is set (ioredis)
- Fixed-window rate limiting via Lua script (atomic INCR + EXPIRE)
- In-memory fallback when `REDIS_URL` is unset (e.g. local dev)
- Fail-open on Redis errors; `checkRateLimit()` is async
- Set `REDIS_URL` in production for cross-instance rate limiting

---

### 4. Health Check Endpoints
**Status:** ✅ COMPLETED  
**Location:** `apps/web/src/app/api/health/route.ts` and `apps/web/src/app/api/health/ready/route.ts`  
**Issue:** Documentation mentions `/api/health` and `/api/health/ready` but they don't exist  
**Risk:** MEDIUM - No health monitoring, Kubernetes/Docker health checks fail  
**Fix Applied:**
- Created `/api/health` endpoint for liveness probes (returns 200 OK)
- Created `/api/health/ready` endpoint for readiness probes (checks database connectivity)
- Readiness endpoint returns 503 if database is unavailable
- Both endpoints include timestamps for monitoring

**Implementation Details:**
- `/api/health`: Simple health check that always returns 200 OK
- `/api/health/ready`: Executes `SELECT 1` query to verify database connectivity
- Uses Drizzle ORM's `sql` template for database query
- Proper error handling with 503 status for unavailable services

---

### 5. Environment Variable Validation
**Status:** ❌ NOT IMPLEMENTED  
**Issue:** App starts even if required env vars are missing  
**Risk:** MEDIUM - Runtime failures in production  
**Fix Required:**
Create `apps/web/src/lib/env.ts`:
```typescript
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "production", "test"]),
  // Optional but recommended
  RESEND_API_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
```

Import and validate at startup in `apps/web/src/lib/config.ts`

---

### 6. Security Headers
**Status:** ❌ NOT CONFIGURED  
**Issue:** No security headers (CSP, HSTS, etc.)  
**Risk:** MEDIUM - Vulnerable to XSS, clickjacking  
**Fix Required:**
Update `apps/web/next.config.ts`:
```typescript
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on"
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload"
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN"
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block"
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin"
          },
        ],
      },
    ];
  },
};
```

---

### 7. Database Backup Automation
**Status:** ❌ NOT IMPLEMENTED  
**Issue:** Only documentation mentions backups  
**Risk:** HIGH - Data loss if database fails  
**Fix Required:**
- Set up automated daily backups
- Use cron job or Kubernetes CronJob
- Store backups in S3/cloud storage
- Test restore procedure

Example script:
```bash
#!/bin/bash
DATE=$(date +%Y-%m-%d_%H-%M-%S)
pg_dump $DATABASE_URL | gzip > "/backups/croissantpay-$DATE.sql.gz"
# Upload to S3
aws s3 cp "/backups/croissantpay-$DATE.sql.gz" s3://your-bucket/backups/
# Keep last 30 days locally
find /backups -name "*.sql.gz" -mtime +30 -delete
```

---

### 8. Error Monitoring
**Status:** ❌ NOT IMPLEMENTED  
**Issue:** Only console.error, no structured error tracking  
**Risk:** MEDIUM - Production errors go unnoticed  
**Fix Required:**
- Integrate Sentry or similar service
- Add error boundary components
- Set up alerts for critical errors

---

## ⚠️ HIGH PRIORITY - Should Fix Soon

### 9. CORS Configuration
**Status:** ⚠️ NEEDS VERIFICATION  
**Issue:** CORS settings not visible in codebase  
**Fix:** Verify and configure CORS for production domains

---

### 10. Google Webhook Verification
**Status:** ⚠️ NEEDS VERIFICATION  
**Location:** `apps/web/src/app/api/webhooks/google/`  
**Fix:** Verify Google webhook signature verification is properly implemented

---

### 11. Database Connection Pooling
**Status:** ⚠️ NEEDS VERIFICATION  
**Issue:** Ensure proper connection pooling for production  
**Fix:** Configure Drizzle connection pool settings

---

### 12. Structured Logging
**Status:** ⚠️ PARTIAL  
**Issue:** Documentation mentions JSON logging but not implemented  
**Fix:** Implement structured JSON logging for production

---

### 13. Monitoring & Metrics
**Status:** ⚠️ NOT IMPLEMENTED  
**Issue:** Prometheus metrics mentioned in docs but not implemented  
**Fix:** Add metrics endpoint and monitoring dashboard

---

## ✅ Already Implemented

- ✅ API authentication (public/secret keys)
- ✅ Rate limiting (in-memory - needs Redis)
- ✅ API request logging
- ✅ Error handling
- ✅ Customer webhook signatures
- ✅ Database migrations
- ✅ Docker deployment
- ✅ Multi-tenancy (organization scoping)

---

## 📋 Pre-Launch Checklist

- [ ] Fix all 8 CRITICAL issues above
- [ ] Test Apple webhook signature verification
- [ ] Test Google webhook signature verification
- [ ] Set up production database with backups
- [ ] Configure production environment variables
- [ ] Set up SSL/HTTPS (required for webhooks)
- [ ] Test health check endpoints
- [ ] Set up error monitoring (Sentry)
- [ ] Configure security headers
- [ ] Load test the API
- [ ] Test rate limiting with Redis
- [ ] Verify email verification flow
- [ ] Test database restore from backup
- [ ] Set up production monitoring dashboard
- [ ] Document production deployment process
- [ ] Create runbook for common issues

---

## 🚀 Deployment Steps

1. **Fix Critical Issues** - Address all 8 critical items above
2. **Set Up Infrastructure**
   - Production PostgreSQL database
   - Redis instance for rate limiting
   - SSL certificate (Let's Encrypt)
   - Backup storage (S3/GCS)
3. **Configure Environment**
   - Set all required environment variables
   - Configure Apple/Google credentials
   - Set up email service (Resend)
4. **Deploy**
   - Run database migrations
   - Deploy application
   - Verify health checks
5. **Monitor**
   - Set up error alerts
   - Monitor API usage
   - Check webhook delivery

---

## 📝 Notes

- The codebase is well-structured and most features are implemented
- Main gaps are in production hardening (security, monitoring, backups)
- Estimated time to production-ready: 2-3 days of focused work
- Consider a staging environment to test all fixes before production
