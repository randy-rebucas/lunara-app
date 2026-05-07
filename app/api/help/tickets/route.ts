import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { withAuth } from '@/middleware/auth'
import { withAuthAndValidation } from '@/middleware/validate'
import { getPagination } from '@/lib/utils'
import type { JWTPayload } from '@/lib/jwt'
import HelpTicket from '@/models/HelpTicket'

type AnyCtx = { params: Promise<Record<string, string | string[]>> }

const createTicketSchema = z.object({
  subject: z.string().min(3).max(200),
  message: z.string().min(10).max(2000),
})

type CreateTicketInput = z.infer<typeof createTicketSchema>

async function handleListTickets(
  req: NextRequest,
  _ctx: AnyCtx,
  user: JWTPayload
): Promise<NextResponse> {
  await connectDB()

  const url = new URL(req.url)
  const { page, limit, skip } = getPagination(url)

  const filter =
    user.role === 'admin' ? {} : { user: user.userId }

  const [items, total] = await Promise.all([
    HelpTicket.find(filter)
      .populate('user', 'name phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    HelpTicket.countDocuments(filter),
  ])

  return NextResponse.json({
    success: true,
    data: { items, total, page, limit, totalPages: Math.ceil(total / limit) },
  })
}

async function handleCreateTicket(
  _req: NextRequest,
  _ctx: AnyCtx,
  user: JWTPayload,
  body: CreateTicketInput
): Promise<NextResponse> {
  await connectDB()

  const ticket = await HelpTicket.create({
    user: user.userId,
    subject: body.subject,
    message: body.message,
    status: 'open',
  })

  return NextResponse.json({ success: true, data: ticket }, { status: 201 })
}

export const GET = withAuth(handleListTickets)
export const POST = withAuthAndValidation(createTicketSchema, handleCreateTicket)
