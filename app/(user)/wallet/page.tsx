import Link from 'next/link'
import { ChevronLeft, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { requireSession } from '@/lib/server/auth'
import { connectDB } from '@/lib/db'
import WalletModel from '@/models/Wallet'
import Transaction from '@/models/Transaction'
import PaymentMethod from '@/models/PaymentMethod'
import WalletTopUp from './wallet-topup'

export default async function WalletPage() {
  const session = await requireSession()
  await connectDB()

  const [wallet, rawTxns, defaultPM] = await Promise.all([
    WalletModel.findOne({ user: session.userId }).lean(),
    Transaction.find({ user: session.userId }).sort({ createdAt: -1 }).limit(20).lean(),
    PaymentMethod.findOne({ user: session.userId, isDefault: true }).lean(),
  ])

  const balance = (wallet as { balance: number } | null)?.balance ?? 0
  const txns = JSON.parse(JSON.stringify(rawTxns)) as Array<{
    _id: string; type: 'credit' | 'debit'; amount: number; description: string; createdAt: string
  }>
  const pm = defaultPM
    ? JSON.parse(JSON.stringify(defaultPM)) as { type: string; label: string; maskedNumber?: string }
    : null

  return (
    <div className="flex min-h-full flex-col bg-gray-50">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="bg-white px-4 pt-5 pb-4">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="text-center">
            <h1 className="text-lg font-bold text-gray-900">Top Up</h1>
          </div>
          <div className="w-9" />
        </div>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Add money to your wallet for faster checkout.
        </p>
      </div>

      {/* ── Balance card ───────────────────────────────────────── */}
      <div className="bg-white px-4 pb-5">
        <div className="flex items-center justify-between rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Current Balance</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
              ₱{balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Wallet Balance</p>
          </div>
          {/* Wallet illustration */}
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Wallet className="h-9 w-9 text-primary" strokeWidth={1.5} />
          </div>
        </div>
      </div>

      {/* ── Divider ────────────────────────────────────────────── */}
      <div className="h-2 bg-gray-100" />

      {/* ── Top-up inline form ─────────────────────────────────── */}
      <div className="bg-white px-4 py-5">
        <WalletTopUp defaultPM={pm} />
      </div>

      {/* ── Divider ────────────────────────────────────────────── */}
      <div className="h-2 bg-gray-100" />

      {/* ── Transaction history ────────────────────────────────── */}
      <div className="bg-white px-4 pt-5 pb-8">
        <p className="mb-3 text-[15px] font-semibold text-gray-900">Transaction History</p>

        {txns.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-gray-50 py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <Wallet className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No transactions yet</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Top up your wallet to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white overflow-hidden">
            {txns.map((txn) => (
              <div key={txn._id} className="flex items-center gap-3 px-4 py-3.5">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    txn.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                  }`}
                >
                  {txn.type === 'credit'
                    ? <TrendingUp  className="h-4.5 w-4.5 text-green-600" />
                    : <TrendingDown className="h-4.5 w-4.5 text-red-500"  />
                  }
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{txn.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(txn.createdAt).toLocaleDateString('en-PH', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-sm font-bold ${
                    txn.type === 'credit' ? 'text-green-600' : 'text-red-500'
                  }`}
                >
                  {txn.type === 'credit' ? '+' : '−'}₱{txn.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
