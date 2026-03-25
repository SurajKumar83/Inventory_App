# Research: DukaanSync Platform

**Feature**: DukaanSync multi-shop inventory and e-commerce platform
**Branch**: 001-dukaansync-platform
**Date**: 2026-03-25

## Purpose

This document consolidates technology choices, best practices, and integration patterns for the DukaanSync platform. All decisions align with constitutional principles (multi-location integrity, real-time sync, mobile-first, security, alerting, API-first).

## Technology Stack Decisions

### Decision: React 18 + Vite for Admin Web Dashboard

**Rationale**:

- React 18 provides concurrent rendering for improved perceived performance
- Vite offers near-instant hot module replacement (HMR) for rapid development
- Tailwind CSS enables rapid UI prototyping with utility-first approach
- Mature ecosystem with extensive third-party components and libraries

**Alternatives Considered**:

- **Next.js**: Rejected due to added complexity of SSR for admin dashboard that doesn't need SEO
- **Angular**: Rejected due to steeper learning curve and heavier bundle size
- **Vue.js**: Rejected due to smaller ecosystem for enterprise-grade component libraries

**Best Practices**:

- Use Vite's code splitting to lazy-load dashboard sections (Inventory, Orders, Alerts, Suppliers)
- Implement React.lazy() for route-based code splitting
- Use Tailwind CDN during development for zero-config start, switch to build-time purging for production
- Zustand for lightweight state management instead of Redux to avoid boilerplate

**Integration Patterns**:

- Axios interceptors for automatic JWT token attachment and refresh
- Custom hook `useRealTimeSync()` to poll `/api/v1/events` every 2 seconds for inventory updates
- Error boundaries around each page to prevent full app crashes

### Decision: React Native + Expo SDK 51 for Mobile App

**Rationale**:

- Expo simplifies React Native development with managed workflow (no native code initially)
- Over-the-air (OTA) updates allow quick bug fixes without app store approval
- Expo Router provides file-based routing similar to Next.js, reducing boilerplate
- Expo Push Notifications built-in for low-stock alerts
- AsyncStorage for offline operation queue (aligns with offline-first principle)

**Alternatives Considered**:

- **Native Android (Kotlin)**: Rejected due to higher development time and inability to share code with web
- **Flutter**: Rejected due to lack of web code sharing and different language (Dart)
- **Bare React Native**: Rejected to avoid native module complexity in v1; can eject from Expo later if needed

**Best Practices**:

- Use Expo SDK built-in modules (Camera, Notifications, SecureStore) instead of third-party npm packages
- Implement offline-first architecture: queue operations in AsyncStorage, sync on connectivity restore
- Use Expo's `NetInfo` to detect connectivity changes and trigger sync
- Follow React Native Performance best practices: FlatList for long product lists, memoization for product cards

**Integration Patterns**:

- Shared API client with admin web (same Axios instance, endpoints, auth logic)
- Expo SecureStore for JWT token persistence (more secure than AsyncStorage)
- Expo Notifications for push alerts; register device token with backend on app launch
- Use Expo's `expo-updates` for OTA deployment of JS bundle changes

### Decision: Node.js 20 + Express + Prisma + PostgreSQL for Backend

**Rationale**:

- Node.js 20 LTS provides long-term stability and native fetch API
- Express is battle-tested, minimal, and well-documented for REST APIs
- Prisma ORM provides type-safe database queries, automatic migrations, and excellent DX
- PostgreSQL offers ACID transactions (critical for multi-location inventory integrity)
- PostgreSQL row-level locking ensures atomic stock updates under concurrent load

**Alternatives Considered**:

- **NestJS**: Rejected due to added complexity of decorators and dependency injection for small API surface
- **Fastify**: Rejected despite better performance; Express has larger ecosystem and more developers know it
- **MongoDB**: Rejected due to lack of ACID transactions for multi-document updates (inventory + audit log)
- **MySQL**: Rejected in favor of PostgreSQL for better JSON support and advanced indexing

**Best Practices**:

- Use Prisma transactions for all stock mutations: `prisma.$transaction([updateStock, createAudit])`
- Implement database indexes on `shopId`, `productId`, `quantity` columns for fast queries
- Use Prisma middleware to auto-populate `createdAt`, `updatedAt` timestamps
- Separate service layer from route handlers for testability: routes call services, services call Prisma
- Use `bcrypt` with salt rounds = 12 for password hashing (OWASP recommendation)
- Use `jsonwebtoken` with RS256 (asymmetric) for JWT signing to enable token verification without shared secret

