# CLAUDE CODE PROMPT — BACKEND (Next.js)
## Laundry App API — Next.js + MongoDB

You are a senior backend engineer.

Your task is to build a production-ready REST API for a laundry service application using Next.js API routes with MongoDB.

---

## TECH STACK

- Next.js (App Router, API Routes)
- TypeScript
- MongoDB with Mongoose
- JWT Authentication
- Bcrypt
- Twilio (OTP / SMS)
- Firebase Admin SDK (Push Notifications)
- Multer + Cloudinary (file uploads)
- Rate limiting
- Helmet
- CORS
- Zod (request validation)

---

## FEATURES TO BUILD

- User authentication (register, login, OTP verify)
- OTP generation and verification via Twilio
- Laundry order CRUD (create, read, update, cancel)
- Pickup & delivery scheduling
- Wallet system (balance, top-up, transactions)
- Coupon & rewards management
- Order tracking (status updates with full timeline)
- Push notifications via Firebase
- Profile management (update, avatar upload to Cloudinary)
- Referral system (generate code, apply code, track rewards)
- Payment methods (add, list, delete)
- Help center (FAQs, ticket submission)
- Services catalog management (pricing, descriptions)
- Loyalty points system
- Admin-ready architecture (admin dashboard, driver app, provider portal)

---

## FOLDER STRUCTURE

```
app/
  api/
    auth/
      register/route.ts
      login/route.ts
      otp/send/route.ts
      otp/verify/route.ts
      refresh/route.ts
    users/
      [id]/route.ts
      profile/route.ts
    orders/
      route.ts
      [id]/route.ts
      [id]/status/route.ts
    wallet/
      route.ts
      topup/route.ts
      transactions/route.ts
    coupons/
      route.ts
      apply/route.ts
    notifications/
      route.ts
      send/route.ts
    referrals/
      route.ts
    payments/
      route.ts
      [id]/route.ts
    help/
      faqs/route.ts
      tickets/route.ts

lib/
  db.ts               # MongoDB connection
  jwt.ts              # Token helpers
  otp.ts              # Twilio OTP
  cloudinary.ts       # File upload
  firebase.ts         # Push notifications

models/
  User.ts
  Order.ts
  Wallet.ts
  Transaction.ts
  Coupon.ts
  Notification.ts
  Referral.ts
  PaymentMethod.ts
  HelpTicket.ts

middleware/
  auth.ts             # JWT guard
  rateLimit.ts
  validate.ts         # Zod middleware

types/
  index.ts

schemas/
  auth.schema.ts
  order.schema.ts
  wallet.schema.ts
  coupon.schema.ts
```

---

## API DESIGN RULES

- All routes return `{ success: boolean, data?: any, message?: string, error?: string }`
- Use HTTP status codes correctly (200, 201, 400, 401, 403, 404, 500)
- JWT in `Authorization: Bearer <token>` header
- Validate all request bodies with Zod schemas
- Rate-limit auth endpoints (max 5 req/min per IP)
- Paginate list endpoints with `?page=1&limit=10`
- Timestamps (`createdAt`, `updatedAt`) on all models

---

## MONGODB MODELS (key fields)

### User
```ts
{ name, phone, email?, passwordHash, avatar?, wallet: ref, referralCode, referredBy?, isVerified, role: 'user'|'admin', createdAt, updatedAt }
```

### Order
```ts
{ user: ref, items: [{ service, quantity, price }], status: 'pending'|'confirmed'|'picked_up'|'washing'|'ready'|'delivered'|'cancelled', pickupAddress, deliveryAddress, pickupTime, deliveryTime, totalAmount, couponApplied?, paymentMethod, createdAt, updatedAt }
```

### Wallet
```ts
{ user: ref, balance: Number, currency: 'PHP' }
```

### Transaction
```ts
{ wallet: ref, user: ref, type: 'credit'|'debit', amount, description, reference, createdAt }
```

### Coupon
```ts
{ code, discountType: 'percent'|'fixed', discountValue, minOrderValue, maxUses, usedCount, expiresAt, isActive }
```

### Reward
```ts
{ title, pointsRequired: Number, discountValue: Number, isActive: Boolean, createdAt, updatedAt }
```

