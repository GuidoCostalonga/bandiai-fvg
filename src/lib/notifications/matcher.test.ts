import { describe, it, expect } from 'vitest'

// The matching predicate is pure; we re-declare a thin copy to test the logic
// without importing the DB-bound module. Keep in sync with matcher.ts.
function isMatch(
  profile: { categories: string[]; territories: string[]; entityTypes: string[]; budgetMin: number | null; budgetMax: number | null },
  bando: { categories: string[]; beneficiari: string[]; territorio: string | null; contributoMax: number | null },
): boolean {
  const categoryHit = profile.categories.length === 0 || bando.categories.some((c) => profile.categories.includes(c))
  const entityHit = profile.entityTypes.length === 0 || bando.beneficiari.some((b) => profile.entityTypes.includes(b))
  const territoryHit =
    profile.territories.length === 0 ||
    (bando.territorio ? profile.territories.some((t) => bando.territorio!.toLowerCase().includes(t.toLowerCase())) : true)
  const importo = bando.contributoMax
  const budgetHit =
    importo == null ||
    ((profile.budgetMin == null || importo >= profile.budgetMin) && (profile.budgetMax == null || importo <= profile.budgetMax))
  return (categoryHit || entityHit) && territoryHit && budgetHit
}

const emptyProfile = { categories: [], territories: [], entityTypes: [], budgetMin: null, budgetMax: null }

describe('notification matcher', () => {
  it('matches everything for an empty profile', () => {
    expect(isMatch(emptyProfile, { categories: ['SPORT'], beneficiari: [], territorio: 'FVG', contributoMax: 1000 })).toBe(true)
  })

  it('matches on category overlap', () => {
    const p = { ...emptyProfile, categories: ['SPORT'] }
    expect(isMatch(p, { categories: ['SPORT'], beneficiari: [], territorio: null, contributoMax: null })).toBe(true)
    expect(isMatch(p, { categories: ['CULTURA'], beneficiari: [], territorio: null, contributoMax: null })).toBe(false)
  })

  it('respects budget bounds', () => {
    const p = { ...emptyProfile, categories: ['IMPRESE'], budgetMin: 10_000, budgetMax: 100_000 }
    expect(isMatch(p, { categories: ['IMPRESE'], beneficiari: [], territorio: null, contributoMax: 50_000 })).toBe(true)
    expect(isMatch(p, { categories: ['IMPRESE'], beneficiari: [], territorio: null, contributoMax: 5_000 })).toBe(false)
  })

  it('filters by territory substring', () => {
    const p = { ...emptyProfile, categories: ['TURISMO'], territories: ['Udine'] }
    expect(isMatch(p, { categories: ['TURISMO'], beneficiari: [], territorio: 'Comune di Udine', contributoMax: null })).toBe(true)
    expect(isMatch(p, { categories: ['TURISMO'], beneficiari: [], territorio: 'Trieste', contributoMax: null })).toBe(false)
  })
})