**Integration Patterns**:

- Express middleware chain: rate limiter → CORS → body parser → auth → validation → route handler
- Prisma client singleton pattern: single instance shared across app
- Use `express-validator` for request validation middleware
- Use `express-rate-limit` with Redis store for distributed rate limiting across Railway instances

### Decision: Redis 7 for Caching and Real-Time Alerts

**Rationale**:

- Redis pub/sub enables real-time inventory change notifications to connected clients
- Redis TTL-based caching for frequently accessed product catalog reduces PostgreSQL load
- Redis queues (Bull/BullMQ) for alert delivery jobs (email, push notifications)
- Redis session store for distributed session management if scaling to multiple Railway instances

**Alternatives Considered**:

- **In-memory cache (node-cache)**: Rejected due to inability to share cache across multiple instances
- **Memcached**: Rejected in favor of Redis due to richer data structures (pub/sub, sorted sets)
- **Server-Sent Events (SSE)**: Considered for real-time sync but rejected to avoid maintaining persistent connections; polling is simpler for v1

**Best Practices**:

- Use Redis keyspace notifications to listen for stock cache invalidation
- Cache product catalog with 5-minute TTL; invalidate on product CRUD operations
- Use Redis sorted sets for alert queue sorted by timestamp (process oldest first)
- Implement exponential backoff for failed alert delivery (retry after 1min, 5min, 15min)

**Integration Patterns**:

- Publish inventory change events to `inventory:updates` channel on stock mutation
- Subscribe to `inventory:updates` in admin web/mobile via polling endpoint `/api/v1/events/poll`
- Use `ioredis` library for Redis client (supports clustering and promises)

### Decision: Railway for Backend Deployment

**Rationale**:

- Railway provides managed PostgreSQL and Redis in same project (no separate providers)
- Git-based deployments trigger automatic builds and zero-downtime rollouts
- Environment variable management with secrets
- Free tier sufficient for initial development; scales with usage-based pricing

**Alternatives Considered**:

- **Heroku**: Rejected due to end of free tier and higher pricing
- **AWS EC2 + RDS**: Rejected due to complexity of managing infrastructure (VPCs, security groups)
- **Render**: Considered but rejected in favor of Railway for better DX and faster cold starts

**Best Practices**:

- Use Railway's environment variable groups for different deployment stages (dev, staging, prod)
- Enable auto-deploy from `main` branch for continuous deployment
- Configure health check endpoint `/health` for Railway's load balancer
- Use Railway's metrics dashboard to monitor memory/CPU usage

### Decision: Vercel for Admin Web and Storefront Deployment

**Rationale**:

- Vercel optimized for Vite apps with automatic build detection
- Edge network CDN for fast global content delivery
- Free tier supports multiple projects (admin + storefront as separate deployments)
- Automatic HTTPS and custom domain support (admin.dukaansync.com, shop.dukaansync.com)

**Alternatives Considered**:

- **Netlify**: Similar to Vercel; rejected due to slightly slower build times in testing
- **GitHub Pages**: Rejected due to lack of support for client-side routing without workarounds
- **Self-hosted on Railway**: Rejected to separate static frontend from API; CDN provides better performance

**Best Practices**:

- Use Vercel's environment variables for API URL (`VITE_API_URL`) per deployment environment
- Configure `vercel.json` with SPA fallback: rewrites all routes to `/index.html` for React Router
- Enable Vercel analytics to track dashboard performance

## Infrastructure and Deployment Patterns

### Pattern: Monorepo with npm Workspaces

**Rationale**:

- Share `api-client` package across admin-web, mobile, and storefront
- Share TypeScript types for API responses across frontends
- Simplifies dependency management and ensures version consistency
- Single CI/CD pipeline can build and test all apps

**Implementation**:

- Root `package.json` defines workspaces: `["backend", "admin-web", "mobile", "storefront", "shared/*"]`
- Shared packages in `shared/api-client` and `shared/types`
- Each app has own `package.json` with app-specific dependencies
- Use `npm install` at root to install all dependencies

### Pattern: Hardcoded Shop Configuration

**Rationale**:

