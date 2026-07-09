import { NextResponse } from 'next/server'
import { searchParamsSchema, searchBandi } from '@/lib/bandi/search'

/** GET /api/bandi — paginated, filtered list. Powers the UI + public API. */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const raw = Object.fromEntries(url.searchParams.entries())
  // Support repeated params for arrays: ?categories=SPORT&categories=CULTURA
  const arrays = {
    categories: url.searchParams.getAll('categories'),
    beneficiari: url.searchParams.getAll('beneficiari'),
  }
  const parsed = searchParamsSchema.safeParse({
    ...raw,
    categories: arrays.categories.length ? arrays.categories : undefined,
    beneficiari: arrays.beneficiari.length ? arrays.beneficiari : undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_params', issues: parsed.error.issues }, { status: 400 })
  }
  const result = await searchBandi(parsed.data)
  return NextResponse.json(result, {
    headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
  })
}
