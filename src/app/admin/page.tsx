import { redirect } from 'next/navigation'
import { Database, Rss, Users, Activity } from 'lucide-react'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { StatCard } from '@/components/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'Amministrazione' }

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'ADMIN') {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-bold">Accesso riservato</h1>
        <p className="text-muted-foreground">Serve il ruolo ADMIN per accedere a questa sezione.</p>
      </div>
    )
  }

  const [users, bandi, sources, recentRuns] = await Promise.all([
    prisma.user.count(),
    prisma.bando.count(),
    prisma.source.findMany({ orderBy: { lastRunAt: 'desc' } }),
    prisma.crawlRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: 10,
      include: { source: { select: { name: true } } },
    }),
  ])

  const runVariant: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
    SUCCESS: 'success',
    PARTIAL: 'warning',
    FAILED: 'destructive',
    RUNNING: 'secondary',
    QUEUED: 'secondary',
  }

  return (
    <div className="container space-y-8 py-8">
      <h1 className="text-3xl font-bold">Pannello di amministrazione</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Utenti" value={users} icon={Users} />
        <StatCard label="Bandi" value={bandi} icon={Database} />
        <StatCard label="Sorgenti" value={sources.length} icon={Rss} />
        <StatCard label="Sorgenti attive" value={sources.filter((s) => s.enabled).length} icon={Activity} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sorgenti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sources.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.kind} · ultima esecuzione: {s.lastRunAt?.toLocaleString('it-IT') ?? 'mai'}
                  </div>
                </div>
                <Badge variant={s.enabled ? 'success' : 'secondary'}>{s.enabled ? 'attiva' : 'disattiva'}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ultime esecuzioni crawler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentRuns.length === 0 && <p className="text-sm text-muted-foreground">Nessuna esecuzione registrata.</p>}
            {recentRuns.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="font-medium">{r.source.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.itemsNew} nuovi · {r.itemsUpdated} aggiornati · {r.errorCount} errori
                  </div>
                </div>
                <Badge variant={runVariant[r.status] ?? 'secondary'}>{r.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
