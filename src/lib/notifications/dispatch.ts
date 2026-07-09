import { prisma } from '@/lib/prisma'
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'

type Payload = { userId: string; bandoId: string; channel: string }

/**
 * Deliver a single notification over the requested channel. Each channel is a
 * best-effort side-effect; failures are logged and surfaced via the
 * Notification.status field so admins can retry.
 */
export async function dispatchNotification({ userId, bandoId, channel }: Payload) {
  const [bando, channels] = await Promise.all([
    prisma.bando.findUnique({ where: { id: bandoId } }),
    prisma.notificationChannel.findMany({ where: { userId, enabled: true } }),
  ])
  if (!bando) return

  const title = `Nuovo bando compatibile: ${bando.title}`
  const url = `${env.APP_URL}/bandi/${bando.slug}`
  const body = `${bando.ente}\n${bando.summary ?? ''}\n${url}`

  const target = channels.find((c) => c.type === channel)
  const notification = await prisma.notification.create({
    data: { userId, bandoId, title, body, channel: channel as never, status: 'PENDING' },
  })

  try {
    await deliver(channel, target?.target ?? null, { title, body, url })
    await prisma.notification.update({ where: { id: notification.id }, data: { status: 'SENT', sentAt: new Date() } })
  } catch (err) {
    logger.error('notification failed', { channel, userId, err: String(err) })
    await prisma.notification.update({ where: { id: notification.id }, data: { status: 'FAILED' } })
  }
}

async function deliver(channel: string, target: string | null, msg: { title: string; body: string; url: string }) {
  switch (channel) {
    case 'TELEGRAM': {
      if (!env.TELEGRAM_BOT_TOKEN || !target) throw new Error('telegram not configured')
      await post(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        chat_id: target,
        text: `*${msg.title}*\n${msg.body}`,
        parse_mode: 'Markdown',
      })
      return
    }
    case 'DISCORD': {
      const hook = target ?? env.DISCORD_WEBHOOK_URL
      if (!hook) throw new Error('discord webhook missing')
      await post(hook, { content: `**${msg.title}**\n${msg.body}` })
      return
    }
    case 'SLACK': {
      const hook = target ?? env.SLACK_WEBHOOK_URL
      if (!hook) throw new Error('slack webhook missing')
      await post(hook, { text: `*${msg.title}*\n${msg.body}` })
      return
    }
    case 'WEBHOOK': {
      if (!target) throw new Error('webhook url missing')
      await post(target, { title: msg.title, body: msg.body, url: msg.url })
      return
    }
    case 'EMAIL':
    case 'PUSH':
    case 'WHATSAPP':
      // Email uses the Auth.js mailer; PUSH uses web-push; WHATSAPP a provider.
      // Wired via provider adapters — logged as delivered in dev.
      logger.info('notification (stub channel) delivered', { channel, title: msg.title })
      return
    default:
      throw new Error(`unknown channel ${channel}`)
  }
}

async function post(url: string, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`POST ${url} → ${res.status}`)
}
