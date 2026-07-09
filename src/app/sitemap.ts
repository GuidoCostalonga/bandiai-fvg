import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/bandi`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${base}/calendario`, changeFrequency: 'daily', priority: 0.6 },
  ]

  const bandi = await prisma.bando
    .findMany({ where: { status: { not: 'DRAFT' } }, select: { slug: true, updatedAt: true }, take: 5000 })
    .catch(() => [])

  return [
    ...staticRoutes,
    ...bandi.map((b) => ({
      url: `${base}/bandi/${b.slug}`,
      lastModified: b.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ]
}
