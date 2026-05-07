import mongoose, { Schema, Document } from 'mongoose'

export interface IReward extends Document {
  title: string
  pointsRequired: number
  discountValue: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const RewardSchema = new Schema<IReward>(
  {
    title: { type: String, required: true, trim: true },
    pointsRequired: { type: Number, required: true, min: 1 },
    discountValue: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export default mongoose.models.Reward ?? mongoose.model<IReward>('Reward', RewardSchema)
