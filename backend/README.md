# DukaanSync Backend API

Node.js + Express + Prisma REST API for DukaanSync inventory management platform.

## 🏗️ Tech Stack

- **Runtime**: Node.js 20.x
- **Framework**: Express 4.x
- **Database ORM**: Prisma 5.x
- **Database**: PostgreSQL 16
- **Cache/Pub-Sub**: Redis 7
- **Authentication**: JWT with RS256, bcrypt
- **Validation**: express-validator
- **Rate Limiting**: express-rate-limit with Redis store
- **Email**: Nodemailer
- **Payment**: Razorpay SDK

## 📁 Project Structure

```
backend/
├── src/
│   ├── api/
│   │   ├── routes/v1/          # API route handlers
│   │   ├── middleware/          # Auth, validation, rate limiting
│   │   └── app.js              # Express app configuration
│   ├── config/
│   │   ├── database.js         # Prisma client
│   │   ├── redis.js            # Redis pub/sub clients
│   │   └── shops.js            # Shop configuration
│   ├── services/               # Business logic layer
│   │   ├── auth.service.js
│   │   ├── product.service.js
│   │   ├── inventory.service.js
│   │   ├── order.service.js
│   │   ├── payment.service.js
│   │   ├── supplier.service.js
│   │   ├── alert.service.js
│   │   ├── dashboard.service.js
│   │   └── email.service.js
│   ├── jobs/                   # Background jobs
│   │   └── checkLowStock.js   # 30-second cron for alerts
│   └── server.js               # Entry point
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── migrations/             # Migration history
│   └── seed.js                 # Seed data
├── tests/                      # Test suites
└── package.json
```

## 🚀 Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Redis 7+

### Installation

```bash
cd backend
npm install
```

### Environment Configuration

Create `.env` file:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dukaansync

# Redis
REDIS_URL=redis://localhost:6379

# JWT Secrets (generate with: openssl rand -base64 64)
JWT_SECRET=your-jwt-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here

# Server
NODE_ENV=development
PORT=3000

# Email (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password  # Generate at myaccount.google.com/apppasswords

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174

# MFA
MFA_OTP_EXPIRY=10  # minutes
```

### Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database (creates default shops and admin user)
npm run seed
```

**Default Admin Account**:

- Email: `admin@dukaansync.com`
- Password: `Admin@123`

### Start Development Server

```bash
npm run dev
```

API available at: http://localhost:3000

## 📍 API Endpoints

### Authentication

```
POST   /api/v1/auth/register        # Register new user
POST   /api/v1/auth/login           # Login (returns JWT tokens)
POST   /api/v1/auth/refresh         # Refresh access token
POST   /api/v1/auth/logout          # Logout (invalidate refresh token)
POST   /api/v1/auth/mfa/verify      # Verify MFA OTP
```

### Products

```
GET    /api/v1/products             # List products (paginated, searchable)
GET    /api/v1/products/:id         # Get single product with stock
POST   /api/v1/products             # Create product
PUT    /api/v1/products/:id         # Update product
DELETE /api/v1/products/:id         # Delete product
```

### Inventory

```
POST   /api/v1/inventory/adjust     # Adjust stock (add/remove)
POST   /api/v1/inventory/transfer   # Transfer stock between shops
GET    /api/v1/inventory/history/:productId  # Stock audit trail
```

### Orders

```
POST   /api/v1/orders               # Create order
GET    /api/v1/orders               # List orders (admin: all, customer: own)
GET    /api/v1/orders/:id           # Get order details
PATCH  /api/v1/orders/:id/status    # Update order status (admin only)
POST   /api/v1/orders/:id/cancel    # Cancel order
POST   /api/v1/orders/payment/webhook  # Razorpay webhook handler
```

### Suppliers

```
GET    /api/v1/suppliers            # List suppliers
GET    /api/v1/suppliers/:id        # Get supplier details
POST   /api/v1/suppliers            # Create supplier
PUT    /api/v1/suppliers/:id        # Update supplier
DELETE /api/v1/suppliers/:id        # Delete supplier
POST   /api/v1/suppliers/:id/products  # Link product to supplier
```

