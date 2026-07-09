import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { enqueueCrawl } from '@/lib/queue'
import { env } from '@/lib/env'

/**
 * POST /api/cron/crawl — enqueue crawls for all due sources.
 * Protected by a shared secret so only the scheduler (Vercel Cron, Coolify
 * scheduled task, or an external cron) can trigger it.
 *
 *   Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: Request) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET && env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const sources = await prisma.source.findMany({ where: { enabled: true }, select: { id: true, slug: true } })
  await Promise.all(sources.map((s) => enqueueCrawl(s.id)))
  return NextResponse.json({ enqueued: sources.length, sources: sources.map((s) => s.slug) })
}

export const GET = POST // allow GET for simple cron providers
