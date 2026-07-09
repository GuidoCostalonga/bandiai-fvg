import { completeJson } from './client'
import { aiInsightSchema, type AiInsight } from './schemas'
import type { BandoExtraction } from './schemas'

const SYSTEM = `Sei un consulente che aiuta cittadini, imprese ed enti a capire e vincere i bandi.
Dato un bando strutturato, produci una guida pratica in italiano semplice, in JSON.
Includi: plainSummary (spiegazione "come se avessi 14 anni"), keyPoints, checklist
(cosa serve per partecipare), faq (domande frequenti), mistakesToAvoid,
successProbability (0-1, stima onesta), practicalAdvice, timeline, requiredDocs.
Rispondi SOLO con JSON valido.`

/** Generate the "Area AI" bundle for a bando from its structured fields. */
export async function generateInsight(bando: BandoExtraction): Promise<AiInsight> {
  const user = `Bando strutturato:\n${JSON.stringify(bando, null, 2)}\n\nGenera la guida JSON.`
  const json = await completeJson<unknown>(
    [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: user },
    ],
    { kind: 'extract' },
  )
  const parsed = aiInsightSchema.safeParse(json)
  if (parsed.success) return parsed.data
  // Minimal fallback keeps the bando usable even if insight generation degrades.
  return aiInsightSchema.parse({
    plainSummary: bando.summary ?? bando.description ?? bando.title,
  })
}
