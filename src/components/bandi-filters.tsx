'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useCallback } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

const QUICK = [
  { key: 'onlyOpen', label: 'Solo aperti' },
  { key: 'onlyFvg', label: 'Solo FVG' },
  { key: 'onlyPnrr', label: 'PNRR' },
  { key: 'onlyEu', label: 'Europa' },
]

/** Client filter bar. Serialises state into the URL so results stay shareable. */
export function BandiFilters() {
  const router = useRouter()
  const params = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString())
      if (value) next.set(key, value)
      else next.delete(key)
      next.delete('page')
      router.push(`/bandi?${next.toString()}`)
    },
    [params, router],
  )

  return (
    <div className="flex flex-col gap-3 rounded-xl border p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setParam('q', q || null)
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cerca per titolo, ente, parola chiave…"
            className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <Button type="submit">Cerca</Button>
      </form>

      <div className="flex flex-wrap gap-2">
        {QUICK.map((f) => {
          const active = params.get(f.key) === 'true'
          return (
            <Button
              key={f.key}
              type="button"
              size="sm"
              variant={active ? 'default' : 'outline'}
              onClick={() => setParam(f.key, active ? null : 'true')}
            >
              {f.label}
            </Button>
          )
        })}
        <select
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          value={params.get('sort') ?? 'recent'}
          onChange={(e) => setParam('sort', e.target.value)}
        >
          <option value="recent">Più recenti</option>
          <option value="deadline">Scadenza vicina</option>
          <option value="importo">Importo maggiore</option>
        </select>
      </div>
    </div>
  )
}
