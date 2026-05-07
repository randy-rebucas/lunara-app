import mongoose from 'mongoose'
import Referral from '@/models/Referral'
import Wallet from '@/models/Wallet'
import Transaction from '@/models/Transaction'

export function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function getPagination(url: URL) {
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '10', 10)))
  const skip = (page - 1) * limit
  return { page, limit, skip }
}

export async function creditReferralReward(userId: string): Promise<void> {
  const referral = await Referral.findOne({ referee: userId, rewardCredited: false })
  if (!referral) return

  const [referrerWallet, refereeWallet] = await Promise.all([
    Wallet.findOne({ user: referral.referrer }),
    Wallet.findOne({ user: userId }),
  ])
  if (!referrerWallet || !refereeWallet) return

  const session = await mongoose.startSession()
  try {
    await session.withTransaction(async () => {
      await Wallet.findByIdAndUpdate(
        referrerWallet._id,
        { $inc: { balance: referral.referrerReward } },
        { session }
      )
      await Wallet.findByIdAndUpdate(
        refereeWallet._id,
        { $inc: { balance: referral.refereeReward } },
        { session }
      )
      await Transaction.create(
        [
          {
            wallet: referrerWallet._id,
            user: referral.referrer,
            type: 'credit',
            amount: referral.referrerReward,
            description: 'Referral reward',
            reference: `REFERRAL-${userId}`,
          },
          {
            wallet: refereeWallet._id,
            user: userId,
            type: 'credit',
            amount: referral.refereeReward,
            description: 'Welcome referral bonus',
            reference: `REFERRAL-BONUS-${userId}`,
          },
        ],
        { session }
      )
      await Referral.findByIdAndUpdate(referral._id, { rewardCredited: true }, { session })
    })
  } finally {
    await session.endSession()
  }
}
