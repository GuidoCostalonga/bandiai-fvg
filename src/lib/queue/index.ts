import { Queue } from 'bullmq'
import { Redis } from 'ioredis'
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'

/**
 * BullMQ requires a dedicated connection with `maxRetriesPerRequest: null`.
 * We keep queue connections separate from the app cache connection (redis.ts).
 */
export const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null })
connection.on('error', (err) => logger.debug('bullmq redis error', { err: err.message }))

export const QUEUES = {
  crawl: 'crawl',
  notify: 'notify',
  ai: 'ai',
} as const

export type CrawlJob = { sourceId: string }
export type NotifyJob = { userId: string; bandoId: string; channel: string }

export const crawlQueue = new Queue<CrawlJob>(QUEUES.crawl, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 10_000 },
    removeOnComplete: 200,
    removeOnFail: 500,
  },
})

export const notifyQueue = new Queue<NotifyJob>(QUEUES.notify, {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 5_000 },
    removeOnComplete: 1000,
  },
})

/** Enqueue a crawl for one source. */
export async function enqueueCrawl(sourceId: string) {
  return crawlQueue.add('crawl-source', { sourceId }, { jobId: `crawl:${sourceId}:${Date.now()}` })
}
