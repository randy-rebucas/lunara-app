import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IHelpTicket extends Document {
  user: Types.ObjectId
  subject: string
  message: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  adminReply?: string
  createdAt: Date
  updatedAt: Date
}

const HelpTicketSchema = new Schema<IHelpTicket>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
    },
    adminReply: { type: String },
  },
  { timestamps: true }
)

HelpTicketSchema.index({ user: 1, createdAt: -1 })

export default mongoose.models.HelpTicket ??
  mongoose.model<IHelpTicket>('HelpTicket', HelpTicketSchema)
