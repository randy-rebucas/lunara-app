export interface ApiResponse<T = undefined> {
  success: boolean
  data?: T
  message?: string
  error?: string
  details?: { field: string; message: string }[]
}

export interface PaginationQuery {
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type { JWTPayload } from '@/lib/jwt'
export type { OrderStatus } from '@/models/Order'
