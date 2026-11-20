import 'server-only'
import { cookies } from 'next/headers'
import {
  createPayloadRequest,
  getPayload,
  JWTAuthentication,
  logoutOperation,
  refreshOperation,
} from 'payload'
import config from '@payload-config'

export function createAppAuth(collection: 'users') {
  const options = {
    httpOnly: true,
    secure:
      process.env.NODE_ENV === 'production' ||
      Boolean(process.env.FIGMA_PUBLIC_URL?.startsWith('https:')),
    sameSite: 'none' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  }
  async function currentUser() {
    const token = (await cookies()).get('app-session')?.value
    if (!token) return null
    const payload = await getPayload({ config })
    try {
      // Payload HMR updates collections, but not auth strategies. A cold start
      // registers this natively; keep newly added app auth usable in preview too.
      if (
        process.env.NODE_ENV === 'development' &&
        !payload.authStrategies.some((strategy) => strategy.name === 'local-jwt')
      ) {
        payload.authStrategies.push({ name: 'local-jwt', authenticate: JWTAuthentication })
      }
      const { user } = await payload.auth({
        headers: new Headers({ Authorization: `JWT ${token}` }),
      })
      return user?.collection === collection ? user : null
    } catch {
      return null
    }
  }
  return {
    currentUser,
    async login(email: string, password: string) {
      const payload = await getPayload({ config })
      const result = await payload.login({ collection, data: { email, password } })
      if (!result.token || !result.user) throw new Error('Sign-in failed.')
      ;(await cookies()).set('app-session', result.token, options)
      return result.user
    },
    async logout() {
      try {
        const user = await currentUser()
        if (user) {
          const payload = await getPayload({ config })
          await logoutOperation({
            collection: payload.collections[collection],
            req: await createPayloadRequest({ payload, user }),
          })
        }
      } finally {
        ;(await cookies()).set('app-session', '', { ...options, maxAge: 0 })
      }
    },
    async refresh() {
      const user = await currentUser()
      if (!user) return false
      const payload = await getPayload({ config })
      const result = await refreshOperation({
        collection: payload.collections[collection],
        req: await createPayloadRequest({ payload, user }),
      })
      ;(await cookies()).set('app-session', result.refreshedToken, options)
      return true
    },
  }
}

export const appAuth = createAppAuth('users')
