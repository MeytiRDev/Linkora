import type { CollectionConfig } from 'payload'
import { appMember, editor, serverField } from './chat-access'

export const ChatUploads: CollectionConfig = {
  slug: 'chat-uploads',
  admin: { useAsTitle: 'filename', group: 'Community' },
  access: { create: appMember, read: appMember, update: () => false, delete: editor },
  upload: {
    mimeTypes: [
      'audio/webm',
      'audio/ogg',
      'audio/wav',
      'audio/mpeg',
      'audio/mp4',
      'video/webm',
      'video/mp4',
      'video/quicktime',
    ],
    modifyResponseHeaders: ({ headers }) => {
      headers.set('Cache-Control', 'private, no-store')
      return headers
    },
  },
  hooks: {
    beforeChange: [
      ({ data, req }) => {
        if (req.file && req.file.size > 20 * 1024 * 1024)
          throw new Error('Clips must be smaller than 20 MB.')
        if (req.user?.collection === 'users') data.author = req.user.id
        return data
      },
    ],
  },
  fields: [
    { name: 'alt', type: 'text', required: true, maxLength: 100 },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      access: { create: serverField, update: serverField },
    },
  ],
}
