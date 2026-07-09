/**
 * Pure comparison logic for the "Confronta bandi" view. Kept free of React/DB so
 * it can be unit-tested and reused (API, export, etc.).
 */

export interface BandoComparable {
  slug: string
  title: string
  ente: string
  status: string
  categories: string[]
  beneficiari: string[]
  territorio: string | null
  importoTotale: number | null
  contributoMax: number | null
  percentualeFinanziabile: number | null
  deadline: string | Date | null
}

export interface ComparisonRow {
  key: string
  label: string
  /** One formatted cell per bando, in input order. */
  values: string[]
  /**
   * Index of the "best" bando for this row, when a meaningful winner exists
   * (e.g. highest contribution, latest deadline). `null` when not applicable.
   */
  bestIndex: number | null
}

const eur = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const fmtEur = (v: number | null) => (v == null ? '—' : eur.format(v))
const fmtPct = (v: number | null) => (v == null ? '—' : `${v}%`)
const fmtList = (v: string[]) => (v.length ? v.map((s) => s.toLowerCase().replace(/_/g, ' ')).join(', ') : '—')
const fmtDate = (v: string | Date | null) => {
  if (!v) return '—'
  const d = typeof v === 'string' ? new Date(v) : v
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('it-IT')
}

/** Index of the max numeric value; null if none present or all equal/absent. */
function argmax(values: Array<number | null>): number | null {
  let best: number | null = null
  let idx: number | null = null
  values.forEach((v, i) => {
    if (v == null) return
    if (best == null || v > best) {
      best = v
      idx = i
    }
  })
  // No winner to highlight if fewer than two comparable values.
  return values.filter((v) => v != null).length >= 2 ? idx : null
}

/** Index of the latest (max) date; useful to highlight "more time to apply". */
function argLatestDate(values: Array<string | Date | null>): number | null {
  const times = values.map((v) => {
    if (!v) return null
    const d = typeof v === 'string' ? new Date(v) : v
    return Number.isNaN(d.getTime()) ? null : d.getTime()
  })
  return argmax(times)
}

/** Build the comparison table rows for the given bandi (order preserved). */
export function buildComparisonRows(bandi: BandoComparable[]): ComparisonRow[] {
  return [
    { key: 'ente', label: 'Ente', values: bandi.map((b) => b.ente), bestIndex: null },
    { key: 'status', label: 'Stato', values: bandi.map((b) => b.status), bestIndex: null },
    { key: 'territorio', label: 'Territorio', values: bandi.map((b) => b.territorio ?? '—'), bestIndex: null },
    { key: 'categories', label: 'Categorie', values: bandi.map((b) => fmtList(b.categories)), bestIndex: null },
    { key: 'beneficiari', label: 'Beneficiari', values: bandi.map((b) => fmtList(b.beneficiari)), bestIndex: null },
    {
      key: 'contributoMax',
      label: 'Contributo massimo',
      values: bandi.map((b) => fmtEur(b.contributoMax)),
      bestIndex: argmax(bandi.map((b) => b.contributoMax)),
    },
    {
      key: 'importoTotale',
      label: 'Dotazione totale',
      values: bandi.map((b) => fmtEur(b.importoTotale)),
      bestIndex: argmax(bandi.map((b) => b.importoTotale)),
    },
    {
      key: 'percentuale',
      label: '% finanziabile',
      values: bandi.map((b) => fmtPct(b.percentualeFinanziabile)),
      bestIndex: argmax(bandi.map((b) => b.percentualeFinanziabile)),
    },
    {
      key: 'deadline',
      label: 'Scadenza',
      values: bandi.map((b) => fmtDate(b.deadline)),
      bestIndex: argLatestDate(bandi.map((b) => b.deadline)),
    },
  ]
}
