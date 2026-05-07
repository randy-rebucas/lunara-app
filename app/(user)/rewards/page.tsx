import Link from 'next/link'
import { requireSession } from '@/lib/server/auth'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import Reward from '@/models/Reward'
import {
  CalendarCheck, ChevronLeft, ChevronRight,
  CircleHelp, Gift, History, ShoppingBag, Star, Ticket,
  Trophy, UserPlus,
} from 'lucide-react'
import RedeemButton from './redeem-button'

const EARNING_ITEMS = [
  {
    icon: ShoppingBag,
    title: 'Place an Order',
    desc: '10 pts for every $1 spent',
    status: 'Active',
  },
  {
    icon: CalendarCheck,
    title: 'Complete Your Order',
    desc: '50 pts for every completed order',
    status: 'Active',
  },
  {
    icon: UserPlus,
    title: 'Refer a Friend',
    desc: 'Get 200 pts when your friend places their first order',
    href: '/referrals',
  },
  {
    icon: Star,
    title: 'Write a Review',
    desc: 'Get 25 pts for each service review',
    href: '/help',
  },
]

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
  const pointValue = points / 100
  const featuredRewards = rewards.slice(0, 3)

  return (
    <div className="min-h-full bg-[#f8fbff] px-4 pb-8 pt-5">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
        <Link
          href="/profile"
          className="flex h-9 w-9 items-center justify-center rounded-full text-primary"
          aria-label="Back to profile"
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <div className="text-center">
          <h1 className="text-xl font-extrabold tracking-tight text-slate-950">Rewards</h1>
          <p className="mt-2 text-sm font-semibold text-slate-400">Earn points, get rewards and save more!</p>
        </div>
        <Link
          href="/help"
          className="flex items-center gap-1 text-xs font-bold text-primary"
        >
          How it works
          <CircleHelp className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-6 space-y-5">
        <div className="relative overflow-hidden rounded-[1.35rem] bg-gradient-to-br from-[#f5f9ff] to-[#e9f3ff] px-5 py-5 shadow-[0_14px_36px_rgba(39,88,151,0.08)] ring-1 ring-blue-950/5">
          <div className="absolute right-2 top-2 h-32 w-32 rounded-full bg-white/40 blur-2xl" />
          <div className="absolute right-20 top-5 h-2 w-2 rotate-45 bg-primary/60" />
          <div className="absolute right-28 bottom-9 h-2 w-2 rotate-45 bg-primary/70" />
          <div className="relative flex min-h-28 items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-500">Your Points Balance</p>
              <p className="mt-2 text-4xl font-black tracking-tight text-slate-950">
                {points.toLocaleString()}
                <span className="ml-2 text-2xl font-extrabold">pts</span>
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-600">
                ${pointValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} in value
              </p>
              <Link
                href="/orders"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/75 px-3 py-2 text-xs font-extrabold text-primary"
              >
                <History className="h-4 w-4" />
                View Point History
              </Link>
            </div>
            <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
              <div className="absolute h-20 w-20 rounded-full bg-amber-300/20 blur-xl" />
              <Trophy className="relative h-24 w-24 fill-amber-300 text-amber-500 drop-shadow-lg" strokeWidth={1.3} />
            </div>
          </div>
        </div>

        <section>
          <h2 className="mb-2 text-lg font-extrabold text-slate-950">Ways to Earn Points</h2>
          <div className="divide-y divide-blue-950/5 overflow-hidden rounded-[1.35rem] bg-white shadow-[0_14px_36px_rgba(39,88,151,0.08)] ring-1 ring-blue-950/5">
            {EARNING_ITEMS.map(({ icon: Icon, title, desc, status, href }) => {
              const rowContent = (
                <>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50">
                    <Icon className="h-5 w-5 text-primary" strokeWidth={1.7} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold leading-tight text-slate-950">{title}</p>
                    <p className="mt-0.5 text-xs font-semibold leading-tight text-slate-400">{desc}</p>
                  </div>
                  {status ? (
                    <span className="text-xs font-extrabold text-green-600">{status}</span>
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  )}
                </>
              )

              return href ? (
                <Link key={title} href={href} className="flex items-center gap-3 px-4 py-3 active:bg-blue-50">
                  {rowContent}
                </Link>
              ) : (
                <div key={title} className="flex items-center gap-3 px-4 py-3">
                  {rowContent}
                </div>
              )
            })}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-950">Redeem Your Points</h2>
            <Link href="/rewards" className="text-xs font-extrabold text-primary">View All</Link>
          </div>

          {featuredRewards.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[1.35rem] bg-white py-10 text-center shadow-[0_14px_36px_rgba(39,88,151,0.08)] ring-1 ring-blue-950/5">
              <Star className="mb-3 h-10 w-10 text-primary/30" />
              <p className="text-sm font-bold text-slate-500">No rewards available</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {featuredRewards.map((reward, index) => {
                const canRedeem = points >= reward.pointsRequired
                const colors = [
                  'from-[#0097ff] to-[#2777f4]',
                  'from-[#7b2ff7] to-[#b037ff]',
                  'from-[#ff7b22] to-[#ff9b3e]',
                ]

                return (
                  <div
                    key={reward._id}
                    className="rounded-[1.1rem] bg-white px-2.5 py-4 text-center shadow-[0_14px_36px_rgba(39,88,151,0.08)] ring-1 ring-blue-950/5"
                  >
                    <div className={`mx-auto flex h-10 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${colors[index % colors.length]} text-white shadow-lg shadow-blue-500/10`}>
                      <Ticket className="h-6 w-6 fill-white/20" />
                    </div>
                    <p className="mt-3 text-[10px] font-semibold text-slate-400">
                      {reward.pointsRequired.toLocaleString()} pts
                    </p>
                    <p className="mt-1 text-sm font-black leading-tight text-slate-950">
                      ${reward.discountValue.toFixed(2)} Off
                    </p>
                    <p className="mt-0.5 text-[10px] font-semibold leading-tight text-slate-500">
                      Min. order ${Math.max(15, reward.discountValue * 5)}
                    </p>
                    <div className="mt-3">
                      <RedeemButton
                        rewardId={reward._id}
                        title={reward.title}
                        pointsRequired={reward.pointsRequired}
                        disabled={!canRedeem}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <div className="flex items-center gap-3 rounded-[1.1rem] bg-[#eef6ff] px-4 py-3 shadow-[0_14px_36px_rgba(39,88,151,0.08)]">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white">
            <Gift className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-extrabold leading-tight text-primary">Every 100 points = $1.00 off</p>
            <p className="text-xs font-semibold leading-tight text-slate-500">Points will be automatically applied at checkout.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
