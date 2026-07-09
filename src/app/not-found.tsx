import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-6xl font-bold text-primary">404</p>
      <h1 className="text-2xl font-semibold">Pagina non trovata</h1>
      <p className="text-muted-foreground">Il bando o la pagina che cerchi non esiste (più).</p>
      <Button asChild>
        <Link href="/">Torna alla dashboard</Link>
      </Button>
    </div>
  )
}
