import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  BadgeCheck, CalendarDays, Camera, Check, CheckCircle2, ChevronLeft,
  ChevronRight, Circle, FileText, Headphones, Home, MapPin,
  Navigation, Package, ReceiptText, Shirt, Truck, WashingMachine,
  type LucideIcon,
} from 'lucide-react'
import { requireSession } from '@/lib/server/auth'
import { connectDB } from '@/lib/db'
import Order from '@/models/Order'
import OrderActions from './order-actions'

const STATUS_STEPS = [
  { key: 'picked_up',        label: 'Picked Up',        icon: Package },
  { key: 'washing',          label: 'Washing',          icon: Camera },
  { key: 'drying',           label: 'Drying',           icon: BadgeCheck },
  { key: 'ironing',          label: 'Ironing',          icon: Shirt },
  { key: 'out_for_delivery', label: 'Out For Delivery', icon: Truck },
  { key: 'delivered',        label: 'Delivered',        icon: Check },
]

const ALL_STEPS = [
  'pending', 'confirmed', 'picked_up', 'washing',
  'drying', 'ironing', 'out_for_delivery', 'delivered',
]

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'In Progress',
  picked_up: 'In Progress',
  washing: 'In Progress',
  drying: 'In Progress',
  ironing: 'In Progress',
  out_for_delivery: 'In Progress',
  delivered: 'Completed',
  cancelled: 'Cancelled',
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-600',
  confirmed: 'bg-blue-100 text-primary',
  picked_up: 'bg-blue-100 text-primary',
  washing: 'bg-blue-100 text-primary',
  drying: 'bg-blue-100 text-primary',
  ironing: 'bg-blue-100 text-primary',
  out_for_delivery: 'bg-blue-100 text-primary',
  delivered: 'bg-green-100 text-green-600',
  cancelled: 'bg-red-100 text-red-500',
}

const ITEM_ICON: Record<string, LucideIcon> = {
  'Wash & Fold': WashingMachine,
  'Dry Cleaning': Shirt,
  'Bedding & Linen': ReceiptText,
  'Shoe Laundry': Package,
}

