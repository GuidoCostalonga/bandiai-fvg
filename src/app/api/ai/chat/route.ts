import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { complete, type ChatMessage } from '@/lib/ai/client'
import { rateLimit } from '@/lib/security/rate-limit'

const bodySchema = z.object({
  bandoSlug: z.string().optional(),
  messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(4000) })).min(1),
})

const SYSTEM = `Sei l'assistente AI di BandiAI FVG. Aiuti gli utenti a capire i bandi:
requisiti, ammissibilità, documenti, scadenze, e a preparare le domande.
Rispondi in italiano, in modo chiaro e concreto. Se ti viene fornito il contesto
di un bando specifico, basa le risposte su quello e cita i dati (importi, scadenze).
Non inventare requisiti: se non sai, dillo e invita a controllare il testo ufficiale.`

/** POST /api/ai/chat — the "Assistente AI" chat, optionally bando-grounded. */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { success } = await rateLimit(`ai-chat:${session.user.id}`, 20, 60)
  if (!success) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })

  const parsed = bodySchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 })

  let context = ''
  if (parsed.data.bandoSlug) {
    const bando = await prisma.bando.findUnique({
      where: { slug: parsed.data.bandoSlug },
      include: { aiInsight: true },
    })
    if (bando) {
      context = `\n\nCONTESTO BANDO:\n${JSON.stringify(
        {
          title: bando.title,
          ente: bando.ente,
          deadline: bando.deadline,
          contributoMax: bando.contributoMax,
          beneficiari: bando.beneficiari,
          obiettivi: bando.obiettivi,
          documentazioneRichiesta: bando.documentazioneRichiesta,
          summary: bando.summary,
        },
        null,
        2,
      )}`
    }
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM + context },
    ...parsed.data.messages,
  ]
  const reply = await complete(messages, { kind: 'chat', temperature: 0.4 })
  return NextResponse.json({ reply })
}
