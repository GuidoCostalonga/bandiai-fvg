'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { GitCompareArrows, X, ExternalLink, Trophy } from 'lucide-react'
import { useUiStore } from '@/store/ui'
import { buildComparisonRows, type BandoComparable } from '@/lib/bandi/compare'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Side-by-side comparison of the selected bandi. Client-rendered: the selection
 * lives in the persisted Zustand store, then we hydrate the full records from
 * the API and render a comparison table with "best value" highlights.
 */
export default function ConfrontaPage() {
  const compareSlugs = useUiStore((s) => s.compareSlugs)
  const toggleCompare = useUiStore((s) => s.toggleCompare)
  const clearCompare = useUiStore((s) => s.clearCompare)
  const [items, setItems] = useState<BandoComparable[] | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (compareSlugs.length === 0) {
      setItems([])
      return
    }
    setLoading(true)
    fetch(`/api/bandi/compare?slugs=${encodeURIComponent(compareSlugs.join(','))}`)
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [compareSlugs])

  const rows = items ? buildComparisonRows(items) : []

  return (
    <div className="container space-y-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <GitCompareArrows className="h-7 w-7 text-primary" /> Confronto bandi
          </h1>
          <p className="text-muted-foreground">Fino a 3 bandi affiancati. Il valore migliore per riga è evidenziato.</p>
        </div>
        {compareSlugs.length > 0 && (
          <Button variant="outline" onClick={clearCompare}>
            Svuota selezione
          </Button>
        )}
      </div>

      {loading && <div className="skeleton h-64 w-full" />}

      {!loading && (!items || items.length === 0) && (
        <Card>
          <CardContent className="space-y-3 p-10 text-center text-muted-foreground">
            <p>Nessun bando selezionato per il confronto.</p>
            <Button asChild>
              <Link href="/bandi">Vai ai bandi</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && items && items.length > 0 && (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="w-40 p-3 text-left font-medium text-muted-foreground">Caratteristica</th>
                {items.map((b) => (
                  <th key={b.slug} className="p-3 text-left align-top">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/bandi/${b.slug}`} className="font-semibold hover:text-primary">
                        {b.title}
                      </Link>
                      <button
                        onClick={() => toggleCompare(b.slug)}
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        title="Rimuovi dal confronto"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-b last:border-0">
                  <td className="p-3 font-medium text-muted-foreground">{row.label}</td>
                  {row.values.map((value, i) => (
                    <td
                      key={i}
                      className={cn(
                        'p-3 align-top',
                        row.bestIndex === i && 'font-semibold text-primary',
                      )}
                    >
                      <span className="inline-flex items-center gap-1">
                        {row.bestIndex === i && <Trophy className="h-3.5 w-3.5" />}
                        {value}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="p-3" />
                {items.map((b) => (
                  <td key={b.slug} className="p-3">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/bandi/${b.slug}`}>
                        Dettaglio <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
