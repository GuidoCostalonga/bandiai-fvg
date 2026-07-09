import { prisma } from '@/lib/prisma'
import { env } from '@/lib/env'

/** GET /feed.xml — public RSS feed of the latest bandi. */
export async function GET() {
  const bandi = await prisma.bando
    .findMany({
      where: { status: { not: 'DRAFT' } },
      orderBy: { publishedAt: 'desc' },
      take: 50,
      select: { slug: true, title: true, ente: true, summary: true, publishedAt: true },
    })
    .catch(() => [])

  const base = env.APP_URL
  const items = bandi
    .map(
      (b) => `    <item>
      <title>${esc(b.title)}</title>
      <link>${base}/bandi/${b.slug}</link>
      <guid>${base}/bandi/${b.slug}</guid>
      <description>${esc(b.ente)} — ${esc(b.summary ?? '')}</description>
      ${b.publishedAt ? `<pubDate>${b.publishedAt.toUTCString()}</pubDate>` : ''}
    </item>`,
    )
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>BandiAI FVG — Ultimi bandi</title>
    <link>${base}</link>
    <description>Bandi pubblici del Friuli Venezia Giulia</description>
    <language>it-IT</language>
${items}
  </channel>
</rss>`

  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } })
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
