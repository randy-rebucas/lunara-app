import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { sendOtpVerification } from '@/lib/otp'
import { withRateLimit } from '@/middleware/rateLimit'
import { withValidation } from '@/middleware/validate'
import { sendOtpSchema, SendOtpInput } from '@/schemas/auth.schema'

type AnyCtx = { params: Promise<Record<string, string | string[]>> }

async function handleSendOtp(
  _req: NextRequest,
  _ctx: AnyCtx,
  body: SendOtpInput
): Promise<NextResponse> {
  await connectDB()
  await sendOtpVerification(body.phone)
  return NextResponse.json({ success: true, message: 'OTP sent successfully' })
}

export const POST = withRateLimit(withValidation(sendOtpSchema, handleSendOtp), {
  key: 'auth-send-otp',
  points: 5,
  duration: 60,
})
