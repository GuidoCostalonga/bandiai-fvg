import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Google from 'next-auth/providers/google'
import GitHub from 'next-auth/providers/github'
import type { NextAuthConfig } from 'next-auth'
import type { Role } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { env } from '@/lib/env'

/** Only register OAuth providers that are actually configured. */
function providers() {
  const list = []
  if (env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET) {
    list.push(Google({ clientId: env.AUTH_GOOGLE_ID, clientSecret: env.AUTH_GOOGLE_SECRET }))
  }
  if (env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET) {
    list.push(GitHub({ clientId: env.AUTH_GITHUB_ID, clientSecret: env.AUTH_GITHUB_SECRET }))
  }
  return list
}

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'database' },
  pages: { signIn: '/login' },
  providers: providers(),
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        session.user.role = (user as { role?: Role }).role ?? 'USER'
      }
      return session
    },
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

/** Guard helper for server actions / route handlers requiring a role. */
export async function requireRole(min: Role) {
  const session = await auth()
  const order: Record<Role, number> = { USER: 1, EDITOR: 2, ADMIN: 3 }
  if (!session?.user || order[(session.user.role as Role) ?? 'USER'] < order[min]) {
    throw new Error('unauthorized')
  }
  return session
}