- System has exactly 2 shops (Shop 1, Shop 2) with no immediate plans for more locations
- Hardcoding avoids premature database normalization and admin UI for shop CRUD
- Simple `shops.js` config module exports shop metadata: `[{ id: 'shop1', name: 'Shop 1 - Main Street', address: '...' }, ...]`
- Frontend dynamically renders dashboard cards based on shop array

**Implementation**:

```javascript
// backend/src/config/shops.js
export const SHOPS = [
  {
    id: "shop1",
    name: "Shop 1 - Main Street",
    address: "123 Main Street, City",
    phone: "+91-9876543210",
  },
  {
    id: "shop2",
    name: "Shop 2 - Market Road",
    address: "456 Market Road, City",
    phone: "+91-9876543211",
  },
];
```

**Migration Path**: When scaling to 3+ shops, migrate hardcoded array to `Shop` database table with admin UI for shop management.

### Pattern: Offline-First Mobile Operations

**Rationale**:

- Shop owner may have poor connectivity in warehouse/storage areas
- Constitution requires offline mode for mobile app
- Queue stock adjustments locally, sync when connectivity restores

**Implementation**:

- Use `@react-native-async-storage/async-storage` to persist operation queue
- Each queued operation has: `{ id, type, payload, timestamp, retryCount }`
- On app launch and connectivity restore (via `@react-native-community/netinfo`), process queue:
  1. Sort operations by timestamp (oldest first)
  2. POST each operation to API
  3. Remove from queue on success; increment retryCount on failure (max 3 retries)
  4. Show offline indicator badge with queue count
- Use optimistic UI updates: apply change locally immediately, rollback on sync failure

### Pattern: Background Alert Checker Job

**Rationale**:

- Low-stock alerts must trigger within 60 seconds of stock falling below threshold
- Database polling every 30 seconds ensures timely detection without complex event listeners

**Implementation**:

- Use `node-cron` to run alert check every 30 seconds
- Alert checker service:
  1. Query: `SELECT * FROM Stock WHERE quantity <= reorderLevel AND quantity > 0`
  2. For each low-stock item, check if alert already sent (query `Alert` table)
  3. If no recent alert, create `Alert` record and enqueue jobs: email, push notification
- Use `bull` library with Redis queue for alert delivery jobs (retries, rate limiting)

### Pattern: JWT with Refresh Tokens

**Rationale**:

- Access tokens expire after 15 minutes (short-lived reduces risk if leaked)
- Refresh tokens expire after 7 days (aligns with constitution session timeout)
- Mobile app stores refresh token in Expo SecureStore; web stores in httpOnly cookie (more secure than localStorage)

**Implementation**:

- Login response: `{ accessToken: 'jwt...', refreshToken: 'jwt...', expiresIn: 900 }`
- Access token payload: `{ userId, role, exp: Date.now() + 15min }`
- Refresh token payload: `{ userId, tokenVersion, exp: Date.now() + 7days }`
- API route `/api/v1/auth/refresh` accepts refresh token, verifies, issues new access token
- Increment `tokenVersion` in User table on password change to invalidate all refresh tokens

## Security and Compliance

### Multi-Factor Authentication (MFA) via Email OTP

**Rationale**:

- Constitution requires MFA for owner account
- Email OTP is simpler than TOTP (Google Authenticator) for non-technical users
- No third-party MFA service needed (lower cost)

**Implementation**:

- On login with valid username/password, generate 6-digit OTP: `Math.floor(100000 + Math.random() * 900000)`
- Store OTP hash in Redis with 5-minute expiration: `SET mfa:${userId} ${hash} EX 300`
- Send OTP via email (nodemailer)
- User submits OTP on second screen; API verifies OTP hash
- Rate limit OTP verification to 5 attempts per 15 minutes per user

### Rate Limiting Strategy

**Rationale**:

- Constitution requires rate limiting: 100 req/min authenticated, 10 req/min unauthenticated
- Prevents brute-force attacks on login and API abuse

**Implementation**:

- Use `express-rate-limit` with Redis store (shared across Railway instances)
- Two rate limiter middlewares:
  - `authRateLimiter`: 100 requests per minute per authenticated user (based on JWT `userId`)
  - `publicRateLimiter`: 10 requests per minute per IP address (unauthenticated routes)
- Apply `authRateLimiter` to all `/api/v1/*` routes after auth middleware
- Apply `publicRateLimiter` to `/api/v1/auth/login`, `/api/v1/auth/register`, storefront routes

