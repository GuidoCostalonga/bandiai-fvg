import { describe, it, expect } from 'vitest'
import { GenericHtmlParser, absolute } from './base'
import { RssParser } from './rss'
import { RegioneFvgParser } from './regione-fvg'

describe('absolute', () => {
  it('resolves relative URLs against a base', () => {
    expect(absolute('https://x.it/a/b', '../c')).toBe('https://x.it/c')
  })
  it('returns null for garbage', () => {
    expect(absolute('not a url', '::::')).toBeNull()
  })
})

describe('GenericHtmlParser', () => {
  it('discovers links matching bando keywords', () => {
    const html = `
      <a href="/bando-123">Bando per le imprese artigiane</a>
      <a href="/contatti">Contatti</a>
      <a href="/avviso-pubblico">Avviso pubblico contributi</a>`
    const items = new GenericHtmlParser('t').discover({ url: 'https://x.it', html })
    const urls = items.map((i) => i.url)
    expect(urls).toContain('https://x.it/bando-123')
    expect(urls).toContain('https://x.it/avviso-pubblico')
    expect(urls).not.toContain('https://x.it/contatti')
  })
})

describe('RssParser', () => {
  it('parses RSS <item> entries', () => {
    const xml = `<rss><channel>
      <item><title>Bando A</title><link>https://x.it/a</link><pubDate>Wed, 01 Jan 2025 00:00:00 GMT</pubDate></item>
      <item><title>Bando B</title><link>https://x.it/b</link></item>
    </channel></rss>`
    const items = new RssParser().discover({ html: xml })
    expect(items).toHaveLength(2)
    expect(items[0]).toMatchObject({ url: 'https://x.it/a', title: 'Bando A' })
  })

  it('parses Atom <entry> with link href', () => {
    const xml = `<feed><entry><title>C</title><link href="https://x.it/c"/></entry></feed>`
    const items = new RssParser().discover({ html: xml })
    expect(items[0]?.url).toBe('https://x.it/c')
  })
})

describe('RegioneFvgParser', () => {
  it('falls back to generic discovery when tuned selectors miss', () => {
    const html = `<a href="/bando-agricoltura">Bando agricoltura FVG</a>`
    const items = new RegioneFvgParser().discover({ url: 'https://regione.fvg.it', html })
    expect(items.map((i) => i.url)).toContain('https://regione.fvg.it/bando-agricoltura')
  })
})
