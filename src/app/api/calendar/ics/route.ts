import { prisma } from '@/lib/prisma'
import { env } from '@/lib/env'

/** GET /api/calendar/ics — deadlines as an iCalendar feed (Google/Apple/Outlook). */
export async function GET() {
  const bandi = await prisma.bando.findMany({
    where: { deadline: { gte: new Date() } },
    orderBy: { deadline: 'asc' },
    take: 500,
    select: { id: true, slug: true, title: true, ente: true, deadline: true },
  })

  const pad = (n: number) => String(n).padStart(2, '0')
  const toIcsDate = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(
      d.getUTCMinutes(),
    )}00Z`

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BandiAI FVG//Scadenze//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:BandiAI FVG — Scadenze',
  ]
  for (const b of bandi) {
    if (!b.deadline) continue
    lines.push(
      'BEGIN:VEVENT',
      `UID:${b.id}@bandiai.fvg`,
      `DTSTAMP:${toIcsDate(new Date())}`,
      `DTSTART:${toIcsDate(b.deadline)}`,
      `SUMMARY:Scadenza bando: ${escapeIcs(b.title)}`,
      `DESCRIPTION:${escapeIcs(b.ente)} — ${env.APP_URL}/bandi/${b.slug}`,
      `URL:${env.APP_URL}/bandi/${b.slug}`,
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')

  return new Response(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="bandiai-fvg.ics"',
    },
  })
}

function escapeIcs(text: string): string {
  return text.replace(/[\\,;]/g, (m) => `\\${m}`).replace(/\n/g, '\\n')
}
