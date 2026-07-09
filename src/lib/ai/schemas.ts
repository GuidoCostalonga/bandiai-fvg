import { z } from 'zod'

/** Categories & entity types mirror the Prisma enums (kept in sync manually). */
export const CATEGORY_VALUES = [
  'IMPRESE', 'PMI', 'STARTUP', 'ARTIGIANI', 'AGRICOLTURA', 'SPORT', 'COMUNI',
  'ASSOCIAZIONI', 'TERZO_SETTORE', 'SCUOLE', 'UNIVERSITA', 'TURISMO', 'CULTURA',
  'ENERGIA', 'DIGITALE', 'INNOVAZIONE', 'EXPORT', 'INTERNAZIONALIZZAZIONE',
  'IMPIANTISTICA_SPORTIVA', 'PROTEZIONE_CIVILE', 'AMBIENTE', 'GIOVANI', 'ANZIANI',
  'FAMIGLIE', 'DISABILITA', 'DSA', 'SANITA', 'MOBILITA', 'SICUREZZA', 'RICERCA', 'ALTRO',
] as const

export const ENTITY_VALUES = [
  'IMPRESA', 'PMI', 'STARTUP', 'LIBERO_PROFESSIONISTA', 'ASSOCIAZIONE',
  'ENTE_PUBBLICO', 'COMUNE', 'SCUOLA', 'UNIVERSITA', 'ENTE_TERZO_SETTORE',
  'PRIVATO_CITTADINO', 'COOPERATIVA', 'CONSORZIO', 'ALTRO',
] as const

/** Shape the AI must return when extracting a bando from raw documents. */
export const bandoExtractionSchema = z.object({
  title: z.string(),
  ente: z.string(),
  description: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  importoTotale: z.number().nullable().optional(),
  contributoMax: z.number().nullable().optional(),
  percentualeFinanziabile: z.number().nullable().optional(),
  publishedAt: z.string().nullable().optional(),
  opensAt: z.string().nullable().optional(),
  deadline: z.string().nullable().optional(),
  categories: z.array(z.enum(CATEGORY_VALUES)).default([]),
  beneficiari: z.array(z.enum(ENTITY_VALUES)).default([]),
  keywords: z.array(z.string()).default([]),
  territorio: z.string().nullable().optional(),
  codice: z.string().nullable().optional(),
  normativa: z.string().nullable().optional(),
  contatti: z.record(z.string()).nullable().optional(),
  obiettivi: z.array(z.string()).default([]),
  vincoli: z.array(z.string()).default([]),
  documentazioneRichiesta: z.array(z.string()).default([]),
  speseAmmissibili: z.array(z.string()).default([]),
  speseEscluse: z.array(z.string()).default([]),
  tempistiche: z.string().nullable().optional(),
  procedura: z.string().nullable().optional(),
  valutazione: z.string().nullable().optional(),
})
export type BandoExtraction = z.infer<typeof bandoExtractionSchema>

/** Shape for the "Area AI" insight bundle. */
export const aiInsightSchema = z.object({
  plainSummary: z.string(),
  keyPoints: z.array(z.string()).default([]),
  checklist: z.array(z.object({ label: z.string(), required: z.boolean().default(true) })).default([]),
  faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
  mistakesToAvoid: z.array(z.string()).default([]),
  successProbability: z.number().min(0).max(1).nullable().optional(),
  practicalAdvice: z.array(z.string()).default([]),
  timeline: z.array(z.object({ label: z.string(), date: z.string().nullable().optional(), note: z.string().optional() })).default([]),
  requiredDocs: z.array(z.string()).default([]),
})
export type AiInsight = z.infer<typeof aiInsightSchema>
