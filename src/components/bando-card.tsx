import Link from 'next/link'
import { CalendarClock, Building2 } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, daysUntil, truncate } from '@/lib/utils'

export type BandoCardData = {
  slug: string
  title: string
  ente: string
  summary?: string | null
  status: string
  deadline?: Date | string | null
  contributoMax?: number | string | null
  categories: string[]
  territorio?: string | null
}

const statusVariant: Record<string, 'success' | 'warning' | 'secondary' | 'destructive'> = {
  OPEN: 'success',
  CLOSING_SOON: 'warning',
  CLOSED: 'destructive',
  DRAFT: 'secondary',
  ARCHIVED: 'secondary',
}

export function BandoCard({ bando }: { bando: BandoCardData }) {
  const days = daysUntil(bando.deadline)
  return (
    <Card className="group flex h-full flex-col transition-shadow hover:shadow-md">
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-2">
          <Badge variant={statusVariant[bando.status] ?? 'secondary'}>{bando.status}</Badge>
          {bando.contributoMax != null && (
            <span className="text-sm font-semibold text-primary">{formatCurrency(Number(bando.contributoMax))}</span>
          )}
        </div>
        <Link href={`/bandi/${bando.slug}`} className="font-semibold leading-snug group-hover:text-primary">
          {bando.title}
        </Link>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Building2 className="h-3.5 w-3.5" /> {bando.ente}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-3">
        {bando.summary && <p className="text-sm text-muted-foreground">{truncate(bando.summary, 140)}</p>}
        <div className="flex flex-wrap items-center gap-1.5">
          {bando.categories.slice(0, 3).map((c) => (
            <Badge key={c} variant="outline" className="text-[10px]">
              {c.toLowerCase().replace(/_/g, ' ')}
            </Badge>
          ))}
          {bando.territorio && <Badge variant="secondary" className="text-[10px]">{bando.territorio}</Badge>}
        </div>
        {days != null && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5" />
            {days >= 0 ? `Scade tra ${days} giorni` : 'Scaduto'}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
