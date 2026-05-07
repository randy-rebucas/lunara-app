import { requireSession } from '@/lib/server/auth'
import { connectDB } from '@/lib/db'
import Service from '@/models/Service'
import WalletModel from '@/models/Wallet'
import NewOrderForm from './new-order-form'

export default async function NewOrderPage() {
  const session = await requireSession()
  await connectDB()

  const [rawServices, wallet] = await Promise.all([
    Service.find({ isActive: true }).sort({ sortOrder: 1 }).lean(),
    WalletModel.findOne({ user: session.userId }).select('balance').lean(),
  ])

  const services = JSON.parse(JSON.stringify(rawServices))
  const balance = (wallet as { balance: number } | null)?.balance ?? 0

  return (
    <div className="p-4">
      <h1 className="mb-6 text-2xl font-bold">Place New Order</h1>
      <NewOrderForm services={services} walletBalance={balance} />
    </div>
  )
}
