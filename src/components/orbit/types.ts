import type { User, Channel, Message, Reaction } from '@/payload-types'

export type Member = Pick<User, 'id' | 'displayName' | 'color'> &
  Partial<Pick<User, 'bio' | 'isGuide'>>
export type ChatMessage = Pick<
  Message,
  'id' | 'body' | 'kind' | 'createdAt' | 'duration' | 'pinned' | 'attachment'
> & { author: Member | User['id'] }
export type ChatReaction = Pick<Reaction, 'id' | 'kind'> & {
  message: Message['id']
  author: User['id']
}
export type Community = {
  channels: Channel[]
  selected: Channel['id'] | null
  messages: ChatMessage[]
  reactions: ChatReaction[]
  members: Member[]
  user: Member | null
}

export const avatarColors: Record<string, string> = {
  mint: 'from-[#448376] to-[#203c38] text-[#b9f7d8]',
  violet: 'from-[#8b7bc0] to-[#3e355c] text-[#eee3ff]',
  peach: 'from-[#b27b64] to-[#584239] text-[#ffe2c6]',
  blue: 'from-[#5a82a4] to-[#283c56] text-[#c9eaff]',
  pink: 'from-[#b46f92] to-[#5b344b] text-[#ffdaeb]',
  yellow: 'from-[#a99b56] to-[#49452d] text-[#fff1bc]',
}

export async function postJSON(url: string, data: unknown) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || 'Something went wrong. Please try again.')
  return result
}

export function clipTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0')}`
}
