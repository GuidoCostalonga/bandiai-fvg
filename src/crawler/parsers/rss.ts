import * as cheerio from 'cheerio'
import type { DiscoveredItem, Parser } from '../types'

/**
 * RSS / Atom feed parser. Handles both <item> (RSS) and <entry> (Atom).
 * Uses cheerio in XML mode — no extra XML dependency.
 */
export class RssParser implements Parser {
  constructor(public readonly key: string = 'rss-generic') {}

  discover({ html }: { html: string }): DiscoveredItem[] {
    const $ = cheerio.load(html, { xmlMode: true })
    const items: DiscoveredItem[] = []

    $('item, entry').each((_, el) => {
      const node = $(el)
      const title = node.find('title').first().text().trim()
      // RSS: <link>url</link> ; Atom: <link href="url"/>
      const link =
        node.find('link').first().text().trim() ||
        node.find('link').first().attr('href') ||
        ''
      const pub =
        node.find('pubDate').first().text().trim() ||
        node.find('updated').first().text().trim() ||
        node.find('published').first().text().trim() ||
        undefined
      if (link) items.push({ url: link, title, publishedAt: pub })
    })

    return items
  }
}
