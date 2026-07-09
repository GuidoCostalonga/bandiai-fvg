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
  const categoryHit =
    profile.categories.length === 0 || bando.categories.some((c) => profile.categories.includes(c))
  const entityHit =
    profile.entityTypes.length === 0 || bando.beneficiari.some((b) => profile.entityTypes.includes(b))
  const territoryHit =
    profile.territories.length === 0 ||
    (bando.territorio ? profile.territories.some((t) => bando.territorio!.toLowerCase().includes(t.toLowerCase())) : true)

  const importo = bando.contributoMax ? Number(bando.contributoMax) : null
  const budgetHit =
    importo == null ||
    ((profile.budgetMin == null || importo >= profile.budgetMin) &&
      (profile.budgetMax == null || importo <= profile.budgetMax))

  // A match requires category OR entity relevance, plus territory + budget fit.
  return (categoryHit || entityHit) && territoryHit && budgetHit
}
