import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI as string

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not set')
}

// Cached connection across hot reloads in development
const cached: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } =
  (global as unknown as { _mongooseCache: typeof cached })._mongooseCache ?? { conn: null, promise: null }

;(global as unknown as { _mongooseCache: typeof cached })._mongooseCache = cached

export async function connectDB() {
  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false })
  }

  cached.conn = await cached.promise
  return cached.conn
}
