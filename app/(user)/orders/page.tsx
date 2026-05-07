import Link from 'next/link'
import { Suspense } from 'react'
import {
  Package, MapPin, CheckCircle2, XCircle,
  ChevronRight, Circle, Headphones, CalendarDays, Filter,
  Shirt, ShoppingBasket, WashingMachine,
} from 'lucide-react'
import { requireSession } from '@/lib/server/auth'
import { connectDB } from '@/lib/db'
import Order from '@/models/Order'
import OrderFilterTabs from './order-filter-tabs'

// Steps shown in the progress mini-strip (skipping pending/confirmed)
const PROGRESS_STEPS = [
  { key: 'picked_up',        label: 'Picked Up'  },
  { key: 'washing',          label: 'Washing'    },
  { key: 'drying',           label: 'Drying'     },
  { key: 'ironing',          label: 'Ironing'    },
  { key: 'out_for_delivery', label: 'Delivering' },
  { key: 'delivered',        label: 'Delivered'  },
]

const ALL_STEPS = [
  'pending', 'confirmed', 'picked_up', 'washing',
  'drying', 'ironing', 'out_for_delivery', 'delivered',
]

function statusMeta(status: string) {
  if (status === 'delivered')  return { label: 'Completed',   badge: 'bg-green-100 text-green-600', bar: 'bg-green-50 text-green-600' }
  if (status === 'cancelled')  return { label: 'Cancelled',   badge: 'bg-red-100 text-red-500',     bar: 'bg-red-50 text-red-500'     }
  if (status === 'pending')    return { label: 'Pending',     badge: 'bg-yellow-100 text-yellow-600', bar: 'bg-yellow-50 text-yellow-600' }
  return                              { label: 'In Progress', badge: 'bg-blue-100 text-primary',     bar: 'bg-blue-50 text-primary'    }
}

function iconMeta(status: string) {
  if (status === 'delivered') return { icon: Shirt, bg: 'bg-green-50', color: 'text-green-600' }
  if (status === 'cancelled') return { icon: ShoppingBasket, bg: 'bg-red-50', color: 'text-red-500' }
  if (status === 'pending')   return { icon: Package, bg: 'bg-yellow-50', color: 'text-yellow-600' }
  return { icon: WashingMachine, bg: 'bg-blue-50', color: 'text-primary' }
}

