# BandiAI FVG 🇮🇹⚡

**Il sistema intelligente di monitoraggio automatico dei bandi pubblici del Friuli Venezia Giulia.**

BandiAI FVG trova i bandi al posto tuo. Un motore di crawling professionale sorveglia
in continuo Regione, Comuni, Province, Camere di Commercio, Ministeri, Invitalia, PNRR,
Sport e Salute, ANCI, GAL, Fondazioni bancarie e i programmi europei (UE, Interreg,
Erasmus+, LIFE, Horizon). Quando esce un bando, l'AI lo **legge, estrae, classifica,
riassume** e ti **avvisa** se è compatibile con il tuo profilo.

> **Non cercare i bandi. Te li troviamo noi.**

---

## ✨ Funzionalità principali

| Area | Cosa fa |
|------|---------|
| **Crawler multi-sorgente** | Parser dedicati, PDF/DOC/XLS/HTML/RSS/sitemap/API, headless Playwright per JS & Cloudflare, retry, rate-limiting, queue, cache, dedup, versioning |
| **AI extraction** | Estrae 25+ campi strutturati da ogni bando (importi, scadenze, beneficiari, spese, procedura…) |
| **Classificazione AI** | 30 categorie (Imprese, Sport, Terzo Settore, PNRR, Ambiente…) |
| **Ricerca** | Full-text + **semantica AI (pgvector)** + filtri (importo, scadenza, categoria, territorio, ente, solo aperti/FVG/EU/PNRR) |
| **Area AI per bando** | Riassunto semplice, checklist, FAQ, errori da evitare, probabilità di successo, timeline |
| **Assistente AI** | Chat che risponde "Posso partecipare?", "Fammi la checklist", "Spiegamelo come a un 14enne" |
| **Notifiche** | Email, Telegram, Discord, Slack, Webhook, Push, WhatsApp — solo per bandi compatibili |
| **Dashboard** | Statistiche, grafici, scadenze imminenti, nuovi oggi/settimana/mese, top finanziati |
| **Calendario** | Vista agenda + export **ICS** (Google/Apple/Outlook) |
| **Profilo utente** | Categorie, territori, tipologia ente, budget, ATECO, forma giuridica |
| **Admin** | Gestione sorgenti, log crawler, statistiche, ruoli |
| **Confronto** | Confronto affiancato di 2-3 bandi con evidenziazione del valore migliore |
| **Extra** | Preferiti, tag, commenti, versionamento, feed RSS, API REST + OpenAPI, PWA, SEO, health check |

---

## 🧱 Stack tecnologico

- **Frontend**: Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · shadcn/ui · Framer Motion · TanStack Query · Zustand
- **Backend**: Next.js API Routes · Prisma ORM · PostgreSQL · Redis · BullMQ · Node 20
- **Auth**: Auth.js (NextAuth v5) — Google, GitHub, Email
- **AI**: OpenAI *o* Claude (Anthropic) — configurabile via `AI_PROVIDER`
- **Infra**: Docker · Docker Compose · compatibile Coolify / Railway / Vercel / VPS
- **Test**: Vitest (unit) · Playwright (E2E)

Architettura completa in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## 🚀 Quick start

> Prerequisiti: **Node 20+**, **pnpm** (o npm), **Docker** (per Postgres + Redis).

```bash
# 1. Dipendenze
pnpm install

# 2. Variabili d'ambiente
cp .env.example .env      # poi compila AUTH_SECRET, ANTHROPIC_API_KEY/OPENAI_API_KEY, ...

# 3. Database + Redis (Docker)
docker compose up -d postgres redis

# 4. Migrazioni + seed sorgenti
pnpm prisma migrate dev
pnpm db:seed

# 5. Avvia l'app
pnpm dev                  # http://localhost:3000

# 6. (in un altro terminale) worker per crawler + notifiche
pnpm worker

# 7. Lancia un primo crawl manuale
pnpm crawl regione-fvg
```

Guida dettagliata: [`docs/INSTALL.md`](docs/INSTALL.md).

### Tutto in Docker

```bash
cp .env.example .env
docker compose up -d --build
docker compose exec web pnpm prisma migrate deploy && docker compose exec web pnpm db:seed
```

---

## 🗂️ Struttura del progetto

```
bandiai-fvg/
├── prisma/
│   ├── schema.prisma        # modello dati completo (bandi, AI, sorgenti, utenti, notifiche)
│   └── seed.ts              # registro sorgenti FVG + tag
├── src/
│   ├── app/                 # Next.js App Router (pagine + API routes)
│   │   ├── api/             # bandi, search, ai/chat, health, cron, calendar/ics, profile
│   │   ├── bandi/           # lista + dettaglio bando (Area AI)
│   │   ├── admin/ calendario/ assistente/ profilo/ login/
│   │   ├── robots.ts sitemap.ts manifest.ts feed.xml/
│   │   └── page.tsx         # dashboard
│   ├── components/          # UI (shadcn/ui) + componenti applicativi
│   ├── crawler/             # motore di crawling
│   │   ├── engine.ts        # orchestrazione fetch → extract → AI → persist
│   │   ├── fetcher.ts       # HTTP + Playwright + estrazione PDF/XLS
│   │   ├── parsers/         # parser per sorgente (regione-fvg, rss, generic…)
│   │   ├── dedup.ts cli.ts
│   ├── lib/
│   │   ├── ai/              # client provider-agnostic, extract, insight, schemas
│   │   ├── queue/           # BullMQ (queue + worker)
│   │   ├── notifications/   # dispatch multi-canale + matcher compatibilità
│   │   ├── bandi/           # search + stats
│   │   ├── security/        # rate limiting
│   │   ├── auth.ts prisma.ts redis.ts env.ts logger.ts utils.ts
│   └── types/
├── tests/e2e/               # Playwright
├── docs/                    # ARCHITECTURE, INSTALL, DEPLOY, API, ROADMAP, CHANGELOG, ADMIN
├── docker-compose.yml Dockerfile
└── openapi.yaml
```

---

## 🔌 API REST

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| `GET`  | `/api/bandi` | Lista paginata + filtri |
| `GET`  | `/api/search` | Ricerca **semantica** AI (fallback full-text) |
| `GET`  | `/api/bandi/:slug` | Dettaglio bando + Area AI |
| `POST` | `/api/ai/chat` | Assistente AI (auth) |
| `GET/PUT` | `/api/profile` | Profilo utente (auth) |
| `GET`  | `/api/calendar/ics` | Feed iCalendar scadenze |
| `GET`  | `/api/health` | Health check (DB + Redis) |
| `POST` | `/api/cron/crawl` | Trigger crawl (secret) |
| `GET`  | `/feed.xml` | Feed RSS pubblico |

Spec completa in [`openapi.yaml`](openapi.yaml) e [`docs/API.md`](docs/API.md).

---

## 🧪 Test

```bash
pnpm test         # unit (Vitest): utils, parser, matcher notifiche
pnpm test:e2e     # end-to-end (Playwright): smoke di homepage, bandi, health, tema
pnpm typecheck    # type safety
```

---

## 🔒 Sicurezza

Rate limiting Redis · CSP + security headers (middleware) · validazione input con Zod ·
Prisma (no SQL injection) · audit log · ruoli (USER/EDITOR/ADMIN) · predisposizione 2FA.
Dettagli in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md#sicurezza).

---

## 🗺️ Roadmap & Changelog

Vedi [`docs/ROADMAP.md`](docs/ROADMAP.md) e [`docs/CHANGELOG.md`](docs/CHANGELOG.md).

## 📄 Licenza

MIT.
