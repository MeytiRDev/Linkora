import { getPayload } from 'payload'
import config from '@payload-config'
import { appAuth } from '@/lib/app-auth'

export async function POST(request: Request) {
  if (request.headers.get('sec-fetch-site') === 'cross-site')
    return Response.json({ error: 'Request not allowed.' }, { status: 403 })
  try {
    const input = await request.json()
    if (input.action === 'logout') {
      await appAuth.logout()
      return Response.json({ success: true })
    }
    if (input.action === 'refresh') {
      const success = await appAuth.refresh()
      return Response.json(
        success ? { success: true } : { error: 'Your session has ended. Please sign in again.' },
        { status: success ? 200 : 401 },
      )
    }
    const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : ''
    const password = typeof input.password === 'string' ? input.password : ''
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
      return Response.json({ error: 'Enter a valid email address.' }, { status: 400 })
    if (password.length < 8 || password.length > 128)
      return Response.json(
        { error: 'Use a password between 8 and 128 characters.' },
        { status: 400 },
      )
    if (input.action === 'signup') {
      const displayName = typeof input.displayName === 'string' ? input.displayName.trim() : ''
      if (displayName.length < 2 || displayName.length > 32)
        return Response.json(
          { error: 'Your display name should be 2–32 characters.' },
          { status: 400 },
        )
      const payload = await getPayload({ config })
      await payload.create({
        collection: 'users',
        overrideAccess: false,
        data: { email, password, displayName },
      })
    } else if (input.action !== 'login')
      return Response.json({ error: 'Unknown action.' }, { status: 400 })
    const user = await appAuth.login(email, password)
    return Response.json({
      user: { id: user.id, displayName: user.displayName, color: user.color },
    })
  } catch {
    return Response.json(
      {
        error:
          'Unable to sign in. Check your credentials, or try a different email when creating an account.',
      },
      { status: 400 },
    )
  }
}
