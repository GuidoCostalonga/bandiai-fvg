import { PrismaClient, type SourceKind, type FetchStrategy } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Seed the source registry with the main public bodies to monitor for FVG.
 * URLs point at the public listing pages; parserKey selects the crawler parser.
 * Tune entryUrls/parserKey per source as you validate real page structures.
 */
type SeedSource = {
  slug: string
  name: string
  kind: SourceKind
  homepageUrl: string
  entryUrls: string[]
  parserKey: string
  strategy?: FetchStrategy
  usesJavascript?: boolean
}

const sources: SeedSource[] = [
  {
    slug: 'regione-fvg',
    name: 'Regione Autonoma Friuli Venezia Giulia',
    kind: 'REGIONE',
    homepageUrl: 'https://www.regione.fvg.it',
    entryUrls: ['https://www.regione.fvg.it/rafvg/cms/RAFVG/economia-imprese/'],
    parserKey: 'regione-fvg',
  },
  {
    slug: 'comune-trieste',
    name: 'Comune di Trieste',
    kind: 'COMUNE',
    homepageUrl: 'https://www.comune.trieste.it',
    entryUrls: ['https://www.comune.trieste.it/it/bandi-e-avvisi'],
    parserKey: 'comune-generic',
  },
  {
    slug: 'comune-udine',
    name: 'Comune di Udine',
    kind: 'COMUNE',
    homepageUrl: 'https://www.comune.udine.it',
    entryUrls: ['https://www.comune.udine.it/it/bandi-avvisi'],
    parserKey: 'comune-generic',
  },
  {
    slug: 'cciaa-pnud',
    name: 'CCIAA Pordenone-Udine',
    kind: 'CAMERA_COMMERCIO',
    homepageUrl: 'https://www.pnud.camcom.it',
    entryUrls: ['https://www.pnud.camcom.it/bandi'],
    parserKey: 'comune-generic',
  },
  {
    slug: 'invitalia',
    name: 'Invitalia',
    kind: 'INVITALIA',
    homepageUrl: 'https://www.invitalia.it',
    entryUrls: ['https://www.invitalia.it/cosa-facciamo/rafforziamo-le-imprese'],
    parserKey: 'html-generic',
    usesJavascript: true,
  },
  {
    slug: 'pnrr-italiadomani',
    name: 'PNRR — Italia Domani',
    kind: 'PNRR',
    homepageUrl: 'https://www.italiadomani.gov.it',
    entryUrls: ['https://www.italiadomani.gov.it/it/bandi.html'],
    parserKey: 'html-generic',
  },
  {
    slug: 'sport-salute',
    name: 'Sport e Salute',
    kind: 'SPORT_SALUTE',
    homepageUrl: 'https://www.sportesalute.eu',
    entryUrls: ['https://www.sportesalute.eu/bandi.html'],
    parserKey: 'html-generic',
  },
  {
    slug: 'ue-funding-tenders',
    name: 'UE — Funding & Tenders Portal',
    kind: 'UE',
    homepageUrl: 'https://ec.europa.eu',
    entryUrls: ['https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/calls-for-proposals'],
    parserKey: 'ue-generic',
    usesJavascript: true,
  },
  {
    slug: 'interreg-italia-slovenia',
    name: 'Interreg Italia-Slovenia',
    kind: 'INTERREG',
    homepageUrl: 'https://www.ita-slo.eu',
    entryUrls: ['https://www.ita-slo.eu/it/bandi'],
    parserKey: 'ue-generic',
  },
]

async function main() {
  for (const s of sources) {
    await prisma.source.upsert({
      where: { slug: s.slug },
      update: { name: s.name, homepageUrl: s.homepageUrl, entryUrls: s.entryUrls, parserKey: s.parserKey },
      create: {
        slug: s.slug,
        name: s.name,
        kind: s.kind,
        homepageUrl: s.homepageUrl,
        entryUrls: s.entryUrls,
        parserKey: s.parserKey,
        strategy: s.strategy ?? 'HTML',
        usesJavascript: s.usesJavascript ?? false,
      },
    })
  }

  // A default tag palette
  const tags = [
    { slug: 'urgente', label: 'Urgente', color: '#ef4444' },
    { slug: 'facile', label: 'Facile', color: '#22c55e' },
    { slug: 'alto-importo', label: 'Alto importo', color: '#3b82f6' },
  ]
  for (const t of tags) {
    await prisma.tag.upsert({ where: { slug: t.slug }, update: {}, create: t })
  }

  console.log(`Seeded ${sources.length} sources and ${tags.length} tags.`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
