import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  MapPin, CreditCard, Settings2, Bell, ChevronRight,
  HelpCircle, Headphones, Users, Star, Camera,
  Wallet, Trophy, Tag, Package,
} from 'lucide-react'
import { requireSession } from '@/lib/server/auth'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import WalletModel from '@/models/Wallet'
import Order from '@/models/Order'
import Coupon from '@/models/Coupon'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import PersonalInfoSheet from './personal-info-sheet'

const ACCOUNT_ITEMS = [
  { icon: MapPin,    label: 'Addresses',       desc: 'Manage your pickup and delivery addresses', href: '/profile' },
  { icon: CreditCard,label: 'Payment Methods', desc: 'Add or manage your payment options',         href: '/profile' },
  { icon: Settings2, label: 'Preferences',     desc: 'Set your laundry preferences',              href: '/profile' },
  { icon: Bell,      label: 'Notifications',   desc: 'Manage your notification settings',         href: '/notifications' },
]

const SUPPORT_ITEMS = [
  { icon: HelpCircle, label: 'Help Center',  desc: 'Find answers to common questions', href: '/help' },
  { icon: Headphones, label: 'Contact Us',   desc: 'Chat or call our support team',    href: '/help' },
  { icon: Users,      label: 'Refer & Earn', desc: 'Invite friends and earn rewards',  href: '/referrals' },
]

