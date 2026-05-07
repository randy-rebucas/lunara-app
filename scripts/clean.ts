import { readFileSync } from 'fs'
import { resolve } from 'path'
import mongoose from 'mongoose'

try {
  const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (key && !(key in process.env)) process.env[key] = val
  }
} catch {}

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set')
  process.exit(1)
}

const COLLECTIONS = [
  'users', 'wallets', 'transactions', 'paymentmethods',
  'orders', 'notifications', 'helptickets', 'referrals',
  'loyaltyredemptions', 'refreshtokens', 'services',
  'rewards', 'coupons',
]

async function clean() {
  await mongoose.connect(MONGODB_URI!)
  console.log('Connected to MongoDB\n── Cleaning collections')

  const db = mongoose.connection.db!
  for (const name of COLLECTIONS) {
    const result = await db.collection(name).deleteMany({})
    console.log(`  ✓ ${name.padEnd(20)} ${result.deletedCount} doc(s) removed`)
  }

  console.log('\n✅ Clean complete.')
  await mongoose.disconnect()
}

clean().catch((err) => {
  console.error(err)
  process.exit(1)
})
