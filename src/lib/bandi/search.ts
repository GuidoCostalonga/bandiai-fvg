import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { CATEGORY_VALUES, ENTITY_VALUES } from '@/lib/ai/schemas'

/** Validated filter/query params shared by the API and the UI. */
export const searchParamsSchema = z.object({
  q: z.string().trim().optional(),
  categories: z.array(z.enum(CATEGORY_VALUES)).optional(),
  beneficiari: z.array(z.enum(ENTITY_VALUES)).optional(),
  ente: z.string().optional(),
  territorio: z.string().optional(),
  importoMin: z.coerce.number().optional(),
  importoMax: z.coerce.number().optional(),
  deadlineBefore: z.coerce.date().optional(),
  onlyOpen: z.coerce.boolean().optional(),
  onlyFvg: z.coerce.boolean().optional(),
  onlyPnrr: z.coerce.boolean().optional(),
  onlyEu: z.coerce.boolean().optional(),
  sort: z.enum(['recent', 'deadline', 'importo']).default('recent'),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
export type SearchParams = z.infer<typeof searchParamsSchema>

/** Build the Prisma `where` clause from validated params. */
function buildWhere(p: SearchParams): Prisma.BandoWhereInput {
  const AND: Prisma.BandoWhereInput[] = []

  if (p.q) {
    // Full-text-ish search across the denormalised searchText plus title/ente.
    AND.push({
      OR: [
        { searchText: { contains: p.q.toLowerCase() } },
        { title: { contains: p.q, mode: 'insensitive' } },
        { ente: { contains: p.q, mode: 'insensitive' } },
        { keywords: { hasSome: p.q.split(/\s+/) } },
      ],
    })
  }
  if (p.categories?.length) AND.push({ categories: { hasSome: p.categories } })
  if (p.beneficiari?.length) AND.push({ beneficiari: { hasSome: p.beneficiari } })
  if (p.ente) AND.push({ ente: { contains: p.ente, mode: 'insensitive' } })
  if (p.territorio) AND.push({ territorio: { contains: p.territorio, mode: 'insensitive' } })
  if (p.importoMin != null) AND.push({ contributoMax: { gte: p.importoMin } })
  if (p.importoMax != null) AND.push({ contributoMax: { lte: p.importoMax } })
  if (p.deadlineBefore) AND.push({ deadline: { lte: p.deadlineBefore } })
  if (p.onlyOpen) AND.push({ status: { in: ['OPEN', 'CLOSING_SOON'] } })
  if (p.onlyFvg) AND.push({ territorio: { contains: 'friuli', mode: 'insensitive' } })
  if (p.onlyPnrr) AND.push({ OR: [{ keywords: { has: 'pnrr' } }, { ente: { contains: 'PNRR', mode: 'insensitive' } }] })
  if (p.onlyEu) AND.push({ source: { kind: { in: ['UE', 'INTERREG', 'ERASMUS', 'LIFE', 'HORIZON'] } } })

  return AND.length ? { AND } : {}
}

function orderBy(sort: SearchParams['sort']): Prisma.BandoOrderByWithRelationInput {
  switch (sort) {
    case 'deadline':
      return { deadline: 'asc' }
    case 'importo':
      return { contributoMax: 'desc' }
    default:
      return { publishedAt: 'desc' }
  }
}

export async function searchBandi(params: SearchParams) {
  const where = buildWhere(params)
  const [total, items] = await Promise.all([
    prisma.bando.count({ where }),
    prisma.bando.findMany({
      where,
      orderBy: orderBy(params.sort),
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      include: { source: { select: { name: true, kind: true } } },
    }),
  ])
  return {
    items,
    total,
    page: params.page,
    pageSize: params.pageSize,
    totalPages: Math.ceil(total / params.pageSize),
  }
}
