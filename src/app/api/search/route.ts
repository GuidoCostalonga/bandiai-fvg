import { NextResponse } from 'next/server'
import { z } from 'zod'
import { semanticSearch } from '@/lib/bandi/semantic'
import { searchBandi } from '@/lib/bandi/search'

const querySchema = z.object({
  q: z.string().trim().min(1),
  onlyOpen: z.enum(['true', '1']).optional(),
  onlyFvg: z.enum(['true', '1']).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(24),
})

/**
 * GET /api/search — AI semantic search over bandi.
 * Falls back to keyword search when embeddings aren't configured or fail, and
 * reports which mode produced the results so the UI can label them.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()))
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_params', issues: parsed.error.issues }, { status: 400 })
  }
  const { q, onlyOpen, onlyFvg, limit } = parsed.data

  const semantic = await semanticSearch(q, {
    limit,
    onlyOpen: Boolean(onlyOpen),
    onlyFvg: Boolean(onlyFvg),
  }).catch(() => null)

  if (semantic) {
    return NextResponse.json({ mode: 'semantic', total: semantic.items.length, items: semantic.items })
  }

  // Fallback: keyword search reuses the validated params.
  const keyword = await searchBandi({
    q,
    onlyOpen: Boolean(onlyOpen),
    onlyFvg: Boolean(onlyFvg),
    sort: 'recent',
    page: 1,
    pageSize: limit,
  })
  return NextResponse.json({ mode: 'keyword', total: keyword.total, items: keyword.items })
}
