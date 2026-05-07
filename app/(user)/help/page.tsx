import { requireSession } from '@/lib/server/auth'
import { connectDB } from '@/lib/db'
import HelpTicket from '@/models/HelpTicket'
import { MessageCircle, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import NewTicketForm from './new-ticket-form'

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  open:        { label: 'Open',        color: 'text-yellow-700', bg: 'bg-yellow-100', icon: Clock },
  in_progress: { label: 'In Progress', color: 'text-blue-700',   bg: 'bg-blue-100',   icon: AlertCircle },
  resolved:    { label: 'Resolved',    color: 'text-green-700',  bg: 'bg-green-100',  icon: CheckCircle2 },
  closed:      { label: 'Closed',      color: 'text-gray-600',   bg: 'bg-gray-100',   icon: XCircle },
}

export default async function HelpPage() {
  const session = await requireSession()
  await connectDB()

  const raw = await HelpTicket.find({ user: session.userId }).sort({ createdAt: -1 }).lean()
  const tickets = JSON.parse(JSON.stringify(raw)) as Array<{
    _id: string; subject: string; message: string; status: string; adminReply?: string; createdAt: string
  }>

  return (
    <div className="space-y-5 p-4 pt-5">
      <div>
        <h1 className="text-2xl font-bold">Help & Support</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">We typically reply within 24 hours</p>
      </div>

      <NewTicketForm />

      {tickets.length > 0 && (
        <div>
          <h2 className="mb-3 font-semibold">My Tickets</h2>
          <div className="space-y-3">
            {tickets.map((ticket) => {
              const meta = STATUS_META[ticket.status] ?? STATUS_META.open
              const Icon = meta.icon
              return (
                <div key={ticket._id} className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm leading-snug flex-1 min-w-0">
                      {ticket.subject}
                    </p>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${meta.bg} ${meta.color}`}>
                      <Icon className="h-3 w-3" />
                      {meta.label}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground">{ticket.message}</p>

                  {ticket.adminReply && (
                    <div className="rounded-xl bg-primary/5 border border-primary/15 p-3">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                        Admin Reply
                      </p>
                      <p className="text-sm">{ticket.adminReply}</p>
                    </div>
                  )}

                  <p className="text-[10px] text-muted-foreground">
                    {new Date(ticket.createdAt).toLocaleDateString('en-PH', { dateStyle: 'medium' })}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tickets.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white py-12 text-center">
          <MessageCircle className="mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="font-medium text-muted-foreground">No tickets yet</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Submit a request above</p>
        </div>
      )}
    </div>
  )
}
