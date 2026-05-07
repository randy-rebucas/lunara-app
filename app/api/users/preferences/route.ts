import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { withAuth } from '@/middleware/auth'
import { withAuthAndValidation } from '@/middleware/validate'
import type { JWTPayload } from '@/lib/jwt'
import User from '@/models/User'

type AnyCtx = { params: Promise<Record<string, string | string[]>> }

const preferencesSchema = z.object({
  pushNotifications: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  language: z.string().min(2).max(10).optional(),
})

type PreferencesInput = z.infer<typeof preferencesSchema>

async function handleGetPreferences(
  _req: NextRequest,
  _ctx: AnyCtx,
  user: JWTPayload
): Promise<NextResponse> {
  await connectDB()
  const dbUser = await User.findById(user.userId).select('preferences')
  return NextResponse.json({ success: true, data: dbUser?.preferences ?? {} })
}

async function handleUpdatePreferences(
  _req: NextRequest,
  _ctx: AnyCtx,
  user: JWTPayload,
  body: PreferencesInput
): Promise<NextResponse> {
  await connectDB()

  const updates: Record<string, unknown> = {}
  if (body.pushNotifications !== undefined) updates['preferences.pushNotifications'] = body.pushNotifications
  if (body.emailNotifications !== undefined) updates['preferences.emailNotifications'] = body.emailNotifications
  if (body.language !== undefined) updates['preferences.language'] = body.language

  const updated = await User.findByIdAndUpdate(user.userId, updates, { new: true }).select('preferences')

  return NextResponse.json({ success: true, data: updated?.preferences })
}

export const GET = withAuth(handleGetPreferences)
export const PUT = withAuthAndValidation(preferencesSchema, handleUpdatePreferences)