### Alerts

```
GET    /api/v1/alerts               # List low-stock alerts
GET    /api/v1/alerts/unviewed-count  # Count unviewed alerts
PATCH  /api/v1/alerts/:id/mark-viewed  # Mark alert as viewed
POST   /api/v1/alerts/:id/contact-supplier  # Get supplier contact info
```

### Dashboard

```
GET    /api/v1/dashboard/stats      # Real-time dashboard metrics
```

### Customers

```
GET    /api/v1/customers/profile    # Get customer profile
GET    /api/v1/customers/addresses  # List delivery addresses
POST   /api/v1/customers/addresses  # Create delivery address
PUT    /api/v1/customers/addresses/:id  # Update address
DELETE /api/v1/customers/addresses/:id  # Delete address
```

### Events (Real-time)

```
GET    /api/v1/events/poll          # Poll for inventory updates
```

### Device Registration (Push Notifications)

```
POST   /api/v1/devices/register     # Register Expo push token
```

## 🔐 Authentication

All authenticated endpoints require `Authorization: Bearer <token>` header.

**Token Lifecycle**:

- Access tokens: 15 minutes expiry
- Refresh tokens: 7 days expiry
- Use `/auth/refresh` endpoint to get new access token

**Example**:

```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@dukaansync.com",
    "password": "Admin@123"
  }'

# Use token
curl http://localhost:3000/api/v1/products \
  -H "Authorization: Bearer <your-access-token>"
```

## 🔒 Security Features

- **JWT Authentication**: RS256 signing algorithm
- **Password Hashing**: bcrypt with 12 rounds
- **MFA**: OTP-based email verification
- **Rate Limiting**:
  - 100 requests/min for authenticated users
  - 10 requests/min for public endpoints
  - 5 requests/min for login endpoint
- **CORS**: Configured whitelist of allowed origins
- **Helmet.js**: Security headers (CSP, HSTS, X-Frame-Options)
- **SQL Injection**: Protected via Prisma ORM
- **XSS**: Input validation with express-validator

## 🗄️ Database Schema

**Key Models**:

- User (OWNER, ADMIN, STAFF roles)
- Customer
- Product (name, SKU, price, category, unit)
- Shop (2 shops configured)
- Stock (productId + shopId composite key)
- Order & OrderItem
- Payment (Razorpay integration)
- Supplier & SupplierProduct
- Alert (low-stock notifications)
- AuditLog (immutable audit trail)
- DeliveryAddress

See [prisma/schema.prisma](./prisma/schema.prisma) for full schema.

## 📊 Background Jobs

**Low-Stock Alert Checker** (`src/jobs/checkLowStock.js`):

- Runs every 30 seconds
- Checks stock levels against reorder thresholds
- Creates alerts and sends email/push notifications
- Deduplicates alerts within 24-hour window

Start job:

```bash
npm run jobs:alerts
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- inventory.test.js

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage
```

## 🚀 Production Deployment

### Environment Variables

Set production environment variables:

```bash
DATABASE_URL=<production-postgres-url>
REDIS_URL=<production-redis-url>
NODE_ENV=production
ALLOWED_ORIGINS=https://admin.dukaansync.com,https://shop.dukaansync.com
```

### Database Migration

```bash
npx prisma migrate deploy
```

### Start Production Server

```bash
npm start
```

### Health Check

```bash
curl https://api.dukaansync.com/health
```

## 📈 Performance

- API Response Time: p95 < 300ms
- Database Queries: Optimized with indexes on frequently queried columns
- Redis Caching: 5-minute TTL for product catalog
- Connection Pooling: Prisma connection pool (default 10 connections)

## 🐛 Debugging

Enable debug logging:

```bash
DEBUG=* npm run dev
```

View Prisma queries:

```bash
npx prisma studio
```

## 📄 License

MIT
