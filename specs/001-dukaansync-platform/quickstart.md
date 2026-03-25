# Quickstart Guide: DukaanSync Platform

**Feature**: DukaanSync multi-shop inventory and e-commerce platform
**Branch**: 001-dukaansync-platform
**Date**: 2026-03-25

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** 20 LTS or higher ([download](https://nodejs.org/))
- **npm** 10+ or **yarn** 1.22+ (comes with Node.js)
- **PostgreSQL** 16+ ([download](https://www.postgresql.org/download/)) or use Railway/Supabase managed instance
- **Redis** 7+ ([download](https://redis.io/download/)) or use Railway/Upstash managed instance
- **Git** for version control
- **Android Studio** (for mobile development) or **Expo Go app** on physical Android device

**Optional**:

- **VS Code** with recommended extensions: Prisma, ESLint, Prettier, Tailwind CSS IntelliSense
- **Postman** or **Insomnia** for API testing

---

## Repository Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/dukaansync-platform.git
cd dukaansync-platform
git checkout 001-dukaansync-platform
```

### 2. Install Dependencies (Monorepo)

This is a monorepo using npm workspaces. Install all dependencies from the root:

```bash
npm install
```

This will install dependencies for:

- `backend/`
- `admin-web/`
- `mobile/`
- `storefront/`
- `shared/api-client/`

---

## Backend Setup

### 1. Create PostgreSQL Database

**Option A: Local PostgreSQL**

```bash
# Create database
createdb dukaansync_dev

# Verify connection
psql -d dukaansync_dev -c "SELECT version();"
```

**Option B: Railway (Recommended for Development)**

1. Go to [railway.app](https://railway.app) and create account
2. Create new project → Add PostgreSQL database
3. Copy `DATABASE_URL` from environment variables

### 2. Create Redis Instance

**Option A: Local Redis**

```bash
# Start Redis server
redis-server

# Verify connection
redis-cli ping  # Should return PONG
```

**Option B: Railway**

1. In same Railway project → Add Redis database
2. Copy `REDIS_URL` from environment variables

### 3. Configure Environment Variables

Create `backend/.env` file:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dukaansync_dev?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_ACCESS_SECRET="your-access-token-secret-here"
JWT_REFRESH_SECRET="your-refresh-token-secret-here"

# MFA
MFA_ISSUER="DukaanSync"

# Email (for MFA OTP and order confirmations)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="DukaanSync <noreply@dukaansync.com>"

# Payment Gateway (Razorpay - get from https://razorpay.com/docs/)
RAZORPAY_KEY_ID="rzp_test_xxxxx"
RAZORPAY_KEY_SECRET="xxxxx"
RAZORPAY_WEBHOOK_SECRET="whsec_xxxxx"

# App URLs
ADMIN_WEB_URL="http://localhost:5173"
STOREFRONT_URL="http://localhost:5174"

# Environment
NODE_ENV="development"
PORT=3000
```

**⚠️ Important**: Never commit `.env` to version control. Use `.env.example` as template.

### 4. Run Database Migrations

Initialize Prisma and run migrations:

```bash
cd backend

# Generate Prisma Client
npx prisma generate

# Run migrations to create tables
npx prisma migrate dev --name init

# Seed database with initial data (shops, sample owner account)
npx prisma db seed
```

**Expected Output**:

```
✔ Generated Prisma Client
✔ Database synchronized
✔ Seeded 2 shops, 1 owner, 5 sample products
```

### 5. Start Backend Development Server

```bash
cd backend
npm run dev
```

**Expected Output**:

```
[INFO] Server running on http://localhost:3000
[INFO] PostgreSQL connected
[INFO] Redis connected
[INFO] Alert checker job scheduled (every 30s)
```

### 6. Verify Backend Health

Open browser or curl:

```bash
curl http://localhost:3000/health
```

**Expected Response**:

```json
{
  "status": "ok",
  "timestamp": "2026-03-25T12:00:00Z",
  "database": "connected",
  "redis": "connected"
}
```

---

## Admin Web Dashboard Setup

### 1. Configure Environment Variables

Create `admin-web/.env` file:

```bash
VITE_API_URL="http://localhost:3000/api/v1"
VITE_APP_NAME="DukaanSync Admin"
```

### 2. Start Development Server

```bash
cd admin-web
npm run dev
```

**Expected Output**:

```
VITE v5.x.x ready in 245 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 3. Access Dashboard

1. Open browser: `http://localhost:5173`
2. Login with seeded owner account:
   - **Email**: `owner@dukaansync.com`
   - **Password**: `Owner123!` (change this in seed script)
3. If MFA enabled, check email for OTP

**Expected UI**:

- White background with green accent colors
- Large heading: "Manage Your Two Shops"
- Sidebar navigation: Inventory, Orders, Alerts, Suppliers,Reports
- Dashboard cards showing metrics (total products, low stock, today's sales, pending orders)

---

## Mobile App Setup (React Native + Expo)

### 1. Install Expo CLI

```bash
npm install -g expo-cli
# or use npx: npx expo start
```

### 2. Configure Environment Variables

Create `mobile/.env` file:

```bash
API_URL="http://localhost:3000/api/v1"
# For physical device testing, use your computer's IP:
# API_URL="http://192.168.1.100:3000/api/v1"
```

### 3. Start Expo Development Server

```bash
cd mobile
npx expo start
```

**Expected Output**:

```
Starting Metro Bundler
› Metro waiting on exp://192.168.1.100:8081
› Scan the QR code above with Expo Go (Android)
```

### 4. Run on Device or Emulator

**Option A: Physical Android Device (Recommended)**

1. Install **Expo Go** app from Play Store
2. Scan QR code from terminal
3. App loads on device

**Option B: Android Emulator**

1. Open Android Studio → AVD Manager → Start emulator
2. Press `a` in terminal to launch on Android emulator

### 5. Login to Mobile App

Use same credentials as web dashboard:

- **Email**: `owner@dukaansync.com`
- **Password**: `Owner123!`

**Expected UI**:

- Bottom tab navigation: Dashboard, Inventory, Alerts, Suppliers
- Touch-optimized product cards with stock counts for Shop 1 and Shop 2
- Offline indicator badge (if network disconnected)

---

## Customer Storefront Setup

### 1. Configure Environment Variables

Create `storefront/.env` file:

```bash
VITE_API_URL="http://localhost:3000/api/v1"
VITE_RAZORPAY_KEY_ID="rzp_test_xxxxx"
```

### 2. Start Development Server

```bash
cd storefront
npm run dev
```

**Expected Output**:

```
VITE v5.x.x ready in 198 ms

➜  Local:   http://localhost:5174/
➜  Network: use --host to expose
```

### 3. Access Storefront

1. Open browser: `http://localhost:5174`
2. Browse products by category
3. Add to cart and checkout
4. Create customer account or guest checkout

**Expected UI**:

- Product grid with category filters
- Search bar for product search
- Shopping cart icon with item count
- Checkout flow with delivery address and payment (Razorpay test mode)

---

## Database Management

### View Database with Prisma Studio

Prisma Studio provides a visual interface for database:

```bash
cd backend
npx prisma studio
```

Opens browser at `http://localhost:5555` with:

- All database tables (User, Product, Stock, Order, etc.)
- Create, read, update, delete (CRUD) operations
- Relationship visualization

### Run Migrations

When making schema changes:

```bash
cd backend

# Edit prisma/schema.prisma

# Create migration
npx prisma migrate dev --name add_new_field

# Generate updated Prisma Client
npx prisma generate
```

### Reset Database (Development Only)

```bash
cd backend
npx prisma migrate reset  # ⚠️ Deletes all data!
npx prisma db seed        # Re-seed with initial data
```

---

## Testing

### Backend API Tests

```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- inventory.test.js
```

**Test Structure**:

- `tests/unit/`: Service layer tests (business logic)
- `tests/integration/`: API endpoint tests with test database
- `tests/contract/`: API contract validation tests

### Frontend Tests

```bash
cd admin-web
npm test  # Vitest unit tests

cd storefront
npm test
```

### Mobile E2E Tests (Detox)

```bash
cd mobile

# Build app for testing
npx detox build --configuration android.emu.debug

# Run E2E tests on emulator
npx detox test --configuration android.emu.debug
```

---

## Development Workflow

### Monorepo Commands (from root)

```bash
# Install dependencies for all workspaces
npm install

# Run backend dev server
npm run dev:backend

# Run admin web dev server
npm run dev:admin

# Run storefront dev server
npm run dev:storefront

# Run mobile dev server
npm run dev:mobile

# Run all frontends + backend concurrently
npm run dev:all  # (requires concurrently package)
```

### Linting and Formatting

```bash
# Lint all JavaScript/TypeScript files
npm run lint

# Fix linting errors
npm run lint:fix

# Format code with Prettier
npm run format
```

### Git Workflow

```bash
# Create feature branch from 001-dukaansync-platform
git checkout -b feature/add-supplier-management

# Commit changes
git add .
git commit -m "feat: add supplier CRUD endpoints"

# Push and create PR
git push origin feature/add-supplier-management
```

---

## Deployment

### Deploy Backend to Railway

1. Install Railway CLI:

   ```bash
   npm install -g @railway/cli
   ```

2. Login and link project:

   ```bash
   railway login
   railway link
   ```

3. Deploy:

   ```bash
   cd backend
   railway up
   ```

4. Set environment variables in Railway dashboard:
   - `DATABASE_URL` (auto-configured if using Railway PostgreSQL)
   - `REDIS_URL` (auto-configured if using Railway Redis)
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (generate new for production)
   - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` (production keys)
   - `SMTP_*` (production email service)

5. Run migrations:
   ```bash
   railway run npx prisma migrate deploy
   ```

**Production URL**: `https://dukaansync-backend.up.railway.app`

### Deploy Admin Web to Vercel

1. Install Vercel CLI:

   ```bash
   npm install -g vercel
   ```

2. Deploy:

   ```bash
   cd admin-web
   vercel
   ```

3. Set environment variables in Vercel dashboard:
   - `VITE_API_URL`: `https://dukaansync-backend.up.railway.app/api/v1`

4. Configure custom domain (optional):
   - `admin.dukaansync.com`

**Production URL**: `https://admin.dukaansync.com`

### Deploy Storefront to Vercel

```bash
cd storefront
vercel
```

Set environment variables:

- `VITE_API_URL`: `https://dukaansync-backend.up.railway.app/api/v1`
- `VITE_RAZORPAY_KEY_ID`: Production Razorpay key

**Production URL**: `https://shop.dukaansync.com`

### Deploy Mobile App (Expo)

For development/testing:

```bash
cd mobile
eas build --platform android --profile development
```

For production:

```bash
cd mobile

# Configure EAS
eas configure

# Build APK/AAB
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android
```

---

## Troubleshooting

### Backend Won't Start

**Error**: `Error: P1001: Can't reach database server`

**Fix**:

1. Verify PostgreSQL is running: `pg_isready`
2. Check `DATABASE_URL` in `.env` file
3. Test connection: `psql $DATABASE_URL -c "SELECT 1"`

**Error**: `Error: Redis connection refused`

**Fix**:

1. Verify Redis is running: `redis-cli ping`
2. Check `REDIS_URL` in `.env` file

### Prisma Migration Fails

**Error**: `Migration failed: Table 'User' already exists`

**Fix**:

```bash
# Reset database (⚠️ deletes data)
npx prisma migrate reset

# Or manually drop tables
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Re-run migrations
npx prisma migrate dev
```

### Mobile App Can't Connect to API

**Error**: Network request failed

**Fix**:

1. Ensure backend is running: `curl http://localhost:3000/health`
2. Use computer's IP instead of `localhost` in `mobile/.env`:
   ```bash
   # Find IP: ipconfig (Windows) or ifconfig (Mac/Linux)
   API_URL="http://192.168.1.100:3000/api/v1"
   ```
3. Restart Expo: `npx expo start -c`

### Admin Web Shows CORS Error

**Error**: `Access to fetch at... blocked by CORS policy`

**Fix**:

1. Check `backend/src/api/app.js` CORS configuration:
   ```javascript
   app.use(
     cors({
       origin: ["http://localhost:5173", "http://localhost:5174"],
       credentials: true,
     }),
   );
   ```
2. Restart backend server

### Tailwind Styles Not Loading

**Fix**:

1. For development, ensure Tailwind CDN script in `index.html`:
   ```html
   <script src="https://cdn.tailwindcss.com"></script>
   ```
2. For production, build Tailwind CSS:
   ```bash
   npm run build
   ```

---

## Useful Commands Cheat Sheet

| Command                  | Description                                 |
| ------------------------ | ------------------------------------------- |
| `npm install`            | Install all workspace dependencies          |
| `npm run dev:backend`    | Start backend API server                    |
| `npm run dev:admin`      | Start admin web dashboard                   |
| `npm run dev:storefront` | Start customer storefront                   |
| `npx expo start`         | Start mobile app (from `mobile/` directory) |
| `npx prisma studio`      | Open Prisma Studio database GUI             |
| `npx prisma migrate dev` | Run database migrations                     |
| `npx prisma db seed`     | Seed database with initial data             |
| `npm test`               | Run tests                                   |
| `npm run lint`           | Lint code                                   |
| `npm run format`         | Format code with Prettier                   |
| `railway up`             | Deploy backend to Railway                   |
| `vercel`                 | Deploy frontend to Vercel                   |
| `eas build`              | Build mobile app with EAS                   |

---

## Next Steps

1. ✅ **Backend Running**: Verify `/health` endpoint returns 200 OK
2. ✅ **Database Migrated**: Run `npx prisma studio` to view tables
3. ✅ **Admin Web Accessible**: Login at `http://localhost:5173`
4. ✅ **Mobile App Running**: Test on Expo Go app
5. ✅ **Storefront Accessible**: Browse products at `http://localhost:5174`

6. **Create Sample Data**:
   - Add more products via admin dashboard
   - Set reorder levels for products
   - Test low-stock alert triggering

7. **Test Core Workflows**:
   - Stock adjustment (add/remove/transfer)
   - Place order from storefront
   - View low-stock alerts
   - Contact supplier via WhatsApp link

8. **Review Documentation**:
   - [data-model.md](data-model.md): Database schema
   - [contracts/api-rest.md](contracts/api-rest.md): API endpoints
   - [research.md](research.md): Technology decisions

**Ready to implement!** Proceed to `/speckit.tasks` to generate actionable task list.

---

## Support

- **Documentation**: See `docs/` directory for detailed guides
- **API Reference**: [contracts/api-rest.md](contracts/api-rest.md)
- **Database Schema**: [data-model.md](data-model.md)
- **Architecture Decisions**: [research.md](research.md)
- **Constitution**: `.specify/memory/constitution.md` (non-negotiable principles)
