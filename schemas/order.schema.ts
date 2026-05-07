import { z } from 'zod'

const addressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  province: z.string().min(1),
  zip: z.string().min(1),
  coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
})

const orderItemSchema = z.object({
  service: z.string().min(1),
  quantity: z.number().int().min(1),
  price: z.number().min(0),
})

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  pickupAddress: addressSchema,
  deliveryAddress: addressSchema,
  pickupTime: z.string().datetime(),
  paymentMethod: z.enum(['wallet', 'cash', 'card']),
  couponCode: z.string().optional(),
  notes: z.string().max(500).optional(),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'confirmed', 'picked_up', 'washing', 'drying',
    'ironing', 'out_for_delivery', 'delivered', 'cancelled',
  ]),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>
