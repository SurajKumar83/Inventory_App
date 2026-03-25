# DukaanSync Platform

Full-stack two-shop grocery inventory management system with online storefront.

## 🎯 Features

- ✅ Multi-location inventory tracking (Shop 1 & Shop 2)
- ✅ Real-time stock synchronization
- ✅ Low-stock alerts via email & push notifications
- ✅ Admin dashboard (web + mobile)
- ✅ Customer storefront with online ordering
- ✅ Secure authentication with MFA
- ✅ Role-based access control (RBAC)
- ✅ Audit logging for all inventory changes

## 🏗️ Architecture

**Monorepo Structure:**

- `backend/` - Node.js + Express + Prisma API
- `admin-web/` - React + Vite admin dashboard
- `storefront/` - React + Vite customer storefront
- `mobile/` - React Native + Expo inventory app
- `shared/` - Shared API client and types

**Tech Stack:**

- **Backend**: Node.js 20, Express 4, Prisma ORM, PostgreSQL 16, Redis 7
- **Frontend**: React 18, Vite, Tailwind CSS, Zustand
- **Mobile**: React Native, Expo SDK 51, Expo Router
- **Auth**: JWT with refresh tokens, bcrypt, OTP-based MFA
- **Deployment**: Railway (backend), Vercel (frontends)

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ and npm 10+
- PostgreSQL 16+
- Redis 7+
- Expo CLI (for mobile development)

### 1. Install Dependencies

```bash
# Install all workspace dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install admin-web dependencies
cd admin-web && npm install

# Install mobile dependencies
cd mobile && npm install

# Install storefront dependencies
cd storefront && npm install
```

### 2. Configure Environment Variables

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your database and Redis URLs

# Admin Web
cp admin-web/.env.example admin-web/.env

# Mobile
cp mobile/.env.example mobile/.env

# Storefront
cp storefront/.env.example storefront/.env
```

### 3. Setup Database

```bash
cd backend

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database with sample data
npm run prisma:seed
```

**Default Accounts:**

- **Owner**: owner@dukaansync.com / Password123!
- **Customer**: customer@example.com / customer123

### 4. Start Development Servers

```bash
# From root directory, open 4 terminals:

# Terminal 1: Backend API
npm run dev:backend
# → http://localhost:3000

# Terminal 2: Admin Dashboard
npm run dev:admin
# → http://localhost:5173

# Terminal 3: Customer Storefront
npm run dev:storefront
# → http://localhost:5174

# Terminal 4: Mobile App
npm run dev:mobile
# Scan QR code with Expo Go app
```

## 📚 API Documentation

### Health Check

```bash
curl http://localhost:3000/health
```

### Authentication

**Register:**

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "firstName": "Test",
    "lastName": "User",
    "phone": "+919876543210"
  }'
```

**Login:**

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@dukaansync.com",
    "password": "Password123!"
  }'
```

## 📂 Project Structure

```
inventory-management/
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   └── v1/
│   │   │   │       └── auth.routes.js
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.js
│   │   │   │   ├── rateLimiter.middleware.js
│   │   │   │   └── validation.middleware.js
│   │   │   └── app.js
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   ├── redis.js
│   │   │   └── shops.js
│   │   ├── services/
│   │   │   ├── auth.service.js
│   │   │   └── email.service.js
│   │   └── server.js
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   └── package.json
├── admin-web/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── mobile/
│   ├── app/
│   │   └── index.jsx
│   ├── components/
│   ├── services/
│   └── package.json
├── storefront/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── shared/
│   ├── api-client/
│   │   ├── index.js
│   │   └── endpoints.js
│   └── types/
│       └── index.js
└── package.json
```

## 🗄️ Database Schema

**Key Entities:**

- User (admin accounts with MFA)
- Product (grocery items)
- Shop (Shop 1 & Shop 2)
- Stock (per-shop inventory)
- Customer
- Order & OrderItem
- Payment
- Supplier & SupplierProduct
- Alert (low-stock notifications)
- AuditLog (immutable audit trail)
- DeliveryAddress

## 🔐 Security Features

- JWT access tokens (15min expiry)
- Refresh tokens (7 day expiry)
- Password hashing with bcrypt (12 rounds)
- OTP-based MFA via email
- Rate limiting (100 req/min authenticated, 10 req/min public)
- Role-based access control (RBAC)
- Audit logging for all inventory changes

## 📋 Implementation Status

**Phase 1: Setup** ✅ Complete

- [x] Project structure
- [x] Package configuration
- [x] ESLint & Prettier
- [x] Tailwind CSS
- [x] Git hooks

**Phase 2: Foundational** ✅ Complete

- [x] Database schema (Prisma)
- [x] PostgreSQL & Redis configuration
- [x] Authentication & JWT
- [x] Email service (Nodemailer)
- [x] API infrastructure
- [x] Shared API client

**Phase 3: User Story 1 - Inventory Management** 🚧 Pending

- [ ] Product CRUD
- [ ] Stock adjustment & transfer
- [ ] Admin UI components
- [ ] Mobile inventory app

**Phase 4: User Story 2 - Alerts & Suppliers** 🚧 Pending

- [ ] Low-stock alert system
- [ ] Push notifications
- [ ] Supplier management
- [ ] WhatsApp/SMS integration

**Phase 5: User Story 3 - Customer Storefront** 🚧 Pending

- [ ] Product catalog
- [ ] Shopping cart
- [ ] Checkout & payment
- [ ] Order tracking

**Phase 6: User Story 4 - Dashboard UI** 🚧 Pending

- [ ] Dashboard metrics
- [ ] Visual analytics
- [ ] Responsive design

**Phase 7: Polish** 🚧 Pending

- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Documentation
- [ ] Performance optimization

## 🛠️ Development Commands

```bash
# Backend
npm run dev:backend          # Start backend dev server
npm run prisma:migrate       # Run database migrations
npm run prisma:seed          # Seed database
npm run prisma:studio        # Open Prisma Studio

# Admin Web
npm run dev:admin            # Start admin dashboard
npm run build:admin          # Build for production

# Storefront
npm run dev:storefront       # Start storefront
npm run build:storefront     # Build for production

# Mobile
npm run dev:mobile           # Start Expo dev server
npm run android              # Run on Android
npm run ios                  # Run on iOS

# All workspaces
npm run build:all            # Build all projects
npm run test:all             # Run all tests
npm run lint                 # Lint all workspaces
```

## 📖 Documentation

- [Feature Specification](specs/001-dukaansync-platform/spec.md)
- [Implementation Plan](specs/001-dukaansync-platform/plan.md)
- [Data Model](specs/001-dukaansync-platform/data-model.md)
- [API Contracts](specs/001-dukaansync-platform/contracts/api-rest.md)
- [Tasks Breakdown](specs/001-dukaansync-platform/tasks.md)

## 🚢 Deployment

### Backend (Railway)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and link project
railway login
railway link

# Deploy
railway up
```

### Frontend (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy admin dashboard
cd admin-web && vercel --prod

# Deploy storefront
cd storefront && vercel --prod
```

## 📄 License

MIT

## 👥 Team

Built with SpecKit and GitHub Copilot.

---

**Status**: 43 of 182 tasks complete (23.6%) - Foundation ready for user story implementation
# Inventory_App
