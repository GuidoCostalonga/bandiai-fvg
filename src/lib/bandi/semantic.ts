import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { embed, toVectorLiteral, isEmbeddingConfigured, buildEmbeddingText } from '@/lib/ai/embeddings'

/** Options for a semantic query. Filters are applied in-DB before ranking. */
export interface SemanticOptions {
  limit?: number
  onlyOpen?: boolean
  onlyFvg?: boolean
  /** Minimum cosine similarity (0..1) to keep. Filters weak matches. */
  minScore?: number
}

export interface SemanticResult {
  items: Array<{
    id: string
    slug: string
    title: string
    ente: string
    summary: string | null
    status: string
    deadline: Date | null
    contributoMax: Prisma.Decimal | null
    categories: string[]
    territorio: string | null
    score: number
  }>
}

/**
 * Store (or refresh) a bando's embedding. Best-effort: if embeddings aren't
 * configured, this is a no-op so the crawl pipeline keeps working. The vector
 * column is `Unsupported`, so it must be written via raw SQL.
 */
export async function setBandoEmbedding(
  bandoId: string,
  fields: Parameters<typeof buildEmbeddingText>[0],
): Promise<void> {
  if (!isEmbeddingConfigured()) return
  try {
    const vec = await embed(buildEmbeddingText(fields))
    const literal = toVectorLiteral(vec)
    await prisma.$executeRaw`
      UPDATE "Bando" SET embedding = ${literal}::vector, "embeddedAt" = now() WHERE id = ${bandoId}
    `
  } catch (err) {
    logger.warn('setBandoEmbedding failed', { bandoId, err: String(err) })
  }
}

/**
 * Semantic search over bandi using pgvector cosine distance (`<=>`).
 * Returns `null` when embeddings aren't configured so the caller can fall back
 * to keyword search transparently.
 */
export async function semanticSearch(query: string, opts: SemanticOptions = {}): Promise<SemanticResult | null> {
  if (!isEmbeddingConfigured()) return null
  const limit = Math.min(opts.limit ?? 30, 100)

  let literal: string
  try {
    literal = toVectorLiteral(await embed(query))
  } catch (err) {
    logger.warn('query embedding failed, caller should fall back', { err: String(err) })
    return null
  }

  // Build optional in-DB filters as composable SQL fragments (safe: no user text).
  const filters: Prisma.Sql[] = [Prisma.sql`embedding IS NOT NULL`]
  if (opts.onlyOpen) filters.push(Prisma.sql`status IN ('OPEN','CLOSING_SOON')`)
  if (opts.onlyFvg) filters.push(Prisma.sql`territorio ILIKE '%friuli%'`)
  const where = Prisma.join(filters, ' AND ')

  const rows = await prisma.$queryRaw<
    Array<{
      id: string
      slug: string
      title: string
      ente: string
      summary: string | null
      status: string
      deadline: Date | null
      contributoMax: Prisma.Decimal | null
      categories: string[]
      territorio: string | null
      score: number
    }>
  >`
    SELECT id, slug, title, ente, summary, status, deadline, "contributoMax",
           categories, territorio,
           1 - (embedding <=> ${literal}::vector) AS score
    FROM "Bando"
    WHERE ${where}
    ORDER BY embedding <=> ${literal}::vector
    LIMIT ${limit}
  `

  const min = opts.minScore ?? 0
  return {
    items: rows.map((r) => ({ ...r, score: Number(r.score) })).filter((r) => r.score >= min),
  }
}
