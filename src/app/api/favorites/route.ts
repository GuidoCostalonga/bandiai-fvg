import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const bodySchema = z.object({ bandoId: z.string(), note: z.string().max(500).optional() })

/** GET /api/favorites — the current user's saved bandi. */
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: { bando: { select: { slug: true, title: true, ente: true, deadline: true, status: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(favorites)
}

/** POST /api/favorites — toggle a favorite for the current user. */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const parsed = bodySchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 })

  const existing = await prisma.favorite.findUnique({
    where: { userId_bandoId: { userId: session.user.id, bandoId: parsed.data.bandoId } },
  })
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } })
    return NextResponse.json({ favorited: false })
  }
  await prisma.favorite.create({
    data: { userId: session.user.id, bandoId: parsed.data.bandoId, note: parsed.data.note },
  })
  return NextResponse.json({ favorited: true })
}
