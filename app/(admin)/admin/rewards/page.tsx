import { requireAdmin } from '@/lib/server/auth'
import { connectDB } from '@/lib/db'
import Reward from '@/models/Reward'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import RewardToggle from './reward-toggle'
import AddRewardForm from './add-reward-form'

export default async function AdminRewardsPage() {
  await requireAdmin()
  await connectDB()

  const raw = await Reward.find().sort({ pointsRequired: 1 }).lean()
  const rewards = JSON.parse(JSON.stringify(raw)) as Array<{
    _id: string; title: string; pointsRequired: number; discountValue: number; isActive: boolean
  }>

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rewards</h1>
          <p className="text-sm text-muted-foreground">Loyalty reward catalog</p>
        </div>
        <AddRewardForm />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Points Required</TableHead>
                <TableHead>Discount Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rewards.map((reward) => (
                <TableRow key={reward._id}>
                  <TableCell className="font-medium">{reward.title}</TableCell>
                  <TableCell>{reward.pointsRequired} pts</TableCell>
                  <TableCell className="font-medium">₱{reward.discountValue}</TableCell>
                  <TableCell>
                    <Badge variant={reward.isActive ? 'default' : 'secondary'}>
                      {reward.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <RewardToggle rewardId={reward._id} isActive={reward.isActive} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
