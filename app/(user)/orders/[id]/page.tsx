import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { requireSession } from '@/lib/server/auth'
import { connectDB } from '@/lib/db'
import Order from '@/models/Order'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import OrderActions from './order-actions'

const STATUS_STEPS = [
  'pending', 'confirmed', 'picked_up', 'washing',
  'drying', 'ironing', 'out_for_delivery', 'delivered',
]

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  picked_up: 'bg-indigo-100 text-indigo-800',
  washing: 'bg-purple-100 text-purple-800',
  drying: 'bg-pink-100 text-pink-800',
  ironing: 'bg-orange-100 text-orange-800',
  out_for_delivery: 'bg-cyan-100 text-cyan-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
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

  const currentStep = STATUS_STEPS.indexOf(order.status)
  const isCancellable = ['pending', 'confirmed'].includes(order.status)

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Link href="/orders" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />Back
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Order Details</h1>
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLOR[order.status] ?? ''}`}>
          {order.status.replace(/_/g, ' ')}
        </span>
      </div>

      {order.status !== 'cancelled' && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 overflow-x-auto">
              {STATUS_STEPS.map((step, i) => (
                <div key={step} className="flex flex-1 items-center">
                  <div className={`h-2 flex-1 rounded-full ${i <= currentStep ? 'bg-primary' : 'bg-muted'}`} />
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground capitalize">
              {currentStep >= 0 ? STATUS_STEPS[currentStep].replace(/_/g, ' ') : 'Cancelled'}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span>{item.service} ×{item.quantity}</span>
              <span className="font-medium">₱{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <Separator />
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-₱{order.discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>₱{(order.totalAmount - order.discountAmount).toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-4 text-sm">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">Payment</p>
            <p className="capitalize">{order.paymentMethod}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">Pickup</p>
            <p>{order.pickupAddress.street}, {order.pickupAddress.city}</p>
            <p className="text-muted-foreground">
              {new Date(order.pickupTime).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
          {order.notes && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Notes</p>
              <p>{order.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {isCancellable && <OrderActions orderId={order._id} />}
    </div>
  )
}
