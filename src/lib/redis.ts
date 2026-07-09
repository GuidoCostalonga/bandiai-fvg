import { Redis } from 'ioredis'
import { env } from './env'

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

/**
 * Shared ioredis connection used for caching. BullMQ creates its own
 * connections (it requires `maxRetriesPerRequest: null`), see queue/index.ts.
 */
export const redis =
  globalForRedis.redis ??
  new Redis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
  })

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis

/** Cache-aside helper: return cached JSON or compute, store and return it. */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>,
): Promise<T> {
  try {
    const hit = await redis.get(key)
    if (hit) return JSON.parse(hit) as T
  } catch {
    // Redis unavailable → fall through to compute (degraded, not broken)
  }
  const value = await compute()
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds)
  } catch {
    /* ignore cache write failure */
  }
  return value
}

export async function invalidate(pattern: string): Promise<void> {
  const stream = redis.scanStream({ match: pattern, count: 100 })
  for await (const keys of stream) {
    if (keys.length) await redis.del(...(keys as string[]))
  }
}
