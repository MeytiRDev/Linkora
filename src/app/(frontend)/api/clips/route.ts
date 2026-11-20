import { getPayload } from 'payload'
import config from '@payload-config'
import { appAuth } from '@/lib/app-auth'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const user = await appAuth.currentUser()
  if (!user) return new Response('Sign in to play this clip.', { status: 401 })
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return new Response('Missing clip.', { status: 400 })
  try {
    const payload = await getPayload({ config })
    const clip = await payload.findByID({
      collection: 'chat-uploads',
      id,
      overrideAccess: false,
      user,
    })
    if (!clip.url) return new Response('Clip not found.', { status: 404 })
    const origin = process.env.FIGMA_PUBLIC_URL || process.env.NEXT_PUBLIC_SITE_URL
    const url = new URL(clip.url, origin)
    const upstreamHeaders = new Headers()
    // Only pass the app token to our own Payload API, never to an external storage host.
    if (origin && url.origin === new URL(origin).origin) {
      const token = (await cookies()).get('app-session')?.value
      upstreamHeaders.set('Authorization', `JWT ${token}`)
    }
    const range = request.headers.get('range')
    if (range) upstreamHeaders.set('Range', range)
    const response = await fetch(url, { headers: upstreamHeaders, cache: 'no-store' })
    if (!response.ok) return new Response('Clip unavailable.', { status: response.status })
    const responseHeaders = new Headers({
      'Cache-Control': 'private, no-store',
      'Content-Type': clip.mimeType || 'application/octet-stream',
    })
    for (const key of ['content-length', 'content-range', 'accept-ranges']) {
      const value = response.headers.get(key)
      if (value) responseHeaders.set(key, value)
    }
    return new Response(response.body, { status: response.status, headers: responseHeaders })
  } catch {
    return new Response('Clip not found.', { status: 404 })
  }
}

export async function POST(request: Request) {
  if (request.headers.get('sec-fetch-site') === 'cross-site')
    return Response.json({ error: 'Request not allowed.' }, { status: 403 })
  const user = await appAuth.currentUser()
  if (!user) return Response.json({ error: 'Sign in to send a clip.' }, { status: 401 })
  try {
    const form = await request.formData()
    const file = form.get('file')
    const types = [
      'audio/webm',
      'audio/ogg',
      'audio/wav',
      'audio/mpeg',
      'audio/mp4',
      'video/webm',
      'video/mp4',
      'video/quicktime',
    ]
    if (
      !(file instanceof File) ||
      !file.size ||
      file.size > 20 * 1024 * 1024 ||
      !types.includes(file.type.split(';')[0])
    )
      return Response.json(
        { error: 'Choose an audio or video clip smaller than 20 MB.' },
        { status: 400 },
      )
    const payload = await getPayload({ config })
    const upload = await payload.create({
      collection: 'chat-uploads',
      overrideAccess: false,
      user,
      data: {
        alt: `${user.displayName}'s ${file.type.startsWith('video') ? 'video' : 'voice'} message`,
        author: user.id,
      },
      file: {
        data: Buffer.from(await file.arrayBuffer()),
        mimetype: file.type.split(';')[0],
        name: file.name.replace(/[^a-zA-Z0-9._-]/g, '_'),
        size: file.size,
      },
    })
    return Response.json({ id: upload.id })
  } catch {
    return Response.json(
      { error: 'Your clip could not be uploaded. Please try again.' },
      { status: 400 },
    )
  }
}
