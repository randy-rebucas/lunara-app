import { requireAdmin } from '@/lib/server/auth'
import { connectDB } from '@/lib/db'
import Service from '@/models/Service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { WashingMachine, CheckCircle2, XCircle, LayoutGrid } from 'lucide-react'
import ServiceToggle from './service-toggle'
import ServiceEditDialog from './service-edit-dialog'
import AddServiceForm from './add-service-form'

const UNIT_LABEL: Record<string, string> = {
  per_kg: '/ kg', per_piece: '/ piece', flat: 'flat',
}

const UNIT_COLOR: Record<string, string> = {
  per_kg:    'bg-blue-100 text-blue-700',
  per_piece: 'bg-purple-100 text-purple-700',
  flat:      'bg-amber-100 text-amber-700',
}

export default async function AdminServicesPage() {
  await requireAdmin()
  await connectDB()

  const raw = await Service.find().sort({ sortOrder: 1 }).lean()
  const services = JSON.parse(JSON.stringify(raw)) as Array<{
    _id: string; name: string; slug: string; description: string
    basePrice: number; unit: string; isActive: boolean; sortOrder: number
  }>

  const totalActive   = services.filter((s) => s.isActive).length
  const totalInactive = services.filter((s) => !s.isActive).length

  return (
    <div className="space-y-5 p-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Services</h1>
          <p className="text-sm text-muted-foreground">Manage your laundry service catalog</p>
        </div>
        <AddServiceForm />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Services', value: services.length, icon: LayoutGrid,   color: 'text-blue-600',  bg: 'bg-blue-50' },
          { label: 'Active',         value: totalActive,     icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Inactive',       value: totalInactive,   icon: XCircle,      color: 'text-gray-500',  bg: 'bg-gray-100' },
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

      {/* Catalog cards */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Catalog</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((svc) => (
            <Card
              key={svc._id}
              className={`transition-shadow hover:shadow-md ${!svc.isActive ? 'opacity-60' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <WashingMachine className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold leading-tight">{svc.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{svc.description}</p>
                    </div>
                  </div>
                  <ServiceEditDialog
                    serviceId={svc._id}
                    name={svc.name}
                    description={svc.description}
                    basePrice={svc.basePrice}
                    unit={svc.unit}
                    sortOrder={svc.sortOrder}
                    isActive={svc.isActive}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-primary">₱{svc.basePrice.toFixed(2)}</span>
                    <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${UNIT_COLOR[svc.unit] ?? 'bg-gray-100 text-gray-600'}`}>
                      {UNIT_LABEL[svc.unit] ?? svc.unit}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${svc.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-xs text-muted-foreground">{svc.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Full table */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">All Services</h2>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-28">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((svc) => (
                  <TableRow key={svc._id} className={!svc.isActive ? 'opacity-60' : ''}>
                    <TableCell className="text-xs text-muted-foreground">{svc.sortOrder}</TableCell>
                    <TableCell>
                      <p className="font-medium">{svc.name}</p>
                      <p className="max-w-[220px] truncate text-xs text-muted-foreground">{svc.description}</p>
                    </TableCell>
                    <TableCell className="font-semibold">₱{svc.basePrice.toFixed(2)}</TableCell>
                    <TableCell>
                      <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${UNIT_COLOR[svc.unit] ?? 'bg-gray-100 text-gray-600'}`}>
                        {UNIT_LABEL[svc.unit] ?? svc.unit}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${svc.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className={`text-xs font-medium ${svc.isActive ? 'text-green-700' : 'text-muted-foreground'}`}>
                          {svc.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ServiceEditDialog
                          serviceId={svc._id}
                          name={svc.name}
                          description={svc.description}
                          basePrice={svc.basePrice}
                          unit={svc.unit}
                          sortOrder={svc.sortOrder}
                          isActive={svc.isActive}
                        />
                        <ServiceToggle serviceId={svc._id} isActive={svc.isActive} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
