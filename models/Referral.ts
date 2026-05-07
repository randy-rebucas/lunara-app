import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IReferral extends Document {
  referrer: Types.ObjectId
  referee: Types.ObjectId
  referralCode: string
  referrerReward: number
  refereeReward: number
  rewardCredited: boolean
  createdAt: Date
  updatedAt: Date
}

const ReferralSchema = new Schema<IReferral>(
  {
    referrer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    referee: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    referralCode: { type: String, required: true },
    referrerReward: { type: Number, default: 50 },
    refereeReward: { type: Number, default: 30 },
    rewardCredited: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export default mongoose.models.Referral ?? mongoose.model<IReferral>('Referral', ReferralSchema)
