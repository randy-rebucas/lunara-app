import mongoose, { Schema, Document } from 'mongoose'

export interface IService extends Document {
  name: string
  slug: string
  description: string
  icon?: string
  basePrice: number
  unit: 'per_kg' | 'per_piece' | 'flat'
  isActive: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

const ServiceSchema = new Schema<IService>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true },
    icon: { type: String },
    basePrice: { type: Number, required: true, min: 0 },
    unit: { type: String, enum: ['per_kg', 'per_piece', 'flat'], required: true },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
)

ServiceSchema.index({ slug: 1 })
ServiceSchema.index({ isActive: 1, sortOrder: 1 })

export default mongoose.models.Service ?? mongoose.model<IService>('Service', ServiceSchema)
