import { Sparkles } from 'lucide-react'
import { searchParamsSchema, searchBandi } from '@/lib/bandi/search'
import { semanticSearch } from '@/lib/bandi/semantic'
import { BandoCard } from '@/components/bando-card'
import { BandiFilters } from '@/components/bandi-filters'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'Bandi' }

type CardItem = {
  id: string
  slug: string
  title: string
  ente: string
  summary: string | null
  status: string
  deadline: Date | null
  contributoMax: number | null
  categories: string[]
  territorio: string | null
  score?: number
}

/** Server-rendered, filterable list. Supports keyword and AI semantic search. */
export default async function BandiPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>
}) {
  const sp = await searchParams
  const parsed = searchParamsSchema.safeParse({
    ...sp,
    categories: sp.categories ? [sp.categories].flat() : undefined,
  })
  const params = parsed.success ? parsed.data : searchParamsSchema.parse({})
  const wantSemantic = sp.semantic === 'true' && !!params.q

  let items: CardItem[] = []
  let total = 0
  let mode: 'keyword' | 'semantic' = 'keyword'
  let dbError = false

  try {
    if (wantSemantic) {
      const sem = await semanticSearch(params.q!, {
        limit: 30,
        onlyOpen: params.onlyOpen,
        onlyFvg: params.onlyFvg,
      })
      if (sem) {
        mode = 'semantic'
        items = sem.items.map((b) => ({ ...b, contributoMax: b.contributoMax ? Number(b.contributoMax) : null }))
        total = sem.items.length
      }
    }
    if (mode === 'keyword') {
      const result = await searchBandi(params)
      total = result.total
      items = result.items.map((b) => ({
        id: b.id,
        slug: b.slug,
        title: b.title,
        ente: b.ente,
        summary: b.summary,
        status: b.status,
        deadline: b.deadline,
        contributoMax: b.contributoMax ? Number(b.contributoMax) : null,
        categories: b.categories,
        territorio: b.territorio,
      }))
    }
  } catch {
    dbError = true
  }

  return (
    <div className="container space-y-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold">Bandi</h1>
          <p className="text-muted-foreground">{dbError ? 'Database non disponibile' : `${total} bandi trovati`}</p>
        </div>
        {mode === 'semantic' && (
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" /> Ricerca semantica AI
          </Badge>
        )}
      </div>

      <BandiFilters />

      {wantSemantic && mode === 'keyword' && !dbError && (
        <p className="text-sm text-muted-foreground">
          Ricerca semantica non disponibile (embedding non configurati): mostro i risultati per parola chiave.
        </p>
      )}

      {dbError || items.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            {dbError
              ? 'Database non raggiungibile.'
              : 'Nessun bando corrisponde ai filtri. Prova ad allargare la ricerca o attiva la ricerca AI.'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((b) => (
            <BandoCard key={b.id} bando={b} />
          ))}
        </div>
      )}
    </div>
  )
}
