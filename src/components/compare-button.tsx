'use client'

import { GitCompareArrows, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useUiStore, COMPARE_LIMIT } from '@/store/ui'
import { cn } from '@/lib/utils'

/**
 * Toggle a bando in/out of the comparison set. Works from cards and the detail
 * page; state lives in the Zustand store (persisted) and drives the CompareBar.
 */
export function CompareButton({
  slug,
  variant = 'icon',
  className,
}: {
  slug: string
  variant?: 'icon' | 'full'
  className?: string
}) {
  const compareSlugs = useUiStore((s) => s.compareSlugs)
  const toggleCompare = useUiStore((s) => s.toggleCompare)
  const active = compareSlugs.includes(slug)

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!active && compareSlugs.length >= COMPARE_LIMIT) {
      toast.warning(`Puoi confrontare al massimo ${COMPARE_LIMIT} bandi`)
      return
    }
    toggleCompare(slug)
  }

  if (variant === 'full') {
    return (
      <button
        onClick={onClick}
        className={cn(
          'inline-flex w-full items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors',
          active ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-accent',
          className,
        )}
      >
        {active ? <Check className="h-4 w-4" /> : <GitCompareArrows className="h-4 w-4" />}
        {active ? 'Nel confronto' : 'Aggiungi al confronto'}
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      aria-label={active ? 'Rimuovi dal confronto' : 'Aggiungi al confronto'}
      title={active ? 'Rimuovi dal confronto' : 'Aggiungi al confronto'}
      className={cn(
        'grid h-8 w-8 place-items-center rounded-md border transition-colors',
        active ? 'border-primary bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent',
        className,
      )}
    >
      {active ? <Check className="h-4 w-4" /> : <GitCompareArrows className="h-4 w-4" />}
    </button>
  )
}
