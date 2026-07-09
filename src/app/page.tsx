import Link from 'next/link'
import { FileText, Clock, TrendingUp, Sparkles, CalendarClock, Euro } from 'lucide-react'
import { getDashboardStats } from '@/lib/bandi/stats'
import { StatCard } from '@/components/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, daysUntil } from '@/lib/utils'

export const revalidate = 300 // ISR: refresh dashboard every 5 minutes

export default async function DashboardPage() {
  const stats = await getDashboardStats().catch(() => null)

  return (
    <div className="container space-y-8 py-8">
      <section className="flex flex-col gap-4 rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-8">
        <Badge variant="secondary" className="w-fit gap-1">
          <Sparkles className="h-3 w-3" /> Powered by AI
        </Badge>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight">
          Non cercare i bandi. <span className="text-primary">Te li troviamo noi.</span>
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          BandiAI FVG monitora automaticamente Regione, Comuni, Camere di Commercio, Ministeri, PNRR e programmi
          europei. L'intelligenza artificiale legge, riassume e ti avvisa quando esce un bando adatto a te.
        </p>
        <div className="flex gap-3">
          <Button asChild size="lg">
            <Link href="/bandi">Esplora i bandi</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/profilo">Imposta i tuoi interessi</Link>
          </Button>
        </div>
      </section>

      {stats ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Bandi totali" value={stats.total} icon={FileText} />
            <StatCard label="Attualmente aperti" value={stats.open} icon={TrendingUp} accent="bg-emerald-500/10 text-emerald-600" />
            <StatCard label="In scadenza (7gg)" value={stats.closingSoon} icon={Clock} accent="bg-amber-500/10 text-amber-600" />
            <StatCard label="Finanziamenti mappati" value={formatCurrency(stats.totalFunding)} icon={Euro} accent="bg-blue-500/10 text-blue-600" />
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Nuovi oggi" value={stats.newToday} icon={Sparkles} hint="ultime 24 ore" />
            <StatCard label="Nuovi questa settimana" value={stats.newWeek} icon={Sparkles} hint="ultimi 7 giorni" />
            <StatCard label="Nuovi questo mese" value={stats.newMonth} icon={Sparkles} hint="ultimi 30 giorni" />
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-primary" /> Scadenze imminenti
                </CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/calendario">Calendario →</Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.upcoming.length === 0 && <p className="text-sm text-muted-foreground">Nessuna scadenza a breve.</p>}
                {stats.upcoming.map((b) => {
                  const d = daysUntil(b.deadline)
                  return (
                    <Link
                      key={b.id}
                      href={`/bandi/${b.slug}`}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">{b.title}</div>
                        <div className="truncate text-xs text-muted-foreground">{b.ente}</div>
                      </div>
                      <Badge variant={d != null && d <= 7 ? 'warning' : 'secondary'}>
                        {d != null ? `${d} gg` : '—'}
                      </Badge>
                    </Link>
                  )
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Euro className="h-5 w-5 text-primary" /> Bandi più finanziati
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.topFunded.length === 0 && <p className="text-sm text-muted-foreground">Ancora nessun dato.</p>}
                {stats.topFunded.map((b) => (
                  <Link
                    key={b.id}
                    href={`/bandi/${b.slug}`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{b.title}</div>
                      <div className="truncate text-xs text-muted-foreground">{b.ente}</div>
                    </div>
                    <span className="font-semibold text-primary">{formatCurrency(b.contributoMax)}</span>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p>Il database non è ancora raggiungibile o non contiene dati.</p>
            <p className="mt-2 text-sm">
              Esegui <code className="rounded bg-muted px-1">pnpm prisma migrate dev</code> e{' '}
              <code className="rounded bg-muted px-1">pnpm db:seed</code>, poi avvia un crawl.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
