import { requireAdmin } from '@/lib/server/auth'
import { connectDB } from '@/lib/db'
import Order from '@/models/Order'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import OrderStatusUpdater from './order-status-updater'

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

export default async function AdminOrdersPage() {
  await requireAdmin()
  await connectDB()

  const raw = await Order.find().sort({ createdAt: -1 }).populate('user', 'name phone').lean()
  const orders = JSON.parse(JSON.stringify(raw)) as Array<{
    _id: string; status: string; totalAmount: number; discountAmount: number;
    paymentMethod: string; createdAt: string;
    user: { name: string; phone: string } | null
    items: Array<{ service: string; quantity: number }>
  }>

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-sm text-muted-foreground">{orders.length} total orders</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Services</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order._id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.user?.name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">{order.user?.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <p className="truncate text-sm">
                      {order.items.map((i) => `${i.service}×${i.quantity}`).join(', ')}
                    </p>
                  </TableCell>
                  <TableCell className="font-medium">
                    ₱{(order.totalAmount - order.discountAmount).toFixed(2)}
                  </TableCell>
                  <TableCell className="capitalize">{order.paymentMethod}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLOR[order.status] ?? ''}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString('en-PH', { dateStyle: 'short' })}
                  </TableCell>
                  <TableCell>
                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <OrderStatusUpdater orderId={order._id} currentStatus={order.status} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
