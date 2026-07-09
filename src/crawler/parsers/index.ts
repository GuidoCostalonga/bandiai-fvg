import type { Parser } from '../types'
import { GenericHtmlParser } from './base'
import { RssParser } from './rss'
import { RegioneFvgParser } from './regione-fvg'

/**
 * Parser registry. `parserKey` on a Source maps to one of these. Add new
 * source-specific parsers here — the engine resolves them by key.
 */
const registry = new Map<string, Parser>()

function register(p: Parser) {
  registry.set(p.key, p)
}

register(new GenericHtmlParser('html-generic'))
register(new RssParser('rss-generic'))
register(new RegioneFvgParser())
// Comuni / Camere di commercio share the generic heuristic until tuned:
register(new GenericHtmlParser('comune-generic', { keywords: ['bando', 'avviso', 'contributo', 'graduatoria'] }))
register(new GenericHtmlParser('ue-generic', { keywords: ['call', 'grant', 'bando', 'funding', 'tender'] }))

export function getParser(key: string): Parser {
  return registry.get(key) ?? registry.get('html-generic')!
}

export const parserKeys = () => [...registry.keys()]
