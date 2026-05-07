import { requireAdmin } from '@/lib/server/auth'
import { connectDB } from '@/lib/db'
import HelpTicket from '@/models/HelpTicket'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import ReplyDialog from './reply-dialog'

const STATUS_COLOR: Record<string, string> = {
  open: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
}

export default async function AdminHelpTicketsPage() {
  await requireAdmin()
  await connectDB()

  const raw = await HelpTicket.find().sort({ createdAt: -1 }).populate('user', 'name phone').lean()
  const tickets = JSON.parse(JSON.stringify(raw)) as Array<{
    _id: string; subject: string; message: string; status: string;
    adminReply?: string; createdAt: string;
    user: { name: string; phone: string } | null
  }>

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-bold">Help Tickets</h1>
        <p className="text-sm text-muted-foreground">
          {tickets.filter((t) => t.status === 'open').length} open tickets
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket._id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{ticket.user?.name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">{ticket.user?.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">{ticket.message}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLOR[ticket.status] ?? ''}`}>
                      {ticket.status.replace(/_/g, ' ')}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(ticket.createdAt).toLocaleDateString('en-PH', { dateStyle: 'short' })}
                  </TableCell>
                  <TableCell>
                    <ReplyDialog
                      ticketId={ticket._id}
                      subject={ticket.subject}
                      message={ticket.message}
                      currentReply={ticket.adminReply}
                      currentStatus={ticket.status}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
