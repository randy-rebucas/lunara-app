import { requireSession } from '@/lib/server/auth'
import { connectDB } from '@/lib/db'
import WalletModel from '@/models/Wallet'
import Transaction from '@/models/Transaction'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Wallet } from 'lucide-react'
import WalletTopUp from './wallet-topup'

export default async function WalletPage() {
  const session = await requireSession()
  await connectDB()

  const [wallet, rawTxns] = await Promise.all([
    WalletModel.findOne({ user: session.userId }).lean(),
    Transaction.find({ user: session.userId }).sort({ createdAt: -1 }).limit(20).lean(),
  ])

  const balance = (wallet as { balance: number } | null)?.balance ?? 0
  const txns = JSON.parse(JSON.stringify(rawTxns)) as Array<{
    _id: string; type: 'credit' | 'debit'; amount: number; description: string; reference: string; createdAt: string
  }>

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">Wallet</h1>

      <Card className="bg-primary text-primary-foreground">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 opacity-80">
            <Wallet className="h-5 w-5" />
            <span className="text-sm font-medium">Available Balance</span>
          </div>
          <p className="mt-2 text-4xl font-bold">
            ₱{balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </p>
          <p className="mt-1 text-xs opacity-70">Philippine Peso</p>
        </CardContent>
      </Card>

      <WalletTopUp />

      <div>
        <h2 className="mb-3 font-semibold">Transaction History</h2>
        {txns.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No transactions yet
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {txns.map((txn) => (
              <Card key={txn._id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium">{txn.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(txn.createdAt).toLocaleDateString('en-PH', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </p>
                  </div>
                  <span className={`text-sm font-bold ${txn.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                    {txn.type === 'credit' ? '+' : '-'}₱{txn.amount.toFixed(2)}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
