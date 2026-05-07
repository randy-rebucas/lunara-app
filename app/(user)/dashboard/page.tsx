import Image from 'next/image'
import Link from 'next/link'
import {
  Package, ChevronRight, CalendarDays,
  Clock, Menu, Bell, ShoppingBag, Tag,
  WashingMachine, Shirt, BedDouble, Footprints, Sparkles,
  Wind, Layers, type LucideIcon,
} from 'lucide-react'
import { requireSession } from '@/lib/server/auth'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import Order from '@/models/Order'
import ServiceModel from '@/models/Service'

const STATUS_TEXT_COLOR: Record<string, string> = {
  pending:          'text-yellow-600',
  confirmed:        'text-blue-600',
  picked_up:        'text-primary',
  washing:          'text-primary',
  drying:           'text-primary',
  ironing:          'text-primary',
  out_for_delivery: 'text-cyan-600',
  delivered:        'text-green-600',
  cancelled:        'text-red-500',
}

const SERVICE_ICON_MAP: Record<string, { icon: LucideIcon; bg: string; color: string }> = {
  'Wash & Fold':     { icon: WashingMachine, bg: 'bg-blue-50',   color: 'text-blue-600' },
  'Dry Cleaning':    { icon: Shirt,          bg: 'bg-indigo-50', color: 'text-indigo-600' },
  'Bedding & Linen': { icon: BedDouble,      bg: 'bg-purple-50', color: 'text-purple-600' },
  'Shoe Laundry':    { icon: Footprints,     bg: 'bg-orange-50', color: 'text-orange-600' },
  'Special Care':    { icon: Sparkles,       bg: 'bg-pink-50',   color: 'text-pink-600' },
  'Ironing':         { icon: Wind,           bg: 'bg-cyan-50',   color: 'text-cyan-600' },
}
const SERVICE_ICON_DEFAULT = { icon: Layers, bg: 'bg-gray-50', color: 'text-gray-500' }

