import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { createHash } from 'node:crypto'

/** Tailwind-aware className merge (shadcn/ui convention). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Deterministic content hash for deduplication + change detection. */
export function contentHash(input: string): string {
  return createHash('sha256').update(input.trim()).digest('hex')
}

/** URL-safe slug, collision-resistant via short hash suffix. */
export function slugify(text: string, salt?: string): string {
  const base = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritics after NFD
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 80)
  if (!salt) return base
  const suffix = createHash('sha1').update(salt).digest('hex').slice(0, 6)
  return `${base}-${suffix}`
}

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
