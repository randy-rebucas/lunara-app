import { requireAdmin } from '@/lib/server/auth'
import { connectDB } from '@/lib/db'
import HelpTicket from '@/models/HelpTicket'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LifeBuoy, Clock, Loader, CheckCircle, XCircle, MessageSquare, AlertTriangle } from 'lucide-react'
import ReplyDialog from './reply-dialog'
import Link from 'next/link'

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

interface Ticket {
  _id: string
  subject: string
  message: string
  status: TicketStatus
  adminReply?: string
  createdAt: string
  updatedAt: string
  user: { _id: string; name: string; phone: string } | null
}

const STATUS_META: Record<TicketStatus, { label: string; icon: React.ElementType; color: string; bg: string; badge: string }> = {
  open:        { label: 'Open',        icon: Clock,        color: 'text-yellow-700', bg: 'bg-yellow-50',  badge: 'bg-yellow-100 text-yellow-800' },
  in_progress: { label: 'In Progress', icon: Loader,       color: 'text-blue-700',   bg: 'bg-blue-50',    badge: 'bg-blue-100 text-blue-800'     },
  resolved:    { label: 'Resolved',    icon: CheckCircle,  color: 'text-green-700',  bg: 'bg-green-50',   badge: 'bg-green-100 text-green-800'   },
  closed:      { label: 'Closed',      icon: XCircle,      color: 'text-gray-600',   bg: 'bg-gray-50',    badge: 'bg-gray-100 text-gray-700'     },
}

const ALL_STATUSES: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed']

function daysAgo(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
}

function timeAgo(dateStr: string): string {
  const m = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  if (d > 0) return `${d}d ago`
  if (h > 0) return `${h}h ago`
  if (m > 0) return `${m}m ago`
  return 'just now'
}

export default async function AdminHelpTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  await requireAdmin()
  await connectDB()

  const { status: statusFilter } = await searchParams

  // Fetch counts and filtered results separately — avoids loading all tickets into memory
  const [rawCounts, rawTickets, urgentCount] = await Promise.all([
    HelpTicket.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    HelpTicket.find(statusFilter && statusFilter !== 'all' ? { status: statusFilter } : {})
      .sort({ createdAt: -1 })
      .limit(200)
      .populate('user', 'name phone')
      .lean(),
    HelpTicket.countDocuments({
      status: 'open',
      createdAt: { $lte: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    }),
  ])

  const counts = (rawCounts as Array<{ _id: string; count: number }>).reduce<Record<string, number>>(
    (acc, r) => { acc[r._id] = r.count; return acc },
    {}
  )
  const urgent  = urgentCount
  const tickets = JSON.parse(JSON.stringify(rawTickets)) as Ticket[]
  const all     = { length: Object.values(counts).reduce((s, v) => s + v, 0) }

  const statCards = [
    { label: 'Total',       value: all.length,               icon: LifeBuoy,      color: 'text-blue-600',   bg: 'bg-blue-50'   },
    { label: 'Open',        value: counts.open ?? 0,      icon: Clock,         color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'In Progress', value: counts.in_progress ?? 0, icon: Loader,      color: 'text-blue-600',   bg: 'bg-blue-50'   },
    { label: 'Resolved',    value: counts.resolved ?? 0,  icon: CheckCircle,   color: 'text-green-600',  bg: 'bg-green-50'  },
  ]

  const tabs = [
    { key: 'all',         label: 'All',         count: all.length },
    { key: 'open',        label: 'Open',        count: counts.open ?? 0 },
    { key: 'in_progress', label: 'In Progress', count: counts.in_progress ?? 0 },
    { key: 'resolved',    label: 'Resolved',    count: counts.resolved ?? 0 },
    { key: 'closed',      label: 'Closed',      count: counts.closed ?? 0 },
  ]

  const active = statusFilter ?? 'all'

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Help Tickets</h1>
          <p className="text-sm text-muted-foreground">Support requests from customers and drivers</p>
        </div>
        {urgent > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4" />
            <span><strong>{urgent}</strong> open ticket{urgent !== 1 ? 's' : ''} overdue (&gt;2 days)</span>
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`rounded-lg p-2 ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-1 border-b pb-0">
        {tabs.map(({ key, label, count }) => (
          <Link
            key={key}
            href={`/admin/help-tickets?status=${key}`}
            className={`flex items-center gap-1.5 rounded-t-md border border-b-0 px-3 py-2 text-sm font-medium transition-colors
              ${active === key
                ? 'border-border bg-background text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            {label}
            <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold leading-none
              ${active === key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {count}
            </span>
          </Link>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {tickets.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <LifeBuoy className="h-8 w-8 opacity-30" />
              <p className="text-sm">No tickets found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reply</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => {
                  const meta    = STATUS_META[ticket.status] ?? STATUS_META.open
                  const Icon    = meta.icon
                  const age     = daysAgo(ticket.createdAt)
                  const isUrgent = ticket.status === 'open' && age >= 2
                  const hasReply = !!ticket.adminReply

                  return (
                    <TableRow
                      key={ticket._id}
                      className={isUrgent ? 'bg-red-50/50 hover:bg-red-50' : ''}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{ticket.user?.name ?? '—'}</p>
                          <p className="text-xs text-muted-foreground">{ticket.user?.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[220px]">
                        <p className="font-medium text-sm truncate">{ticket.subject}</p>
                        <p className="text-xs text-muted-foreground truncate">{ticket.message}</p>
                      </TableCell>
                      <TableCell>
                        <span className={`flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${meta.badge}`}>
                          <Icon className="h-3 w-3" />
                          {meta.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        {hasReply ? (
                          <span className="flex items-center gap-1 text-xs text-green-700">
                            <MessageSquare className="h-3 w-3" />
                            Replied
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs ${isUrgent ? 'font-semibold text-red-600' : 'text-muted-foreground'}`}>
                          {isUrgent && <AlertTriangle className="mr-0.5 inline h-3 w-3" />}
                          {timeAgo(ticket.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <ReplyDialog
                          ticketId={ticket._id}
                          subject={ticket.subject}
                          message={ticket.message}
                          currentReply={ticket.adminReply}
                          currentStatus={ticket.status}
                          userName={ticket.user?.name}
                          createdAt={ticket.createdAt}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
          {tickets.length > 0 && (
            <p className="border-t px-4 py-2.5 text-center text-xs text-muted-foreground">
              Showing {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
              {active !== 'all' ? ` · filtered by "${active.replace('_', ' ')}"` : ''}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