const SERVICE_DESCRIPTION_MAP: Record<string, string> = {
  'Wash & Fold': 'Clean, folded and ready to use',
  'Dry Cleaning': 'Gentle care for your best wear',
  'Bedding & Linen': 'Fresh and deep cleaned',
  'Shoe Laundry': 'Clean kicks looking fresh',
  'Special Care': 'Extra care for delicate items',
  'Ironing': 'Crisp finish for every outfit',
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  picked_up: 'In Progress',
  washing: 'In Progress',
  drying: 'In Progress',
  ironing: 'In Progress',
  out_for_delivery: 'On the Way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

function formatPickupLabel(pickupTime?: string) {
  if (!pickupTime) return 'Pickup: Schedule pending'

  const pickupDate = new Date(pickupTime)
  const now = new Date()
  const isToday = pickupDate.toDateString() === now.toDateString()

  return `Pickup: ${isToday ? 'Today' : pickupDate.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
  })}, ${pickupDate.toLocaleTimeString('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
  })}`
}

export default async function DashboardPage() {
  const session = await requireSession()
  await connectDB()

  const [user, recentOrders, rawServices] = await Promise.all([
    User.findById(session.userId).select('name').lean(),
    Order.find({ user: session.userId }).sort({ createdAt: -1 }).limit(3).lean(),
    ServiceModel.find({ isActive: true }).sort({ sortOrder: 1 }).select('name basePrice unit').lean(),
  ])

  const userData   = user as { name: string } | null
  const orders     = JSON.parse(JSON.stringify(recentOrders)) as Array<{
    _id: string; status: string; totalAmount: number; discountAmount: number;
    pickupTime?: string; createdAt: string;
    items: Array<{ service: string; quantity: number }>
  }>
  const services   = JSON.parse(JSON.stringify(rawServices)) as Array<{
    _id: string; name: string; basePrice: number; unit: string
  }>

  const firstName   = userData?.name.split(' ')[0] ?? 'there'
  const featuredServices = services.slice(0, 4)

  return (
    <div className="min-h-full overflow-hidden bg-[#f8fbff]">
      <div className="relative bg-gradient-to-br from-white via-[#f7fbff] to-[#eaf4ff] px-5 pb-6 pt-4">
        <div className="absolute -right-12 top-0 h-56 w-56 rounded-full bg-[#eaf3ff]" />

        <div className="relative z-10 flex items-center justify-between">
          <Link
            href="/profile"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700"
            aria-label="Profile menu"
          >
            <Menu className="h-5 w-5" />
          </Link>
          <Link
            href="/notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-700"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full border border-white bg-primary" />
          </Link>
        </div>

        <div className="relative z-10 mt-7 max-w-[54%]">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">
            Hi, {firstName} 👋
          </h1>
          <p className="mt-2 text-sm font-medium leading-snug text-slate-500">
            Fresh laundry, delivered to you.
          </p>
        </div>

        <div className="absolute right-0 top-11 h-40 w-48 sm:h-44 sm:w-56">
          <Image
            src="/hero-laundry.png"
            alt="Laundry basket"
            fill
            sizes="224px"
            className="object-contain object-right"
            priority
          />
        </div>
      </div>

      <div className="space-y-5 px-4 pb-8">
        <Link
          href="/orders/new"
          className="relative -mt-1 block overflow-hidden rounded-[1.65rem] bg-gradient-to-br from-[#1d8cff] to-[#2878f0] p-4 shadow-xl shadow-blue-500/20"
        >
          <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute bottom-0 right-6 h-28 w-28 rounded-full bg-white/10 blur-sm" />

          <div className="relative flex min-h-28 items-center justify-between gap-4">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20">
                <CalendarDays className="h-6 w-6 text-white" strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-white">Schedule a Pickup</h2>
                <p className="mt-1 max-w-[150px] text-xs font-medium leading-relaxed text-white/85">
                  We&apos;ll pick up your clothes and handle the rest.
                </p>
                <span className="mt-4 inline-flex items-center gap-3 rounded-full bg-white px-5 py-2 text-sm font-bold text-primary shadow-lg shadow-blue-950/10">
                  Book Now
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </span>
              </div>
            </div>

            <div className="relative h-28 w-28 shrink-0">
              <Image
                src="/hero-laundry.png"
                alt="Laundry bag"
                fill
                sizes="112px"
                className="scale-125 object-contain object-left-bottom"
              />
            </div>
          </div>
        </Link>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900">Our Services</h2>
            <Link
              href="/services"
              className="flex items-center gap-1 text-xs font-semibold text-primary"
            >
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            {featuredServices.map((svc) => {
              const meta = SERVICE_ICON_MAP[svc.name] ?? SERVICE_ICON_DEFAULT
              const Icon = meta.icon
              return (
                <Link
                  key={svc._id}
                  href="/services"
                  className="flex min-h-[6.4rem] flex-col items-center rounded-2xl bg-white px-2 py-3 text-center shadow-[0_10px_28px_rgba(39,88,151,0.08)] ring-1 ring-blue-950/5 transition-transform active:scale-95"
                >
                  <div className={`flex h-11 w-11 items-center justify-center rounded-full ${meta.bg}`}>
                    <Icon className={`h-6 w-6 ${meta.color}`} strokeWidth={1.6} />
                  </div>
                  <p className="mt-2 line-clamp-2 min-h-[1.75rem] text-[10px] font-extrabold leading-tight text-slate-900">
                    {svc.name}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[8px] font-semibold leading-tight text-slate-400">
                    {SERVICE_DESCRIPTION_MAP[svc.name] ?? `Starts at ₱${svc.basePrice}`}
                  </p>
                </Link>
              )
            })}
          </div>
        </div>

        <Link
          href="/orders/new"
          className="relative block overflow-hidden rounded-[1.45rem] bg-[#eef6ff] px-4 py-4 shadow-[0_12px_30px_rgba(39,88,151,0.08)]"
        >
          <div className="flex items-center">
            <div className="relative z-10 flex-1">
              <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wide text-primary">
                <Tag className="h-4 w-4 fill-primary text-primary" />
                First Order Offer
              </p>
              <p className="mt-2 text-2xl font-black leading-none text-slate-950">Get 20% OFF</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">on your first order</p>
              <span className="mt-4 inline-flex rounded-xl border border-dashed border-primary/50 bg-white/70 px-3 py-1.5 text-xs font-bold text-primary">
                Code: WELCOME20
              </span>
            </div>

            <div className="relative h-28 w-36 shrink-0">
              <Image
                src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=220&h=220&fit=crop&q=80"
                alt="Folded clothes"
                fill
                sizes="144px"
                className="rounded-2xl object-cover"
              />
              <div className="absolute -left-2 top-2 flex h-12 w-12 flex-col items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/25">
                <span className="text-[10px] font-extrabold leading-none">20%</span>
                <span className="text-[10px] font-extrabold leading-none">OFF</span>
              </div>
            </div>
          </div>
        </Link>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900">Your Orders</h2>
            <Link
              href="/orders"
              className="flex items-center gap-1 text-xs font-semibold text-primary"
            >
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-10 text-center shadow-[0_10px_28px_rgba(39,88,151,0.08)] ring-1 ring-blue-950/5">
              <Package className="mb-3 h-10 w-10 text-primary/30" />
              <p className="text-sm font-bold text-slate-700">No orders yet</p>
              <p className="mt-0.5 text-xs font-medium text-slate-400">Tap Book Now to get started</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {orders.map((order) => {
                const totalItems = order.items.reduce((s, i) => s + i.quantity, 0)
                return (
                  <Link key={order._id} href={`/orders/${order._id}`}>
                    <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-[0_10px_28px_rgba(39,88,151,0.08)] ring-1 ring-blue-950/5 transition-transform active:scale-[0.99]">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        order.status === 'delivered'  ? 'bg-green-100' :
                        order.status === 'cancelled'  ? 'bg-red-100'   :
                                                        'bg-primary/10'
                      }`}>
                        <ShoppingBag className={`h-5 w-5 ${
                          order.status === 'delivered'  ? 'text-green-600' :
                          order.status === 'cancelled'  ? 'text-red-500'   :
                                                          'text-primary'
                        }`} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className={`text-[11px] font-extrabold ${STATUS_TEXT_COLOR[order.status] ?? 'text-primary'}`}>
                          {STATUS_LABEL[order.status] ?? order.status.replace(/_/g, ' ')}
                        </p>
                        <p className="mt-0.5 truncate text-sm font-bold text-slate-900">
                          Order #{order._id.slice(-6).toUpperCase()}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-slate-400">
                          <Clock className="h-3 w-3" />
                          {formatPickupLabel(order.pickupTime)}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-slate-400">
                        <span>{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
