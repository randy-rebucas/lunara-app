import Link from 'next/link'
import { requireAdmin } from '@/lib/server/auth'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Users, UserCheck, Truck, ShieldCheck } from 'lucide-react'
import UserEditDialog from './user-edit-dialog'
import UserSearch from './user-search'

const ROLE_TABS = [
  { key: '',       label: 'All' },
  { key: 'user',   label: 'Customers' },
  { key: 'driver', label: 'Drivers' },
  { key: 'admin',  label: 'Admins' },
]

type SearchParams = { role?: string; q?: string }

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireAdmin()
  await connectDB()

  const { role: roleFilter = '', q = '' } = await searchParams

  const [countAll, countUsers, countDrivers, countAdmins, countUnverified, rawUsers] =
    await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'driver' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ isVerified: false }),
      User.find(roleFilter ? { role: roleFilter } : {})
        .sort({ createdAt: -1 })
        .limit(500)
        .lean(),
    ])

  type UserRow = {
    _id: string; name: string; phone: string; email?: string; role: string;
    loyaltyPoints: number; isVerified: boolean; createdAt: string
  }

  let users = JSON.parse(JSON.stringify(rawUsers)) as UserRow[]

  if (q) {
    const term = q.toLowerCase()
    users = users.filter(
      (u) => u.name.toLowerCase().includes(term) || u.phone.includes(term)
    )
  }

  const TAB_COUNTS: Record<string, number> = {
    '':       countAll,
    user:     countUsers,
    driver:   countDrivers,
    admin:    countAdmins,
  }

  const ROLE_BADGE: Record<string, string> = {
    admin:  'bg-primary/10 text-primary',
    driver: 'bg-indigo-100 text-indigo-700',
    user:   'bg-gray-100 text-gray-700',
  }

  return (
    <div className="space-y-5 p-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground">Manage customers, drivers and admins</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Users',   value: countAll,        icon: Users,       color: 'text-blue-600',   bg: 'bg-blue-50' },
          { label: 'Customers',     value: countUsers,      icon: Users,       color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Drivers',       value: countDrivers,    icon: Truck,       color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Unverified',    value: countUnverified, icon: UserCheck,   color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div>
                <p className="text-xl font-bold leading-none">{value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 overflow-x-auto rounded-lg border bg-muted/40 p-1">
          {ROLE_TABS.map(({ key, label }) => {
            const active = roleFilter === key
            const count  = TAB_COUNTS[key]
            const href   = `/admin/users${key ? `?role=${key}` : ''}`
            return (
              <Link
                key={key}
                href={href}
                className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors
                  ${active
                    ? 'bg-white shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/60'
                  }`}
              >
                {label}
                <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold
                  ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {count}
                </span>
              </Link>
            )
          })}
        </div>
        <UserSearch />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <Users className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">No users found</p>
              {q && <p className="text-xs text-muted-foreground">Try a different search term</p>}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>User</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const initials = user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                  return (
                    <TableRow key={user._id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className={`text-xs font-bold
                              ${user.role === 'driver' ? 'bg-indigo-100 text-indigo-700'
                                : user.role === 'admin' ? 'bg-primary/10 text-primary'
                                : 'bg-gray-100 text-gray-700'}`}>
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <Link
                              href={`/admin/users/${user._id}`}
                              className="font-medium hover:text-primary hover:underline underline-offset-2"
                            >
                              {user.name}
                            </Link>
                            {user.email && (
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.phone}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${ROLE_BADGE[user.role] ?? 'bg-gray-100 text-gray-700'}`}>
                          {user.role === 'admin' && <ShieldCheck className="h-3 w-3" />}
                          {user.role === 'driver' && <Truck className="h-3 w-3" />}
                          {user.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm font-semibold">
                          {user.loyaltyPoints}
                          <span className="text-xs font-normal text-muted-foreground">pts</span>
                        </span>
                      </TableCell>
                      <TableCell>
                        {user.isVerified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                            <UserCheck className="h-3 w-3" /> Verified
                          </span>
                        ) : (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                            Unverified
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString('en-PH', { dateStyle: 'medium' })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <UserEditDialog
                            userId={user._id}
                            name={user.name}
                            role={user.role}
                            loyaltyPoints={user.loyaltyPoints}
                            isVerified={user.isVerified}
                          />
                          <Link
                            href={`/admin/users/${user._id}`}
                            className="rounded-md px-2 py-1 text-xs text-primary hover:bg-muted"
                          >
                            View
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {users.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Showing {users.length}{q && ` of ${TAB_COUNTS[roleFilter] ?? countAll}`} users
          {q && ` matching "${q}"`}
        </p>
      )}
    </div>
  )
}
