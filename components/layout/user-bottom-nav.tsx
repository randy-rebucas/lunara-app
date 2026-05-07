'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Package, Tag, User } from 'lucide-react'
import { cn } from '@/lib/cn'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home',    icon: Home },
  { href: '/orders',    label: 'Orders',  icon: Package },
  { href: '/rewards',   label: 'Offers',  icon: Tag },
  { href: '/profile',   label: 'Profile', icon: User },
]

export default function UserBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-transparent px-3 pb-2"
      style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="mx-auto flex h-20 w-full max-w-lg items-center rounded-t-[2rem] bg-white px-4 shadow-[0_-14px_40px_rgba(22,52,92,0.12)] ring-1 ring-blue-950/5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors',
                active ? 'text-primary' : 'text-slate-400 hover:text-slate-700'
              )}
            >
              <Icon
                className={cn('h-5 w-5 transition-transform', active && 'scale-110 fill-primary/10')}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
