import { requireSession } from '@/lib/server/auth'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import ProfileForm from './profile-form'
import PaymentMethodsList from './payment-methods-list'
import PaymentMethod from '@/models/PaymentMethod'

export default async function ProfilePage() {
  const session = await requireSession()
  await connectDB()

  const [rawUser, rawPayments] = await Promise.all([
    User.findById(session.userId).lean(),
    PaymentMethod.find({ user: session.userId }).sort({ isDefault: -1 }).lean(),
  ])

  if (!rawUser) return null

  const user = JSON.parse(JSON.stringify(rawUser)) as {
    _id: string; name: string; phone: string; email?: string; referralCode: string;
    loyaltyPoints: number; isVerified: boolean; role: string;
    preferences: { pushNotifications: boolean; emailNotifications: boolean; language: string }
  }

  const payments = JSON.parse(JSON.stringify(rawPayments)) as Array<{
    _id: string; type: string; label: string; maskedNumber?: string; isDefault: boolean
  }>

  const initials = user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">Profile</h1>

      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary text-primary-foreground text-xl">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-semibold">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.phone}</p>
            {user.email && <p className="text-sm text-muted-foreground">{user.email}</p>}
            <span className="mt-1 inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
              {user.role}
            </span>
          </div>
        </CardContent>
      </Card>

      <ProfileForm
        userId={user._id}
        name={user.name}
        email={user.email ?? ''}
        preferences={user.preferences}
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Referral Code</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-md bg-muted px-3 py-2 text-sm font-bold tracking-widest">
              {user.referralCode}
            </code>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Share this code. You earn ₱50 and your friend earns ₱30 after their first order.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentMethodsList userId={user._id} payments={payments} />
        </CardContent>
      </Card>
    </div>
  )
}