function formatDateTime(value?: string) {
  if (!value) return 'Pending'
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatShortDateTime(value?: string) {
  if (!value) return 'Pending'
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatDeliveryEstimate(value?: string) {
  if (!value) return 'Pending'
  const date = new Date(value)
  const today = new Date()
  const dayLabel = date.toDateString() === today.toDateString()
    ? 'Today'
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return `${dayLabel}, ${date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })}`
}

function formatAddress(address: { street: string; city: string; province: string }) {
  return `${address.street}, ${address.city}, ${address.province}`
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireSession()
  await connectDB()

  const raw = await Order.findOne({ _id: id, user: session.userId }).lean()
  if (!raw) notFound()

  const order = JSON.parse(JSON.stringify(raw)) as {
    _id: string; status: string; totalAmount: number; discountAmount: number;
    paymentMethod: string; pickupTime: string; deliveryTime?: string; notes?: string;
    createdAt: string; items: Array<{ service: string; quantity: number; price: number }>
    pickupAddress: { street: string; city: string; province: string }
    deliveryAddress: { street: string; city: string; province: string }
  }

  const currentStep = ALL_STEPS.indexOf(order.status)
  const isCancellable = ['pending', 'confirmed'].includes(order.status)
  const isCancelled = order.status === 'cancelled'
  const total = order.totalAmount - (order.discountAmount ?? 0)
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)
  const deliveryDate = order.deliveryTime ?? order.pickupTime
  const subtotal = order.totalAmount
  const paidTotal = total
  const orderId = `#${order._id.slice(-5).toUpperCase()}`

  return (
    <div className="min-h-full bg-[#f8fbff] px-4 pb-8 pt-5">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
        <Link
          href="/orders"
          className="flex h-9 w-9 items-center justify-center rounded-full text-primary"
          aria-label="Back to orders"
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-xl font-extrabold tracking-tight text-slate-950">Order {orderId}</h1>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${STATUS_BADGE[order.status] ?? 'bg-blue-100 text-primary'}`}>
              {STATUS_LABEL[order.status] ?? order.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-500">
            <CalendarDays className="h-4 w-4" />
            Placed on {formatDateTime(order.createdAt)}
          </p>
        </div>
        <Link href="/help" className="flex items-center gap-1.5 text-xs font-extrabold text-primary">
          <Headphones className="h-4 w-4" />
          Help
        </Link>
      </div>

      <div className="mt-6 space-y-5">
        <div className="relative overflow-hidden rounded-[1.1rem] bg-[#eef6ff] px-5 py-4 shadow-[0_14px_36px_rgba(39,88,151,0.08)]">
          <div className="flex min-h-24 items-center gap-4">
            <div className="relative h-20 w-20 shrink-0">
              <Image
                src="/hero-laundry.png"
                alt="Laundry bag"
                fill
                sizes="80px"
                className="scale-150 object-contain object-left-bottom"
                priority
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-700">We&apos;re taking great care of your clothes!</p>
              <p className="mt-3 text-sm font-semibold text-slate-500">Estimated delivery</p>
              <p className="text-2xl font-black text-primary">{formatDeliveryEstimate(deliveryDate)}</p>
            </div>
            <div className="relative hidden h-24 w-28 shrink-0 sm:block">
              <WashingMachine className="absolute bottom-2 left-2 h-16 w-16 text-slate-300" strokeWidth={1.3} />
              <Package className="absolute bottom-0 right-2 h-10 w-10 text-primary/40" />
            </div>
          </div>
        </div>

        {!isCancelled ? (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-950">Order Progress</h2>
              <Link href="/orders" className="flex items-center gap-1 text-xs font-extrabold text-primary">
                View History
                <ClockIcon />
              </Link>
            </div>
            <div className="overflow-hidden rounded-[1.1rem] bg-white px-3 py-4 shadow-[0_14px_36px_rgba(39,88,151,0.08)] ring-1 ring-blue-950/5">
              <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex min-w-max items-start">
                  {STATUS_STEPS.map((step, i) => {
                    const Icon = step.icon
                    const stepOrder = ALL_STEPS.indexOf(step.key)
                    const done = stepOrder < currentStep
                    const current = stepOrder === currentStep
                    const last = i === STATUS_STEPS.length - 1
                    const active = done || current

                    return (
                      <div key={step.key} className="flex items-start">
                        <div className="flex w-16 flex-col items-center gap-2">
                          <div className={`flex h-11 w-11 items-center justify-center rounded-full ${
                            active ? 'bg-primary text-white' : 'bg-slate-50 text-slate-400 ring-1 ring-slate-200'
                          }`}>
                            <Icon className="h-5 w-5" strokeWidth={1.8} />
                          </div>
                          <div className="text-center">
                            <p className={`text-[10px] font-extrabold leading-tight ${active ? 'text-slate-950' : 'text-slate-400'}`}>
                              {step.label}
                            </p>
                            <p className="mt-1 text-[8px] font-semibold leading-tight text-slate-400">
                              {active ? formatShortDateTime(order.pickupTime).replace(',', '') : 'Pending'}
                            </p>
                          </div>
                        </div>
                        {!last && (
                          <div className={`mt-5 h-0.5 w-6 shrink-0 rounded-full ${done ? 'bg-primary' : 'bg-slate-200'}`} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>
        ) : (
          <div className="rounded-[1.1rem] bg-red-50 px-4 py-3 text-sm font-bold text-red-500">
            This order has been cancelled.
          </div>
        )}

        <section className="rounded-[1.1rem] bg-white p-4 shadow-[0_14px_36px_rgba(39,88,151,0.08)] ring-1 ring-blue-950/5">
          <h2 className="mb-3 text-lg font-extrabold text-slate-950">Order Details</h2>
          <div className="divide-y divide-blue-950/5">
            {[
              { icon: MapPin, label: 'Pickup Address', value: formatAddress(order.pickupAddress), href: true },
              { icon: Home, label: 'Delivery Address', value: formatAddress(order.deliveryAddress), href: true },
              { icon: CalendarDays, label: 'Pickup Date & Time', value: formatDateTime(order.pickupTime) },
              { icon: CalendarDays, label: 'Delivery Date & Time', value: formatDateTime(deliveryDate) },
              { icon: FileText, label: 'Special Instructions', value: order.notes || 'No special instructions.' },
            ].map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <Icon className="h-4.5 w-4.5 shrink-0 text-primary" strokeWidth={1.7} />
                <p className="w-32 shrink-0 text-xs font-extrabold text-slate-950">{label}</p>
                <p className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-600">{value}</p>
                {href && <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[1.1rem] bg-white p-4 shadow-[0_14px_36px_rgba(39,88,151,0.08)] ring-1 ring-blue-950/5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-950">Items</h2>
            <p className="text-sm font-semibold text-slate-500">{itemCount} Items</p>
          </div>

          <div className="divide-y divide-blue-950/5">
            {order.items.map((item, i) => {
              const Icon = ITEM_ICON[item.service] ?? Package
              return (
                <div key={i} className="flex items-center gap-3 py-3 first:pt-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                    <Icon className="h-5 w-5 text-primary" strokeWidth={1.7} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold text-slate-950">{item.service}</p>
                    <p className="text-xs font-semibold text-slate-400">{item.quantity} item{item.quantity !== 1 ? 's' : ''}</p>
                  </div>
                  <p className="text-xs font-semibold text-slate-500">x{item.quantity}</p>
                  <p className="w-20 text-right text-sm font-extrabold text-slate-950">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              )
            })}
          </div>

          <div className="mt-4 border-t border-blue-950/5 pt-4">
            <h3 className="mb-3 text-sm font-extrabold text-slate-950">Pricing Summary</h3>
            <div className="space-y-2 text-sm font-semibold">
              <div className="flex justify-between text-slate-700">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {(order.discountAmount ?? 0) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount (WELCOME20)</span>
                  <span>-${order.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-700">
                <span>Delivery Fee</span>
                <span>Included</span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-blue-950/5 pt-4">
              <p className="text-base font-extrabold text-slate-950">Total Paid</p>
              <p className="text-2xl font-black text-slate-950">${paidTotal.toFixed(2)}</p>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-green-50 px-3 py-2 text-sm font-bold text-green-600">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Paid via {order.paymentMethod.replace(/_/g, ' ')}
              </span>
              <span>${paidTotal.toFixed(2)}</span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3">
          {isCancellable ? (
            <OrderActions orderId={order._id} />
          ) : (
            <Link
              href="/help"
              className="flex h-12 items-center justify-center rounded-xl border border-primary bg-white text-sm font-extrabold text-primary"
            >
              Contact Support
            </Link>
          )}
          <Link
            href="/orders"
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-extrabold text-white shadow-lg shadow-primary/20"
          >
            Track Order
            <Navigation className="h-4 w-4 fill-white" />
          </Link>
        </div>
      </div>
    </div>
  )
}

function ClockIcon() {
  return <Circle className="h-3.5 w-3.5" />
}
