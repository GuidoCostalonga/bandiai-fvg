import * as cheerio from 'cheerio'
import type { DiscoveredItem, Parser } from '../types'
import type { DocumentType } from '@prisma/client'

/** Resolve a possibly-relative href against a base URL. */
export function absolute(base: string, href: string): string | null {
  try {
    return new URL(href, base).toString()
  } catch {
    return null
  }
}

function attachmentType(href: string): DocumentType | null {
  const u = href.toLowerCase()
  if (u.endsWith('.pdf')) return 'PDF'
  if (u.match(/\.docx?$/)) return 'DOC'
  if (u.match(/\.xlsx?$/)) return 'XLS'
  return null
}

/**
 * Generic HTML parser: heuristically finds links that look like bandi.
 * Concrete sources subclass/configure this via `linkSelector` + `keywords`.
 */
export class GenericHtmlParser implements Parser {
  constructor(
    public readonly key: string,
    private readonly opts: {
      linkSelector?: string
      keywords?: string[]
    } = {},
  ) {}

  discover({ url, html }: { url: string; html: string }): DiscoveredItem[] {
    const $ = cheerio.load(html)
    const keywords = this.opts.keywords ?? ['bando', 'avviso', 'contributo', 'finanziamento', 'graduatoria']
    const selector = this.opts.linkSelector ?? 'a[href]'
    const items = new Map<string, DiscoveredItem>()

    $(selector).each((_, el) => {
      const href = $(el).attr('href')
      const text = $(el).text().trim()
      if (!href || !text) return
      const abs = absolute(url, href)
      if (!abs) return
      const hay = `${text} ${abs}`.toLowerCase()
      if (!keywords.some((k) => hay.includes(k))) return

      const att = attachmentType(abs)
      if (att) {
        // A direct document link — attach to the nearest listing item if any.
        const existing = items.get(url)
        if (existing) existing.attachments = [...(existing.attachments ?? []), { url: abs, type: att }]
        return
      }
      if (!items.has(abs)) items.set(abs, { url: abs, title: text })
    })

    return [...items.values()]
  }

  extractDetail({ html }: { html: string }): string {
    const $ = cheerio.load(html)
    $('script, style, nav, header, footer').remove()
    return ($('main').text() || $('article').text() || $('body').text()).trim()
  }
}
