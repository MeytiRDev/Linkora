import { getPayload } from 'payload'
import config from '@payload-config'
import { appAuth } from '@/lib/app-auth'

export async function GET(request: Request) {
  try {
    const payload = await getPayload({ config })
    const user = await appAuth.currentUser()
    const channel = new URL(request.url).searchParams.get('channel')
    const channels = await payload.find({
      collection: 'channels',
      sort: 'createdAt',
      limit: 100,
      overrideAccess: false,
      user,
    })
    const selected =
      channels.docs.find((item) => String(item.id) === channel) ??
      channels.docs.find((item) => item.name === 'general') ??
      channels.docs[0]
    const [messages, members] = await Promise.all([
      selected
        ? payload.find({
            collection: 'messages',
            where: { channel: { equals: selected.id } },
            sort: '-createdAt',
            limit: 100,
            depth: 1,
            overrideAccess: false,
            user,
          })
        : Promise.resolve({ docs: [] }),
      payload.find({
        collection: 'users',
        limit: 100,
        depth: 0,
        select: { displayName: true, color: true, bio: true, isGuide: true },
        overrideAccess: false,
        user,
      }),
    ])
    const reactions = messages.docs.length
      ? await payload.find({
          collection: 'reactions',
          where: { message: { in: messages.docs.map((message) => message.id) } },
          depth: 0,
          limit: 1000,
          overrideAccess: false,
          user,
        })
      : { docs: [] }
    return Response.json(
      {
        channels: channels.docs,
        selected: selected?.id ?? null,
        messages: messages.docs.reverse().map((message) => ({
          id: message.id,
          body: message.body,
          kind: message.kind,
          author:
            typeof message.author === 'object'
              ? {
                  id: message.author.id,
                  displayName: message.author.displayName,
                  color: message.author.color,
                  bio: message.author.bio,
                  isGuide: message.author.isGuide,
                }
              : message.author,
          createdAt: message.createdAt,
          attachment: message.attachment,
          duration: message.duration,
          pinned: message.pinned,
        })),
        reactions: reactions.docs.map((reaction) => ({
          id: reaction.id,
          message: reaction.message,
          author: reaction.author,
          kind: reaction.kind,
        })),
        members: members.docs,
        user: user
          ? { id: user.id, displayName: user.displayName, color: user.color, bio: user.bio }
          : null,
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch {
    return Response.json(
      { error: 'Unable to load the community. Please try again.' },
      { status: 503 },
    )
  }
}

export async function POST(request: Request) {
  if (request.headers.get('sec-fetch-site') === 'cross-site')
    return Response.json({ error: 'Request not allowed.' }, { status: 403 })
  const user = await appAuth.currentUser()
  if (!user) return Response.json({ error: 'Sign in to join the conversation.' }, { status: 401 })
  try {
    const payload = await getPayload({ config })
    const input = await request.json()
    if (input.action === 'channel') {
      const name =
        typeof input.name === 'string' ? input.name.trim().toLowerCase().replace(/\s+/g, '-') : ''
      if (!/^[a-z0-9-]{2,32}$/.test(name))
        return Response.json(
          { error: 'Use 2–32 lowercase letters, numbers, or hyphens.' },
          { status: 400 },
        )
      const existing = await payload.find({
        collection: 'channels',
        where: { name: { equals: name } },
        limit: 1,
        overrideAccess: false,
        user,
      })
      if (existing.docs.length)
        return Response.json({ error: 'That channel already exists.' }, { status: 400 })
      const channel = await payload.create({
        collection: 'channels',
        overrideAccess: false,
        user,
        data: {
          name,
          description:
            typeof input.description === 'string' ? input.description.trim().slice(0, 180) : '',
          category: 'conversation',
        },
      })
      return Response.json({ id: channel.id })
    }
    if (input.action === 'message') {
      const body = typeof input.body === 'string' ? input.body.trim() : ''
      if (body.length > 4000)
        return Response.json({ error: 'Messages can be up to 4,000 characters.' }, { status: 400 })
      const kind = ['text', 'voice', 'video'].includes(input.kind)
        ? (input.kind as 'text' | 'voice' | 'video')
        : 'text'
      if (!input.channel || !['string', 'number'].includes(typeof input.channel))
        return Response.json({ error: 'Choose a channel first.' }, { status: 400 })
      if (kind === 'text' && !body)
        return Response.json({ error: 'Write a message first.' }, { status: 400 })
      if (kind !== 'text' && !['string', 'number'].includes(typeof input.attachment))
        return Response.json({ error: 'Record or select a clip first.' }, { status: 400 })
      const message = await payload.create({
        collection: 'messages',
        overrideAccess: false,
        user,
        data: {
          author: user.id,
          channel: input.channel,
          body,
          kind,
          ...(kind !== 'text'
            ? {
                attachment: input.attachment,
                duration:
                  typeof input.duration === 'number'
                    ? Math.max(0, Math.min(180, input.duration))
                    : 0,
              }
            : {}),
        },
      })
      return Response.json({ id: message.id })
    }
    if (input.action === 'reaction') {
      const kind = input.kind
      if (
        !['heart', 'fire', 'sparkles', 'like'].includes(kind) ||
        !['string', 'number'].includes(typeof input.message)
      )
        return Response.json({ error: 'Choose a valid reaction.' }, { status: 400 })
      const existing = await payload.find({
        collection: 'reactions',
        where: {
          and: [
            { author: { equals: user.id } },
            { message: { equals: input.message } },
            { kind: { equals: kind } },
          ],
        },
        limit: 1,
        overrideAccess: false,
        user,
      })
      if (existing.docs[0])
        await payload.delete({
          collection: 'reactions',
          id: existing.docs[0].id,
          overrideAccess: false,
          user,
        })
      else
        await payload.create({
          collection: 'reactions',
          overrideAccess: false,
          user,
          data: { message: input.message, kind, author: user.id },
        })
      return Response.json({ success: true })
    }
    if (input.action === 'profile') {
      const displayName = typeof input.displayName === 'string' ? input.displayName.trim() : ''
      const bio = typeof input.bio === 'string' ? input.bio.trim() : ''
      if (
        displayName.length < 2 ||
        displayName.length > 32 ||
        bio.length > 160 ||
        !['mint', 'violet', 'peach', 'blue', 'pink', 'yellow'].includes(input.color)
      )
        return Response.json({ error: 'Check your profile details.' }, { status: 400 })
      await payload.update({
        collection: 'users',
        id: user.id,
        overrideAccess: false,
        user,
        data: { displayName, bio, color: input.color },
      })
      return Response.json({ success: true })
    }
    return Response.json({ error: 'Unknown action.' }, { status: 400 })
  } catch {
    return Response.json(
      { error: 'That could not be saved. Check your message and try again.' },
      { status: 400 },
    )
  }
}
