import 'dotenv/config'
import { Worker } from 'bullmq'
import { connection, QUEUES, type CrawlJob, type NotifyJob } from './index'
import { prisma } from '@/lib/prisma'
import { runCrawl } from '@/crawler/engine'
import { dispatchNotification } from '@/lib/notifications/dispatch'
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'

/**
 * Standalone worker process. Run with: `pnpm worker`.
 * Processes crawl and notification jobs. Deploy as a separate container/service
 * so web request latency is never affected by heavy crawling / AI work.
 */

const crawlWorker = new Worker<CrawlJob>(
  QUEUES.crawl,
  async (job) => {
    const source = await prisma.source.findUnique({ where: { id: job.data.sourceId } })
    if (!source) throw new Error(`source ${job.data.sourceId} not found`)
    if (!source.enabled) {
      logger.info('skipping disabled source', { source: source.slug })
      return
    }
    return runCrawl(source)
  },
  { connection, concurrency: env.CRAWLER_CONCURRENCY },
)

const notifyWorker = new Worker<NotifyJob>(
  QUEUES.notify,
  async (job) => dispatchNotification(job.data),
  { connection, concurrency: 8 },
)

for (const [name, w] of [
  ['crawl', crawlWorker],
  ['notify', notifyWorker],
] as const) {
  w.on('completed', (job) => logger.info(`${name} job completed`, { jobId: job.id }))
  w.on('failed', (job, err) => logger.error(`${name} job failed`, { jobId: job?.id, err: String(err) }))
}

logger.info('workers started', { concurrency: env.CRAWLER_CONCURRENCY })

async function shutdown() {
  logger.info('shutting down workers')
  await Promise.all([crawlWorker.close(), notifyWorker.close()])
  process.exit(0)
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