export default async function ProfilePage() {
  const session = await requireSession()
  await connectDB()

  const [rawUser, wallet, orderCount, couponCount] = await Promise.all([
    User.findById(session.userId).lean(),
    WalletModel.findOne({ user: session.userId }).select('balance').lean(),
    Order.countDocuments({ user: session.userId }),
    Coupon.countDocuments({ isActive: true }),
  ])

  if (!rawUser) notFound()

  const user = JSON.parse(JSON.stringify(rawUser)) as {
    _id: string; name: string; phone: string; email?: string; referralCode: string;
    loyaltyPoints: number; isVerified: boolean; role: string; avatar?: string;
    preferences: { pushNotifications: boolean; emailNotifications: boolean; language: string }
  }

  const balance  = (wallet as { balance: number } | null)?.balance ?? 0

  return (
    <div className="min-h-full bg-[#f8fbff] pb-8">
      <div className="bg-gradient-to-br from-white via-[#f7fbff] to-[#eef7ff] px-4 pb-5 pt-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">My Profile</h1>
            <p className="mt-1 text-xs font-medium text-slate-500">Manage your account and preferences</p>
          </div>
          <Link
            href="/profile"
            className="flex h-10 w-10 items-center justify-center rounded-full text-primary"
            aria-label="Profile settings"
          >
            <Settings2 className="h-5 w-5" />
          </Link>
        </div>
      </div>

      <div className="space-y-4 px-4 pt-1">
        <div className="rounded-[1.75rem] bg-white p-4 shadow-[0_14px_36px_rgba(39,88,151,0.08)] ring-1 ring-blue-950/5">
          <div className="flex items-center gap-3.5">
            <div className="relative shrink-0">
              <Avatar className="h-[4.35rem] w-[4.35rem] bg-blue-100">
                {user.avatar ? (
                  <Image src={user.avatar} alt={user.name} width={70} height={70} className="rounded-full object-cover" />
                ) : (
                  <AvatarFallback className="bg-blue-100 text-4xl">
                    👩🏻
                  </AvatarFallback>
                )}
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-primary text-white">
                <Camera className="h-3.5 w-3.5" />
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-extrabold leading-tight text-slate-950">{user.name}</p>
              <p className="mt-1 text-sm font-medium leading-tight text-slate-600">{user.phone}</p>
              {user.email && (
                <p className="truncate text-xs font-medium leading-tight text-slate-400">{user.email}</p>
              )}
              <div className="mt-2 flex items-center overflow-hidden rounded-full bg-blue-50 text-[10px] font-bold text-primary">
                <span className="inline-flex items-center gap-1 bg-amber-50 px-2.5 py-1 text-amber-600">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                  Loyalty Member
                </span>
                <span className="px-2.5 py-1">
                  {user.loyaltyPoints.toLocaleString()} pts
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 divide-x divide-blue-950/5 overflow-hidden rounded-[1.35rem] bg-white shadow-[0_14px_36px_rgba(39,88,151,0.08)] ring-1 ring-blue-950/5">
          {[
            { label: 'Wallet Balance', value: `₱${balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, action: 'Top Up',       href: '/wallet',     icon: Wallet },
            { label: 'Loyalty Points', value: `${user.loyaltyPoints.toLocaleString()} pts`,                        action: 'View Rewards', href: '/rewards',    icon: Trophy },
            { label: 'Coupons',        value: `${couponCount} Available`,                                          action: 'View Coupons', href: '/orders/new', icon: Tag },
            { label: 'Order History',  value: `${orderCount} Orders`,                                              action: 'View All',     href: '/orders',     icon: Package },
          ].map(({ label, value, action, href, icon: Icon }) => (
            <Link key={label} href={href} className="flex flex-col items-center px-1.5 py-3 text-center transition-colors active:bg-blue-50">
              <Icon className="mb-1 h-4.5 w-4.5 text-primary" strokeWidth={1.6} />
              <p className="min-h-[1.4rem] text-[9px] font-semibold leading-tight text-slate-400">{label}</p>
              <p className="mt-0.5 text-xs font-extrabold leading-tight text-slate-950">{value}</p>
              <p className="mt-1 text-[9px] font-bold leading-tight text-primary">{action}</p>
            </Link>
          ))}
        </div>

        <div>
          <p className="mb-2 px-1 text-sm font-extrabold text-slate-900">Account</p>
          <div className="divide-y divide-blue-950/5 overflow-hidden rounded-[1.35rem] bg-white shadow-[0_14px_36px_rgba(39,88,151,0.08)] ring-1 ring-blue-950/5">
            <PersonalInfoSheet name={user.name} email={user.email ?? ''} phone={user.phone} />

            {ACCOUNT_ITEMS.map(({ icon: Icon, label, desc, href }) => (
              <Link
                key={label}
                href={href}
                className="flex items-center gap-3 px-4 py-3 transition-colors active:bg-blue-50"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50">
                  <Icon className="h-4.5 w-4.5 text-primary" strokeWidth={1.6} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-extrabold text-slate-900">{label}</p>
                  <p className="text-[10px] font-semibold text-slate-400">{desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 px-1 text-sm font-extrabold text-slate-900">Support</p>
          <div className="divide-y divide-blue-950/5 overflow-hidden rounded-[1.35rem] bg-white shadow-[0_14px_36px_rgba(39,88,151,0.08)] ring-1 ring-blue-950/5">
            {SUPPORT_ITEMS.map(({ icon: Icon, label, desc, href }) => (
              <Link
                key={label}
                href={href}
                className="flex items-center gap-3 px-4 py-3 transition-colors active:bg-blue-50"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50">
                  <Icon className="h-4.5 w-4.5 text-primary" strokeWidth={1.6} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-extrabold text-slate-900">{label}</p>
                  <p className="text-[10px] font-semibold text-slate-400">{desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
              </Link>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[1.35rem] bg-[#eef6ff] shadow-[0_14px_36px_rgba(39,88,151,0.08)]">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="relative h-16 w-16 shrink-0">
              <Image
                src="/hero-laundry.png"
                alt="Laundry bag"
                fill
                sizes="64px"
                className="scale-150 object-contain object-left-bottom"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold text-slate-900">Love our service?</p>
              <p className="text-[10px] font-semibold leading-snug text-slate-500">
                Rate your recent experience and help us serve you better.
              </p>
            </div>
            <Link
              href="/help"
              className="shrink-0 flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-extrabold text-primary shadow-sm transition-transform active:scale-95"
            >
              Rate Us
              <Star className="h-3.5 w-3.5 fill-primary" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
