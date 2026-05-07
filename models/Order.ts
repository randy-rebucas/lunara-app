import mongoose, { Schema, Document, Types } from 'mongoose'

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'picked_up'
  | 'washing'
  | 'drying'
  | 'ironing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'

export interface IOrderItem {
  service: string
  quantity: number
  price: number
}

export interface IAddress {
  street: string
  city: string
  province: string
  zip: string
  coordinates?: { lat: number; lng: number }
}

export interface IOrder extends Document {
  user: Types.ObjectId
  items: IOrderItem[]
  status: OrderStatus
  pickupAddress: IAddress
  deliveryAddress: IAddress
  pickupTime: Date
  deliveryTime?: Date
  totalAmount: number
  couponApplied?: Types.ObjectId
  discountAmount: number
  paymentMethod: 'wallet' | 'cash' | 'card'
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const AddressSchema = new Schema<IAddress>(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    province: { type: String, required: true },
    zip: { type: String, required: true },
    coordinates: { lat: { type: Number }, lng: { type: Number } },
  },
  { _id: false }
)

const OrderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
      {
        service: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
      },
    ],
    status: {
      type: String,
      enum: [
        'pending', 'confirmed', 'picked_up', 'washing',
        'drying', 'ironing', 'out_for_delivery', 'delivered', 'cancelled',
      ],
      default: 'pending',
    },
    pickupAddress: { type: AddressSchema, required: true },
    deliveryAddress: { type: AddressSchema, required: true },
    pickupTime: { type: Date, required: true },
    deliveryTime: { type: Date },
    totalAmount: { type: Number, required: true, min: 0 },
    couponApplied: { type: Schema.Types.ObjectId, ref: 'Coupon' },
    discountAmount: { type: Number, default: 0 },
    paymentMethod: { type: String, enum: ['wallet', 'cash', 'card'], required: true },
    notes: { type: String },
  },
  { timestamps: true }
)

OrderSchema.index({ user: 1, createdAt: -1 })
OrderSchema.index({ status: 1 })

export default mongoose.models.Order ?? mongoose.model<IOrder>('Order', OrderSchema)
