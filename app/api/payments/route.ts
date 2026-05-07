import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { withAuth } from '@/middleware/auth'
import { withAuthAndValidation } from '@/middleware/validate'
import type { JWTPayload } from '@/lib/jwt'
import PaymentMethod from '@/models/PaymentMethod'

type AnyCtx = { params: Promise<Record<string, string | string[]>> }

const addPaymentSchema = z.object({
  type: z.enum(['card', 'gcash', 'maya', 'bank']),
  label: z.string().min(1).max(100),
  maskedNumber: z.string().optional(),
  isDefault: z.boolean().default(false),
})

type AddPaymentInput = z.infer<typeof addPaymentSchema>

async function handleListPayments(
  _req: NextRequest,
  _ctx: AnyCtx,
  user: JWTPayload
): Promise<NextResponse> {
  await connectDB()

  const methods = await PaymentMethod.find({ user: user.userId }).sort({ isDefault: -1, createdAt: -1 })
  return NextResponse.json({ success: true, data: methods })
}

async function handleAddPayment(
  _req: NextRequest,
  _ctx: AnyCtx,
  user: JWTPayload,
  body: AddPaymentInput
): Promise<NextResponse> {
  await connectDB()

  if (body.isDefault) {
    await PaymentMethod.updateMany({ user: user.userId }, { isDefault: false })
  }

  const method = await PaymentMethod.create({ ...body, user: user.userId })
  return NextResponse.json({ success: true, data: method }, { status: 201 })
}

export const GET = withAuth(handleListPayments)
export const POST = withAuthAndValidation(addPaymentSchema, handleAddPayment)
