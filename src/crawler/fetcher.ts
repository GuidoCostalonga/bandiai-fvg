import * as cheerio from 'cheerio'
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'
import type { DocumentType } from '@prisma/client'
import type { FetchedDocument } from './types'

/** Small helper: sleep for politeness / backoff. */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Retry with exponential backoff + jitter. Retries network/5xx/timeouts. */
async function withRetry<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
  let lastErr: unknown
  for (let i = 0; i < tries; i++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      const backoff = Math.min(8000, 500 * 2 ** i) + Math.floor(Math.random() * 250)
      logger.warn('fetch retry', { attempt: i + 1, backoff })
      await sleep(backoff)
    }
  }
  throw lastErr
}

function guessType(url: string, contentType: string): DocumentType {
  const u = url.toLowerCase()
  if (u.endsWith('.pdf') || contentType.includes('pdf')) return 'PDF'
  if (u.match(/\.docx?$/) || contentType.includes('word')) return 'DOC'
  if (u.match(/\.xlsx?$/) || contentType.includes('sheet') || contentType.includes('excel')) return 'XLS'
  if (contentType.includes('html')) return 'HTML'
  return 'ALTRO'
}

/** Convert HTML to readable plain text (drops nav/script/style). */
export function htmlToText(html: string): string {
  const $ = cheerio.load(html)
  $('script, style, noscript, nav, header, footer, svg').remove()
  const text = $('main').text() || $('body').text() || $.root().text()
  return text.replace(/\s+\n/g, '\n').replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
}

/**
 * Plain HTTP fetch. Fast path for static pages, RSS, sitemaps and downloads.
 */
export async function fetchHttp(url: string): Promise<FetchedDocument> {
  return withRetry(async () => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), env.CRAWLER_REQUEST_TIMEOUT_MS)
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': env.CRAWLER_USER_AGENT, Accept: '*/*' },
        signal: controller.signal,
        redirect: 'follow',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
      const contentType = res.headers.get('content-type') ?? ''
      const type = guessType(url, contentType)

      if (type === 'PDF' || type === 'DOC' || type === 'XLS') {
        const buf = Buffer.from(await res.arrayBuffer())
        const text = await extractBinary(buf, type)
        return { url, contentType, text, type }
      }
      const html = await res.text()
      return { url, contentType, html, text: htmlToText(html), type }
    } finally {
      clearTimeout(timeout)
    }
  })
}

/**
 * Extract text from binary documents. PDF via pdf-parse, XLS via xlsx.
 * DOC/DOCX text extraction is best-effort (falls back to empty string).
 */
async function extractBinary(buf: Buffer, type: DocumentType): Promise<string> {
  try {
    if (type === 'PDF') {
      const { default: pdfParse } = await import('pdf-parse')
      const data = await pdfParse(buf)
      return data.text
    }
    if (type === 'XLS') {
      const XLSX = await import('xlsx')
      const wb = XLSX.read(buf, { type: 'buffer' })
      return wb.SheetNames.map((n) => XLSX.utils.sheet_to_csv(wb.Sheets[n]!)).join('\n\n')
    }
  } catch (err) {
    logger.warn('binary extraction failed', { type, err: String(err) })
  }
  return ''
}

/**
 * Playwright fetch for JS-heavy / Cloudflare-protected pages. Loaded lazily so
 * the browser dependency is only required when a source needs it.
 */
export async function fetchBrowser(url: string): Promise<FetchedDocument> {
  const { chromium } = await import('playwright')
  const browser = await chromium.launch({ headless: env.PLAYWRIGHT_HEADLESS })
  try {
    const ctx = await browser.newContext({ userAgent: env.CRAWLER_USER_AGENT })
    const page = await ctx.newPage()
    await page.goto(url, { waitUntil: 'networkidle', timeout: env.CRAWLER_REQUEST_TIMEOUT_MS })
    // Give Cloudflare interstitials a moment to resolve.
    await page.waitForTimeout(1500)
    const html = await page.content()
    return { url, contentType: 'text/html', html, text: htmlToText(html), type: 'HTML' }
  } finally {
    await browser.close()
  }
}
