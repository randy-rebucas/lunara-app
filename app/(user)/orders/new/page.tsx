import Link from 'next/link'
import { ChevronLeft, Headphones } from 'lucide-react'
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

  const services     = JSON.parse(JSON.stringify(rawServices))
  const balance      = (wallet as { balance: number } | null)?.balance ?? 0

  return (
    <div className="flex min-h-full flex-col bg-gray-50">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="bg-white px-4 pt-5 pb-4">
        <div className="flex items-center justify-between">
          <Link
            href="/orders"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="text-center">
            <h1 className="text-lg font-bold text-gray-900">Book Now</h1>
          </div>
          <Link
            href="/help"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-gray-100"
          >
            <Headphones className="h-5 w-5" />
          </Link>
        </div>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Schedule a pickup and we'll take care of the rest.
        </p>
      </div>

      <NewOrderForm services={services} walletBalance={balance} />
    </div>
  )
}
