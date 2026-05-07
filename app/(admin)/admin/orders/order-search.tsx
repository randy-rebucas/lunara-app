'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default function OrderSearch() {
  const router      = useRouter()
  const pathname    = usePathname()
  const params      = useSearchParams()
  const [, startTransition] = useTransition()

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const sp = new URLSearchParams(params.toString())
      if (e.target.value) sp.set('q', e.target.value)
      else sp.delete('q')
      sp.delete('page')
      startTransition(() => router.replace(`${pathname}?${sp.toString()}`))
    },
    [router, pathname, params]
  )

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        defaultValue={params.get('q') ?? ''}
        onChange={handleChange}
        placeholder="Search customer name or phone…"
        className="h-9 pl-8 text-sm w-60"
      />
    </div>
  )
}
