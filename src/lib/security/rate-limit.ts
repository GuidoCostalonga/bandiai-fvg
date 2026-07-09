import { redis } from '@/lib/redis'

/**
 * Fixed-window rate limiter backed by Redis. Returns whether the action is
 * allowed plus remaining budget. Fails open (allows) if Redis is unavailable so
 * a cache outage never locks users out.
 *
 * @param key      logical bucket, e.g. `ai-chat:<userId>` or `login:<ip>`
 * @param limit    max requests per window
 * @param windowS  window length in seconds
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowS: number,
): Promise<{ success: boolean; remaining: number }> {
  const redisKey = `rl:${key}`
  try {
    const count = await redis.incr(redisKey)
    if (count === 1) await redis.expire(redisKey, windowS)
    return { success: count <= limit, remaining: Math.max(0, limit - count) }
  } catch {
    return { success: true, remaining: limit }
  }
}
