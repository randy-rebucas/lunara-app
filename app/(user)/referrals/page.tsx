import { requireSession } from '@/lib/server/auth'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import Referral from '@/models/Referral'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users } from 'lucide-react'
import CopyButton from './copy-button'
import ApplyReferralForm from './apply-referral-form'

export default async function ReferralsPage() {
  const session = await requireSession()
  await connectDB()

  const [user, referrals] = await Promise.all([
    User.findById(session.userId).select('referralCode referredBy loyaltyPoints').lean(),
    Referral.find({ referrer: session.userId }).lean(),
  ])

  const userData = user as { referralCode: string; referredBy?: string; loyaltyPoints: number } | null
  const referralList = JSON.parse(JSON.stringify(referrals)) as Array<{
    _id: string; rewardCredited: boolean; createdAt: string
  }>

  const totalEarned = referralList.filter((r) => r.rewardCredited).length * 50

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-2xl font-bold">Refer & Earn</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Earn ₱50 for every friend who completes their first order
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{referralList.length}</p>
            <p className="text-xs text-muted-foreground">Friends Referred</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-700">₱{totalEarned}</p>
            <p className="text-xs text-muted-foreground">Total Earned</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Your Referral Code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-muted px-4 py-3 text-center text-xl font-bold tracking-widest">
              {userData?.referralCode ?? '—'}
            </code>
            <CopyButton text={userData?.referralCode ?? ''} />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Your friend earns ₱30, you earn ₱50 wallet credit
          </p>
        </CardContent>
      </Card>

      {!userData?.referredBy && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Have a referral code?</CardTitle>
          </CardHeader>
          <CardContent>
            <ApplyReferralForm />
          </CardContent>
        </Card>
      )}

      {referralList.length > 0 && (
        <div>
          <h2 className="mb-3 font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />Friends
          </h2>
          <div className="space-y-2">
            {referralList.map((r, i) => (
              <Card key={r._id}>
                <CardContent className="flex items-center justify-between p-3">
                  <span className="text-sm text-muted-foreground">Friend #{i + 1}</span>
                  <span className={`text-sm font-medium ${r.rewardCredited ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {r.rewardCredited ? '+₱50 earned' : 'Pending 1st order'}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
