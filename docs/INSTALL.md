# Guida all'installazione

## Prerequisiti

- **Node.js 20+** e **pnpm** (`npm i -g pnpm`) — oppure npm/yarn
- **Docker + Docker Compose** (per PostgreSQL e Redis; in alternativa istanze locali)
- Una **API key** OpenAI o Anthropic (Claude)

## 1. Clona e installa

```bash
git clone <repo> bandiai-fvg && cd bandiai-fvg
pnpm install
```

## 2. Configura le variabili d'ambiente

```bash
cp .env.example .env
```

Compila almeno:

| Variabile | Note |
|-----------|------|
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `DATABASE_URL` | default OK con il compose incluso |
| `REDIS_URL` | default OK con il compose incluso |
| `AI_PROVIDER` | `anthropic` o `openai` |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` | secondo il provider scelto |

OAuth (`AUTH_GOOGLE_*`, `AUTH_GITHUB_*`) e notifiche (`TELEGRAM_BOT_TOKEN`, …) sono opzionali:
i provider non configurati vengono semplicemente disattivati.

## 3. Avvia i servizi di supporto

```bash
docker compose up -d postgres redis
```

## 4. Database

```bash
pnpm prisma generate
pnpm prisma migrate dev      # crea le tabelle
pnpm db:seed                 # popola il registro sorgenti + tag
```

Per ispezionare i dati: `pnpm prisma:studio`.

## 5. Avvia l'applicazione

```bash
pnpm dev                     # web su http://localhost:3000
pnpm worker                  # in un altro terminale: crawler + notifiche
```

## 6. Primo crawl

```bash
pnpm crawl                   # tutte le sorgenti attive
pnpm crawl regione-fvg       # una singola sorgente per slug
```

I bandi appariranno nella dashboard e in `/bandi` man mano che vengono elaborati.

## Rendere ADMIN un utente

Dopo il primo login (via OAuth), promuovi l'utente:

```bash
pnpm prisma studio           # apri User → imposta role = ADMIN
# oppure via SQL:
# UPDATE "User" SET role='ADMIN' WHERE email='tuo@email';
```

## Troubleshooting

- **`AUTH_SECRET` mancante** → l'app fallisce al boot (validazione env): impostalo in `.env`.
- **Crawler senza risultati** → alcune sorgenti richiedono `usesJavascript=true`; verifica
  che Playwright abbia il browser installato: `pnpm exec playwright install chromium`.
- **Chiamate AI in errore** → controlla `AI_PROVIDER` e la relativa API key.
- **Redis non raggiungibile** → cache e rate limit degradano in modo soft; le code BullMQ no,
  quindi il worker richiede Redis attivo.
