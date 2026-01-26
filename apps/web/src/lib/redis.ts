import Redis from "ioredis";

let redis: Redis | null = null;

/**
 * Get a Redis client. Returns null if REDIS_URL is not set.
 * Uses a singleton to reuse the connection.
 */
export function getRedis(): Redis | null {
  if (redis !== null) {
    return redis;
  }
  const url = process.env.REDIS_URL;
  if (!url) {
    return null;
  }
  try {
    redis = new Redis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        const delay = Math.min(times * 100, 3000);
        return delay;
      },
      lazyConnect: true,
    });
    return redis;
  } catch {
    return null;
  }
}

/**
 * Check if Redis is available (REDIS_URL set and client created).
 */
export function isRedisAvailable(): boolean {
  return !!process.env.REDIS_URL && getRedis() !== null;
}
