import { readFileSync } from 'fs'
import { resolve } from 'path'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import Service from '../models/Service'
import Reward from '../models/Reward'
import Coupon from '../models/Coupon'
import User from '../models/User'
import Wallet from '../models/Wallet'
import Transaction from '../models/Transaction'
import PaymentMethod from '../models/PaymentMethod'
import Order from '../models/Order'
import Notification from '../models/Notification'
import HelpTicket from '../models/HelpTicket'
import Referral from '../models/Referral'
import LoyaltyRedemption from '../models/LoyaltyRedemption'

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

// ─── Static data ────────────────────────────────────────────────────────────

const SERVICES = [
  { name: 'Wash & Fold', slug: 'wash-and-fold', description: 'Full wash, dry, and fold service for everyday clothing.', basePrice: 90, unit: 'per_kg' as const, isActive: true, sortOrder: 1 },
  { name: 'Dry Cleaning', slug: 'dry-cleaning', description: 'Professional dry cleaning for delicate and formal garments.', basePrice: 250, unit: 'per_piece' as const, isActive: true, sortOrder: 2 },
  { name: 'Bedding & Linen', slug: 'bedding-and-linen', description: 'Deep clean for bed sheets, pillowcases, blankets, and duvet covers.', basePrice: 350, unit: 'per_piece' as const, isActive: true, sortOrder: 3 },
  { name: 'Shoe Laundry', slug: 'shoe-laundry', description: 'Thorough cleaning and deodorizing for all types of shoes.', basePrice: 200, unit: 'per_piece' as const, isActive: true, sortOrder: 4 },
  { name: 'Special Care', slug: 'special-care', description: 'Tailored treatment for luxury, embellished, or extra-sensitive items.', basePrice: 500, unit: 'flat' as const, isActive: true, sortOrder: 5 },
]

const REWARDS = [
  { title: '₱50 Off Your Order', pointsRequired: 100, discountValue: 50, isActive: true },
  { title: '₱100 Off Your Order', pointsRequired: 200, discountValue: 100, isActive: true },
  { title: '₱200 Off Your Order', pointsRequired: 350, discountValue: 200, isActive: true },
  { title: 'Free Delivery Upgrade', pointsRequired: 50, discountValue: 30, isActive: true },
]

const now = new Date()
const days = (n: number) => new Date(now.getTime() + n * 86_400_000)

const COUPONS = [
  { code: 'WELCOME10', discountType: 'percent' as const, discountValue: 10, minOrderValue: 200, maxUses: 100, expiresAt: days(90), isActive: true },
  { code: 'FLAT50', discountType: 'fixed' as const, discountValue: 50, minOrderValue: 300, maxUses: 50, expiresAt: days(60), isActive: true },
  { code: 'NEWUSER20', discountType: 'percent' as const, discountValue: 20, minOrderValue: 0, maxUses: 200, expiresAt: days(90), isActive: true },
]

// Seed accounts (phones used as stable identifiers for cleanup)
const SEED_PHONES = ['+639000000001', '+639000000002', '+639000000003']

