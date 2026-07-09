'use client'

import { useState } from 'react'
import { Send, Bot } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type Msg = { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
  'Posso partecipare?',
  'Fammi la checklist',
  'Riassumilo come se avessi 14 anni',
  'Quali documenti servono?',
]

/** Bando-grounded AI chat. Calls POST /api/ai/chat with the bando slug. */
export function BandoAssistant({ slug }: { slug: string }) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function send(text: string) {
    if (!text.trim() || loading) return
    const next: Msg[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bandoSlug: slug, messages: next }),
      })
      const data = await res.json()
      setMessages([...next, { role: 'assistant', content: data.reply ?? data.error ?? 'Errore' }])
    } catch {
      setMessages([...next, { role: 'assistant', content: 'Si è verificato un errore. Riprova.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bot className="h-5 w-5 text-primary" /> Assistente AI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="max-h-72 space-y-2 overflow-y-auto">
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border px-2.5 py-1 text-xs hover:bg-accent"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`rounded-lg p-2.5 text-sm ${
                m.role === 'user' ? 'ml-6 bg-primary text-primary-foreground' : 'mr-6 bg-muted'
              }`}
            >
              {m.content}
            </div>
          ))}
          {loading && <div className="mr-6 rounded-lg bg-muted p-2.5 text-sm text-muted-foreground">Sto scrivendo…</div>}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            send(input)
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Scrivi una domanda…"
            className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button type="submit" size="icon" disabled={loading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
