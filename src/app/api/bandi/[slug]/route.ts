import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/** GET /api/bandi/:slug — full bando with AI insight and documents. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const bando = await prisma.bando.findUnique({
    where: { slug },
    include: {
      aiInsight: true,
      documents: true,
      source: { select: { name: true, kind: true, homepageUrl: true } },
      tags: { include: { tag: true } },
    },
  })
  if (!bando) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json(bando)
}
