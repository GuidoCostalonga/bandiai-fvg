import 'dotenv/config'
import { prisma } from '@/lib/prisma'
import { runCrawl } from './engine'
import { logger } from '@/lib/logger'

/**
 * Manual crawl runner for development / cron.
 *   pnpm crawl            → crawl all enabled sources
 *   pnpm crawl <slug>     → crawl a single source by slug
 */
async function main() {
  const slug = process.argv[2]
  const sources = await prisma.source.findMany({
    where: slug ? { slug } : { enabled: true },
  })
  if (sources.length === 0) {
    logger.warn('no matching sources', { slug })
    return
  }
  for (const source of sources) {
    logger.info('crawling', { source: source.slug })
    await runCrawl(source)
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error('crawl cli failed', { err: String(err) })
    process.exit(1)
  })
