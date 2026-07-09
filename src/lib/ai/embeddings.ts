import OpenAI from 'openai'
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'

/**
 * Embeddings for semantic search. Kept separate from the chat client because
 * Anthropic has no embeddings endpoint — this always talks to an
 * OpenAI-compatible embeddings API. Dimension is fixed to 1536 to match the
 * `vector(1536)` column (OpenAI text-embedding-3-small). Change both together.
 */
export const EMBEDDING_DIMENSIONS = 1536

function apiKey(): string | undefined {
  return env.EMBEDDING_API_KEY ?? env.OPENAI_API_KEY
}

/** True when an embedding key is available; callers fall back to keyword search otherwise. */
export function isEmbeddingConfigured(): boolean {
  return Boolean(apiKey())
}

let client: OpenAI | null = null
function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: apiKey() ?? 'missing',
      ...(env.EMBEDDING_BASE_URL ? { baseURL: env.EMBEDDING_BASE_URL } : {}),
    })
  }
  return client
}

/** Embed a single string. Truncates to a safe token budget. */
export async function embed(text: string): Promise<number[]> {
  const res = await getClient().embeddings.create({
    model: env.EMBEDDING_MODEL,
    input: text.slice(0, 8000),
    dimensions: EMBEDDING_DIMENSIONS,
  })
  const vec = res.data[0]?.embedding
  if (!vec) throw new Error('empty embedding response')
  return vec
}

/** Embed many strings in one request (order preserved). */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []
  const res = await getClient().embeddings.create({
    model: env.EMBEDDING_MODEL,
    input: texts.map((t) => t.slice(0, 8000)),
    dimensions: EMBEDDING_DIMENSIONS,
  })
  return res.data.sort((a, b) => a.index - b.index).map((d) => d.embedding)
}

/** Serialize a vector as a pgvector literal: `[0.1,0.2,...]`. */
export function toVectorLiteral(vec: number[]): string {
  return `[${vec.join(',')}]`
}

/**
 * Build the text that represents a bando for embedding. Concatenates the most
 * semantically meaningful fields so similar bandi land near each other.
 */
export function buildEmbeddingText(b: {
  title: string
  ente: string
  summary?: string | null
  description?: string | null
  keywords?: string[]
  categories?: string[]
  obiettivi?: string[]
}): string {
  return [
    b.title,
    b.ente,
    b.summary ?? b.description ?? '',
    (b.categories ?? []).join(', '),
    (b.keywords ?? []).join(', '),
    (b.obiettivi ?? []).join('. '),
  ]
    .filter(Boolean)
    .join('\n')
    .trim()
}

export function logEmbeddingSkip(reason: string) {
  logger.debug('embedding skipped', { reason })
}
