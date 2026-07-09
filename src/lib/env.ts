import { z } from 'zod'

/**
 * Validated environment. Import `env` anywhere instead of reading
 * `process.env` directly so misconfiguration fails fast at boot.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_URL: z.string().url().default('http://localhost:3000'),

  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),

  AUTH_SECRET: z.string().min(1),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  AUTH_GITHUB_ID: z.string().optional(),
  AUTH_GITHUB_SECRET: z.string().optional(),

  AI_PROVIDER: z.enum(['openai', 'anthropic']).default('anthropic'),
  AI_EXTRACTION_MODEL: z.string().default('claude-sonnet-5'),
  AI_CHAT_MODEL: z.string().default('claude-sonnet-5'),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),

  TELEGRAM_BOT_TOKEN: z.string().optional(),
  DISCORD_WEBHOOK_URL: z.string().optional(),
  SLACK_WEBHOOK_URL: z.string().optional(),

  CRAWLER_USER_AGENT: z.string().default('BandiAI-FVG-Bot/1.0'),
  CRAWLER_CONCURRENCY: z.coerce.number().int().positive().default(4),
  CRAWLER_RATE_LIMIT_MS: z.coerce.number().int().nonnegative().default(1500),
  CRAWLER_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  PLAYWRIGHT_HEADLESS: z
    .string()
    .default('true')
    .transform((v) => v !== 'false'),

  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
})

// On the client, only NEXT_PUBLIC_* is available; guard so this module is
// only fully validated server-side.
const isServer = typeof window === 'undefined'

export const env = isServer
  ? schema.parse(process.env)
  : ({} as z.infer<typeof schema>)

export type Env = z.infer<typeof schema>
