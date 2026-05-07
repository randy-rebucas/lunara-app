import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IUserPreferences {
  pushNotifications: boolean
  emailNotifications: boolean
  language: string
}

export interface IUser extends Document {
  name: string
  phone: string
  email?: string
  passwordHash?: string
  avatar?: string
  wallet: Types.ObjectId
  referralCode: string
  referredBy?: Types.ObjectId
  fcmToken?: string
  isVerified: boolean
  role: 'user' | 'admin' | 'driver'
  loyaltyPoints: number
  preferences: IUserPreferences
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, sparse: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    avatar: { type: String },
    wallet: { type: Schema.Types.ObjectId, ref: 'Wallet' },
    referralCode: { type: String, unique: true, required: true },
    referredBy: { type: Schema.Types.ObjectId, ref: 'User' },
    fcmToken: { type: String },
    isVerified: { type: Boolean, default: false },
    role: { type: String, enum: ['user', 'admin', 'driver'], default: 'user' },
    loyaltyPoints: { type: Number, default: 0, min: 0 },
    preferences: {
      pushNotifications: { type: Boolean, default: true },
      emailNotifications: { type: Boolean, default: false },
      language: { type: String, default: 'en' },
    },
  },
  { timestamps: true }
)

export default mongoose.models.User ?? mongoose.model<IUser>('User', UserSchema)
