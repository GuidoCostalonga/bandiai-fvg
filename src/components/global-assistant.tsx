'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type Msg = { role: 'user' | 'assistant'; content: string }

/** Full-page AI assistant (not bound to a specific bando). */
export function GlobalAssistant() {
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
        body: JSON.stringify({ messages: next }),
      })
      const data = await res.json()
      setMessages([...next, { role: 'assistant', content: data.reply ?? data.error ?? 'Errore' }])
    } catch {
      setMessages([...next, { role: 'assistant', content: 'Errore di connessione.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="min-h-[300px] space-y-2">
          {messages.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Inizia una conversazione. Devi essere autenticato per usare l'assistente.
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`rounded-lg p-3 text-sm ${
                m.role === 'user' ? 'ml-12 bg-primary text-primary-foreground' : 'mr-12 bg-muted'
              }`}
            >
              {m.content}
            </div>
          ))}
          {loading && <div className="mr-12 rounded-lg bg-muted p-3 text-sm text-muted-foreground">Sto scrivendo…</div>}
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
            placeholder="Scrivi qui…"
            className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button type="submit" disabled={loading}>
            <Send className="h-4 w-4" /> Invia
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
