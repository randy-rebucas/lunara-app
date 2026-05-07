import Link from 'next/link'
import { requireAdmin } from '@/lib/server/auth'
import { connectDB } from '@/lib/db'
import Order from '@/models/Order'
import User from '@/models/User'
import HelpTicket from '@/models/HelpTicket'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Package, Users, HelpCircle, TrendingUp, Truck,
  Clock, CheckCircle2, XCircle, AlertCircle,
  ArrowRight, ShoppingBag, Star, UserCog, Tag,
  WashingMachine,
} from 'lucide-react'

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

export default async function AdminDashboardPage() {
  const session = await requireAdmin()
  await connectDB()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const [
    totalOrders,
    pendingOrders,
    activeOrders,
    deliveredToday,
    cancelledTotal,
    totalUsers,
    totalDrivers,
    openTickets,
    inProgressTickets,
    unassignedActive,
    recentOrders,
    revenueAll,
    revenueToday,
    revenueMonth,
    statusBreakdown,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ status: 'pending' }),
    Order.countDocuments({ status: { $in: ['confirmed', 'picked_up', 'washing', 'drying', 'ironing', 'out_for_delivery'] } }),
    Order.countDocuments({ status: 'delivered', updatedAt: { $gte: todayStart } }),
    Order.countDocuments({ status: 'cancelled' }),
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ role: 'driver' }),
    HelpTicket.countDocuments({ status: 'open' }),
    HelpTicket.countDocuments({ status: 'in_progress' }),
    Order.countDocuments({
      driver: null,
      status: { $in: ['confirmed', 'picked_up', 'washing', 'drying', 'ironing', 'out_for_delivery'] },
    }),
    Order.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('user', 'name phone')
      .lean(),
    Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: { $subtract: ['$totalAmount', '$discountAmount'] } } } },
    ]),
    Order.aggregate([
      { $match: { status: 'delivered', updatedAt: { $gte: todayStart } } },
      { $group: { _id: null, total: { $sum: { $subtract: ['$totalAmount', '$discountAmount'] } } } },
    ]),
    Order.aggregate([
      { $match: { status: 'delivered', updatedAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: { $subtract: ['$totalAmount', '$discountAmount'] } } } },
    ]),
    Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ])

  const orders = JSON.parse(JSON.stringify(recentOrders)) as Array<{
    _id: string
    status: string
    totalAmount: number
    discountAmount: number
    createdAt: string
    user: { name: string; phone: string } | null
    items: Array<{ service: string }>
  }>

  const totalRevenue  = revenueAll[0]?.total   ?? 0
  const todayRevenue  = revenueToday[0]?.total  ?? 0
  const monthRevenue  = revenueMonth[0]?.total  ?? 0

  const breakdown = (statusBreakdown as Array<{ _id: string; count: number }>)
    .filter((s) => s._id)
    .sort((a, b) => b.count - a.count)

  const greetHour = new Date().getHours()
  const greeting  = greetHour < 12 ? 'Good morning' : greetHour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6 p-6">

      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{greeting}, Admin</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Package className="h-4 w-4" /> View All Orders
        </Link>
      </div>

      {/* Primary KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="mt-1 text-2xl font-bold">
                  ₱{totalRevenue.toLocaleString('en-PH', { maximumFractionDigits: 0 })}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  ₱{monthRevenue.toLocaleString('en-PH', { maximumFractionDigits: 0 })} this month
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today&apos;s Revenue</p>
                <p className="mt-1 text-2xl font-bold">
                  ₱{todayRevenue.toLocaleString('en-PH', { maximumFractionDigits: 0 })}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{deliveredToday} delivered today</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50">
                <CheckCircle2 className="h-5 w-5 text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="mt-1 text-2xl font-bold">{totalOrders}</p>
                <p className="mt-1 text-xs text-muted-foreground">{cancelledTotal} cancelled</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Orders</p>
                <p className="mt-1 text-2xl font-bold">{activeOrders}</p>
                <p className="mt-1 text-xs text-muted-foreground">{pendingOrders} awaiting confirmation</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Customers</p>
                <p className="mt-1 text-2xl font-bold">{totalUsers}</p>
                <p className="mt-1 text-xs text-muted-foreground">registered users</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Drivers</p>
                <p className="mt-1 text-2xl font-bold">{totalDrivers}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {unassignedActive > 0
                    ? <span className="text-orange-500">{unassignedActive} jobs need driver</span>
                    : 'all jobs assigned'}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                <Truck className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Support Tickets</p>
                <p className="mt-1 text-2xl font-bold">{openTickets + inProgressTickets}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {openTickets} open · {inProgressTickets} in progress
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
                <HelpCircle className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={unassignedActive > 0 ? 'border-orange-200 bg-orange-50/30' : ''}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Needs Attention</p>
                <p className="mt-1 text-2xl font-bold text-orange-600">{pendingOrders + openTickets + unassignedActive}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {pendingOrders} pending · {openTickets} tickets
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
                <AlertCircle className="h-5 w-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status breakdown + Quick actions */}
      <div className="grid gap-5 lg:grid-cols-3">

        {/* Order status distribution */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <WashingMachine className="h-4 w-4 text-primary" />
              Order Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {breakdown.map(({ _id: status, count }) => {
              const pct = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0
              return (
                <div key={status} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_COLOR[status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{count}</span>
                      <span>{pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/60 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 p-3 pt-0">
            {[
              { href: '/admin/orders',   icon: Package,    label: 'Manage Orders',   sub: `${pendingOrders} pending` },
              { href: '/admin/users',    icon: UserCog,    label: 'Manage Users',    sub: `${totalUsers} customers` },
              { href: '/admin/users?role=driver', icon: Truck, label: 'Manage Drivers', sub: `${totalDrivers} active` },
              { href: '/admin/services', icon: WashingMachine, label: 'Services',    sub: 'Edit pricing' },
              { href: '/admin/coupons',  icon: Tag,        label: 'Coupons',         sub: 'Manage discounts' },
              { href: '/admin/rewards',  icon: Star,       label: 'Rewards',         sub: 'Loyalty programme' },
              { href: '/admin/help-tickets', icon: HelpCircle, label: 'Help Tickets', sub: `${openTickets} open` },
            ].map(({ href, icon: Icon, label, sub }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted"
              >
                <Icon className="h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ShoppingBag className="h-4 w-4 text-primary" />
            Recent Orders
          </CardTitle>
          <Link href="/admin/orders" className="flex items-center gap-1 text-xs text-primary hover:underline">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent className="space-y-0 p-0">
          {orders.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <div>
              {orders.map((order, idx) => (
                <div key={order._id}>
                  <div className="flex items-center gap-4 px-6 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Package className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{order.user?.name ?? 'Unknown'}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {order.items.map((i) => i.service).join(', ')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        className={`border-0 text-xs font-semibold capitalize ${STATUS_COLOR[order.status] ?? 'bg-gray-100 text-gray-700'}`}
                      >
                        {order.status.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-xs font-semibold">
                        ₱{(order.totalAmount - (order.discountAmount ?? 0)).toFixed(2)}
                      </span>
                    </div>
                    <Link
                      href={`/admin/orders/${order._id}`}
                      className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-white text-muted-foreground transition-colors hover:bg-muted"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                  {idx < orders.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alerts strip */}
      {(unassignedActive > 0 || openTickets > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {unassignedActive > 0 && (
            <Link href="/admin/orders" className="group flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 transition-colors hover:bg-orange-100">
              <XCircle className="h-5 w-5 shrink-0 text-orange-500" />
              <div className="flex-1 text-sm">
                <p className="font-semibold text-orange-800">{unassignedActive} active orders without a driver</p>
                <p className="text-xs text-orange-600">Tap to assign drivers</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-orange-400 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
          {openTickets > 0 && (
            <Link href="/admin/help-tickets" className="group flex items-center gap-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 transition-colors hover:bg-yellow-100">
              <HelpCircle className="h-5 w-5 shrink-0 text-yellow-600" />
              <div className="flex-1 text-sm">
                <p className="font-semibold text-yellow-800">{openTickets} open support ticket{openTickets > 1 ? 's' : ''}</p>
                <p className="text-xs text-yellow-600">Tap to review and reply</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-yellow-400 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>
      )}

    </div>
  )
}
