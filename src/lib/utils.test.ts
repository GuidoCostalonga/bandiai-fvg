import { describe, it, expect } from 'vitest'
import { contentHash, slugify, formatCurrency, daysUntil, truncate } from './utils'

describe('contentHash', () => {
  it('is stable and whitespace-insensitive at the edges', () => {
    expect(contentHash('  hello ')).toBe(contentHash('hello'))
  })
  it('changes when content changes', () => {
    expect(contentHash('a')).not.toBe(contentHash('b'))
  })
})

describe('slugify', () => {
  it('normalises accents and spaces', () => {
    expect(slugify('Bando Città di Udine 2025!')).toBe('bando-citta-di-udine-2025')
  })
  it('appends a deterministic suffix when salted', () => {
    const a = slugify('Bando', 'https://x/1')
    const b = slugify('Bando', 'https://x/1')
    const c = slugify('Bando', 'https://x/2')
    expect(a).toBe(b)
    expect(a).not.toBe(c)
  })
})

describe('formatCurrency', () => {
  it('formats EUR and handles null', () => {
    expect(formatCurrency(null)).toBe('—')
    expect(formatCurrency(50000)).toContain('50.000')
  })
})

describe('daysUntil', () => {
  it('returns null for missing date', () => {
    expect(daysUntil(null)).toBeNull()
  })
  it('is positive for future dates', () => {
    const future = new Date(Date.now() + 5 * 86_400_000)
    expect(daysUntil(future)).toBeGreaterThan(3)
  })
})

describe('truncate', () => {
  it('leaves short strings untouched', () => {
    expect(truncate('short', 10)).toBe('short')
  })
  it('adds an ellipsis when over the limit', () => {
    expect(truncate('abcdefghij', 5)).toMatch(/…$/)
  })
})
