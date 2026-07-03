// The user object json-server-auth returns from /login and /register (password stripped).
export interface User {
  id: number
  email: string
  username?: string
  role?: 'user' | 'admin'
  emailVerified?: boolean
  pendingEmail?: string
  tokenVersion?: number
}

export interface Session {
  accessToken: string
  user: User
}
