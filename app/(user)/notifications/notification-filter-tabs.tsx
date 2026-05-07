'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/cn'

const TABS = [
  { key: 'all',     label: 'All'     },
  { key: 'orders',  label: 'Orders'  },
  { key: 'offers',  label: 'Offers'  },
  { key: 'updates', label: 'Updates' },
]

export default function NotificationFilterTabs() {
  const router      = useRouter()
  const searchParams = useSearchParams()
  const active      = searchParams.get('tab') ?? 'all'

  function select(key: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (key === 'all') params.delete('tab')
    else params.set('tab', key)
    router.push(`/notifications?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex overflow-x-auto border-b border-gray-100 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {TABS.map((tab) => {
        const isActive = active === tab.key
        return (
          <button
            key={tab.key}
            onClick={() => select(tab.key)}
            className={cn(
              'shrink-0 px-5 pb-3 pt-1 text-sm font-medium transition-colors',
              isActive
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
