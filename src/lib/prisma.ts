import { PrismaClient } from '@prisma/client'

/**
 * Singleton Prisma client. Next.js dev mode hot-reloads modules, so we cache
 * the instance on `globalThis` to avoid exhausting DB connections.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['warn', 'error']
        : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
