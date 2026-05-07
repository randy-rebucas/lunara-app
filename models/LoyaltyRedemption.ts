import mongoose, { Schema, Document, Types } from 'mongoose'

export interface ILoyaltyRedemption extends Document {
  user: Types.ObjectId
  reward: Types.ObjectId
  pointsSpent: number
  discountValue: number
  couponCode: string
  createdAt: Date
}

const LoyaltyRedemptionSchema = new Schema<ILoyaltyRedemption>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reward: { type: Schema.Types.ObjectId, ref: 'Reward', required: true },
    pointsSpent: { type: Number, required: true },
    discountValue: { type: Number, required: true },
    couponCode: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

LoyaltyRedemptionSchema.index({ user: 1, createdAt: -1 })

export default mongoose.models.LoyaltyRedemption ??
  mongoose.model<ILoyaltyRedemption>('LoyaltyRedemption', LoyaltyRedemptionSchema)
