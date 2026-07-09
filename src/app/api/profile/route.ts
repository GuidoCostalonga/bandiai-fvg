import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CATEGORY_VALUES, ENTITY_VALUES } from '@/lib/ai/schemas'

const profileSchema = z.object({
  interests: z.array(z.string()).default([]),
  categories: z.array(z.enum(CATEGORY_VALUES)).default([]),
  territories: z.array(z.string()).default([]),
  entityTypes: z.array(z.enum(ENTITY_VALUES)).default([]),
  budgetMin: z.number().int().nonnegative().nullable().optional(),
  budgetMax: z.number().int().nonnegative().nullable().optional(),
  atecoCode: z.string().nullable().optional(),
  legalForm: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const profile = await prisma.userProfile.findUnique({ where: { userId: session.user.id } })
  return NextResponse.json(profile ?? {})
}

export async function PUT(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const parsed = profileSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'invalid', issues: parsed.error.issues }, { status: 400 })

  const data = parsed.data
  const profile = await prisma.userProfile.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...data },
    update: data,
  })
  return NextResponse.json(profile)
}
