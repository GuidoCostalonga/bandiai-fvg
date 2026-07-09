# Roadmap

Legenda: ✅ fatto · 🟡 parziale (fondamenta pronte, da completare) · ⬜ pianificato

## Fase 1 — Fondamenta (MVP) ✅
- ✅ Architettura, schema dati Prisma completo, Docker/Compose
- ✅ Motore di crawling (HTTP + Playwright, PDF/XLS, retry, rate-limit, dedup, versioning)
- ✅ Pipeline AI: estrazione strutturata + classificazione + Area AI insight
- ✅ Ricerca + filtri, dashboard, dettaglio bando, calendario + ICS
- ✅ Auth.js (Google/GitHub), profilo utente, notifiche multi-canale + matcher
- ✅ Assistente AI (globale + per bando), API REST + OpenAPI, feed RSS, SEO, PWA manifest
- ✅ Test unit (utils, parser, matcher) + E2E Playwright smoke

## Fase 2 — Consolidamento 🟡
- 🟡 Parser dedicati per ogni Comune/Camera/Ministero (oggi: FVG dedicato + generici)
- ✅ Ricerca **semantica** con embeddings (pgvector) + fallback full-text automatico
- 🟡 Email magic-link + Web Push (VAPID) end-to-end; WhatsApp provider
- 🟡 2FA (TOTP) completo sopra i campi già presenti
- ⬜ Admin: editor sorgenti/bandi inline, retry code, gestione ruoli da UI
- ⬜ Grafici dashboard con Recharts (categorie, timeline, mappa FVG)

## Fase 3 — Prodotto avanzato ⬜
- ⬜ Generazione documenti (bozza domanda, business plan, cronoprogramma, budget, PEC)
- ⬜ Confronto tra bandi + cronologia modifiche visuale (diff versioni)
- ⬜ Import/Export Excel/CSV/PDF, widget embeddabile
- ⬜ Multi-lingua (IT/EN/SL per Interreg), commenti e condivisione social
- ⬜ Sistema plugin per sorgenti di terze parti
- ⬜ Monitoring (Sentry, OpenTelemetry), backup automatici pianificati

## Fase 4 — Scala ⬜
- ⬜ Ranking di compatibilità personalizzato (ML) e "match score" per utente
- ⬜ Digest periodici intelligenti, alert su saved search
- ⬜ Team/organizzazioni con permessi condivisi
