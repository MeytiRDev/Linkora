import type { CollectionConfig } from 'payload'
import { editor, serverField } from './chat-access'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    tokenExpiration: 60 * 60 * 24 * 7,
    maxLoginAttempts: 8,
    lockTime: 600000,
  },
  admin: { useAsTitle: 'displayName', group: 'Community' },
  access: {
    admin: () => false,
    create: () => true,
    read: () => true,
    update: ({ req }) =>
      req.user?.collection === 'users' ? { id: { equals: req.user.id } } : false,
    delete: editor,
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      access: {
        read: ({ req, doc }) =>
          req.user?.collection === 'admins' ||
          (req.user?.collection === 'users' && req.user.id === doc?.id),
      },
    },
    { name: 'displayName', type: 'text', required: true, minLength: 2, maxLength: 32 },
    { name: 'bio', type: 'text', maxLength: 160 },
    {
      name: 'color',
      type: 'select',
      defaultValue: 'mint',
      options: ['mint', 'violet', 'peach', 'blue', 'pink', 'yellow'],
    },
    {
      name: 'isGuide',
      type: 'checkbox',
      defaultValue: false,
      access: { create: serverField, update: serverField },
    },
  ],
}
