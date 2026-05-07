import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IRefreshToken extends Document {
  user: Types.ObjectId
  jti: string
  expiresAt: Date
  isRevoked: boolean
  createdAt: Date
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    jti: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    isRevoked: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

RefreshTokenSchema.index({ jti: 1 })
RefreshTokenSchema.index({ user: 1 })
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.models.RefreshToken ??
  mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema)
