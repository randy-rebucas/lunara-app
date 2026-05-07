import Link from 'next/link'
import { requireAdmin } from '@/lib/server/auth'
import { connectDB } from '@/lib/db'
import Order, { type OrderStatus } from '@/models/Order'
import User from '@/models/User'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Eye, Package, Clock, CheckCircle2, XCircle, Truck, AlertCircle } from 'lucide-react'
import OrderStatusUpdater from './order-status-updater'
import OrderCancelButton from './order-cancel-button'
import AssignDriverDialog from './assign-driver-dialog'
import OrderSearch from './order-search'

const STATUS_COLOR: Record<string, string> = {
  pending:          'bg-yellow-100 text-yellow-800',
  confirmed:        'bg-blue-100 text-blue-800',
  picked_up:        'bg-indigo-100 text-indigo-800',
  washing:          'bg-purple-100 text-purple-800',
  drying:           'bg-pink-100 text-pink-800',
  ironing:          'bg-orange-100 text-orange-800',
  out_for_delivery: 'bg-cyan-100 text-cyan-800',
  delivered:        'bg-green-100 text-green-800',
  cancelled:        'bg-red-100 text-red-800',
}

const ACTIVE_STATUSES: OrderStatus[] = ['confirmed', 'picked_up', 'washing', 'drying', 'ironing', 'out_for_delivery']

const TABS = [
  { key: '',           label: 'All' },
  { key: 'pending',    label: 'Pending' },
  { key: 'active',     label: 'Active' },
  { key: 'delivered',  label: 'Delivered' },
  { key: 'cancelled',  label: 'Cancelled' },
]

