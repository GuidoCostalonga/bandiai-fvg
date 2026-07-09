import 'dotenv/config'
import { prisma } from '@/lib/prisma'
import { setBandoEmbedding } from '@/lib/bandi/semantic'
import { isEmbeddingConfigured } from '@/lib/ai/embeddings'
import { logger } from '@/lib/logger'

/**
 * Backfill embeddings for bandi that don't have one yet (e.g. crawled before
 * semantic search was enabled). Idempotent and resumable — re-run any time.
 *   pnpm embed:backfill
 */
async function main() {
  if (!isEmbeddingConfigured()) {
    logger.error('embeddings not configured — set EMBEDDING_API_KEY or OPENAI_API_KEY')
    process.exit(1)
  }

  let processed = 0
  const batchSize = 100
  for (;;) {
    // `embedding` is an Unsupported column → query the target rows via raw SQL.
    const rows = await prisma.$queryRaw<
      Array<{
        id: string
        title: string
        ente: string
        summary: string | null
        description: string | null
        keywords: string[]
        categories: string[]
        obiettivi: string[]
      }>
    >`
      SELECT id, title, ente, summary, description, keywords, categories, obiettivi
      FROM "Bando"
      WHERE embedding IS NULL
      LIMIT ${batchSize}
    `
    if (rows.length === 0) break

    for (const r of rows) {
      await setBandoEmbedding(r.id, r)
      processed++
    }
    logger.info('backfill progress', { processed })
  }

  logger.info('embedding backfill complete', { processed })
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    logger.error('backfill failed', { err: String(err) })
    await prisma.$disconnect()
    process.exit(1)
  })
