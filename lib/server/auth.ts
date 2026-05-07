import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyAccessToken, type JWTPayload } from '@/lib/jwt'

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  if (!token) return null
  try {
    return verifyAccessToken(token)
  } catch {
    return null
  }
}

export async function requireSession(): Promise<JWTPayload> {
  const session = await getSession()
  if (!session) redirect('/login')
  return session
}

export async function requireAdmin(): Promise<JWTPayload> {
  const session = await requireSession()
  if (session.role !== 'admin') redirect('/dashboard')
  return session
}
