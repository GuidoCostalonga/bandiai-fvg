import type { MetadataRoute } from 'next'

/** PWA manifest — enables install + offline shell. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BandiAI FVG',
    short_name: 'BandiAI',
    description: 'Monitoraggio intelligente dei bandi pubblici del Friuli Venezia Giulia',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b1120',
    theme_color: '#2563eb',
    lang: 'it',
    categories: ['business', 'productivity', 'government'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