function formatOrderDate(value?: string) {
  if (!value) return 'Schedule pending'
  return new Date(value).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatStatusDate(value?: string) {
  if (!value) return ''
  return new Date(value).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

type OrderRow = {
  _id: string
  status: string
  totalAmount: number
  discountAmount: number
  createdAt: string
  pickupTime?: string
  deliveryTime?: string
  paymentMethod: string
  pickupAddress?: { street: string; city: string; province: string }
  items: Array<{ service: string; quantity: number; price: number }>
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab = 'all' } = await searchParams
  const session = await requireSession()
  await connectDB()

  // Build query with status filter
  let query = Order.find({ user: session.userId }).sort({ createdAt: -1 })
  if (tab === 'active')    query = query.where('status').nin(['delivered', 'cancelled'])
  if (tab === 'completed') query = query.where('status').equals('delivered')
  if (tab === 'cancelled') query = query.where('status').equals('cancelled')

  const rawOrders = await query.lean()

  const orders = JSON.parse(JSON.stringify(rawOrders)) as OrderRow[]

  return (
    <div className="flex min-h-full flex-col bg-[#f8fbff]">
      <div className="bg-gradient-to-br from-white via-[#f7fbff] to-[#eef7ff] px-4 pb-3 pt-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">My Orders</h1>
            <p className="mt-2 text-sm font-semibold text-slate-500">Track your orders and view history</p>
          </div>
          <Link
            href="/orders"
            className="mt-1 flex items-center gap-1.5 rounded-full text-xs font-extrabold text-primary"
          >
            <Filter className="h-4 w-4" />
            Filter
          </Link>
        </div>

        <div className="mt-5">
          <Suspense fallback={null}>
            <OrderFilterTabs />
          </Suspense>
        </div>
      </div>

      <div className="flex-1 space-y-3 px-4 pb-8 pt-3">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[1.35rem] bg-white py-16 text-center shadow-[0_14px_36px_rgba(39,88,151,0.08)] ring-1 ring-blue-950/5">
            <Package className="mb-3 h-12 w-12 text-primary/25" />
            <p className="font-extrabold text-slate-600">No orders found</p>
            <p className="mt-1 text-xs font-semibold text-slate-400">
              {tab === 'all' ? 'Place your first laundry order' : 'No orders in this category'}
            </p>
            {tab === 'all' && (
              <Link href="/orders/new" className="mt-5 rounded-full bg-primary px-5 py-2 text-xs font-extrabold text-white">
                Place your first order
              </Link>
            )}
          </div>
        ) : (
          <>
            {orders.map((order) => {
              const meta      = statusMeta(order.status)
              const total     = order.totalAmount - (order.discountAmount ?? 0)
              const isActive  = !['delivered', 'cancelled'].includes(order.status)
              const isDone    = order.status === 'delivered'
              const isCancelled = order.status === 'cancelled'
              const orderId   = `#${order._id.slice(-5).toUpperCase()}`
              const stepIdx   = ALL_STEPS.indexOf(order.status)
              const location  = order.pickupAddress?.city || order.pickupAddress?.street || 'Home'
              const icon      = iconMeta(order.status)
              const Icon      = icon.icon

              return (
                <Link key={order._id} href={`/orders/${order._id}`}>
                  <div className="overflow-hidden rounded-[1.35rem] bg-white shadow-[0_14px_36px_rgba(39,88,151,0.08)] ring-1 ring-blue-950/5 transition-transform active:scale-[0.99]">
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${icon.bg}`}>
                          <Icon className={`h-8 w-8 ${icon.color}`} strokeWidth={1.5} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-extrabold ${meta.badge}`}>
                              {meta.label}
                            </span>
                          </div>
                          <p className="mt-1 text-xl font-extrabold leading-tight text-slate-950">
                            Order {orderId}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {formatOrderDate(order.pickupTime)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {location}
                            </span>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2 pl-1">
                          {!isActive && (
                            <div className="text-right">
                              <p className="text-xs font-semibold text-slate-500">Total</p>
                              <p className="text-xl font-extrabold text-slate-950">₱{total.toFixed(2)}</p>
                            </div>
                          )}
                          <ChevronRight className="h-5 w-5 text-slate-500" />
                        </div>
                      </div>

                      {isActive && (
                        <div className="mt-5">
                          <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            <div className="flex min-w-max items-start pb-1">
                              {PROGRESS_STEPS.map((step, i) => {
                                const stepOrder = ALL_STEPS.indexOf(step.key)
                                const done      = stepOrder < stepIdx
                                const current   = stepOrder === stepIdx
                                const last      = i === PROGRESS_STEPS.length - 1
                                return (
                                  <div key={step.key} className="flex items-start">
                                    <div className="flex w-14 flex-col items-center gap-1.5">
                                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                        done    ? 'bg-primary text-white' :
                                        current ? 'bg-primary text-white' :
                                                  'bg-slate-100 text-slate-400'
                                      }`}>
                                        {done || current
                                          ? <CheckCircle2 className="h-4 w-4" />
                                          : <Circle className="h-2.5 w-2.5 fill-current" />
                                        }
                                      </div>
                                      <span className={`text-center text-[9px] font-bold leading-tight ${
                                        done || current ? 'text-primary' : 'text-slate-400'
                                      }`}>
                                        {step.label}
                                      </span>
                                    </div>
                                    {!last && (
                                      <div className={`mt-4 h-0.5 w-4 shrink-0 ${stepOrder < stepIdx ? 'bg-primary' : 'bg-slate-200'}`} />
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>

                          <div className="mt-3 flex items-start gap-3 rounded-xl bg-blue-50 px-4 py-3">
                            <Package className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <p className="text-xs font-semibold leading-snug text-slate-600">
                              We&apos;re taking great care of your clothes!
                              <br />
                              <span className="text-[11px] text-slate-500">
                                Estimated delivery: <span className="font-extrabold text-primary">Today, 6:00 PM</span>
                              </span>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {isDone && (
                      <div className={`mx-4 mb-4 flex items-center gap-2 rounded-xl px-3 py-2 ${meta.bar}`}>
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <p className="text-xs font-semibold">
                          Delivered on {' '}
                          {order.deliveryTime
                            ? formatStatusDate(order.deliveryTime)
                            : formatStatusDate(order.createdAt)}
                        </p>
                      </div>
                    )}
                    {isCancelled && (
                      <div className={`mx-4 mb-4 flex items-center gap-2 rounded-xl px-3 py-2 ${meta.bar}`}>
                        <XCircle className="h-4 w-4 shrink-0" />
                        <p className="text-xs font-semibold">
                          Cancelled on {formatStatusDate(order.createdAt)}
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}

            <Link href="/help">
              <div className="flex items-center gap-3 rounded-[1.1rem] bg-[#eef6ff] px-4 py-3.5 shadow-[0_14px_36px_rgba(39,88,151,0.08)]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                  <Headphones className="h-5 w-5 text-primary" strokeWidth={1.7} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-extrabold text-slate-900">Need help with your order?</p>
                  <p className="text-xs font-bold text-primary">Contact our support team</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
