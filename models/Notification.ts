import mongoose, { Schema, Document, Types } from 'mongoose'

export interface INotification extends Document {
  user: Types.ObjectId
  title: string
  message: string
  type: 'order' | 'promo' | 'reward' | 'system'
  data?: Record<string, string>
  isRead: boolean
  createdAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['order', 'promo', 'reward', 'system'], default: 'system' },
    data: { type: Schema.Types.Mixed },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

NotificationSchema.index({ user: 1, createdAt: -1 })

export default mongoose.models.Notification ??
  mongoose.model<INotification>('Notification', NotificationSchema)
