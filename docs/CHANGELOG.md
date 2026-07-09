# Changelog

Tutte le modifiche rilevanti a questo progetto. Formato ispirato a
[Keep a Changelog](https://keepachangelog.com/) · versioning [SemVer](https://semver.org/).

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
