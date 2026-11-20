import type { CollectionConfig } from 'payload'
import { appMember, ownRecord, serverField } from './chat-access'

export const Reactions: CollectionConfig = {
  slug: 'reactions',
  admin: { group: 'Community' },
  access: { read: () => true, create: appMember, update: () => false, delete: ownRecord },
  hooks: {
    beforeValidate: [
      ({ data, req }) => {
        if (!data) return data
        if (req.user?.collection === 'users') data.author = req.user.id
        data.key = `${data.message}:${data.author}:${data.kind}`
        return data
      },
    ],
    beforeChange: [
      async ({ data, req }) => {
        await req.payload.findByID({
          collection: 'messages',
          id: data.message,
          overrideAccess: false,
          user: req.user,
          req,
        })
        return data
      },
    ],
  },
  fields: [
    { name: 'message', type: 'relationship', relationTo: 'messages', required: true, index: true },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      access: { create: serverField, update: serverField },
    },
    {
      name: 'kind',
      type: 'select',
      required: true,
      options: ['heart', 'fire', 'sparkles', 'like'],
    },
    {
      name: 'key',
      type: 'text',
      unique: true,
      access: { create: serverField, update: serverField },
      admin: { hidden: true },
    },
  ],
}
