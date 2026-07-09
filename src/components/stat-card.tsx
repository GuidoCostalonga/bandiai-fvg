import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  accent,
}: {
  label: string
  value: string | number
  icon: LucideIcon
  hint?: string
  accent?: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className={cn('grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary', accent)}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <div className="text-2xl font-bold tabular-nums">{value}</div>
          <div className="text-sm text-muted-foreground">{label}</div>
          {hint && <div className="text-xs text-muted-foreground/70">{hint}</div>}
        </div>
      </CardContent>
    </Card>
  )
}
