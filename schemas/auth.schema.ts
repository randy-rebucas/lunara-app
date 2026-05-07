import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number'),
  password: z.string().min(8).max(128),
  email: z.string().email().optional(),
  referralCode: z.string().optional(),
})

export const loginSchema = z.object({
  phone: z.string().min(1),
  password: z.string().min(1),
})

export const sendOtpSchema = z.object({
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number'),
})

export const verifyOtpSchema = z.object({
  phone: z.string().min(1),
  otp: z.string().length(6),
})

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
})

export const adminLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type SendOtpInput = z.infer<typeof sendOtpSchema>
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>
export type AdminLoginInput = z.infer<typeof adminLoginSchema>
