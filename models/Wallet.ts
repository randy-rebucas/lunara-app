import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IWallet extends Document {
  user: Types.ObjectId
  balance: number
  currency: 'PHP'
  createdAt: Date
  updatedAt: Date
}

const WalletSchema = new Schema<IWallet>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    balance: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'PHP' },
  },
  { timestamps: true }
)

export default mongoose.models.Wallet ?? mongoose.model<IWallet>('Wallet', WalletSchema)
