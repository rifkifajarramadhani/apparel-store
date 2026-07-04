// User as returned by the backend's GET /api/auth/me.
export interface User {
  id: number
  email: string
  username?: string
  role?: 'user' | 'admin'
  emailVerified?: boolean
  pendingEmail?: string
  tokenVersion?: number
}

// The backend issues a short-lived access token plus a refresh token; the user
// is fetched separately from /auth/me and assembled into the session.
export interface Session {
  accessToken: string
  refreshToken: string
  user: User
}