### Audit Logging Requirements

**Rationale**:

- Constitution requires immutable audit logs retained for 2 years
- Every inventory transaction must log: who, what, when, which shop

**Implementation**:

- Prisma `AuditLog` model with fields: `id, userId, action, resourceType, resourceId, shopId, changes (JSON), timestamp`
- Prisma middleware intercepts all Stock updates: `prisma.$use(async (params, next) => { ... })`
- Middleware creates AuditLog entry in same transaction as Stock update (atomic)
- Database constraint: `AuditLog` table has no UPDATE or DELETE permissions (append-only)
- Background job archives audit logs older than 2 years to cold storage (S3)

## Testing Strategy

### Unit Testing (Backend Services)

**Tools**: Jest, supertest
**Coverage Target**: ≥80% for service layer

**Key Test Cases**:

- `inventory.service.test.js`: Test stock adjustment edge cases (negative quantity, invalid shopId, concurrent updates)
- `alert.service.test.js`: Test alert triggering logic (threshold breach, duplicate alert prevention)
- `auth.service.test.js`: Test password hashing, JWT generation, MFA OTP verification

### Integration Testing (API Endpoints)

**Tools**: Jest, supertest, @testcontainers/postgresql (isolated test database)

**Key Test Cases**:

- `inventory.test.js`: Multi-location atomic transaction test:
  1. Create product with stock at Shop 1 and Shop 2
  2. Simultaneously update stock at both shops (concurrent requests)
  3. Verify final stock counts are correct (no lost updates)
- `alerts.test.js`: Alert delivery within 60 seconds:
  1. Set reorder level to 10
  2. Deplete stock to 9
  3. Wait up to 60 seconds polling `/api/v1/alerts`
  4. Verify alert appears with correct shop and product

### End-to-End Testing (Frontend)

**Tools**: Playwright (web), Detox (mobile)

**Key Test Cases**:

- **Web (Playwright)**: 3-tap inventory adjustment
  1. Login to dashboard
  2. Click product card → tap "Adjust" → enter quantity → tap "Save"
  3. Verify success message appears within 2 seconds
- **Mobile (Detox)**: Offline queue and sync
  1. Enable airplane mode
  2. Adjust stock for product
  3. Verify "Offline - 1 pending" indicator
  4. Disable airplane mode
  5. Verify "Syncing..." indicator then success
  6. Verify stock updated on server

### Load Testing

**Tools**: k6 or Artillery

**Key Test Cases**:

- Simulate 1000 concurrent users browsing storefront (mix of product list, search, add to cart)
- Target: p95 response time < 300ms, p99 < 1000ms
- Monitor PostgreSQL connection pool utilization and Redis memory usage

## Risks and Mitigations

### Risk: Redis Single Point of Failure

**Mitigation**:

- Railway Redis includes automatic backups
- If Redis down, app falls back to database queries (slower but functional)
- Alert queue persists in PostgreSQL fallback table if Redis unavailable

### Risk: Payment Gateway Timeout

**Mitigation**:

- Implement webhook handler for async payment confirmation (Razorpay/Stripe webhooks)
- If payment gateway times out, show "Processing..." message to customer
- Webhook updates order status once payment confirmed server-side
- Idempotency key on order creation prevents duplicate orders on retry

### Risk: Expo OTA Update Breaks App

**Mitigation**:

- Test OTA updates on staging channel before releasing to production
- Expo updates include automatic rollback if app crashes on launch post-update
- Keep previous 3 OTA releases available for manual rollback

### Risk: Concurrent Stock Updates Causing Overselling

**Mitigation**:

- PostgreSQL row-level locking with `FOR UPDATE` in Prisma transactions
- Optimistic concurrency control: check `updatedAt` timestamp before update, retry if changed
- Integration test specifically validates no overselling under concurrent load

## Next Steps (Phase 1)

With research complete, proceed to Phase 1 design artifacts:

1. **data-model.md**: Define Prisma schema for Product, Stock, Shop, Order, Customer, Supplier, Alert, AuditLog, User entities
2. **contracts/api-rest.md**: Document REST API endpoint contracts with request/response shapes
3. **quickstart.md**: Developer onboarding guide with setup instructions for backend, admin-web, mobile, storefront

**Post-Design Gate**: Re-evaluate Constitution Check after Phase 1 to ensure data model and API contracts satisfy all 6 principles.
