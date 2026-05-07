import { requireSession } from '@/lib/server/auth'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import Reward from '@/models/Reward'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Star } from 'lucide-react'
import RedeemButton from './redeem-button'

export default async function RewardsPage() {
  const session = await requireSession()
  await connectDB()

  const [user, rawRewards] = await Promise.all([
    User.findById(session.userId).select('loyaltyPoints').lean(),
    Reward.find({ isActive: true }).sort({ pointsRequired: 1 }).lean(),
  ])

  const points = (user as { loyaltyPoints: number } | null)?.loyaltyPoints ?? 0
  const rewards = JSON.parse(JSON.stringify(rawRewards)) as Array<{
    _id: string; title: string; pointsRequired: number; discountValue: number
  }>

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">Rewards</h1>
        <p className="mt-1 text-sm text-muted-foreground">Redeem your loyalty points</p>
      </div>

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-amber-600">
            <Star className="h-5 w-5 fill-amber-400" />
            <span className="font-semibold">Your Points</span>
          </div>
          <p className="mt-1 text-4xl font-bold text-amber-700">{points.toLocaleString()}</p>
          <p className="mt-1 text-xs text-amber-600">Earn 1 point per ₱1 spent on delivered orders</p>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 font-semibold">Available Rewards</h2>
        <div className="space-y-3">
          {rewards.map((reward) => {
            const canRedeem = points >= reward.pointsRequired
            const progress = Math.min(100, (points / reward.pointsRequired) * 100)

            return (
              <Card key={reward._id} className={canRedeem ? 'border-amber-200' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-medium">{reward.title}</h3>
                      <p className="text-sm text-muted-foreground">{reward.pointsRequired} pts required</p>
                      {!canRedeem && (
                        <div className="mt-2">
                          <Progress value={progress} className="h-1.5" />
                          <p className="mt-1 text-xs text-muted-foreground">
                            {reward.pointsRequired - points} pts to go
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-lg font-bold text-primary">₱{reward.discountValue}</p>
                      <p className="text-xs text-muted-foreground">discount</p>
                    </div>
                  </div>
                  {canRedeem && (
                    <div className="mt-3">
                      <RedeemButton rewardId={reward._id} title={reward.title} pointsRequired={reward.pointsRequired} />
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
