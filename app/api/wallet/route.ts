import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { withAuth } from '@/middleware/auth'
import type { JWTPayload } from '@/lib/jwt'
import Wallet from '@/models/Wallet'

type AnyCtx = { params: Promise<Record<string, string | string[]>> }

async function handleGetWallet(
  _req: NextRequest,
  _ctx: AnyCtx,
  user: JWTPayload
): Promise<NextResponse> {
  await connectDB()

  const wallet = await Wallet.findOne({ user: user.userId })
  if (!wallet) {
    return NextResponse.json({ success: false, error: 'Wallet not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: wallet })
}

export const GET = withAuth(handleGetWallet)