type SearchParams = { status?: string; q?: string }

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireAdmin()
  await connectDB()

  const { status: statusFilter = '', q = '' } = await searchParams

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  // Build query filter
  const statusQuery: { status?: { $in: OrderStatus[] } | OrderStatus } = {}
  if (statusFilter === 'active') {
    statusQuery.status = { $in: ACTIVE_STATUSES }
  } else if (statusFilter && statusFilter !== 'active') {
    statusQuery.status = statusFilter as OrderStatus
  }

  const [
    rawOrders, rawDrivers,
    countAll, countPending, countActive, countDelivered, countCancelled, countDeliveredToday,
    countUnassigned,
  ] = await Promise.all([
    Order.find(statusQuery)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('user', 'name phone')
      .populate('driver', '_id name phone')
      .lean(),
    User.find({ role: 'driver' }).select('_id name phone').lean(),
    Order.countDocuments(),
    Order.countDocuments({ status: 'pending' }),
    Order.countDocuments({ status: { $in: ACTIVE_STATUSES } }),
    Order.countDocuments({ status: 'delivered' }),
    Order.countDocuments({ status: 'cancelled' }),
    Order.countDocuments({ status: 'delivered', updatedAt: { $gte: todayStart } }),
    Order.countDocuments({ driver: null, status: { $in: ACTIVE_STATUSES } }),
  ])

  type OrderRow = {
    _id: string; status: string; totalAmount: number; discountAmount: number;
    paymentMethod: string; createdAt: string;
    user: { name: string; phone: string } | null
    driver: { _id: string; name: string; phone: string } | null
    items: Array<{ service: string; quantity: number }>
  }

  let orders = JSON.parse(JSON.stringify(rawOrders)) as OrderRow[]

  // Client-side search filter (name/phone match on populated user)
  if (q) {
    const term = q.toLowerCase()
    orders = orders.filter(
      (o) =>
        o.user?.name.toLowerCase().includes(term) ||
        o.user?.phone.toLowerCase().includes(term)
    )
  }

  const drivers = JSON.parse(JSON.stringify(rawDrivers)) as Array<{
    _id: string; name: string; phone: string
  }>

  const TAB_COUNTS: Record<string, number> = {
    '':          countAll,
    pending:     countPending,
    active:      countActive,
    delivered:   countDelivered,
    cancelled:   countCancelled,
  }

  return (
    <div className="space-y-5 p-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-sm text-muted-foreground">Manage and track all customer orders</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: 'Total',          value: countAll,           icon: Package,      color: 'text-blue-600',   bg: 'bg-blue-50' },
          { label: 'Pending',        value: countPending,       icon: Clock,        color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Active',         value: countActive,        icon: Truck,        color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Delivered Today',value: countDeliveredToday,icon: CheckCircle2, color: 'text-green-600',  bg: 'bg-green-50' },
          { label: 'Unassigned',     value: countUnassigned,    icon: AlertCircle,  color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className={value > 0 && label === 'Unassigned' ? 'border-orange-200' : ''}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div>
                <p className="text-xl font-bold leading-none">{value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status tabs */}
        <div className="flex gap-1 overflow-x-auto rounded-lg border bg-muted/40 p-1">
          {TABS.map(({ key, label }) => {
            const active = statusFilter === key
            const count  = TAB_COUNTS[key]
            const href   = `/admin/orders${key ? `?status=${key}` : ''}`
            return (
              <Link
                key={key}
                href={href}
                className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors
                  ${active
                    ? 'bg-white shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/60'
                  }`}
              >
                {label}
                <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold
                  ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {count}
                </span>
              </Link>
            )
          })}
        </div>

        <OrderSearch />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <Package className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">No orders found</p>
              {q && <p className="text-xs text-muted-foreground">Try a different search term</p>}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-24">Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const isClosed     = order.status === 'delivered' || order.status === 'cancelled'
                  const needsDriver  = !order.driver && ACTIVE_STATUSES.includes(order.status as OrderStatus)
                  return (
                    <TableRow
                      key={order._id}
                      className={needsDriver ? 'bg-orange-50/40 hover:bg-orange-50/60' : ''}
                    >
                      <TableCell>
                        <Link
                          href={`/admin/orders/${order._id}`}
                          className="font-mono text-xs font-semibold text-primary hover:underline"
                        >
                          #{order._id.slice(-8).toUpperCase()}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-sm">{order.user?.name ?? '—'}</p>
                        <p className="text-xs text-muted-foreground">{order.user?.phone}</p>
                      </TableCell>
                      <TableCell className="max-w-[160px]">
                        <p className="truncate text-sm">
                          {order.items.map((i) => `${i.service}×${i.quantity}`).join(', ')}
                        </p>
                      </TableCell>
                      <TableCell className="font-semibold text-sm">
                        ₱{(order.totalAmount - order.discountAmount).toFixed(2)}
                      </TableCell>
                      <TableCell className="capitalize text-sm">{order.paymentMethod}</TableCell>
                      <TableCell>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_COLOR[order.status] ?? 'bg-gray-100 text-gray-700'}`}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </TableCell>
                      <TableCell>
                        {!isClosed ? (
                          <div className="flex items-center gap-1.5">
                            {needsDriver && (
                              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-orange-500" />
                            )}
                            <AssignDriverDialog
                              orderId={order._id}
                              currentDriverId={order.driver?._id}
                              currentDriverName={order.driver?.name}
                              drivers={drivers}
                            />
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {order.driver?.name ?? '—'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString('en-PH', { dateStyle: 'short' })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleTimeString('en-PH', { timeStyle: 'short' })}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                            <Link href={`/admin/orders/${order._id}`}>
                              <Eye className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          {!isClosed && (
                            <OrderStatusUpdater orderId={order._id} currentStatus={order.status} />
                          )}
                          {!['delivered', 'cancelled', 'out_for_delivery'].includes(order.status) && (
                            <OrderCancelButton orderId={order._id} />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {orders.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Showing {orders.length} of {TAB_COUNTS[statusFilter] ?? countAll} orders
          {q && ` matching "${q}"`}
          {(TAB_COUNTS[statusFilter] ?? countAll) > 100 && ' · Showing latest 100'}
        </p>
      )}
    </div>
  )
}
