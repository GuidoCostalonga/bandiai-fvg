import * as cheerio from 'cheerio'
import { GenericHtmlParser, absolute } from './base'
import type { DiscoveredItem } from '../types'
import type { DocumentType } from '@prisma/client'

/**
 * Dedicated parser for Regione Autonoma Friuli Venezia Giulia bandi listings.
 * The regional portal renders bandi as cards/list rows linking to a detail
 * page, often with directly-attached PDF documents. This parser is tuned to
 * that structure and degrades gracefully to the generic heuristic.
 */
export class RegioneFvgParser extends GenericHtmlParser {
  constructor() {
    super('regione-fvg', {
      keywords: ['bando', 'avviso', 'contributo', 'finanziament', 'incentiv', 'graduatoria'],
    })
  }

  override discover({ url, html }: { url: string; html: string }): DiscoveredItem[] {
    const $ = cheerio.load(html)
    const items: DiscoveredItem[] = []

    // Primary strategy: article/list-item cards on the FVG portal.
    $('article, li.listing-item, div.card, div.views-row').each((_, el) => {
      const node = $(el)
      const a = node.find('a[href]').first()
      const href = a.attr('href')
      const title = a.text().trim() || node.find('h2, h3').first().text().trim()
      if (!href || !title) return
      const abs = absolute(url, href)
      if (!abs) return

      const attachments = node
        .find('a[href$=".pdf"], a[href$=".doc"], a[href$=".docx"], a[href$=".xls"], a[href$=".xlsx"]')
        .map((_, link): { url: string; type: DocumentType } | null => {
          const h = $(link).attr('href')
          const ab = h ? absolute(url, h) : null
          if (!ab) return null
          const type: DocumentType = ab.toLowerCase().endsWith('.pdf')
            ? 'PDF'
            : /\.xlsx?$/.test(ab.toLowerCase())
              ? 'XLS'
              : 'DOC'
          return { url: ab, type }
        })
        .get()
        .filter((x): x is { url: string; type: DocumentType } => x !== null)

      items.push({ url: abs, title, attachments })
    })

    // Fallback to the generic heuristic if the tuned selectors found nothing.
    if (items.length === 0) return super.discover({ url, html })
    return items
  }
}
