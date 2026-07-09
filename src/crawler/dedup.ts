import { prisma } from '@/lib/prisma'
import { contentHash } from '@/lib/hash'

export type DedupResult =
  | { kind: 'new' }
  | { kind: 'unchanged'; bandoId: string }
  | { kind: 'changed'; bandoId: string }

/**
 * Decide whether a freshly-fetched bando is new, unchanged, or an update of an
 * existing record. Identity is the source URL; change detection uses a content
 * hash of the meaningful text.
 */
export async function classify(sourceUrl: string, text: string): Promise<DedupResult & { hash: string }> {
  const hash = contentHash(text)
  const existing = await prisma.bando.findFirst({
    where: { sourceUrl },
    select: { id: true, contentHash: true },
  })
  if (!existing) return { kind: 'new', hash }
  if (existing.contentHash === hash) return { kind: 'unchanged', bandoId: existing.id, hash }
  return { kind: 'changed', bandoId: existing.id, hash }
}
