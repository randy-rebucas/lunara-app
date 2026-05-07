import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { withAuthAndValidation } from '@/middleware/validate'
import type { JWTPayload } from '@/lib/jwt'
import HelpTicket from '@/models/HelpTicket'

type Ctx = { params: Promise<{ id: string }> }

const updateTicketSchema = z.object({
  adminReply: z.string().max(2000).optional(),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
})

type UpdateTicketInput = z.infer<typeof updateTicketSchema>

async function handleUpdateTicket(
  _req: NextRequest,
  ctx: Ctx,
  user: JWTPayload,
  body: UpdateTicketInput
): Promise<NextResponse> {
  if (user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  await connectDB()
  const { id } = await ctx.params

  const ticket = await HelpTicket.findByIdAndUpdate(
    id,
    { ...(body.adminReply !== undefined && { adminReply: body.adminReply }), ...(body.status && { status: body.status }) },
    { new: true, runValidators: true }
  ).populate('user', 'name phone')

  if (!ticket) {
    return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: ticket })
}

export const PATCH = withAuthAndValidation(updateTicketSchema, handleUpdateTicket as Parameters<typeof withAuthAndValidation>[1])
