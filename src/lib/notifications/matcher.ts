import { prisma } from '@/lib/prisma'
import { notifyQueue } from '@/lib/queue'
import { logger } from '@/lib/logger'
import type { Bando } from '@prisma/client'

/**
 * When a new bando is published, find users whose profile makes them a good
 * match and enqueue a notification on each of their enabled channels.
 *
 * Matching is intentionally simple and explainable (category / territory /
 * entity-type / budget overlap). Semantic matching can be layered on top later
 * using embeddings without changing this contract.
 */
export async function notifyMatchingUsers(bando: Bando) {
  const profiles = await prisma.userProfile.findMany({
    include: { user: { include: { channels: { where: { enabled: true } } } } },
  })

  let matched = 0
  for (const profile of profiles) {
    if (!isMatch(profile, bando)) continue
    matched++
    const channels = profile.user.channels.length ? profile.user.channels : [{ type: 'EMAIL' as const }]
    for (const ch of channels) {
      await notifyQueue.add('notify', { userId: profile.userId, bandoId: bando.id, channel: ch.type })
    }
  }
  logger.info('notification matching complete', { bando: bando.slug, matched })
}

function isMatch(
  profile: { categories: string[]; territories: string[]; entityTypes: string[]; budgetMin: number | null; budgetMax: number | null },
  bando: Bando,
): boolean {
  // Relevance = the bando is about something the user cares about, expressed via
  // categories and/or entity types. Only *specified* dimensions constrain the
  // match; an unspecified dimension must NOT vacuously satisfy the OR (that would
  // notify a category-only user about every bando).
  const hasCat = profile.categories.length > 0
  const hasEnt = profile.entityTypes.length > 0
  const catMatch = hasCat && bando.categories.some((c) => profile.categories.includes(c))
  const entMatch = hasEnt && bando.beneficiari.some((b) => profile.entityTypes.includes(b))
  const relevant = !hasCat && !hasEnt ? true : catMatch || entMatch

  const territoryHit =
    profile.territories.length === 0 ||
    (bando.territorio ? profile.territories.some((t) => bando.territorio!.toLowerCase().includes(t.toLowerCase())) : true)

  const importo = bando.contributoMax ? Number(bando.contributoMax) : null
  const budgetHit =
    importo == null ||
    ((profile.budgetMin == null || importo >= profile.budgetMin) &&
      (profile.budgetMax == null || importo <= profile.budgetMax))

  return relevant && territoryHit && budgetHit
}