### Notification
```ts
{ user: ref, title, message, type: 'order'|'promo'|'reward'|'system', isRead: Boolean, createdAt }
```

### Service
```ts
{ name, slug, description, icon, basePrice: Number, unit: 'per_kg'|'per_piece'|'flat', isActive: Boolean, sortOrder: Number }
```

---

## API ENDPOINTS (complete)

### Authentication
```
POST /api/auth/send-otp
POST /api/auth/verify-otp
POST /api/auth/signup
POST /api/auth/refresh
POST /api/auth/logout
```

### User
```
GET  /api/users/profile
PUT  /api/users/profile
PUT  /api/users/preferences
POST /api/users/avatar
```

### Orders
```
POST /api/orders
GET  /api/orders
GET  /api/orders/:id
PUT  /api/orders/:id/cancel
PUT  /api/orders/:id/status      # admin/driver
```

### Services
```
GET  /api/services
GET  /api/services/:slug
```

### Coupons
```
GET  /api/coupons
POST /api/coupons/apply
```

### Wallet
```
GET  /api/wallet
POST /api/wallet/topup
GET  /api/wallet/transactions
```

### Rewards
```
GET  /api/rewards
POST /api/rewards/redeem
GET  /api/rewards/history
```

### Notifications
```
GET  /api/notifications
PUT  /api/notifications/:id/read
PUT  /api/notifications/read-all
```

### Referrals
```
GET  /api/referrals
POST /api/referrals/apply
```

### Payments
```
GET  /api/payments
POST /api/payments
DELETE /api/payments/:id
```

### Help
```
GET  /api/help/faqs
POST /api/help/tickets
GET  /api/help/tickets
```

---

## ORDER TRACKING STATES

```
pending → confirmed → picked_up → washing → drying → ironing → out_for_delivery → delivered
                                                                                 ↘ cancelled
```

Push notification triggers: `confirmed`, `picked_up`, `out_for_delivery`, `delivered`

---

## SECURITY REQUIREMENTS

- JWT access token (15min expiry) + refresh token (30d expiry, stored in DB)
- OTP: 6-digit, hashed with bcrypt, 10-minute expiry, max 3 attempts
- Rate limiting: 5 req/min on auth endpoints, 100 req/min elsewhere
- Helmet for secure HTTP headers
- CORS whitelist for app origins
- All inputs validated via Zod before hitting DB
- Mongoose schema-level validation as second layer
- Wallet top-up and debit wrapped in MongoDB transactions (atomic)

---

## ADMIN-READY STRUCTURE

Design the backend so these can be layered on later without restructuring:

- Admin dashboard (role: `admin` already on User model)
- Driver app (role: `driver`, order assignment fields)
- Provider/franchise portal (multi-tenant order routing)
- Analytics (orders by date, revenue, service popularity)
- Promo/campaign management

Add `role: 'user' | 'admin' | 'driver'` to User schema. Guard admin-only routes with role middleware.

---

## ENVIRONMENT VARIABLES

```env
MONGODB_URI=
JWT_SECRET=
JWT_REFRESH_SECRET=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
FIREBASE_SERVICE_ACCOUNT=
NEXT_PUBLIC_API_URL=
```

---

## INSTRUCTIONS

1. Generate all models with full Mongoose schemas and TypeScript types.
2. Implement all API routes with proper validation, auth guards, and error handling.
3. Build reusable middleware for JWT auth, Zod validation, and rate limiting.
4. Implement OTP flow: send SMS via Twilio, store hashed OTP with expiry, verify.
5. Implement wallet top-up and debit on order payment atomically (MongoDB transactions).
6. Implement referral: unique code per user, credit both referrer and referee on first order.
7. Push notifications: send via Firebase when order status changes.
8. All file uploads go to Cloudinary; store returned URL in DB.
9. Seed the Services collection with: Wash & Fold, Dry Cleaning, Bedding & Linen, Shoe Laundry, Special Care.
10. Implement loyalty points: earn on order completion, spend via rewards redemption.
11. Add `role` field to User; guard admin routes with role middleware.
12. Write the complete project — no placeholders, no TODOs.
