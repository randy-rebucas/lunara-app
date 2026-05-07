import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { withAuth } from '@/middleware/auth'
import { getPagination } from '@/lib/utils'
import type { JWTPayload } from '@/lib/jwt'
import Transaction from '@/models/Transaction'

type AnyCtx = { params: Promise<Record<string, string | string[]>> }

async function handleListTransactions(
  req: NextRequest,
  _ctx: AnyCtx,
  user: JWTPayload
): Promise<NextResponse> {
  await connectDB()

  const url = new URL(req.url)
  const { page, limit, skip } = getPagination(url)
  const type = url.searchParams.get('type')

  const filter: Record<string, unknown> = { user: user.userId }
  if (type === 'credit' || type === 'debit') filter.type = type

  const [items, total] = await Promise.all([
    Transaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Transaction.countDocuments(filter),
  ])

  return NextResponse.json({
    success: true,
    data: { items, total, page, limit, totalPages: Math.ceil(total / limit) },
  })
}

export const GET = withAuth(handleListTransactions)
