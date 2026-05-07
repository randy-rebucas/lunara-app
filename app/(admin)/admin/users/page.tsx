import { requireAdmin } from '@/lib/server/auth'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

export default async function AdminUsersPage() {
  await requireAdmin()
  await connectDB()

  const raw = await User.find().sort({ createdAt: -1 }).lean()
  const users = JSON.parse(JSON.stringify(raw)) as Array<{
    _id: string; name: string; phone: string; email?: string; role: string;
    loyaltyPoints: number; isVerified: boolean; createdAt: string
  }>

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground">{users.length} registered users</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const initials = user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                return (
                  <TableRow key={user._id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          {user.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{user.phone}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : user.role === 'driver' ? 'secondary' : 'outline'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{user.loyaltyPoints}</TableCell>
                    <TableCell>
                      <span className={`text-xs ${user.isVerified ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {user.isVerified ? '✓ Yes' : 'No'}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString('en-PH', { dateStyle: 'short' })}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
