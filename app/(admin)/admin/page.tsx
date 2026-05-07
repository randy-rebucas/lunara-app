import { requireAdmin } from '@/lib/server/auth'
import { connectDB } from '@/lib/db'
import Order from '@/models/Order'
import User from '@/models/User'
import HelpTicket from '@/models/HelpTicket'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Users, HelpCircle, TrendingUp } from 'lucide-react'

export default async function AdminDashboardPage() {
  await requireAdmin()
  await connectDB()

  const [
    totalOrders, pendingOrders, totalUsers, openTickets, deliveredToday, recentOrders
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ status: 'pending' }),
    User.countDocuments({ role: 'user' }),
    HelpTicket.countDocuments({ status: 'open' }),
    Order.countDocuments({
      status: 'delivered',
      updatedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    }),
    Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name phone').lean(),
  ])

  const orders = JSON.parse(JSON.stringify(recentOrders)) as Array<{
    _id: string; status: string; totalAmount: number; createdAt: string;
    user: { name: string; phone: string } | null
    items: Array<{ service: string }>
  }>

  const STATUS_COLOR: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  const revenue = await Order.aggregate([
    { $match: { status: 'delivered' } },
    { $group: { _id: null, total: { $sum: { $subtract: ['$totalAmount', '$discountAmount'] } } } },
  ])
  const totalRevenue = revenue[0]?.total ?? 0

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your laundry business</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Orders', value: totalOrders, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Customers', value: totalUsers, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Open Tickets', value: openTickets, icon: HelpCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Total Revenue', value: `₱${totalRevenue.toLocaleString('en-PH', { maximumFractionDigits: 0 })}`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <p className="mt-3 text-2xl font-bold">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              { label: 'Pending Orders', value: pendingOrders, color: 'text-yellow-600' },
              { label: 'Delivered Today', value: deliveredToday, color: 'text-green-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span className={`font-bold ${color}`}>{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {orders.map((order) => (
              <div key={order._id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{order.user?.name ?? 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">{order.items[0]?.service}</p>
                </div>
                <div className="text-right">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLOR[order.status] ?? 'bg-gray-100 text-gray-800'}`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                  <p className="mt-0.5 text-xs font-semibold">₱{order.totalAmount}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
