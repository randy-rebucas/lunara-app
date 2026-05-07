import mongoose, { Schema, Document, Types } from 'mongoose'

export interface ITransaction extends Document {
  wallet: Types.ObjectId
  user: Types.ObjectId
  type: 'credit' | 'debit'
  amount: number
  description: string
  reference: string
  createdAt: Date
}

const TransactionSchema = new Schema<ITransaction>(
  {
    wallet: { type: Schema.Types.ObjectId, ref: 'Wallet', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['credit', 'debit'], required: true },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, required: true },
    reference: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

TransactionSchema.index({ wallet: 1, createdAt: -1 })
TransactionSchema.index({ user: 1, createdAt: -1 })

export default mongoose.models.Transaction ??
  mongoose.model<ITransaction>('Transaction', TransactionSchema)
