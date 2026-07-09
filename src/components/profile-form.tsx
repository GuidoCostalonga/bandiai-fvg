'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CATEGORY_VALUES, ENTITY_VALUES } from '@/lib/ai/schemas'

type Initial = {
  categories: string[]
  territories: string[]
  entityTypes: string[]
  budgetMin: number | null
  budgetMax: number | null
  atecoCode: string | null
  legalForm: string | null
  location: string | null
}

export function ProfileForm({ initial }: { initial: Initial }) {
  const [categories, setCategories] = useState<string[]>(initial.categories)
  const [entityTypes, setEntityTypes] = useState<string[]>(initial.entityTypes)
  const [territories, setTerritories] = useState(initial.territories.join(', '))
  const [budgetMin, setBudgetMin] = useState(initial.budgetMin?.toString() ?? '')
  const [budgetMax, setBudgetMax] = useState(initial.budgetMax?.toString() ?? '')
  const [atecoCode, setAteco] = useState(initial.atecoCode ?? '')
  const [saving, setSaving] = useState(false)

  const toggle = (list: string[], set: (v: string[]) => void, val: string) =>
    set(list.includes(val) ? list.filter((x) => x !== val) : [...list, val])

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories,
          entityTypes,
          territories: territories.split(',').map((t) => t.trim()).filter(Boolean),
          budgetMin: budgetMin ? Number(budgetMin) : null,
          budgetMax: budgetMax ? Number(budgetMax) : null,
          atecoCode: atecoCode || null,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('Profilo salvato')
    } catch {
      toast.error('Errore nel salvataggio')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Categorie di interesse</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-1.5">
          {CATEGORY_VALUES.map((c) => (
            <button key={c} onClick={() => toggle(categories, setCategories, c)}>
              <Badge variant={categories.includes(c) ? 'default' : 'outline'} className="cursor-pointer">
                {c.toLowerCase().replace(/_/g, ' ')}
              </Badge>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tipologia soggetto</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-1.5">
          {ENTITY_VALUES.map((e) => (
            <button key={e} onClick={() => toggle(entityTypes, setEntityTypes, e)}>
              <Badge variant={entityTypes.includes(e) ? 'default' : 'outline'} className="cursor-pointer">
                {e.toLowerCase().replace(/_/g, ' ')}
              </Badge>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dettagli</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Territori (comuni, separati da virgola)">
            <input value={territories} onChange={(e) => setTerritories(e.target.value)} className={inputCls} placeholder="Udine, Trieste" />
          </Field>
          <Field label="Codice ATECO">
            <input value={atecoCode} onChange={(e) => setAteco(e.target.value)} className={inputCls} placeholder="62.01.00" />
          </Field>
          <Field label="Budget minimo (€)">
            <input type="number" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Budget massimo (€)">
            <input type="number" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} className={inputCls} />
          </Field>
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving} size="lg">
        {saving ? 'Salvataggio…' : 'Salva profilo'}
      </Button>
    </div>
  )
}

const inputCls =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  )
}
