# API REST — BandiAI FVG

Base URL (dev): `http://localhost:3000`. Spec formale: [`../openapi.yaml`](../openapi.yaml).

## Autenticazione

Le rotte pubbliche (lista/dettaglio bandi, feed, health) non richiedono auth.
Le rotte utente (`/api/ai/chat`, `/api/profile`) usano la sessione Auth.js (cookie).
La rotta `/api/cron/crawl` usa `Authorization: Bearer <CRON_SECRET>`.

## Esempi

### Lista bandi con filtri

```bash
curl "http://localhost:3000/api/bandi?onlyOpen=true&categories=SPORT&categories=CULTURA&sort=deadline&page=1"
```

```json
{
  "items": [
    {
      "slug": "contributi-impiantistica-sportiva-a1b2c3",
      "title": "Contributi per l'impiantistica sportiva 2025",
      "ente": "Regione Autonoma Friuli Venezia Giulia",
      "status": "OPEN",
      "contributoMax": 250000,
      "deadline": "2025-09-30T23:59:00.000Z",
      "categories": ["SPORT", "IMPIANTISTICA_SPORTIVA"],
      "territorio": "Friuli Venezia Giulia"
    }
  ],
  "total": 1, "page": 1, "pageSize": 20, "totalPages": 1
}
```

### Ricerca semantica AI

```bash
curl "http://localhost:3000/api/search?q=aiuti%20per%20aprire%20un%20birrificio%20artigianale&onlyOpen=true"
```

```json
{
  "mode": "semantic",
  "total": 12,
  "items": [
    { "slug": "...", "title": "Contributi per micro-imprese artigiane alimentari", "score": 0.83, "...": "..." }
  ]
}
```

`mode` è `semantic` quando gli embedding sono configurati, altrimenti `keyword`
(fallback automatico alla ricerca full-text). `score` è la similarità coseno (0..1).
La query è una **descrizione in linguaggio naturale**, non solo parole chiave.

### Dettaglio bando

```bash
curl "http://localhost:3000/api/bandi/contributi-impiantistica-sportiva-a1b2c3"
```

Ritorna il bando completo + `aiInsight` (riassunto, checklist, FAQ, timeline) + `documents`.

### Assistente AI (autenticato)

```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  --cookie "authjs.session-token=..." \
  -d '{"bandoSlug":"...","messages":[{"role":"user","content":"Posso partecipare come startup?"}]}'
```

### Trigger crawl (scheduler)

```bash
curl -X POST http://localhost:3000/api/cron/crawl -H "Authorization: Bearer $CRON_SECRET"
# → { "enqueued": 9, "sources": ["regione-fvg", ...] }
```

## Filtri disponibili su `/api/bandi`

| Param | Tipo | Descrizione |
|-------|------|-------------|
| `q` | string | Ricerca full-text (titolo, ente, keyword) |
| `categories` | string[] | Una o più categorie (ripetere il param) |
| `beneficiari` | string[] | Tipologie di beneficiario |
| `ente` | string | Filtra per ente |
| `territorio` | string | Filtra per territorio |
| `importoMin` / `importoMax` | number | Range contributo massimo |
| `deadlineBefore` | date | Scadenza entro |
| `onlyOpen` | bool | Solo aperti / in scadenza |
| `onlyFvg` | bool | Solo Friuli Venezia Giulia |
| `onlyPnrr` | bool | Solo PNRR |
| `onlyEu` | bool | Solo programmi europei |
| `sort` | enum | `recent` \| `deadline` \| `importo` |
| `page` / `pageSize` | int | Paginazione (max 100) |

## Codici di stato

`200` ok · `400` parametri non validi · `401` non autenticato · `404` non trovato ·
`429` rate limit · `503` dipendenza non disponibile (health).
