import Link from 'next/link'
import { Plus, Package } from 'lucide-react'
import { requireSession } from '@/lib/server/auth'
import { connectDB } from '@/lib/db'
import Order from '@/models/Order'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

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

export default async function OrdersPage() {
  const session = await requireSession()
  await connectDB()

  const rawOrders = await Order.find({ user: session.userId }).sort({ createdAt: -1 }).lean()
  const orders = JSON.parse(JSON.stringify(rawOrders)) as Array<{
    _id: string; status: string; totalAmount: number; discountAmount: number;
    createdAt: string; paymentMethod: string; items: Array<{ service: string; quantity: number; price: number }>
  }>

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Orders</h1>
        <Button size="sm" asChild>
          <Link href="/orders/new"><Plus className="mr-1 h-4 w-4" />New</Link>
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">No orders yet</p>
          <Button className="mt-4" asChild>
            <Link href="/orders/new">Place your first order</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link key={order._id} href={`/orders/${order._id}`}>
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">
                        {order.items.map((i) => `${i.service} ×${i.quantity}`).join(', ')}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString('en-PH', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                        {' · '}{order.paymentMethod.toUpperCase()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLOR[order.status] ?? ''}`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                      <p className="text-sm font-semibold">
                        ₱{(order.totalAmount - order.discountAmount).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
