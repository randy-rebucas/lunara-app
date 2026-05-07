import { requireSession } from '@/lib/server/auth'
import { connectDB } from '@/lib/db'
import HelpTicket from '@/models/HelpTicket'
import { Card, CardContent } from '@/components/ui/card'
import { MessageCircle } from 'lucide-react'
import NewTicketForm from './new-ticket-form'

const STATUS_COLOR: Record<string, string> = {
  open: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
}

export default async function HelpPage() {
  const session = await requireSession()
  await connectDB()

  const raw = await HelpTicket.find({ user: session.userId }).sort({ createdAt: -1 }).lean()
  const tickets = JSON.parse(JSON.stringify(raw)) as Array<{
    _id: string; subject: string; message: string; status: string; adminReply?: string; createdAt: string
  }>

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-2xl font-bold">Help & Support</h1>
        <p className="mt-1 text-sm text-muted-foreground">We typically reply within 24 hours</p>
      </div>

      <NewTicketForm />

      {tickets.length > 0 && (
        <div>
          <h2 className="mb-3 font-semibold">My Tickets</h2>
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <Card key={ticket._id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm">{ticket.subject}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLOR[ticket.status] ?? ''}`}>
                      {ticket.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{ticket.message}</p>
                  {ticket.adminReply && (
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Admin Reply</p>
                      <p className="text-sm">{ticket.adminReply}</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(ticket.createdAt).toLocaleDateString('en-PH', { dateStyle: 'medium' })}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tickets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <MessageCircle className="mb-3 h-10 w-10 opacity-30" />
          <p className="text-sm">No tickets yet</p>
        </div>
      )}
    </div>
  )
}
