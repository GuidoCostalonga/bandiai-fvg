'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { GitCompareArrows, X } from 'lucide-react'
import { useUiStore } from '@/store/ui'
import { Button } from '@/components/ui/button'

/**
 * Floating bar shown whenever bandi are selected for comparison. Rendered once
 * globally in the root layout. Hidden until the store hydrates to avoid an
 * SSR/CSR mismatch (persisted state is only available on the client).
 */
export function CompareBar() {
  const compareSlugs = useUiStore((s) => s.compareSlugs)
  const clearCompare = useUiStore((s) => s.clearCompare)
  const toggleCompare = useUiStore((s) => s.toggleCompare)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => setHydrated(true), [])
  if (!hydrated || compareSlugs.length === 0) return null

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className="flex w-full max-w-2xl items-center gap-3 rounded-full border bg-background/95 p-2 pl-4 shadow-lg backdrop-blur">
        <GitCompareArrows className="h-5 w-5 shrink-0 text-primary" />
        <div className="flex flex-1 flex-wrap items-center gap-1.5">
          <span className="text-sm font-medium">{compareSlugs.length} selezionati:</span>
          {compareSlugs.map((slug) => (
            <button
              key={slug}
              onClick={() => toggleCompare(slug)}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs hover:bg-muted/70"
              title="Rimuovi"
            >
              <span className="max-w-[8rem] truncate">{slug}</span>
              <X className="h-3 w-3" />
            </button>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={clearCompare}>
          Svuota
        </Button>
        <Button size="sm" asChild disabled={compareSlugs.length < 2}>
          <Link href="/confronta">Confronta</Link>
        </Button>
      </div>
    </div>
  )
}
