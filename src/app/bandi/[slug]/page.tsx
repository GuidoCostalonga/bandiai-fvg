import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Building2, CalendarClock, Euro, FileText, ExternalLink, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BandoAssistant } from '@/components/bando-assistant'
import { formatCurrency, daysUntil } from '@/lib/utils'

async function getBando(slug: string) {
  return prisma.bando.findUnique({
    where: { slug },
    include: { aiInsight: true, documents: true, source: { select: { name: true, homepageUrl: true } } },
  })
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const bando = await getBando(slug).catch(() => null)
  if (!bando) return { title: 'Bando non trovato' }
  return { title: bando.title, description: bando.summary ?? undefined }
}

export default async function BandoDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const bando = await getBando(slug).catch(() => null)
  if (!bando) notFound()

  const days = daysUntil(bando.deadline)
  const insight = bando.aiInsight
  const checklist = (insight?.checklist as { label: string; required: boolean }[] | null) ?? []
  const faq = (insight?.faq as { q: string; a: string }[] | null) ?? []
  const timeline = (insight?.timeline as { label: string; date?: string; note?: string }[] | null) ?? []

  return (
    <div className="container grid gap-8 py-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{bando.status}</Badge>
            {bando.categories.map((c) => (
              <Badge key={c} variant="outline">{c.toLowerCase().replace(/_/g, ' ')}</Badge>
            ))}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{bando.title}</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="h-4 w-4" /> {bando.ente}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <InfoTile icon={Euro} label="Contributo max" value={formatCurrency(bando.contributoMax ? Number(bando.contributoMax) : null)} />
          <InfoTile icon={CalendarClock} label="Scadenza" value={days != null ? (days >= 0 ? `tra ${days} gg` : 'scaduto') : '—'} />
          <InfoTile icon={FileText} label="Codice" value={bando.codice ?? '—'} />
        </div>

        {insight?.plainSummary && (
          <Card>
            <CardHeader>
              <CardTitle>In parole semplici</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{insight.plainSummary}</p>
              {insight.keyPoints.length > 0 && (
                <ul className="space-y-1.5">
                  {insight.keyPoints.map((p, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {p}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        {bando.description && (
          <Card>
            <CardHeader>
              <CardTitle>Descrizione</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{bando.description}</p>
            </CardContent>
          </Card>
        )}

        {checklist.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" /> Checklist per partecipare
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {checklist.map((c, i) => (
                <label key={i} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="h-4 w-4 rounded border-input" />
                  {c.label}
                  {c.required && <Badge variant="secondary" className="text-[10px]">obbligatorio</Badge>}
                </label>
              ))}
            </CardContent>
          </Card>
        )}

        {insight && insight.mistakesToAvoid.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" /> Errori da evitare
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {insight.mistakesToAvoid.map((m, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-amber-500">•</span> {m}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {faq.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" /> Domande frequenti
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {faq.map((f, i) => (
                <details key={i} className="rounded-lg border p-3">
                  <summary className="cursor-pointer font-medium">{f.q}</summary>
                  <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sidebar */}
      <aside className="space-y-6">
        <Card>
          <CardContent className="space-y-3 p-6">
            <Button className="w-full" asChild>
              <a href={bando.sourceUrl} target="_blank" rel="noopener noreferrer">
                Vai al bando ufficiale <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            {insight?.successProbability != null && (
              <div className="rounded-lg bg-muted p-3 text-center">
                <div className="text-2xl font-bold text-primary">{Math.round(insight.successProbability * 100)}%</div>
                <div className="text-xs text-muted-foreground">probabilità di successo stimata</div>
              </div>
            )}
          </CardContent>
        </Card>

        {bando.documents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documentazione</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {bando.documents.map((d) => (
                <a
                  key={d.id}
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border p-2 text-sm hover:bg-accent"
                >
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="truncate">{d.filename ?? d.type}</span>
                </a>
              ))}
            </CardContent>
          </Card>
        )}

        {timeline.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {timeline.map((t, i) => (
                <div key={i} className="flex gap-3">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div>
                    <div className="text-sm font-medium">{t.label}</div>
                    {t.date && <div className="text-xs text-muted-foreground">{t.date}</div>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <BandoAssistant slug={bando.slug} />

        <p className="text-center text-xs text-muted-foreground">
          Fonte: <Link href={bando.source.homepageUrl} className="underline">{bando.source.name}</Link>
        </p>
      </aside>
    </div>
  )
}

function InfoTile({ icon: Icon, label, value }: { icon: typeof Euro; label: string; value: string }) {
  return (
    <div className="rounded-xl border p-4">
      <Icon className="mb-2 h-5 w-5 text-primary" />
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  )
}
