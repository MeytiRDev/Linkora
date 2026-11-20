import type { CollectionConfig } from 'payload'
import { appMember, editor } from './chat-access'

export const Channels: CollectionConfig = {
  slug: 'channels',
  admin: { useAsTitle: 'name', group: 'Community' },
  access: { read: () => true, create: appMember, update: editor, delete: editor },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      minLength: 2,
      maxLength: 32,
      validate: (value: string | null | undefined) =>
        /^[a-z0-9-]{2,32}$/.test(value ?? '') || 'Use 2–32 lowercase letters, numbers, or hyphens.',
    },
    { name: 'description', type: 'text', maxLength: 180 },
    {
      name: 'category',
      type: 'select',
      required: true,
      defaultValue: 'conversation',
      options: ['information', 'conversation', 'creative'],
    },
  ],
}
