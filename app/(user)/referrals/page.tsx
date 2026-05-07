import { requireSession } from '@/lib/server/auth'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import Referral from '@/models/Referral'
import { Users, CheckCircle2, Clock } from 'lucide-react'
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
  const pending     = referralList.filter((r) => !r.rewardCredited).length
  const credited    = referralList.filter((r) => r.rewardCredited).length

  return (
    <div className="space-y-5 p-4 pt-5">
      <div>
        <h1 className="text-2xl font-bold">Refer & Earn</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Earn ₱50 for every friend who completes their first order
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1 rounded-2xl border border-primary/15 bg-primary/5 p-4">
          <div className="flex items-center gap-1.5 text-primary">
            <Users className="h-4 w-4" />
            <span className="text-xs font-semibold">Friends Referred</span>
          </div>
          <p className="text-3xl font-bold text-primary">{referralList.length}</p>
        </div>
        <div className="flex flex-col gap-1 rounded-2xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-1.5 text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-semibold">Total Earned</span>
          </div>
          <p className="text-3xl font-bold text-green-700">₱{totalEarned}</p>
        </div>
      </div>

      {/* Referral code */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
        <div>
          <p className="text-sm font-semibold">Your Referral Code</p>
          <p className="text-xs text-muted-foreground">Share this with friends</p>
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-xl bg-muted px-4 py-3.5 text-center text-2xl font-bold tracking-[0.2em]">
            {userData?.referralCode ?? '—'}
          </code>
          <CopyButton text={userData?.referralCode ?? ''} />
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Your friend earns <strong className="text-foreground">₱30</strong>,
          you earn <strong className="text-foreground">₱50</strong> wallet credit
        </p>
      </div>

      {/* Apply referral code */}
      {!userData?.referredBy && (
        <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
          <div>
            <p className="text-sm font-semibold">Have a referral code?</p>
            <p className="text-xs text-muted-foreground">Apply it to earn ₱30 credit</p>
          </div>
          <ApplyReferralForm />
        </div>
      )}

      {/* Friends list */}
      {referralList.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <Users className="h-4 w-4 text-muted-foreground" />
            Friends ({referralList.length})
          </h2>
          <div className="rounded-2xl border bg-white divide-y">
            {referralList.map((r, i) => (
              <div key={r._id} className="flex items-center gap-3 px-4 py-3.5">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  r.rewardCredited ? 'bg-green-100' : 'bg-muted'
                }`}>
                  {r.rewardCredited
                    ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                    : <Clock className="h-4 w-4 text-muted-foreground/50" />
                  }
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Friend #{i + 1}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString('en-PH', { dateStyle: 'medium' })}
                  </p>
                </div>
                <span className={`text-sm font-semibold ${
                  r.rewardCredited ? 'text-green-600' : 'text-muted-foreground'
                }`}>
                  {r.rewardCredited ? '+₱50' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
