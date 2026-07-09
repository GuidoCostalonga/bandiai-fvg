import { createHash } from 'node:crypto'

/**
 * Server-only hashing/slug helpers. Kept out of `utils.ts` because that module
 * is imported by client components (for `cn`), and `node:crypto` cannot be
 * bundled for the browser.
 */

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
