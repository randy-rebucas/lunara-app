import mongoose from 'mongoose'
import Service from '../models/Service'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set')
  process.exit(1)
}

const SERVICES = [
  {
    name: 'Wash & Fold',
    slug: 'wash-and-fold',
    description: 'Full wash, dry, and fold service for everyday clothing.',
    basePrice: 90,
    unit: 'per_kg' as const,
    isActive: true,
    sortOrder: 1,
  },
  {
    name: 'Dry Cleaning',
    slug: 'dry-cleaning',
    description: 'Professional dry cleaning for delicate and formal garments.',
    basePrice: 250,
    unit: 'per_piece' as const,
    isActive: true,
    sortOrder: 2,
  },
  {
    name: 'Bedding & Linen',
    slug: 'bedding-and-linen',
    description: 'Deep clean for bed sheets, pillowcases, blankets, and duvet covers.',
    basePrice: 350,
    unit: 'per_piece' as const,
    isActive: true,
    sortOrder: 3,
  },
  {
    name: 'Shoe Laundry',
    slug: 'shoe-laundry',
    description: 'Thorough cleaning and deodorizing for all types of shoes.',
    basePrice: 200,
    unit: 'per_piece' as const,
    isActive: true,
    sortOrder: 4,
  },
  {
    name: 'Special Care',
    slug: 'special-care',
    description: 'Tailored treatment for luxury, embellished, or extra-sensitive items.',
    basePrice: 500,
    unit: 'flat' as const,
    isActive: true,
    sortOrder: 5,
  },
]

async function seed() {
  await mongoose.connect(MONGODB_URI!)
  console.log('Connected to MongoDB')

  for (const svc of SERVICES) {
    await Service.findOneAndUpdate({ slug: svc.slug }, svc, { upsert: true, new: true })
    console.log(`✓ ${svc.name}`)
  }

  console.log('Seeding complete.')
  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
