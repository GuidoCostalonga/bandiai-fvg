import type { DocumentType } from '@prisma/client'

/** A candidate bando link discovered by a parser on a listing page. */
export interface DiscoveredItem {
  url: string
  title?: string
  publishedAt?: string
  /** Attachment URLs (PDF/DOC/XLS) found next to the listing entry. */
  attachments?: { url: string; type: DocumentType }[]
}

/** Raw content fetched for a single bando page, before AI extraction. */
export interface FetchedDocument {
  url: string
  contentType: string
  html?: string
  text: string
  type: DocumentType
}

/** Contract every source parser implements. */
export interface Parser {
  key: string
  /** Parse a listing/feed page into candidate bando items. */
  discover(input: { url: string; html: string }): Promise<DiscoveredItem[]> | DiscoveredItem[]
  /**
   * Optional: extract the main textual content of a bando detail page.
   * Defaults to readable-text extraction when omitted.
   */
  extractDetail?(input: { url: string; html: string }): Promise<string> | string
}

export interface CrawlContext {
  sourceId: string
  runId: string
  log: (level: 'debug' | 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>) => Promise<void>
}
