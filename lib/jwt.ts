import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET as string
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string

export interface JWTPayload {
  userId: string
  role: 'user' | 'admin' | 'driver'
}

export interface RefreshTokenPayload extends JWTPayload {
  jti: string
}

export function signAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' })
}

export function signRefreshToken(payload: JWTPayload): { token: string; jti: string } {
  const jti = crypto.randomUUID()
  const token = jwt.sign({ ...payload, jti }, JWT_REFRESH_SECRET, { expiresIn: '30d' })
  return { token, jti }
}

export function verifyAccessToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as RefreshTokenPayload
}

export function signPhoneVerifiedToken(phone: string): string {
  return jwt.sign({ phone, purpose: 'phone_verified' }, JWT_SECRET, { expiresIn: '15m' })
}

export function verifyPhoneVerifiedToken(token: string): { phone: string } {
  const payload = jwt.verify(token, JWT_SECRET) as { phone: string; purpose: string }
  if (payload.purpose !== 'phone_verified') throw new Error('Invalid token purpose')
  return { phone: payload.phone }
}
