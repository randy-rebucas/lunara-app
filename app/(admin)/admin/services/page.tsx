import { requireAdmin } from '@/lib/server/auth'
import { connectDB } from '@/lib/db'
import Service from '@/models/Service'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import ServiceToggle from './service-toggle'

export default async function AdminServicesPage() {
  await requireAdmin()
  await connectDB()

  const raw = await Service.find().sort({ sortOrder: 1 }).lean()
  const services = JSON.parse(JSON.stringify(raw)) as Array<{
    _id: string; name: string; slug: string; description: string;
    basePrice: number; unit: string; isActive: boolean; sortOrder: number
  }>

  const unitLabel: Record<string, string> = {
    per_kg: 'per kg', per_piece: 'per piece', flat: 'flat rate',
  }

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-bold">Services</h1>
        <p className="text-sm text-muted-foreground">Manage your service catalog</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Toggle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((svc) => (
                <TableRow key={svc._id}>
                  <TableCell className="font-medium">{svc.name}</TableCell>
                  <TableCell className="max-w-[200px]">
                    <p className="truncate text-sm text-muted-foreground">{svc.description}</p>
                  </TableCell>
                  <TableCell className="font-medium">₱{svc.basePrice}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {unitLabel[svc.unit] ?? svc.unit}
                  </TableCell>
                  <TableCell>
                    <Badge variant={svc.isActive ? 'default' : 'secondary'}>
                      {svc.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ServiceToggle serviceId={svc._id} isActive={svc.isActive} />
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
