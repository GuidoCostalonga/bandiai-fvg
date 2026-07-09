import { searchParamsSchema, searchBandi } from '@/lib/bandi/search'
import { BandoCard } from '@/components/bando-card'
import { BandiFilters } from '@/components/bandi-filters'
import { Card, CardContent } from '@/components/ui/card'

export const metadata = { title: 'Bandi' }

/** Server-rendered, filterable list. Filters are driven by URL search params. */
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
  const result = await searchBandi(params).catch(() => null)

  return (
    <div className="container space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold">Bandi</h1>
        <p className="text-muted-foreground">
          {result ? `${result.total} bandi trovati` : 'Database non disponibile'}
        </p>
      </div>

      <BandiFilters />

      {!result || result.items.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            Nessun bando corrisponde ai filtri. Prova ad allargare la ricerca.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((b) => (
            <BandoCard
              key={b.id}
              bando={{
                slug: b.slug,
                title: b.title,
                ente: b.ente,
                summary: b.summary,
                status: b.status,
                deadline: b.deadline,
                contributoMax: b.contributoMax ? Number(b.contributoMax) : null,
                categories: b.categories,
                territorio: b.territorio,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
