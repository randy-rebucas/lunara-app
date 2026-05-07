import Link from 'next/link'
import { Package, Plus, Star, Wallet } from 'lucide-react'
import { requireSession } from '@/lib/server/auth'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import Order from '@/models/Order'
import WalletModel from '@/models/Wallet'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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

export default async function DashboardPage() {
  const session = await requireSession()
  await connectDB()

  const [user, wallet, recentOrders] = await Promise.all([
    User.findById(session.userId).select('name loyaltyPoints').lean(),
    WalletModel.findOne({ user: session.userId }).select('balance').lean(),
    Order.find({ user: session.userId }).sort({ createdAt: -1 }).limit(3).lean(),
  ])

  const userData = user as { name: string; loyaltyPoints: number } | null
  const walletData = wallet as { balance: number } | null
  const orders = JSON.parse(JSON.stringify(recentOrders)) as Array<{
    _id: string; status: string; totalAmount: number; createdAt: string; items: Array<{ service: string }>
  }>

  const firstName = userData?.name.split(' ')[0] ?? 'there'

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">Hi, {firstName} 👋</h1>
        <p className="text-sm text-muted-foreground">What can we help you with today?</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-primary">
              <Wallet className="h-4 w-4" />
              <span className="text-xs font-medium">Wallet</span>
            </div>
            <p className="mt-1 text-2xl font-bold">
              ₱{(walletData?.balance ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-600">
              <Star className="h-4 w-4" />
              <span className="text-xs font-medium">Points</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-amber-700">
              {(userData?.loyaltyPoints ?? 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Button className="w-full" size="lg" asChild>
        <Link href="/orders/new">
          <Plus className="mr-2 h-5 w-5" />
          Place New Order
        </Link>
      </Button>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Recent Orders</h2>
          <Link href="/orders" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Package className="mx-auto mb-2 h-8 w-8 opacity-30" />
              <p className="text-sm">No orders yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link key={order._id} href={`/orders/${order._id}`}>
                <Card className="cursor-pointer transition-shadow hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{order.items[0]?.service}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLOR[order.status]}`}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                        <p className="mt-1 text-sm font-semibold">₱{order.totalAmount}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { href: '/rewards', label: 'Rewards', icon: '🎁' },
          { href: '/referrals', label: 'Refer & Earn', icon: '🤝' },
          { href: '/help', label: 'Help', icon: '💬' },
        ].map(({ href, label, icon }) => (
          <Link key={href} href={href}>
            <Card className="cursor-pointer text-center transition-shadow hover:shadow-md">
              <CardContent className="p-3">
                <span className="text-2xl">{icon}</span>
                <p className="mt-1 text-xs font-medium">{label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
