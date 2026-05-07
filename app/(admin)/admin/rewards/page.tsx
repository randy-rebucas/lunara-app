import { requireAdmin } from '@/lib/server/auth'
import { connectDB } from '@/lib/db'
import Reward from '@/models/Reward'
import LoyaltyRedemption from '@/models/LoyaltyRedemption'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Star, Gift, CheckCircle2, XCircle, TrendingUp } from 'lucide-react'
import RewardToggle from './reward-toggle'
import RewardEditDialog from './reward-edit-dialog'
import AddRewardForm from './add-reward-form'

export default async function AdminRewardsPage() {
  await requireAdmin()
  await connectDB()

  const [raw, redemptionStats, totalRedemptions] = await Promise.all([
    Reward.find().sort({ pointsRequired: 1 }).lean(),
    LoyaltyRedemption.aggregate([
      { $group: { _id: '$reward', count: { $sum: 1 } } },
    ]),
    LoyaltyRedemption.countDocuments(),
  ])

  const redemptionMap = Object.fromEntries(
    (redemptionStats as Array<{ _id: string; count: number }>).map((r) => [String(r._id), r.count])
  )

  const rewards = JSON.parse(JSON.stringify(raw)) as Array<{
    _id: string; title: string; pointsRequired: number; discountValue: number; isActive: boolean
  }>

  const totalActive   = rewards.filter((r) => r.isActive).length
  const totalInactive = rewards.filter((r) => !r.isActive).length

  return (
    <div className="space-y-5 p-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rewards</h1>
          <p className="text-sm text-muted-foreground">Manage the loyalty reward catalog</p>
        </div>
        <AddRewardForm />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Rewards',   value: rewards.length,  icon: Gift,        color: 'text-primary',   bg: 'bg-primary/10' },
          { label: 'Active',          value: totalActive,     icon: CheckCircle2,color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Inactive',        value: totalInactive,   icon: XCircle,     color: 'text-gray-500',  bg: 'bg-gray-100' },
          { label: 'Total Redeemed',  value: totalRedemptions,icon: TrendingUp,  color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div>
                <p className="text-xl font-bold leading-none">{value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reward cards */}
      {rewards.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Catalog</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rewards.map((reward) => {
              const redeemed = redemptionMap[reward._id] ?? 0
              const ratio    = reward.pointsRequired > 0
                ? (reward.discountValue / reward.pointsRequired).toFixed(2)
                : '0.00'
              return (
                <Card
                  key={reward._id}
                  className={`transition-shadow hover:shadow-md ${!reward.isActive ? 'opacity-60' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50">
                          <Star className="h-5 w-5 text-amber-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold leading-tight">{reward.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {redeemed} redemption{redeemed !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <RewardEditDialog
                        rewardId={reward._id}
                        title={reward.title}
                        pointsRequired={reward.pointsRequired}
                        discountValue={reward.discountValue}
                        isActive={reward.isActive}
                      />
                    </div>

                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-bold text-primary">₱{reward.discountValue}</span>
                          <span className="text-sm text-muted-foreground">off</span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-semibold">{reward.pointsRequired}</span>
                          <span className="text-xs text-muted-foreground">pts required</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Value ratio</p>
                        <p className="text-sm font-bold text-green-700">₱{ratio}/pt</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t pt-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${reward.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-xs text-muted-foreground">{reward.isActive ? 'Active' : 'Inactive'}</span>
                      </div>
                      <RewardToggle rewardId={reward._id} isActive={reward.isActive} />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Table */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">All Rewards</h2>
        <Card>
          <CardContent className="p-0">
            {rewards.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16 text-center">
                <Gift className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No rewards yet. Add one to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Reward</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="text-right">₱/pt</TableHead>
                    <TableHead className="text-right">Redeemed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-28" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rewards.map((reward) => {
                    const redeemed = redemptionMap[reward._id] ?? 0
                    const ratio = reward.pointsRequired > 0
                      ? (reward.discountValue / reward.pointsRequired).toFixed(2)
                      : '0.00'
                    return (
                      <TableRow key={reward._id} className={!reward.isActive ? 'opacity-60' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />
                            <span className="font-medium">{reward.title}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {reward.pointsRequired}
                          <span className="ml-1 text-xs font-normal text-muted-foreground">pts</span>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          ₱{reward.discountValue}
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold text-green-700">
                          ₱{ratio}
                        </TableCell>
                        <TableCell className="text-right text-sm">{redeemed}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span className={`h-2 w-2 rounded-full ${reward.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <span className={`text-xs font-medium ${reward.isActive ? 'text-green-700' : 'text-muted-foreground'}`}>
                              {reward.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <RewardEditDialog
                              rewardId={reward._id}
                              title={reward.title}
                              pointsRequired={reward.pointsRequired}
                              discountValue={reward.discountValue}
                              isActive={reward.isActive}
                            />
                            <RewardToggle rewardId={reward._id} isActive={reward.isActive} />
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
