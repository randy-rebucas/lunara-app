import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { withAuth } from '@/middleware/auth'
import type { JWTPayload } from '@/lib/jwt'
import PaymentMethod from '@/models/PaymentMethod'

type Ctx = { params: Promise<{ id: string }> }

async function handleDeletePayment(
  _req: NextRequest,
  ctx: Ctx,
  user: JWTPayload
): Promise<NextResponse> {
  await connectDB()

  const { id } = await ctx.params
  const method = await PaymentMethod.findOne({ _id: id, user: user.userId })

  if (!method) {
    return NextResponse.json({ success: false, error: 'Payment method not found' }, { status: 404 })
  }

  await method.deleteOne()
  return NextResponse.json({ success: true, message: 'Payment method deleted' })
}

export const DELETE = withAuth(handleDeletePayment as Parameters<typeof withAuth>[0])
