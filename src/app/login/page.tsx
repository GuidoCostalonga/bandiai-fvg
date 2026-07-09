import { redirect } from 'next/navigation'
import { Mail } from 'lucide-react'
import { signIn, auth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const metadata = { title: 'Accedi' }

export default async function LoginPage() {
  const session = await auth()
  if (session?.user) redirect('/')

  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Accedi a BandiAI FVG</CardTitle>
          <CardDescription>Ricevi notifiche sui bandi giusti per te</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <form
            action={async () => {
              'use server'
              await signIn('google', { redirectTo: '/' })
            }}
          >
            <Button type="submit" variant="outline" className="w-full">
              Continua con Google
            </Button>
          </form>
          <form
            action={async () => {
              'use server'
              await signIn('github', { redirectTo: '/' })
            }}
          >
            <Button type="submit" variant="outline" className="w-full">
              Continua con GitHub
            </Button>
          </form>
          <p className="pt-2 text-center text-xs text-muted-foreground">
            <Mail className="mr-1 inline h-3 w-3" /> Il login via email si abilita configurando il provider SMTP.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
