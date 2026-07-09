# Architettura — BandiAI FVG

## Vista d'insieme

```
                        ┌─────────────────────────────────────────┐
                        │              Next.js 15 (web)            │
   Browser  ──────────► │  App Router · RSC · API Routes           │
   (PWA)                │  Dashboard · Bandi · Area AI · Assistente │
                        └───────────┬───────────────┬─────────────┘
                                    │               │
                     Prisma         │               │  ioredis (cache)
                                    ▼               ▼
                          ┌──────────────┐   ┌──────────────┐
                          │  PostgreSQL  │   │    Redis     │
                          └──────▲───────┘   └──────▲───────┘
                                 │                  │ BullMQ
                     ┌───────────┴──────────────────┴───────────┐
                     │            Worker (processo separato)      │
                     │  ┌────────────┐   ┌────────────────────┐   │
                     │  │ crawl queue│──►│  Crawler engine    │   │
                     │  └────────────┘   │  fetch → extract   │   │
                     │  ┌────────────┐   │  → AI → persist    │   │
                     │  │notify queue│◄──┤  → notify matcher  │   │
                     │  └─────┬──────┘   └─────────┬──────────┘   │
                     └────────┼────────────────────┼─────────────┘
                              │                     │
                    Email/Telegram/…         OpenAI / Claude API
```

Il **web** serve richieste a bassa latenza (SSR/ISR + cache Redis). Tutto il lavoro
pesante — crawling, parsing PDF, chiamate AI, invio notifiche — gira nel **worker**
tramite code BullMQ, così l'UX non è mai bloccata.

## Componenti

### 1. Crawler (`src/crawler`)
- **engine.ts** — orchestrazione per sorgente: discover → fetch dettaglio + allegati →
  dedup → AI extract → AI insight → persist con versioning → notifiche. Concorrenza
  limitata (`p-limit`), rate limiting per sorgente, logging su `CrawlLog`, rollup su `CrawlRun`.
- **fetcher.ts** — `fetchHttp` (veloce) e `fetchBrowser` (Playwright headless per JS/Cloudflare),
  con retry a backoff esponenziale + jitter e anti-timeout (`AbortController`). Estrazione
  testo da PDF (`pdf-parse`) e Excel (`xlsx`).
- **parsers/** — un parser per sorgente (`Parser` interface). `GenericHtmlParser` euristico,
  `RssParser`, `RegioneFvgParser` dedicato. Registry in `parsers/index.ts` risolve per `parserKey`.
- **dedup.ts** — identità = `sourceUrl`; change detection = SHA-256 del testo. New / unchanged / changed.

### 2. AI (`src/lib/ai`)
- **client.ts** — interfaccia provider-agnostic. Sia OpenAI sia Anthropic passano dallo
  stesso SDK cambiando `baseURL`. `complete()` (chat) e `completeJson()` (JSON con retry
  e recupero da fence markdown).
- **extract.ts** — prompt di estrazione strutturata, validato con Zod (`bandoExtractionSchema`),
  fallback minimale se la validazione fallisce (la pipeline non si rompe mai).
- **insight.ts** — genera il bundle "Area AI" (riassunto semplice, checklist, FAQ, timeline…).

### 3. Dati (`prisma/schema.prisma`)
Modello normalizzato: `Source` → `CrawlRun` → `CrawlLog`; `Bando` → `AiInsight`,
`BandoDocument`, `BandoVersion`; utenti con `UserProfile`, `Favorite`, `SavedSearch`,
`NotificationChannel`, `Notification`; `AuditLog`, `Setting`. Indici su `status`,
`deadline`, `ente`, `sourceId`, `publishedAt`.

### 4. Notifiche (`src/lib/notifications`)
- **matcher.ts** — predicato puro ed esplicabile: overlap categoria/beneficiario +
  compatibilità territorio + budget. Estendibile con embedding semantici senza cambiare contratto.
- **dispatch.ts** — invio per canale (Telegram/Discord/Slack/Webhook nativi; Email/Push/WhatsApp
  via adapter), stato tracciato su `Notification.status` per retry.

### 5. Queue (`src/lib/queue`)
BullMQ su Redis. Code `crawl`, `notify`, `ai` con `attempts` + backoff esponenziale.
Il worker (`worker.ts`) è un processo/container separato. Scheduling via `/api/cron/crawl`
(Vercel Cron / Coolify scheduled task / cron di sistema) protetto da `CRON_SECRET`.

## Sicurezza

- **Input**: ogni endpoint valida con Zod. Prisma parametrizza le query (no SQL injection).
- **Rate limiting**: Redis fixed-window (`src/lib/security/rate-limit.ts`), fail-open.
- **Headers/CSP**: `middleware.ts` + `next.config.mjs` (X-Frame-Options, HSTS, nosniff, CSP).
- **Auth**: Auth.js con sessioni su DB; ruoli USER/EDITOR/ADMIN; `requireRole()` per guard.
- **Audit**: `AuditLog` per azioni sensibili. **2FA**: campi `twoFactorSecret/Enabled` predisposti.
- **Segreti**: solo via env validate (`src/lib/env.ts`), mai committati.

## Performance

- SSR + **ISR** (dashboard `revalidate=300`, calendario `600`), cache Redis cache-aside per
  statistiche e liste, `Cache-Control` + `stale-while-revalidate` sulle API pubbliche.
- `optimizePackageImports`, immagini AVIF/WebP, output `standalone` per immagini Docker snelle.
- Lavoro pesante fuori dal request path (BullMQ). Indici DB su tutti i filtri caldi.

## Estensibilità

Aggiungere una sorgente = 1 riga nel seed + (eventuale) parser dedicato registrato in
`parsers/index.ts`. Aggiungere un canale notifiche = un `case` in `dispatch.ts`. Aggiungere
un campo bando = colonna Prisma + campo nello schema Zod di estrazione.
