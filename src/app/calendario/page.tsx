import Link from 'next/link'
import { CalendarClock, Download } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { daysUntil } from '@/lib/utils'

export const metadata = { title: 'Calendario scadenze' }
export const revalidate = 600

export default async function CalendarioPage() {
  const bandi = await prisma.bando
    .findMany({
      where: { deadline: { gte: new Date() } },
      orderBy: { deadline: 'asc' },
      take: 100,
      select: { id: true, slug: true, title: true, ente: true, deadline: true, contributoMax: true },
    })
    .catch(() => [])

  // Group by month for a simple, readable agenda view.
  const groups = new Map<string, typeof bandi>()
  for (const b of bandi) {
    if (!b.deadline) continue
    const key = b.deadline.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
    groups.set(key, [...(groups.get(key) ?? []), b])
  }

  return (
    <div className="container space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendario scadenze</h1>
          <p className="text-muted-foreground">{bandi.length} bandi con scadenza futura</p>
        </div>
        <Button variant="outline" asChild>
          <a href="/api/calendar/ics">
            <Download className="h-4 w-4" /> Esporta ICS
          </a>
        </Button>
      </div>

      {groups.size === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">Nessuna scadenza in programma.</CardContent>
        </Card>
      ) : (
        [...groups.entries()].map(([month, items]) => (
          <Card key={month}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 capitalize">
                <CalendarClock className="h-5 w-5 text-primary" /> {month}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map((b) => {
                const d = daysUntil(b.deadline)
                return (
                  <Link
                    key={b.id}
                    href={`/bandi/${b.slug}`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent"
                  >
                    <div>
                      <div className="font-medium">{b.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {b.ente} · {b.deadline?.toLocaleDateString('it-IT')}
                      </div>
                    </div>
                    <Badge variant={d != null && d <= 7 ? 'warning' : 'secondary'}>{d} gg</Badge>
                  </Link>
                )
              })}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
