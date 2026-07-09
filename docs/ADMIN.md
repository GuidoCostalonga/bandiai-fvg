# Manuale amministratore

## Accesso

Solo gli utenti con ruolo `ADMIN` vedono `/admin`. Per promuovere un utente:

```bash
pnpm prisma studio     # User → role = ADMIN
# oppure: UPDATE "User" SET role='ADMIN' WHERE email='...';
```

Ruoli: `USER` (default), `EDITOR` (può modificare bandi), `ADMIN` (tutto).

## Pannello `/admin`

- **Statistiche**: utenti, bandi, sorgenti, sorgenti attive.
- **Sorgenti**: stato (attiva/disattiva), tipo, ultima esecuzione.
- **Esecuzioni crawler**: ultime run con nuovi/aggiornati/errori e stato.

## Gestione sorgenti

Le sorgenti sono definite in `prisma/seed.ts` e nella tabella `Source`. Campi chiave:

| Campo | Significato |
|-------|-------------|
| `parserKey` | parser usato (`regione-fvg`, `rss-generic`, `html-generic`, `comune-generic`, `ue-generic`) |
| `entryUrls` | pagine di listing/feed da cui partire |
| `strategy` | HTML / RSS / SITEMAP / API / PDF_INDEX / PLAYWRIGHT |
| `usesJavascript` / `usesCloudflare` | forza l'uso del browser headless |
| `cronExpression` | frequenza suggerita (default 6h) |
| `enabled` | attiva/disattiva senza cancellare |

**Aggiungere una sorgente**: inserisci una riga nel seed (o nella tabella) e, se la
struttura HTML è particolare, crea un parser dedicato in `src/crawler/parsers/` e
registralo in `parsers/index.ts`.

## Crawler

- Manuale: `pnpm crawl` (tutte) o `pnpm crawl <slug>` (una).
- Schedulato: lo scheduler chiama `POST /api/cron/crawl` (Bearer `CRON_SECRET`), che
  accoda un job BullMQ per ogni sorgente attiva. Il **worker** li esegue.
- Log e run sono consultabili in `/admin` e nelle tabelle `CrawlRun` / `CrawlLog`.

## Notifiche

Il matcher (`src/lib/notifications/matcher.ts`) confronta ogni nuovo bando con i profili
utente (categoria/beneficiario/territorio/budget) e accoda notifiche sui canali abilitati.
Lo stato di consegna è in `Notification.status` (PENDING/SENT/FAILED) per eventuali retry.

## Backup

Vedi [DEPLOY.md](DEPLOY.md#backup). Pianifica `pg_dump` giornaliero e mantieni il volume
Redis persistente (AOF già attivo nel compose).

## Audit

Le azioni sensibili vanno registrate in `AuditLog` (`action`, `entity`, `entityId`, `userId`,
`ip`, `userAgent`). Usa questa tabella per tracciabilità e conformità.
