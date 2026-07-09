import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { SiteHeader } from '@/components/site-header'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: {
    default: 'BandiAI FVG — Monitoraggio intelligente dei bandi pubblici',
    template: '%s · BandiAI FVG',
  },
  description:
    'Il sistema che trova per te i bandi pubblici del Friuli Venezia Giulia. Ricerca AI, notifiche automatiche, analisi e assistente intelligente.',
  keywords: ['bandi', 'Friuli Venezia Giulia', 'finanziamenti', 'contributi', 'PNRR', 'AI'],
  openGraph: {
    type: 'website',
    locale: 'it_IT',
    siteName: 'BandiAI FVG',
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1120' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <Providers>
          <SiteHeader />
          <main className="min-h-[calc(100vh-4rem)]">{children}</main>
          <footer className="border-t py-8 text-center text-sm text-muted-foreground">
            <div className="container">
              BandiAI FVG · Monitoraggio automatico dei bandi pubblici · Dati da fonti ufficiali
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  )
}
