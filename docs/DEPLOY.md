# Guida al deploy

BandiAI FVG è **container-first**: un'unica immagine serve sia il web (`node server.js`)
sia il worker (comando override). Postgres e Redis sono servizi gestiti o container.

## Componenti da avviare in produzione

1. **web** — Next.js standalone (porta 3000)
2. **worker** — `node --import tsx src/lib/queue/worker.ts` (nessuna porta)
3. **postgres** e **redis**
4. Uno **scheduler** che chiama `POST /api/cron/crawl` con `Authorization: Bearer $CRON_SECRET`

---

## Opzione A — VPS con Docker Compose

```bash
git clone <repo> && cd bandiai-fvg
cp .env.example .env    # imposta i segreti di produzione + CRON_SECRET
docker compose up -d --build
docker compose exec web pnpm prisma migrate deploy
docker compose exec web pnpm db:seed
```

Metti un reverse proxy (Caddy/Nginx/Traefik) davanti a `web:3000` per TLS.
Cron di sistema per i crawl periodici:

```cron
0 */6 * * * curl -fsS -X POST https://tuodominio/api/cron/crawl -H "Authorization: Bearer $CRON_SECRET"
```

## Opzione B — Coolify

1. Nuovo progetto → **Docker Compose**, punta al repo (usa `docker-compose.yml`).
2. Aggiungi le variabili d'ambiente (segreti) nel pannello.
3. Coolify costruisce ed espone `web`. Aggiungi un **Scheduled Task** (cron `0 */6 * * *`)
   che esegue il `curl` all'endpoint `/api/cron/crawl`.
4. Postgres e Redis: usa i database gestiti di Coolify oppure i servizi del compose.

## Opzione C — Railway

1. Crea i plugin **PostgreSQL** e **Redis** → copia le connection string in `DATABASE_URL`/`REDIS_URL`.
2. Servizio **web**: deploy da repo (usa il `Dockerfile`). Comando di start di default.
3. Servizio **worker**: stesso repo, start command
   `node --import tsx src/lib/queue/worker.ts`.
4. Aggiungi un **Cron** Railway per `POST /api/cron/crawl`.
5. Esegui le migrazioni: `railway run pnpm prisma migrate deploy && pnpm db:seed`.

## Opzione D — Vercel (web) + worker esterno

Vercel è ottimo per il **web** (SSR/ISR) ma non per processi long-running:

- **web** → Vercel (importa il repo, imposta le env). Usa **Vercel Cron** per `/api/cron/crawl`.
- **worker** → un container su Railway/Fly/VPS che condivide `DATABASE_URL` e `REDIS_URL`
  (es. Upstash Redis, Neon/Supabase Postgres).
- **Playwright** su Vercel non è supportato: il worker esterno gestisce i crawl con browser.

---

## Checklist di produzione

- [ ] `AUTH_SECRET`, `CRON_SECRET`, API key AI impostati e **non** di default
- [ ] `APP_URL` / `NEXT_PUBLIC_APP_URL` = dominio pubblico (HTTPS)
- [ ] Migrazioni applicate (`prisma migrate deploy`) e seed eseguito
- [ ] Worker attivo e connesso a Redis/Postgres
- [ ] Scheduler cron configurato per i crawl
- [ ] Health check `/api/health` monitorato (200 = ok)
- [ ] Backup Postgres pianificati (`pg_dump`) e volume Redis persistente
- [ ] Reverse proxy con TLS + HSTS

## Backup

```bash
# Postgres
docker compose exec postgres pg_dump -U bandiai bandiai > backup_$(date +%F).sql
# Restore
cat backup.sql | docker compose exec -T postgres psql -U bandiai bandiai
```
