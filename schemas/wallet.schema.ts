import { z } from 'zod'

export const topUpSchema = z.object({
  amount: z.number().min(1).max(100000),
  reference: z.string().min(1),
})

export type TopUpInput = z.infer<typeof topUpSchema>