// ─── Seed ───────────────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(MONGODB_URI!)
  console.log('Connected to MongoDB\n')

  // Services
  console.log('── Services')
  for (const svc of SERVICES) {
    await Service.findOneAndUpdate({ slug: svc.slug }, svc, { upsert: true, returnDocument: 'after' })
    console.log(`  ✓ ${svc.name}`)
  }

  // Rewards
  console.log('\n── Rewards')
  for (const rwd of REWARDS) {
    await Reward.findOneAndUpdate({ title: rwd.title }, rwd, { upsert: true, returnDocument: 'after' })
    console.log(`  ✓ ${rwd.title}`)
  }

  // Coupons
  console.log('\n── Coupons')
  for (const cpn of COUPONS) {
    await Coupon.findOneAndUpdate({ code: cpn.code }, cpn, { upsert: true, returnDocument: 'after' })
    console.log(`  ✓ ${cpn.code}`)
  }

  // ── Clean up previous seed users ──────────────────────────────────────────
  console.log('\n── Cleaning seed users')
  const existing = await User.find({ phone: { $in: SEED_PHONES } }).select('_id')
  const existingIds = existing.map((u) => u._id)
  if (existingIds.length) {
    const wallets = await Wallet.find({ user: { $in: existingIds } }).select('_id')
    const walletIds = wallets.map((w) => w._id)
    await Promise.all([
      User.deleteMany({ _id: { $in: existingIds } }),
      Wallet.deleteMany({ _id: { $in: walletIds } }),
      Transaction.deleteMany({ user: { $in: existingIds } }),
      PaymentMethod.deleteMany({ user: { $in: existingIds } }),
      Order.deleteMany({ user: { $in: existingIds } }),
      Notification.deleteMany({ user: { $in: existingIds } }),
      HelpTicket.deleteMany({ user: { $in: existingIds } }),
      Referral.deleteMany({ $or: [{ referrer: { $in: existingIds } }, { referee: { $in: existingIds } }] }),
      LoyaltyRedemption.deleteMany({ user: { $in: existingIds } }),
    ])
    console.log(`  ✓ Removed ${existingIds.length} existing seed user(s) and related data`)
  } else {
    console.log('  ✓ No previous seed users found')
  }

  // ── Users & Wallets ───────────────────────────────────────────────────────
  console.log('\n── Users')

  const adminUser = await User.create({
    name: 'Maria Santos',
    phone: '+639000000001',
    email: 'admin@laundryapp.dev',
    passwordHash: await bcrypt.hash('Admin@1234', 10),
    referralCode: 'MARIA001',
    isVerified: true,
    role: 'admin',
    loyaltyPoints: 0,
  })
  const adminWallet = await Wallet.create({ user: adminUser._id, balance: 0, currency: 'PHP' })
  await User.findByIdAndUpdate(adminUser._id, { wallet: adminWallet._id })
  console.log(`  ✓ Admin   — ${adminUser.name} (${adminUser.phone})`)

  const driverUser = await User.create({
    name: 'Jose Reyes',
    phone: '+639000000002',
    email: 'driver@laundryapp.dev',
    passwordHash: await bcrypt.hash('Driver@1234', 10),
    referralCode: 'JOSE001',
    isVerified: true,
    role: 'driver',
    loyaltyPoints: 0,
  })
  const driverWallet = await Wallet.create({ user: driverUser._id, balance: 0, currency: 'PHP' })
  await User.findByIdAndUpdate(driverUser._id, { wallet: driverWallet._id })
  console.log(`  ✓ Driver  — ${driverUser.name} (${driverUser.phone})`)

  const regularUser = await User.create({
    name: 'Ana Dela Cruz',
    phone: '+639000000003',
    email: 'ana@laundryapp.dev',
    passwordHash: await bcrypt.hash('User@1234', 10),
    referralCode: 'ANA001',
    referredBy: adminUser._id,
    isVerified: true,
    role: 'user',
    loyaltyPoints: 250,
    preferences: { pushNotifications: true, emailNotifications: false, language: 'en' },
  })
  const userWallet = await Wallet.create({ user: regularUser._id, balance: 1_730, currency: 'PHP' })
  await User.findByIdAndUpdate(regularUser._id, { wallet: userWallet._id })
  console.log(`  ✓ User    — ${regularUser.name} (${regularUser.phone})`)

  const uid = regularUser._id
  const wid = userWallet._id

  // ── Transactions ──────────────────────────────────────────────────────────
  console.log('\n── Transactions')
  await Transaction.insertMany([
    { wallet: wid, user: uid, type: 'credit', amount: 2_000, description: 'Wallet top-up', reference: 'TOPUP-SEED-001' },
    { wallet: wid, user: uid, type: 'debit', amount: 270, description: 'Order payment', reference: 'ORDER-SEED-001' },
  ])
  console.log('  ✓ 2 transactions (top-up + order debit)')

  // ── Payment Methods ───────────────────────────────────────────────────────
  console.log('\n── Payment Methods')
  await PaymentMethod.insertMany([
    { user: uid, type: 'gcash', label: 'GCash', maskedNumber: '****3456', isDefault: true },
    { user: uid, type: 'maya', label: 'Maya', maskedNumber: '****7890', isDefault: false },
  ])
  console.log('  ✓ GCash (default), Maya')

  // ── Orders ────────────────────────────────────────────────────────────────
  console.log('\n── Orders')
  const address = {
    pickupAddress: { street: '123 Sampaguita St', city: 'Makati', province: 'Metro Manila', zip: '1200', coordinates: { lat: 14.5547, lng: 121.0244 } },
    deliveryAddress: { street: '123 Sampaguita St', city: 'Makati', province: 'Metro Manila', zip: '1200', coordinates: { lat: 14.5547, lng: 121.0244 } },
  }

  const order1 = await Order.create({
    user: uid, ...address,
    items: [{ service: 'Wash & Fold', quantity: 3, price: 90 }],
    status: 'delivered',
    pickupTime: days(-3),
    deliveryTime: days(-1),
    totalAmount: 270,
    discountAmount: 0,
    paymentMethod: 'wallet',
    notes: 'Please use unscented detergent.',
  })
  console.log(`  ✓ Order 1 — delivered   (₱270, wallet)`)

  const order2 = await Order.create({
    user: uid, ...address,
    items: [{ service: 'Dry Cleaning', quantity: 2, price: 250 }],
    status: 'out_for_delivery',
    pickupTime: days(-2),
    totalAmount: 500,
    discountAmount: 0,
    paymentMethod: 'cash',
  })
  console.log(`  ✓ Order 2 — out_for_delivery (₱500, cash)`)

  const flat50 = await Coupon.findOne({ code: 'FLAT50' })
  await Order.create({
    user: uid, ...address,
    items: [{ service: 'Bedding & Linen', quantity: 1, price: 350 }],
    status: 'confirmed',
    pickupTime: days(1),
    totalAmount: 350,
    couponApplied: flat50?._id,
    discountAmount: 50,
    paymentMethod: 'wallet',
  })
  console.log(`  ✓ Order 3 — confirmed    (₱350 - ₱50 coupon, wallet)`)

  await Order.create({
    user: uid, ...address,
    items: [{ service: 'Shoe Laundry', quantity: 2, price: 200 }],
    status: 'pending',
    pickupTime: days(2),
    totalAmount: 400,
    discountAmount: 0,
    paymentMethod: 'cash',
    notes: 'Two pairs of white sneakers.',
  })
  console.log(`  ✓ Order 4 — pending      (₱400, cash)`)

  // ── Notifications ─────────────────────────────────────────────────────────
  console.log('\n── Notifications')
  await Notification.insertMany([
    { user: uid, title: 'Welcome to LaundryApp!', message: 'Your account is ready. Book your first order today.', type: 'system', isRead: true },
    { user: uid, title: 'Order Placed', message: 'Your order has been placed successfully.', type: 'order', data: { orderId: order1._id.toString(), status: 'pending' }, isRead: true },
    { user: uid, title: 'Order Delivered', message: 'Your laundry has been delivered. Enjoy fresh clothes!', type: 'order', data: { orderId: order1._id.toString(), status: 'delivered' }, isRead: true },
    { user: uid, title: 'You Earned 270 Loyalty Points!', message: 'Points from your last order have been credited to your account.', type: 'reward', isRead: true },
    { user: uid, title: 'Promo: FLAT50', message: 'Use code FLAT50 to get ₱50 off your next order (min ₱300).', type: 'promo', data: { couponCode: 'FLAT50' }, isRead: false },
    { user: uid, title: 'Your Order Is On Its Way', message: 'Your order is out for delivery. Hang tight!', type: 'order', data: { orderId: order2._id.toString(), status: 'out_for_delivery' }, isRead: false },
  ])
  console.log('  ✓ 6 notifications (3 read, 3 unread)')

  // ── Help Tickets ──────────────────────────────────────────────────────────
  console.log('\n── Help Tickets')
  await HelpTicket.insertMany([
    { user: uid, subject: 'Delayed pickup', message: 'My order was supposed to be picked up 2 hours ago. No one has arrived yet.', status: 'open' },
    { user: uid, subject: 'Wrong amount charged', message: 'I was charged ₱350 but my order total should have been ₱270.', status: 'resolved', adminReply: 'We apologize for the inconvenience. A refund of ₱80 has been credited to your wallet.' },
  ])
  console.log('  ✓ 2 tickets (1 open, 1 resolved)')

  // ── Referral ──────────────────────────────────────────────────────────────
  console.log('\n── Referral')
  await Referral.create({
    referrer: adminUser._id,
    referee: uid,
    referralCode: 'MARIA001',
    referrerReward: 50,
    refereeReward: 30,
    rewardCredited: true,
  })
  console.log('  ✓ Ana referred by Maria (reward credited)')

  // ── Loyalty Redemption ────────────────────────────────────────────────────
  console.log('\n── Loyalty Redemption')
  const reward50 = await Reward.findOne({ title: '₱50 Off Your Order' })
  const redeemedCode = `REWARD-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
  await LoyaltyRedemption.create({
    user: uid,
    reward: reward50!._id,
    pointsSpent: 100,
    discountValue: 50,
    couponCode: redeemedCode,
  })
  console.log(`  ✓ Redeemed "₱50 Off" → ${redeemedCode}`)

  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n✅ Seeding complete.\n')
  console.log('Seed accounts:')
  console.log('  Admin   +639000000001  Admin@1234')
  console.log('  Driver  +639000000002  Driver@1234')
  console.log('  User    +639000000003  User@1234')

  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
