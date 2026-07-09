import pLimitDefault from './p-limit'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { env } from '@/lib/env'
import { slugify } from '@/lib/utils'
import { extractBando } from '@/lib/ai/extract'
import { generateInsight } from '@/lib/ai/insight'
import { fetchHttp, fetchBrowser } from './fetcher'
import { getParser } from './parsers'
import { classify } from './dedup'
import { notifyMatchingUsers } from '@/lib/notifications/matcher'
import { setBandoEmbedding } from '@/lib/bandi/semantic'
import type { DiscoveredItem } from './types'
import type { Source } from '@prisma/client'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Run a full crawl for a single source:
 *   1. fetch entry/listing pages → discover candidate bandi
 *   2. for each candidate: fetch detail (+ attachments), dedup
 *   3. AI-extract structured fields + generate insight
 *   4. persist with versioning
 * Every step is logged into CrawlLog and counters roll up into CrawlRun.
 */
export async function runCrawl(source: Source): Promise<{ runId: string }> {
  const run = await prisma.crawlRun.create({
    data: { sourceId: source.id, status: 'RUNNING' },
  })
  const log = (level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR', message: string, meta?: Record<string, unknown>) =>
    prisma.crawlLog.create({ data: { runId: run.id, level, message, meta: meta ?? undefined } })

  const parser = getParser(source.parserKey)
  const fetchPage = source.usesJavascript || source.usesCloudflare ? fetchBrowser : fetchHttp
  let found = 0
  let created = 0
  let updated = 0
  let errors = 0

  try {
    // 1. Discover candidates across all entry URLs.
    const discovered = new Map<string, DiscoveredItem>()
    for (const entryUrl of source.entryUrls) {
      try {
        const page = await fetchPage(entryUrl)
        const items = await parser.discover({ url: entryUrl, html: page.html ?? page.text })
        for (const it of items) if (!discovered.has(it.url)) discovered.set(it.url, it)
        await log('INFO', `discovered ${items.length} items`, { entryUrl })
      } catch (err) {
        errors++
        await log('ERROR', `failed to fetch entry page: ${String(err)}`, { entryUrl })
      }
      await sleep(source.rateLimitMs || env.CRAWLER_RATE_LIMIT_MS)
    }
    found = discovered.size

    // 2-4. Process each candidate with bounded concurrency + rate limiting.
    const limit = pLimitDefault(env.CRAWLER_CONCURRENCY)
    await Promise.all(
      [...discovered.values()].map((item) =>
        limit(async () => {
          try {
            const outcome = await processItem(source, item, fetchPage, parser)
            if (outcome === 'created') created++
            else if (outcome === 'updated') updated++
            await sleep(source.rateLimitMs || env.CRAWLER_RATE_LIMIT_MS)
          } catch (err) {
            errors++
            await log('ERROR', `item failed: ${String(err)}`, { url: item.url })
          }
        }),
      ),
    )

    const status = errors > 0 && created + updated === 0 ? 'FAILED' : errors > 0 ? 'PARTIAL' : 'SUCCESS'
    await prisma.crawlRun.update({
      where: { id: run.id },
      data: { status, finishedAt: new Date(), itemsFound: found, itemsNew: created, itemsUpdated: updated, errorCount: errors },
    })
    await prisma.source.update({
      where: { id: source.id },
      data: { lastRunAt: new Date(), lastSuccessAt: status !== 'FAILED' ? new Date() : undefined },
    })
    logger.info('crawl finished', { source: source.slug, found, created, updated, errors, status })
  } catch (err) {
    await prisma.crawlRun.update({
      where: { id: run.id },
      data: { status: 'FAILED', finishedAt: new Date(), errorCount: errors + 1 },
    })
    await log('ERROR', `crawl aborted: ${String(err)}`)
    logger.error('crawl aborted', { source: source.slug, err: String(err) })
  }

  return { runId: run.id }
}

async function processItem(
  source: Source,
  item: DiscoveredItem,
  fetchPage: typeof fetchHttp,
  parser: ReturnType<typeof getParser>,
): Promise<'created' | 'updated' | 'skipped'> {
  const page = await fetchPage(item.url)
  const detailText = parser.extractDetail
    ? await parser.extractDetail({ url: item.url, html: page.html ?? page.text })
    : page.text

  // Pull attachment text so the AI sees the full bando, not just the landing page.
  const attachmentTexts: string[] = []
  for (const att of item.attachments ?? []) {
    try {
      const doc = await fetchHttp(att.url)
      if (doc.text) attachmentTexts.push(`\n\n[Allegato ${att.type}: ${att.url}]\n${doc.text}`)
    } catch {
      /* attachment fetch is best-effort */
    }
  }

  const fullText = [detailText, ...attachmentTexts].join('\n')
  const dedup = await classify(item.url, fullText)
  if (dedup.kind === 'unchanged') return 'skipped'

  const extracted = await extractBando({ title: item.title, sourceUrl: item.url, rawText: fullText })
  const insight = await generateInsight(extracted)

  const data = {
    title: extracted.title,
    ente: extracted.ente,
    description: extracted.description ?? null,
    summary: extracted.summary ?? null,
    importoTotale: extracted.importoTotale ?? null,
    contributoMax: extracted.contributoMax ?? null,
    percentualeFinanziabile: extracted.percentualeFinanziabile ?? null,
    publishedAt: parseDate(extracted.publishedAt),
    opensAt: parseDate(extracted.opensAt),
    deadline: parseDate(extracted.deadline),
    categories: extracted.categories,
    beneficiari: extracted.beneficiari,
    keywords: extracted.keywords,
    territorio: extracted.territorio ?? null,
    codice: extracted.codice ?? null,
    normativa: extracted.normativa ?? null,
    contatti: extracted.contatti ?? undefined,
    obiettivi: extracted.obiettivi,
    vincoli: extracted.vincoli,
    documentazioneRichiesta: extracted.documentazioneRichiesta,
    speseAmmissibili: extracted.speseAmmissibili,
    speseEscluse: extracted.speseEscluse,
    tempistiche: extracted.tempistiche ?? null,
    procedura: extracted.procedura ?? null,
    valutazione: extracted.valutazione ?? null,
    contentHash: dedup.hash,
    searchText: buildSearchText(extracted),
    status: computeStatus(parseDate(extracted.deadline)),
  }

  if (dedup.kind === 'new') {
    const created = await prisma.bando.create({
      data: {
        ...data,
        slug: slugify(extracted.title, item.url),
        sourceId: source.id,
        sourceUrl: item.url,
        aiInsight: { create: { ...insight, model: env.AI_EXTRACTION_MODEL } },
        documents: {
          create: (item.attachments ?? []).map((a) => ({ type: a.type, url: a.url })),
        },
        versions: { create: { version: 1, snapshot: data as object, reason: 'crawl-create' } },
      },
    })
    // Index for semantic search + fan out notifications (both best-effort).
    await setBandoEmbedding(created.id, extracted)
    await notifyMatchingUsers(created).catch(() => {})
    return 'created'
  }

  // changed → update + append a new version
  const prev = await prisma.bandoVersion.count({ where: { bandoId: dedup.bandoId } })
  await prisma.$transaction([
    prisma.bando.update({ where: { id: dedup.bandoId }, data }),
    prisma.aiInsight.upsert({
      where: { bandoId: dedup.bandoId },
      create: { bandoId: dedup.bandoId, ...insight, model: env.AI_EXTRACTION_MODEL },
      update: { ...insight, model: env.AI_EXTRACTION_MODEL, generatedAt: new Date() },
    }),
    prisma.bandoVersion.create({
      data: { bandoId: dedup.bandoId, version: prev + 1, snapshot: data as object, reason: 'crawl-update' },
    }),
  ])
  // Content changed → refresh the semantic embedding (best-effort).
  await setBandoEmbedding(dedup.bandoId, extracted)
  return 'updated'
}

function parseDate(v?: string | null): Date | null {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

function computeStatus(deadline: Date | null): 'OPEN' | 'CLOSING_SOON' | 'CLOSED' {
  if (!deadline) return 'OPEN'
  const days = (deadline.getTime() - Date.now()) / 86_400_000
  if (days < 0) return 'CLOSED'
  if (days <= 7) return 'CLOSING_SOON'
  return 'OPEN'
}

function buildSearchText(e: { title: string; ente: string; description?: string | null; keywords: string[] }): string {
  return [e.title, e.ente, e.description ?? '', e.keywords.join(' ')].join(' ').toLowerCase()
}
