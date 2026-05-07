import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireAdmin } from '@/lib/server/auth'
import { connectDB } from '@/lib/db'
import Order from '@/models/Order'
import User from '@/models/User'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft, User as UserIcon, Truck, MapPin,
  CreditCard, Package, MessageSquare, Clock,
  Phone, Mail, ExternalLink, CalendarClock, BadgeCheck, XCircle,
  ArrowRight,
} from 'lucide-react'
import OrderStatusUpdater from '../order-status-updater'
import OrderCancelButton from '../order-cancel-button'
import AssignDriverDialog from '../assign-driver-dialog'

const STATUS_COLOR: Record<string, string> = {
  pending:          'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed:        'bg-blue-100 text-blue-800 border-blue-200',
  picked_up:        'bg-indigo-100 text-indigo-800 border-indigo-200',
  washing:          'bg-purple-100 text-purple-800 border-purple-200',
  drying:           'bg-pink-100 text-pink-800 border-pink-200',
  ironing:          'bg-orange-100 text-orange-800 border-orange-200',
  out_for_delivery: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  delivered:        'bg-green-100 text-green-800 border-green-200',
  cancelled:        'bg-red-100 text-red-800 border-red-200',
}

const STATUS_STEPS = [
  { key: 'pending',          label: 'Pending' },
  { key: 'confirmed',        label: 'Confirmed' },
  { key: 'picked_up',        label: 'Picked Up' },
  { key: 'washing',          label: 'Washing' },
  { key: 'drying',           label: 'Drying' },
  { key: 'ironing',          label: 'Ironing' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered',        label: 'Delivered' },
]

type Params = { params: Promise<{ id: string }> }

export default async function AdminOrderDetailPage({ params }: Params) {
  await requireAdmin()
  await connectDB()

  const { id } = await params

  const [rawOrder, rawDrivers] = await Promise.all([
    Order.findById(id)
      .populate('user', '_id name phone email')
      .populate('driver', '_id name phone')
      .populate('couponApplied', 'code discountType discountValue')
      .lean(),
    User.find({ role: 'driver' }).select('_id name phone').lean(),
  ])

  if (!rawOrder) notFound()

  const order = JSON.parse(JSON.stringify(rawOrder)) as {
    _id: string
    status: string
    totalAmount: number
    discountAmount: number
    paymentMethod: string
    createdAt: string
    updatedAt: string
    pickupTime: string
    deliveryTime?: string
    notes?: string
    user: { _id: string; name: string; phone: string; email?: string } | null
    driver: { _id: string; name: string; phone: string } | null
    items: Array<{ service: string; quantity: number; price: number }>
    pickupAddress: { street: string; city: string; province: string; zip: string }
    deliveryAddress: { street: string; city: string; province: string; zip: string }
    couponApplied: { code: string; discountType: string; discountValue: number } | null
  }

  const drivers = JSON.parse(JSON.stringify(rawDrivers)) as Array<{
    _id: string; name: string; phone: string
  }>

  const finalAmount    = order.totalAmount - order.discountAmount
  const currentStepIdx = STATUS_STEPS.findIndex((s) => s.key === order.status)
  const isClosed       = order.status === 'delivered' || order.status === 'cancelled'
  const isCancelled    = order.status === 'cancelled'
  const isDelivered    = order.status === 'delivered'

  return (
    <div className="space-y-5 p-6">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-white text-muted-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">Order #{id.slice(-8).toUpperCase()}</h1>
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_COLOR[order.status] ?? 'bg-gray-100 text-gray-700'}`}>
                {order.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground font-mono">{id}</p>
          </div>
        </div>

        {!isClosed && (
          <div className="flex flex-wrap items-center gap-2">
            <OrderStatusUpdater orderId={order._id} currentStatus={order.status} />
            {order.status !== 'out_for_delivery' && (
              <OrderCancelButton orderId={order._id} />
            )}
          </div>
        )}
      </div>

      {/* ── Cancelled banner ─────────────────────────────────────────── */}
      {isCancelled && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <XCircle className="h-5 w-5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-semibold text-red-800">This order has been cancelled</p>
            <p className="text-xs text-red-600">
              Last updated {new Date(order.updatedAt).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
        </div>
      )}

      {/* ── Delivered banner ─────────────────────────────────────────── */}
      {isDelivered && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <BadgeCheck className="h-5 w-5 shrink-0 text-green-600" />
          <div>
            <p className="text-sm font-semibold text-green-800">Order delivered successfully</p>
            <p className="text-xs text-green-600">
              {order.deliveryTime
                ? `Delivered on ${new Date(order.deliveryTime).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}`
                : `Completed ${new Date(order.updatedAt).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}`
              }
            </p>
          </div>
        </div>
      )}

      {/* ── Progress tracker ─────────────────────────────────────────── */}
      {!isCancelled && (
        <Card>
          <CardContent className="px-4 py-5">
            <div className="flex items-start justify-between gap-1 overflow-x-auto pb-1">
              {STATUS_STEPS.map((step, i) => {
                const done   = i < currentStepIdx
                const active = i === currentStepIdx
                return (
                  <div key={step.key} className="flex min-w-0 flex-1 flex-col items-center">
                    <div className="flex w-full items-center">
                      {/* left connector */}
                      <div className={`h-0.5 flex-1 ${i === 0 ? 'invisible' : i <= currentStepIdx ? 'bg-primary' : 'bg-muted'}`} />
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-2
                        ${done
                          ? 'bg-primary text-primary-foreground ring-primary'
                          : active
                            ? 'bg-primary/10 text-primary ring-primary'
                            : 'bg-muted/50 text-muted-foreground ring-muted'
                        }`}>
                        {done ? '✓' : i + 1}
                      </div>
                      {/* right connector */}
                      <div className={`h-0.5 flex-1 ${i === STATUS_STEPS.length - 1 ? 'invisible' : i < currentStepIdx ? 'bg-primary' : 'bg-muted'}`} />
                    </div>
                    <span className={`mt-1.5 whitespace-nowrap text-[10px] text-center leading-tight
                      ${active ? 'font-bold text-primary' : done ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Main two-column layout ───────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-3">

        {/* Left — items + addresses + notes */}
        <div className="space-y-5 lg:col-span-2">

          {/* Order items */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-primary" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Service</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{item.service}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right text-muted-foreground">₱{item.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        ₱{(item.price * item.quantity).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="space-y-2 border-t px-5 py-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₱{order.totalAmount.toFixed(2)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-green-700">
                      <span className="flex items-center gap-1.5">
                        Discount
                        {order.couponApplied && (
                          <code className="rounded bg-green-100 px-1.5 py-0.5 text-xs font-bold">
                            {order.couponApplied.code}
                          </code>
                        )}
                      </span>
                      <span>−₱{order.discountAmount.toFixed(2)}</span>
                    </div>
                  </>
                )}
                <Separator />
                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span className="text-primary">₱{finalAmount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Addresses */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-primary" />
                  Pickup Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-0.5 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{order.pickupAddress.street}</p>
                <p>{order.pickupAddress.city}, {order.pickupAddress.province}</p>
                <p>{order.pickupAddress.zip}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-green-600" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-0.5 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{order.deliveryAddress.street}</p>
                <p>{order.deliveryAddress.city}, {order.deliveryAddress.province}</p>
                <p>{order.deliveryAddress.zip}</p>
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Customer Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground italic">
                  &ldquo;{order.notes}&rdquo;
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right sidebar — customer, driver, payment */}
        <div className="space-y-4">

          {/* Customer */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <UserIcon className="h-4 w-4 text-primary" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              <p className="font-semibold text-base">{order.user?.name ?? '—'}</p>
              {order.user?.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>{order.user.phone}</span>
                </div>
              )}
              {order.user?.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{order.user.email}</span>
                </div>
              )}
              {order.user?._id && (
                <Link
                  href={`/admin/users/${order.user._id}`}
                  className="mt-1 flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  View profile <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Driver */}
          <Card className={!order.driver && !isClosed ? 'border-orange-200 bg-orange-50/30' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Truck className="h-4 w-4 text-primary" />
                Driver
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              {order.driver ? (
                <>
                  <p className="font-semibold text-base">{order.driver.name}</p>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <span>{order.driver.phone}</span>
                  </div>
                  <Link
                    href={`/admin/users/${order.driver._id}`}
                    className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    View profile <ExternalLink className="h-3 w-3" />
                  </Link>
                </>
              ) : (
                <p className="text-sm text-orange-600 font-medium">Not assigned yet</p>
              )}
              {!isClosed && (
                <div className="pt-1">
                  <AssignDriverDialog
                    orderId={order._id}
                    currentDriverId={order.driver?._id}
                    currentDriverName={order.driver?.name}
                    drivers={drivers}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment & Timing */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4 text-primary" />
                Payment & Timing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="font-medium capitalize">{order.paymentMethod}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold text-primary">₱{finalAmount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-xs">
                  <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Placed</p>
                    <p className="font-medium text-foreground">
                      {new Date(order.createdAt).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Pickup scheduled</p>
                    <p className="font-medium text-foreground">
                      {new Date(order.pickupTime).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
                {order.deliveryTime && (
                  <div className="flex items-start gap-2 text-xs">
                    <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                    <div>
                      <p className="text-muted-foreground">Delivered</p>
                      <p className="font-medium text-foreground">
                        {new Date(order.deliveryTime).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Footer meta */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        Last updated {new Date(order.updatedAt).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
      </div>

    </div>
  )
}
