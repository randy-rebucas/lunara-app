'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/cn'

const TABS = [
  { key: 'all',       label: 'All Orders'  },
  { key: 'active',    label: 'In Progress' },
  { key: 'completed', label: 'Completed'   },
  { key: 'cancelled', label: 'Cancelled'   },
]

export default function OrderFilterTabs() {
  const router      = useRouter()
  const searchParams = useSearchParams()
  const active      = searchParams.get('tab') ?? 'all'

  function select(key: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (key === 'all') params.delete('tab')
    else params.set('tab', key)
    router.push(`/orders?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="grid grid-cols-4 overflow-hidden rounded-lg bg-white shadow-[0_10px_28px_rgba(39,88,151,0.06)] ring-1 ring-blue-950/5">
      {TABS.map((tab) => {
        const isActive = active === tab.key
        return (
          <button
            key={tab.key}
            onClick={() => select(tab.key)}
            className={cn(
              'relative px-2 py-3 text-center text-[11px] font-bold transition-colors',
              isActive
                ? 'text-primary'
                : 'text-slate-400 hover:text-slate-700'
            )}
          >
            {tab.label}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full bg-primary" />
            )}
          </button>
        )
      })}
    </div>
  )
}
