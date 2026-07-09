import { describe, it, expect } from 'vitest'
import { buildComparisonRows, type BandoComparable } from './compare'

const base: Omit<BandoComparable, 'slug' | 'title'> = {
  ente: 'Regione FVG',
  status: 'OPEN',
  categories: ['SPORT'],
  beneficiari: ['COMUNE'],
  territorio: 'FVG',
  importoTotale: null,
  contributoMax: null,
  percentualeFinanziabile: null,
  deadline: null,
}

function row(rows: ReturnType<typeof buildComparisonRows>, key: string) {
  return rows.find((r) => r.key === key)!
}

describe('buildComparisonRows', () => {
  it('formats currency and marks the highest contribution', () => {
    const bandi: BandoComparable[] = [
      { ...base, slug: 'a', title: 'A', contributoMax: 50_000 },
      { ...base, slug: 'b', title: 'B', contributoMax: 120_000 },
    ]
    const r = row(buildComparisonRows(bandi), 'contributoMax')
    expect(r.values[0]).toContain('50.000')
    expect(r.values[1]).toContain('120.000')
    expect(r.bestIndex).toBe(1)
  })

  it('does not highlight a winner when only one value is present', () => {
    const bandi: BandoComparable[] = [
      { ...base, slug: 'a', title: 'A', contributoMax: 50_000 },
      { ...base, slug: 'b', title: 'B', contributoMax: null },
    ]
    expect(row(buildComparisonRows(bandi), 'contributoMax').bestIndex).toBeNull()
  })

  it('highlights the latest deadline (more time to apply)', () => {
    const bandi: BandoComparable[] = [
      { ...base, slug: 'a', title: 'A', deadline: '2025-09-01' },
      { ...base, slug: 'b', title: 'B', deadline: '2025-12-31' },
    ]
    expect(row(buildComparisonRows(bandi), 'deadline').bestIndex).toBe(1)
  })

  it('renders em-dash for missing values and never highlights text rows', () => {
    const bandi: BandoComparable[] = [
      { ...base, slug: 'a', title: 'A', territorio: null },
      { ...base, slug: 'b', title: 'B' },
    ]
    const rows = buildComparisonRows(bandi)
    expect(row(rows, 'territorio').values[0]).toBe('—')
    expect(row(rows, 'ente').bestIndex).toBeNull()
  })

  it('keeps input order', () => {
    const bandi: BandoComparable[] = [
      { ...base, slug: 'x', title: 'X', ente: 'Comune di Udine' },
      { ...base, slug: 'y', title: 'Y', ente: 'Comune di Trieste' },
    ]
    expect(row(buildComparisonRows(bandi), 'ente').values).toEqual(['Comune di Udine', 'Comune di Trieste'])
  })
})
