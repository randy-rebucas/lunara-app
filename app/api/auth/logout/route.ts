import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { verifyRefreshToken } from '@/lib/jwt'
import { withValidation } from '@/middleware/validate'
import RefreshToken from '@/models/RefreshToken'

type AnyCtx = { params: Promise<Record<string, string | string[]>> }

const logoutSchema = z.object({
  refreshToken: z.string().min(1),
})

type LogoutInput = z.infer<typeof logoutSchema>

async function handleLogout(
  _req: NextRequest,
  _ctx: AnyCtx,
  body: LogoutInput
): Promise<NextResponse> {
  await connectDB()

  try {
    const { jti } = verifyRefreshToken(body.refreshToken)
    await RefreshToken.findOneAndUpdate({ jti }, { isRevoked: true })
  } catch {
    // Token already invalid — treat as success
  }

  return NextResponse.json({ success: true, message: 'Logged out successfully' })
}

export const POST = withValidation(logoutSchema, handleLogout)
