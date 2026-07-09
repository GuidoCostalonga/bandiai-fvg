import { describe, it, expect } from 'vitest'
import { toVectorLiteral, buildEmbeddingText, EMBEDDING_DIMENSIONS } from './embeddings'

describe('toVectorLiteral', () => {
  it('serialises a vector as a pgvector literal', () => {
    expect(toVectorLiteral([0.1, 0.2, -0.3])).toBe('[0.1,0.2,-0.3]')
  })
  it('produces valid syntax for an empty vector', () => {
    expect(toVectorLiteral([])).toBe('[]')
  })
})

describe('buildEmbeddingText', () => {
  it('combines the semantically meaningful fields', () => {
    const text = buildEmbeddingText({
      title: 'Contributi impianti sportivi',
      ente: 'Regione FVG',
      summary: 'Fondi per palestre e piscine comunali',
      keywords: ['sport', 'impianti'],
      categories: ['SPORT', 'IMPIANTISTICA_SPORTIVA'],
      obiettivi: ['Riqualificare gli impianti'],
    })
    expect(text).toContain('Contributi impianti sportivi')
    expect(text).toContain('Regione FVG')
    expect(text).toContain('palestre')
    expect(text).toContain('SPORT')
    expect(text).toContain('impianti')
  })

  it('falls back to description when summary is missing and skips empty fields', () => {
    const text = buildEmbeddingText({ title: 'T', ente: 'E', description: 'D' })
    expect(text).toContain('D')
    // no stray empty lines from missing arrays
    expect(text.split('\n').every((l) => l.length > 0)).toBe(true)
  })
})

describe('embedding dimensions', () => {
  it('matches the vector column width', () => {
    expect(EMBEDDING_DIMENSIONS).toBe(1536)
  })
})
