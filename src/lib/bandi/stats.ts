import { prisma } from '@/lib/prisma'
import { cached } from '@/lib/redis'

/** Dashboard aggregates. Cached in Redis for 5 minutes. */
export async function getDashboardStats() {
  return cached('stats:dashboard', 300, async () => {
    const now = new Date()
    const dayAgo = new Date(now.getTime() - 86_400_000)
    const weekAgo = new Date(now.getTime() - 7 * 86_400_000)
    const monthAgo = new Date(now.getTime() - 30 * 86_400_000)
    const soon = new Date(now.getTime() + 7 * 86_400_000)

    const [total, open, newToday, newWeek, newMonth, closingSoon, byCategory, sumAgg, topFunded, upcoming] =
      await Promise.all([
        prisma.bando.count(),
        prisma.bando.count({ where: { status: { in: ['OPEN', 'CLOSING_SOON'] } } }),
        prisma.bando.count({ where: { createdAt: { gte: dayAgo } } }),
        prisma.bando.count({ where: { createdAt: { gte: weekAgo } } }),
        prisma.bando.count({ where: { createdAt: { gte: monthAgo } } }),
        prisma.bando.count({ where: { deadline: { gte: now, lte: soon } } }),
        prisma.bando.groupBy({ by: ['status'], _count: true }),
        prisma.bando.aggregate({ _sum: { contributoMax: true } }),
        prisma.bando.findMany({
          where: { status: { in: ['OPEN', 'CLOSING_SOON'] } },
          orderBy: { contributoMax: 'desc' },
          take: 5,
          select: { id: true, slug: true, title: true, ente: true, contributoMax: true },
        }),
        prisma.bando.findMany({
          where: { deadline: { gte: now } },
          orderBy: { deadline: 'asc' },
          take: 8,
          select: { id: true, slug: true, title: true, deadline: true, ente: true },
        }),
      ])

    return {
      total,
      open,
      newToday,
      newWeek,
      newMonth,
      closingSoon,
      byStatus: byCategory,
      totalFunding: Number(sumAgg._sum.contributoMax ?? 0),
      topFunded: topFunded.map((b) => ({ ...b, contributoMax: Number(b.contributoMax ?? 0) })),
      upcoming,
    }
  })
}

/** Category distribution for charts. */
export async function getCategoryDistribution() {
  return cached('stats:categories', 300, async () => {
    const bandi = await prisma.bando.findMany({ select: { categories: true } })
    const counts = new Map<string, number>()
    for (const b of bandi) for (const c of b.categories) counts.set(c, (counts.get(c) ?? 0) + 1)
    return [...counts.entries()].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count)
  })
}
