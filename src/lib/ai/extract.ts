import { completeJson } from './client'
import { bandoExtractionSchema, type BandoExtraction, CATEGORY_VALUES, ENTITY_VALUES } from './schemas'
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'

const SYSTEM = `Sei un analista esperto di bandi e finanziamenti pubblici italiani ed europei.
Ricevi il testo grezzo di un bando (estratto da PDF/DOC/HTML/Excel) e devi estrarre
informazioni strutturate in JSON. Regole:
- Rispondi SOLO con un oggetto JSON valido, senza testo aggiuntivo.
- Le date devono essere in formato ISO 8601 (YYYY-MM-DD) o null se assenti.
- Gli importi sono numeri in EUR senza separatori (es. 50000), null se assenti.
- percentualeFinanziabile è un numero 0-100 o null.
- "categories" solo tra: ${CATEGORY_VALUES.join(', ')}.
- "beneficiari" solo tra: ${ENTITY_VALUES.join(', ')}.
- "summary" è un riassunto neutro di 2-3 frasi.
- Non inventare dati: se un'informazione non è presente usa null o array vuoto.`

/**
 * Extract a structured bando from raw document text. The source text is
 * truncated to a safe budget; for very large PDFs the crawler should pass the
 * most relevant sections (title page + articles) first.
 */
export async function extractBando(input: {
  title?: string
  sourceUrl: string
  rawText: string
}): Promise<BandoExtraction> {
  const raw = input.rawText.slice(0, 120_000)
  const user = `URL sorgente: ${input.sourceUrl}
${input.title ? `Titolo pagina: ${input.title}\n` : ''}
--- TESTO BANDO ---
${raw}
--- FINE TESTO ---

Estrai il JSON strutturato.`

  const json = await completeJson<unknown>(
    [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: user },
    ],
    { kind: 'extract' },
  )

  const parsed = bandoExtractionSchema.safeParse(json)
  if (!parsed.success) {
    logger.warn('Bando extraction failed validation', {
      url: input.sourceUrl,
      issues: parsed.error.issues.slice(0, 5),
    })
    // Fall back to a minimal record so the pipeline can still store the bando.
    return bandoExtractionSchema.parse({
      title: input.title ?? 'Bando senza titolo',
      ente: 'Sconosciuto',
    })
  }
  logger.info('Bando extracted', { url: input.sourceUrl, model: env.AI_EXTRACTION_MODEL })
  return parsed.data
}
