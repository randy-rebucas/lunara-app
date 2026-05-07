import { z } from 'zod'

export const createCouponSchema = z.object({
  code: z.string().min(3).max(20).toUpperCase(),
  discountType: z.enum(['percent', 'fixed']),
  discountValue: z.number().min(0),
  minOrderValue: z.number().min(0).default(0),
  maxUses: z.number().int().min(1),
  expiresAt: z.string().datetime(),
})

export const applyCouponSchema = z.object({
  code: z.string().min(1),
  orderAmount: z.number().min(0),
})

export type CreateCouponInput = z.infer<typeof createCouponSchema>
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>
