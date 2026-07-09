import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ProfileForm } from '@/components/profile-form'

export const metadata = { title: 'Il mio profilo' }

export default async function ProfiloPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const profile = await prisma.userProfile.findUnique({ where: { userId: session.user.id } })

  return (
    <div className="container max-w-2xl space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-bold">Il mio profilo</h1>
        <p className="text-muted-foreground">
          Impostando i tuoi interessi riceverai notifiche solo per i bandi compatibili con te.
        </p>
      </div>
      <ProfileForm
        initial={{
          categories: profile?.categories ?? [],
          territories: profile?.territories ?? [],
          entityTypes: profile?.entityTypes ?? [],
          budgetMin: profile?.budgetMin ?? null,
          budgetMax: profile?.budgetMax ?? null,
          atecoCode: profile?.atecoCode ?? null,
          legalForm: profile?.legalForm ?? null,
          location: profile?.location ?? null,
        }}
      />
    </div>
  )
}
