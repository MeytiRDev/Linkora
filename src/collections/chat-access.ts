import type { Access, FieldAccess } from 'payload'

export const appMember: Access = ({ req }) => req.user?.collection === 'users'
export const editor: Access = ({ req }) => req.user?.collection === 'admins'
export const ownRecord: Access = ({ req }) =>
  req.user?.collection === 'admins'
    ? true
    : req.user?.collection === 'users'
      ? { author: { equals: req.user.id } }
      : false
export const serverField: FieldAccess = () => false
