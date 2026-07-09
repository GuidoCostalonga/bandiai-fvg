# Changelog

Tutte le modifiche rilevanti a questo progetto. Formato ispirato a
[Keep a Changelog](https://keepachangelog.com/) · versioning [SemVer](https://semver.org/).

## [Unreleased]

### Added
- **Confronto tra bandi**: selezione fino a 3 bandi (store Zustand persistito),
  barra flottante globale, pagina `/confronta` con tabella comparativa ed
  evidenziazione del valore migliore per riga (contributo, dotazione, %, scadenza),
  endpoint `GET /api/bandi/compare` con degradazione morbida, helper puro
  `buildComparisonRows` con test unitari.
- **Ricerca semantica** con pgvector: colonna `embedding vector(1536)`, modulo
  `src/lib/ai/embeddings.ts` (OpenAI-compatible), `src/lib/bandi/semantic.ts` con ranking
  per distanza coseno e filtri in-DB, endpoint `GET /api/search` con fallback automatico
  alla ricerca full-text, toggle "Ricerca AI" nell'interfaccia, indicizzazione automatica
  in fase di crawl, indice ANN HNSW (`prisma/sql/002_vector_index.sql`) e comando
  `pnpm embed:backfill` per i bandi preesistenti. Immagine Postgres → `pgvector/pgvector:pg16`.

## [0.1.0] — 2026-07-09

### Added
- Scaffolding completo Next.js 15 + React 19 + TypeScript + Tailwind + shadcn/ui.
- Schema Prisma completo: bandi, AI insight, sorgenti, crawl run/log, utenti, profili,
  notifiche, preferiti, saved search, tag, commenti, reminder, audit log, settings.
- Motore di crawling: `fetchHttp` + `fetchBrowser` (Playwright), estrazione PDF/XLS,
  retry con backoff, rate limiting, concorrenza limitata, deduplicazione + versioning.
- Parser: generico euristico, RSS/Atom, dedicato Regione FVG; registry per `parserKey`.
- Pipeline AI provider-agnostic (OpenAI/Claude): estrazione strutturata, classificazione,
  bundle "Area AI" (riassunto, checklist, FAQ, errori, probabilità, timeline).
- BullMQ (code crawl/notify) + worker separato; trigger cron protetto da secret.
- Notifiche multi-canale (Telegram/Discord/Slack/Webhook nativi; Email/Push/WhatsApp adapter)
  con matcher di compatibilità basato sul profilo.
- Frontend: dashboard con statistiche, lista bandi con filtri, dettaglio con Area AI,
  assistente AI (globale + per bando), calendario + export ICS, profilo, login, admin.
- API REST + `openapi.yaml`, feed RSS, sitemap, robots, PWA manifest, health check.
- Sicurezza: rate limiting Redis, CSP + security headers, validazione Zod, ruoli.
- Test: unit (Vitest) per utils/parser/matcher; E2E (Playwright) smoke.
- Documentazione: README, ARCHITECTURE, INSTALL, DEPLOY, API, ADMIN, USER, ROADMAP.

[0.1.0]: https://example.com/bandiai-fvg/releases/tag/v0.1.0
