import OpenAI from 'openai'
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'

/**
 * Provider-agnostic chat/JSON interface. Anthropic exposes an OpenAI-compatible
 * endpoint, so we route both providers through the OpenAI SDK by swapping the
 * baseURL — keeping a single, small surface for the rest of the app.
 */
export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

function makeClient(): { client: OpenAI; model: (kind: 'extract' | 'chat') => string } {
  if (env.AI_PROVIDER === 'anthropic') {
    if (!env.ANTHROPIC_API_KEY) logger.warn('ANTHROPIC_API_KEY not set — AI calls will fail')
    return {
      client: new OpenAI({
        apiKey: env.ANTHROPIC_API_KEY ?? 'missing',
        baseURL: 'https://api.anthropic.com/v1/',
      }),
      model: (kind) => (kind === 'extract' ? env.AI_EXTRACTION_MODEL : env.AI_CHAT_MODEL),
    }
  }
  if (!env.OPENAI_API_KEY) logger.warn('OPENAI_API_KEY not set — AI calls will fail')
  return {
    client: new OpenAI({ apiKey: env.OPENAI_API_KEY ?? 'missing' }),
    model: (kind) => (kind === 'extract' ? env.AI_EXTRACTION_MODEL : env.AI_CHAT_MODEL),
  }
}

const { client, model } = makeClient()

/** Free-form completion (used by the AI assistant chat). */
export async function complete(
  messages: ChatMessage[],
  opts: { kind?: 'extract' | 'chat'; temperature?: number } = {},
): Promise<string> {
  const res = await client.chat.completions.create({
    model: model(opts.kind ?? 'chat'),
    temperature: opts.temperature ?? 0.3,
    messages,
  })
  return res.choices[0]?.message?.content ?? ''
}

/**
 * JSON completion with retry. Instructs the model to emit strict JSON and
 * parses defensively. Callers validate the shape with Zod.
 */
export async function completeJson<T = unknown>(
  messages: ChatMessage[],
  opts: { kind?: 'extract' | 'chat'; retries?: number } = {},
): Promise<T> {
  const retries = opts.retries ?? 2
  let lastErr: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await client.chat.completions.create({
        model: model(opts.kind ?? 'extract'),
        temperature: 0,
        response_format: { type: 'json_object' },
        messages,
      })
      const text = res.choices[0]?.message?.content ?? '{}'
      return JSON.parse(extractJson(text)) as T
    } catch (err) {
      lastErr = err
      logger.warn('AI JSON completion failed, retrying', { attempt })
    }
  }
  throw lastErr
}

/** Some models wrap JSON in prose or ```json fences — recover the object. */
function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced?.[1]) return fenced[1].trim()
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end > start) return text.slice(start, end + 1)
  return text
}
