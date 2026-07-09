import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { BandoComparable } from '@/lib/bandi/compare'

/**
 * GET /api/bandi/compare?slugs=a,b,c — fetch a small set of bandi (max 3) for
 * the comparison view. Returns them in the requested order.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const slugs = (url.searchParams.get('slugs') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3)

  if (slugs.length === 0) return NextResponse.json({ items: [] })

  let rows
  try {
    rows = await prisma.bando.findMany({
      where: { slug: { in: slugs } },
      select: {
        slug: true,
        title: true,
        ente: true,
        status: true,
        categories: true,
        beneficiari: true,
        territorio: true,
        importoTotale: true,
        contributoMax: true,
        percentualeFinanziabile: true,
        deadline: true,
      },
    })
  } catch {
    // Degrade gracefully if the database is unavailable (consistent with the
    // rest of the app); the client renders an empty comparison.
    return NextResponse.json({ items: [] }, { status: 200 })
  }

  // Preserve the order the user selected (findMany order is not guaranteed).
  const bySlug = new Map(rows.map((r) => [r.slug, r]))
  const items: BandoComparable[] = slugs
    .map((s) => bySlug.get(s))
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .map((r) => ({
      slug: r.slug,
      title: r.title,
      ente: r.ente,
      status: r.status,
      categories: r.categories,
      beneficiari: r.beneficiari,
      territorio: r.territorio,
      importoTotale: r.importoTotale ? Number(r.importoTotale) : null,
      contributoMax: r.contributoMax ? Number(r.contributoMax) : null,
      percentualeFinanziabile: r.percentualeFinanziabile,
      deadline: r.deadline ? r.deadline.toISOString() : null,
    }))

  return NextResponse.json({ items })
}
