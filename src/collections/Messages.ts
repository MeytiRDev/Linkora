import type { CollectionConfig } from 'payload'
import { appMember, ownRecord, serverField } from './chat-access'

export const Messages: CollectionConfig = {
  slug: 'messages',
  admin: { useAsTitle: 'body', group: 'Community' },
  access: { read: () => true, create: appMember, update: () => false, delete: ownRecord },
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        if (req.user?.collection === 'users') data.author = req.user.id
        if (data.kind === 'text' && !data.body?.trim()) throw new Error('Write a message first.')
        if (data.kind !== 'text' && !data.attachment)
          throw new Error('A voice or video clip is required.')
        if (data.channel)
          await req.payload.findByID({
            collection: 'channels',
            id: data.channel,
            overrideAccess: false,
            user: req.user,
            req,
          })
        if (data.attachment) {
          const file = await req.payload.findByID({
            collection: 'chat-uploads',
            id: data.attachment,
            overrideAccess: false,
            user: req.user,
            req,
            depth: 0,
          })
          if (req.user?.collection === 'users' && String(file.author) !== String(req.user.id))
            throw new Error('You can only share your own clips.')
          if (!file.mimeType?.startsWith(data.kind === 'voice' ? 'audio/' : 'video/'))
            throw new Error('The clip type does not match the message.')
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'channel', type: 'relationship', relationTo: 'channels', required: true, index: true },
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
      defaultValue: 'text',
      options: ['text', 'voice', 'video'],
    },
    { name: 'body', type: 'textarea', maxLength: 4000 },
    { name: 'attachment', type: 'upload', relationTo: 'chat-uploads' },
    { name: 'duration', type: 'number', min: 0, max: 180 },
    {
      name: 'pinned',
      type: 'checkbox',
      defaultValue: false,
      access: { create: serverField, update: serverField },
    },
  ],
}
