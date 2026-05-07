import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IPaymentMethod extends Document {
  user: Types.ObjectId
  type: 'card' | 'gcash' | 'maya' | 'bank'
  label: string
  maskedNumber?: string
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

const PaymentMethodSchema = new Schema<IPaymentMethod>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['card', 'gcash', 'maya', 'bank'], required: true },
    label: { type: String, required: true, trim: true },
    maskedNumber: { type: String },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
)

PaymentMethodSchema.index({ user: 1 })

export default mongoose.models.PaymentMethod ??
  mongoose.model<IPaymentMethod>('PaymentMethod', PaymentMethodSchema)
