'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, User, Bell, WashingMachine } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { clearTokens, apiFetch } from '@/lib/client/auth'

interface UserHeaderProps {
  name: string
  initials: string
}

export default function UserHeader({ name, initials }: UserHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()

  async function handleLogout() {
    const refreshToken = document.cookie.match(/(?:^|; )refresh_token=([^;]+)/)?.[1]
    if (refreshToken) {
      try {
        await apiFetch('/api/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        })
      } catch {
        // Revocation failed — still clear local tokens
      }
    }
    clearTokens()
    router.push('/login')
  }

  if (
    pathname === '/dashboard' ||
    pathname === '/profile' ||
    pathname === '/rewards' ||
    pathname === '/orders' ||
    (pathname.startsWith('/orders/') && pathname !== '/orders/new')
  ) return null

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-lg items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-1.5">
          <WashingMachine className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold text-primary">Lunara</span>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full outline-none ring-ring focus-visible:ring-2 ml-1">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-2">
                <p className="text-sm font-semibold">{name}</p>
                <p className="text-xs text-muted-foreground">Lunara Member</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/profile')}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/notifications')}>
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
