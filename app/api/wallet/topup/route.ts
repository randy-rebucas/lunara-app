import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/db'
import { withAuthAndValidation } from '@/middleware/validate'
import { topUpSchema, TopUpInput } from '@/schemas/wallet.schema'
import type { JWTPayload } from '@/lib/jwt'
import Wallet from '@/models/Wallet'
import Transaction from '@/models/Transaction'

type AnyCtx = { params: Promise<Record<string, string | string[]>> }

async function handleTopUp(
  _req: NextRequest,
  _ctx: AnyCtx,
  user: JWTPayload,
  body: TopUpInput
): Promise<NextResponse> {
  await connectDB()

  const session = await mongoose.startSession()
  let updatedWallet: (typeof Wallet.prototype) | null = null

  await session.withTransaction(async () => {
    updatedWallet = await Wallet.findOneAndUpdate(
      { user: user.userId },
      { $inc: { balance: body.amount } },
      { new: true, session }
    )

    if (!updatedWallet) throw new Error('Wallet not found')

    await Transaction.create(
      [
        {
          wallet: updatedWallet._id,
          user: user.userId,
          type: 'credit',
          amount: body.amount,
          description: 'Wallet top-up',
          reference: body.reference,
        },
      ],
      { session }
    )
  })

  await session.endSession()

  return NextResponse.json({ success: true, data: updatedWallet })
}

export const POST = withAuthAndValidation(topUpSchema, handleTopUp)
