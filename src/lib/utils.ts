import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Tailwind-aware className merge (shadcn/ui convention). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Note: hashing/slug helpers live in `@/lib/hash` (server-only) because this
// module is bundled for the client and `node:crypto` isn't available there.

const eur = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '—'
  return eur.format(value)
}

export function daysUntil(date: Date | string | null | undefined): number | null {
  if (!date) return null
  const d = typeof date === 'string' ? new Date(date) : date
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000)
}

export function truncate(text: string, max = 160): string {
  return text.length <= max ? text : text.slice(0, max - 1).trimEnd() + '…'
}
