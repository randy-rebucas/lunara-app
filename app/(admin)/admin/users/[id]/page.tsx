import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireAdmin } from '@/lib/server/auth'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import Order from '@/models/Order'
import '@/models/Wallet'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft, ShoppingBag, Star, Wallet as WalletIcon,
  Phone, Mail, UserCheck, Calendar, Hash, Package, Truck,
  Bell, Globe, BadgeCheck, ExternalLink, Clock,
} from 'lucide-react'
import UserEditDialog from '../user-edit-dialog'

type Params = { params: Promise<{ id: string }> }

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

export default async function AdminUserDetailPage({ params }: Params) {
  await requireAdmin()
  await connectDB()

  const { id } = await params

  const [rawUser, rawOrders, rawJobs, orderAgg, jobAgg] = await Promise.all([
    User.findById(id).populate('wallet', 'balance currency').lean(),
    Order.find({ user: id }).sort({ createdAt: -1 }).limit(20).lean(),
    Order.find({ driver: id }).populate('user', 'name phone').sort({ createdAt: -1 }).limit(20).lean(),
    // Accurate lifetime stats — not capped by the display limit
    Order.aggregate([
      { $match: { user: (await import('mongoose')).default.Types.ObjectId.createFromHexString(id) } },
      { $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
          spent: { $sum: { $cond: [{ $ne: ['$status', 'cancelled'] }, { $subtract: ['$totalAmount', '$discountAmount'] }, 0] } },
        },
      },
    ]),
    Order.aggregate([
      { $match: { driver: (await import('mongoose')).default.Types.ObjectId.createFromHexString(id) } },
      { $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
          active: { $sum: { $cond: [{ $not: [{ $in: ['$status', ['delivered', 'cancelled']] }] }, 1, 0] } },
        },
      },
    ]),
  ])

  if (!rawUser) notFound()

  type OrderRow = {
    _id: string; status: string; totalAmount: number; discountAmount: number
    paymentMethod: string; createdAt: string
    items: Array<{ service: string; quantity: number }>
  }
  type JobRow = OrderRow & { user: { name: string; phone: string } | null }

  const user = JSON.parse(JSON.stringify(rawUser)) as {
    _id: string; name: string; phone: string; email?: string; role: string
    isVerified: boolean; loyaltyPoints: number; referralCode: string
    createdAt: string; updatedAt: string
    preferences: { pushNotifications: boolean; emailNotifications: boolean; language: string }
    wallet: { balance: number; currency: string } | null
  }

  const isDriver = user.role === 'driver'
  const orders   = JSON.parse(JSON.stringify(rawOrders)) as OrderRow[]
  const jobs     = JSON.parse(JSON.stringify(rawJobs))   as JobRow[]

  // Use DB aggregates for accurate lifetime stats
  const totalSpent      = orderAgg[0]?.spent    ?? 0
  const completedOrders = orderAgg[0]?.completed ?? 0
  const totalOrders     = orderAgg[0]?.total     ?? 0
  const completedJobs   = jobAgg[0]?.completed  ?? 0
  const activeJobs      = jobAgg[0]?.active      ?? 0
  const totalJobs       = jobAgg[0]?.total       ?? 0

  const initials = user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  const avatarBg = user.role === 'admin' ? 'bg-primary/15 text-primary'
    : user.role === 'driver' ? 'bg-indigo-100 text-indigo-700'
    : 'bg-gray-100 text-gray-700'

  return (
    <div className="space-y-5 p-6">

      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/users"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-white text-muted-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className={`text-sm font-bold ${avatarBg}`}>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold">{user.name}</h1>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize
                  ${user.role === 'admin' ? 'bg-primary/10 text-primary'
                    : user.role === 'driver' ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-700'}`}>
                  {user.role}
                </span>
                {user.isVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                    <BadgeCheck className="h-3 w-3" /> Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Joined {new Date(user.createdAt).toLocaleDateString('en-PH', { dateStyle: 'medium' })}
              </p>
            </div>
          </div>
        </div>
        <UserEditDialog
          userId={user._id} name={user.name} role={user.role}
          loyaltyPoints={user.loyaltyPoints} isVerified={user.isVerified}
        />
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {isDriver ? (
          <>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                  <Truck className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xl font-bold leading-none">{totalJobs}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{completedJobs} delivered</p>
                  <p className="text-[10px] text-muted-foreground">Total jobs</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-50">
                  <Truck className="h-4 w-4 text-cyan-600" />
                </div>
                <div>
                  <p className="text-xl font-bold leading-none">{activeJobs}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">in progress</p>
                  <p className="text-[10px] text-muted-foreground">Active jobs</p>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                  <ShoppingBag className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xl font-bold leading-none">{totalOrders}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{completedOrders} delivered</p>
                  <p className="text-[10px] text-muted-foreground">Total orders</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-50">
                  <WalletIcon className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xl font-bold leading-none">₱{totalSpent.toFixed(0)}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">excl. cancelled</p>
                  <p className="text-[10px] text-muted-foreground">Total spent</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50">
              <WalletIcon className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xl font-bold leading-none">
                {user.wallet ? `₱${user.wallet.balance.toFixed(0)}` : '—'}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{user.wallet?.currency ?? 'PHP'}</p>
              <p className="text-[10px] text-muted-foreground">Wallet</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50">
              <Star className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold leading-none">{user.loyaltyPoints}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">pts</p>
              <p className="text-[10px] text-muted-foreground">Loyalty</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Two-column body ── */}
      <div className="grid gap-5 lg:grid-cols-3">

        {/* Sidebar */}
        <div className="space-y-4">

          {/* Contact */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Contact & Identity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>{user.phone}</span>
              </div>
              {user.email && (
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{user.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2.5">
                <Hash className="h-4 w-4 shrink-0 text-muted-foreground" />
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{user.referralCode}</code>
                <span className="text-xs text-muted-foreground">referral</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {new Date(user.createdAt).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Verified</span>
                {user.isVerified ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
                    <UserCheck className="h-3.5 w-3.5" /> Yes
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">No</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Role</span>
                <Badge variant={user.role === 'admin' ? 'default' : user.role === 'driver' ? 'secondary' : 'outline'} className="text-xs capitalize">
                  {user.role}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-3.5 w-3.5" /> Language
                </div>
                <span className="font-medium uppercase">{user.preferences.language}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Bell className="h-3.5 w-3.5" /> Push
                </div>
                <span className={user.preferences.pushNotifications ? 'text-green-600 font-medium text-xs' : 'text-xs text-muted-foreground'}>
                  {user.preferences.pushNotifications ? 'On' : 'Off'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" /> Email
                </div>
                <span className={user.preferences.emailNotifications ? 'text-green-600 font-medium text-xs' : 'text-xs text-muted-foreground'}>
                  {user.preferences.emailNotifications ? 'On' : 'Off'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Last updated */}
          <div className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Updated {new Date(user.updatedAt).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
          </div>
        </div>

        {/* Main — orders / jobs */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                {isDriver
                  ? <><Truck className="h-4 w-4 text-primary" /> Assigned Jobs</>
                  : <><Package className="h-4 w-4 text-primary" /> Order History</>
                }
                <span className="ml-auto text-xs font-normal text-muted-foreground">Latest 20</span>
              </CardTitle>
            </CardHeader>

            {(isDriver ? jobs : orders).length === 0 ? (
              <CardContent>
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  {isDriver
                    ? <Truck className="h-8 w-8 text-muted-foreground/30" />
                    : <Package className="h-8 w-8 text-muted-foreground/30" />
                  }
                  <p className="text-sm text-muted-foreground">
                    {isDriver ? 'No jobs assigned yet.' : 'No orders placed yet.'}
                  </p>
                </div>
              </CardContent>
            ) : (
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Order #</TableHead>
                      {isDriver && <TableHead>Customer</TableHead>}
                      <TableHead>Services</TableHead>
                      <TableHead>Status</TableHead>
                      {!isDriver && <TableHead>Payment</TableHead>}
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(isDriver ? jobs : orders).map((row) => {
                      const job = row as JobRow
                      return (
                        <TableRow key={row._id}>
                          <TableCell>
                            <Link
                              href={`/admin/orders/${row._id}`}
                              className="font-mono text-xs font-semibold text-primary hover:underline"
                            >
                              #{row._id.slice(-8).toUpperCase()}
                            </Link>
                          </TableCell>
                          {isDriver && (
                            <TableCell className="text-sm">
                              <p className="font-medium">{job.user?.name ?? '—'}</p>
                              {job.user?.phone && (
                                <p className="text-xs text-muted-foreground">{job.user.phone}</p>
                              )}
                            </TableCell>
                          )}
                          <TableCell className="max-w-[160px]">
                            <p className="truncate text-sm">
                              {row.items.map((i) => i.service).join(', ')}
                            </p>
                          </TableCell>
                          <TableCell>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_COLOR[row.status] ?? 'bg-gray-100 text-gray-700'}`}>
                              {row.status.replace(/_/g, ' ')}
                            </span>
                          </TableCell>
                          {!isDriver && (
                            <TableCell className="text-sm capitalize">{(row as OrderRow).paymentMethod}</TableCell>
                          )}
                          <TableCell className="text-right font-semibold text-sm">
                            ₱{(row.totalAmount - row.discountAmount).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(row.createdAt).toLocaleDateString('en-PH', { dateStyle: 'short' })}
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/admin/orders/${row._id}`}
                              className="flex h-6 w-6 items-center justify-center rounded hover:bg-muted"
                              title="View order"
                            >
                              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                            </Link>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            )}
          </Card>
        </div>
      </div>

    </div>
  )
}
