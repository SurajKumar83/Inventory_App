# Implementation Plan: DukaanSync Platform

**Branch**: `001-dukaansync-platform` | **Version**: v1.0 | **Date**: 2026-03-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-dukaansync-platform/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

DukaanSync is a two-shop grocery inventory management system with online storefront for mobile and web. Enables solo shop owner to track stock across Shop 1 and Shop 2, receive low-stock alerts, manage suppliers, and sell products online via a mobile app and website from a single dashboard. Technical approach: React + Node.js full-stack with PostgreSQL for persistent storage, Redis for caching and real-time alerts, React Native with Expo for mobile, deployed on Vercel (frontend) and Railway (backend).

## Technical Context

**Language/Version**: JavaScript/TypeScript (Node.js 20 LTS, React 18, React Native with Expo SDK 51)
**Primary Dependencies**:

- **Frontend**: React 18, Vite, Tailwind CSS (CDN for dev), Zustand (state), React Router
- **Mobile**: React Native, Expo SDK 51, Expo Router, shared API client
- **Backend**: Express 4, Prisma ORM, bcrypt, jsonwebtoken, nodemailer
- **Infrastructure**: PostgreSQL 16, Redis 7 (caching + pub/sub for alerts)
  **Storage**: PostgreSQL (primary persistent storage), Redis (stock cache, alert queue, session store)
  **Testing**: Vitest (frontend unit), Jest + Supertest (backend API), Detox (mobile E2E)
  **Target Platform**:
- Web: Modern browsers (Chrome 100+, Safari 15+, Firefox 100+)
- Mobile: Android 10+ (iOS deferred to future version)
- Backend: Railway (Node.js 20 container environment)
  **Project Type**: Full-stack web + mobile application (admin dashboard + customer storefront + mobile inventory app)
  **Performance Goals**:
- API response time: p95 < 300ms, p99 < 1000ms
- Dashboard load to interactive: < 2 seconds
- Mobile app launch to interactive: < 2 seconds on mid-range Android devices
- Real-time sync latency: < 5 seconds for inventory updates across clients
  **Constraints**:
- Offline support for mobile inventory app (queue operations, sync on reconnect)
- Mobile-first design: critical workflows in ≤3 taps
- Budget-conscious infrastructure: single Railway instance, Vercel free tier initially
- No complex microservices: monolithic API with modular service layer
  **Scale/Scope**:
- Users: 1 admin owner + up to 1000 concurrent customers
- Products: ~500-1000 SKUs typical grocery inventory
- Shops: Hardcoded 2 locations (Shop 1, Shop 2) via config module
- Transactions: ~100-500 orders/day, ~50 stock adjustments/day per shop

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### ✅ I. Multi-Location Data Integrity (NON-NEGOTIABLE)

- **Spec Compliance**: FR-001 mandates separate inventory counts for Shop 1 and Shop 2 with atomic updates
- **Design Requirement**: Prisma schema MUST include `shopId` foreign key on Stock table; all stock mutations MUST use database transactions
- **Test Coverage**: Integration tests MUST verify concurrent stock updates maintain per-location consistency

### ✅ II. Real-Time Synchronization

- **Spec Compliance**: FR-020 requires 5-second sync latency; FR-026 requires offline queue and auto-sync
- **Design Requirement**: Redis pub/sub for broadcast inventory changes; mobile app queues operations in AsyncStorage when offline
- **Test Coverage**: E2E test MUST simulate offline stock adjustment followed by reconnect and verify sync completion

### ✅ III. Mobile-First Design

- **Spec Compliance**: SC-003 requires common tasks in ≤3 taps; FR-026 requires offline mode
- **Design Requirement**: React Native app as primary admin interface; touch-optimized UI with large tap targets (min 44x44pt)
- **Test Coverage**: Detox tests MUST verify stock check, adjust quantity, transfer flow complete in 3 taps

### ✅ IV. Security & Access Control

- **Spec Compliance**: FR-022 requires MFA for owner; FR-021 requires RBAC; FR-023 requires 2-year audit retention
- **Design Requirement**: JWT with refresh tokens; bcrypt password hashing; OTP-based MFA via email; audit log as immutable Prisma model
- **Test Coverage**: API tests MUST verify role-based endpoint access; integration test for MFA flow

### ✅ V. Alerting & Monitoring

- **Spec Compliance**: FR-007/FR-008 require 60-second alert delivery via push, email, in-app badge
- **Design Requirement**: Background job (node-cron) checks stock thresholds every 30 seconds; Redis queue for alert delivery; Expo Push Notifications for mobile
- **Test Coverage**: Integration test MUST verify alert triggers within 60 seconds when stock hits reorder level

### ✅ VI. API-First Architecture

- **Spec Compliance**: FR-020 requires sync across all interfaces; explicit separation of admin and customer roles
- **Design Requirement**: All business logic in Express API routes/services; React web and React Native mobile consume same REST API; versioned routes `/api/v1/*`
- **Test Coverage**: Contract tests MUST verify API responses match OpenAPI spec for all endpoints

**Pre-Research Gate**: ✅ PASS - All constitutional principles accounted for in specification. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-dukaansync-platform/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── api-rest.md      # REST API endpoint contracts
│   └── websocket.md     # Real-time sync protocol (if WebSocket used)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # Prisma client initialization
│   │   ├── redis.js             # Redis connection and pub/sub setup
│   │   └── shops.js             # Hardcoded Shop 1 & Shop 2 config
│   ├── models/                  # Prisma schema (in prisma/ directory)
│   ├── services/
│   │   ├── auth.service.js      # JWT, MFA, password hashing
│   │   ├── inventory.service.js # Stock operations (add/remove/transfer)
│   │   ├── product.service.js   # CRUD for products
│   │   ├── order.service.js     # Order processing, stock deduction
│   │   ├── alert.service.js     # Low-stock alert logic
│   │   ├── supplier.service.js  # Supplier management
│   │   └── email.service.js     # Nodemailer for order confirmations, alerts
│   ├── api/
│   │   ├── routes/
│   │   │   ├── v1/
│   │   │   │   ├── auth.routes.js       # /api/v1/auth/login, /register, /mfa
│   │   │   │   ├── products.routes.js   # /api/v1/products (CRUD)
│   │   │   │   ├── inventory.routes.js  # /api/v1/inventory/adjust, /transfer
│   │   │   │   ├── orders.routes.routes.js      # /api/v1/orders (customer + admin views)
│   │   │   │   ├── alerts.routes.js     # /api/v1/alerts (list, mark viewed)
│   │   │   │   ├── suppliers.routes.js  # /api/v1/suppliers (CRUD)
│   │   │   │   └── dashboard.routes.js  # /api/v1/dashboard/stats (overview metrics)
│   │   │   └── index.js         # Route aggregator
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js       # JWT verification, role checks
│   │   │   ├── validation.middleware.js # Request body validation
│   │   │   └── rateLimiter.middleware.js# Rate limiting (express-rate-limit)
│   │   └── app.js               # Express app setup, CORS, middleware
│   ├── jobs/
│   │   └── alertChecker.job.js  # node-cron job (every 30s check stock thresholds)
│   └── server.js                # Entry point, starts Express + cron jobs
├── prisma/
│   ├── schema.prisma            # Prisma data model
│   └── migrations/              # Database migration history
├── tests/
│   ├── integration/
│   │   ├── auth.test.js         # Login, MFA flow
│   │   ├── inventory.test.js    # Multi-location stock operations, atomic transactions
│   │   ├── orders.test.js       # Order placement, stock deduction
│   │   └── alerts.test.js       # Alert triggering within 60s
│   ├── unit/
│   │   ├── services/
│   │   │   ├── inventory.service.test.js
│   │   │   └── alert.service.test.js
│   │   └── middleware/
│   │       └── auth.middleware.test.js
│   └── contract/
│       └── api-contracts.test.js# Verify API responses match OpenAPI spec
├── package.json
├── .env.example                 # Environment variables template
└── README.md

admin-web/
├── src/
│   ├── components/
│   │   ├── common/              # Button, Card, Badge, Modal components
│   │   ├── inventory/
│   │   │   ├── ProductCard.jsx  # Product grid item with stock counts
│   │   │   ├── StockAdjustForm.jsx
│   │   │   └── TransferForm.jsx
│   │   ├── dashboard/
│   │   │   ├── DashboardCard.jsx
│   │   │   ├── OverviewMetrics.jsx
│   │   │   └── Sidebar.jsx      # Navigation sidebar
│   │   ├── alerts/
│   │   │   └── AlertBadge.jsx   # In-app notification badge
│   │   └── orders/
│   │       └── OrderList.jsx
│   ├── pages/
│   │   ├── Login.jsx            # Authentication page with MFA
│   │   ├── Dashboard.jsx        # Overview with metrics cards
│   │   ├── Inventory.jsx        # Product catalog grid
│   │   ├── Alerts.jsx           # Low-stock alerts list
│   │   ├── Suppliers.jsx        # Supplier management
│   │   └── Orders.jsx           # Admin order view
│   ├── services/
│   │   ├── api.js               # Axios instance with auth interceptor
│   │   ├── auth.service.js      # Login, logout, token refresh
│   │   └── inventory.service.js # API calls for stock operations
│   ├── store/
│   │   ├── authStore.js         # Zustand store for auth state
│   │   └── inventoryStore.js    # Zustand store for product/stock state
│   ├── hooks/
│   │   └── useRealTimeSync.js   # Custom hook for Redis pub/sub via API polling/SSE
│   ├── App.jsx                  # Root component, routing setup
│   ├── main.jsx                 # Vite entry point
│   └── index.html               # Tailwind CDN script tag for dev
├── tests/
│   └── e2e/
│       └── inventory.spec.js    # Playwright tests for 3-tap workflows
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md

mobile/
├── app/
│   ├── (tabs)/                  # Expo Router tab navigation
│   │   ├── _layout.jsx          # Tab navigation structure
│   │   ├── index.jsx            # Dashboard screen (home)
│   │   ├── inventory.jsx        # Inventory list screen
│   │   ├── alerts.jsx           # Alerts screen
│   │   └── suppliers.jsx        # Suppliers screen
│   ├── (modals)/
│   │   ├── stock-adjust.jsx     # Modal for stock adjustment
│   │   └── transfer.jsx         # Modal for shop-to-shop transfer
│   ├── _layout.jsx              # Root layout, auth check
│   └── login.jsx                # Login screen
├── components/
│   ├── ProductCard.jsx          # Reusable product card component
│   ├── StockBadge.jsx           # Low-stock indicator badge
│   └── OfflineIndicator.jsx     # Shows when offline with queue count
├── services/
│   ├── api.js                   # Shared API client (same as web, Axios)
│   ├── offlineQueue.js          # AsyncStorage queue for offline operations
│   └── syncManager.js           # Handles sync on reconnect
├── store/
│   └── inventoryStore.js        # Zustand store (shared with web where possible)
├── tests/
│   └── e2e/
│       └── detox/
│           └── inventory.e2e.js # Detox test for 3-tap workflow
├── app.json                     # Expo configuration
├── package.json
└── README.md

storefront/
├── src/
│   ├── components/
│   │   ├── ProductGrid.jsx      # Customer-facing product catalog
│   │   ├── SearchBar.jsx
│   │   ├── Cart.jsx
│   │   └── Checkout.jsx         # Payment form with Razorpay/Stripe
│   ├── pages/
│   │   ├── Home.jsx             # Landing page with category navigation
│   │   ├── Products.jsx         # Product listing with search/filter
│   │   ├── ProductDetail.jsx    # Single product view
│   │   ├── Cart.jsx             # Cart summary
│   │   ├── Checkout.jsx         # Checkout flow
│   │   └── OrderTracking.jsx    # Order status tracking
│   ├── services/
│   │   ├── api.js               # Axios instance (no auth needed for browsing)
│   │   └── payment.service.js   # Razorpay/Stripe integration
│   ├── App.jsx
│   ├── main.jsx
│   └── index.html               # Tailwind CDN
├── tests/
│   └── e2e/
│       └── checkout.spec.js     # Complete purchase flow test
├── package.json
├── vite.config.js
└── README.md

shared/
├── api-client/                  # Shared API client used by admin-web, mobile, storefront
│   ├── index.js
│   ├── endpoints.js             # Centralized API route definitions
│   └── interceptors.js          # Auth interceptor logic
└── types/                       # Shared TypeScript types (if using TS)
    ├── product.types.js
    ├── order.types.js
    └── stock.types.js

.github/
├── workflows/
│   ├── backend-ci.yml           # Backend tests + deployment to Railway
│   ├── admin-web-ci.yml         # Admin web tests + deployment to Vercel
│   └── storefront-ci.yml        # Storefront tests + deployment to Vercel
└── ...

docs/
├── api/
│   └── openapi.yaml             # OpenAPI 3.0 spec for REST API
└── deployment/
    ├── railway-setup.md
    └── vercel-setup.md
```

**Structure Decision**: Multi-app monorepo structure chosen to support admin web (React), mobile (React Native + Expo), customer storefront (React), and backend API (Express + Prisma). Using workspaces (npm/yarn) to share API client and types across frontend apps. Backend is standalone Node.js service deployed on Railway. Web frontends deployed on Vercel with separate subdomains (admin.dukaansync.com, shop.dukaansync.com).

**Justification**:

- **Monorepo**: Enables code sharing (API client, types) while maintaining clear separation between admin, customer, and mobile concerns
- **Expo**: Simplifies React Native development and OTA updates; Android-first approach defers iOS complexity
- **Hardcoded shops config**: Avoids premature database normalization for 2 fixed locations; scales to dynamic shops in future version
- **Shared API client**: Ensures consistent authentication, error handling, and typing across web and mobile interfaces

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations requiring justification.** All constitutional principles satisfied by design:

- Multi-location integrity: Prisma transactions + `shopId` foreign keys
- Real-time sync: Redis pub/sub + API polling fallback
- Mobile-first: React Native as primary admin interface
- Security: JWT + MFA + RBAC middleware + audit logging
- Alerting: node-cron background job + Expo push notifications
- API-first: All business logic in Express routes/services

---

## Post-Design Constitution Re-Check

_Requirement: Re-evaluate constitutional compliance after Phase 1 design artifacts (data-model.md, contracts/, quickstart.md) are complete._

### ✅ I. Multi-Location Data Integrity (NON-NEGOTIABLE)

**Design Artifacts Review**:

- ✅ **data-model.md**: Stock model has composite unique key `(productId, shopId)` ensuring separate records per location
- ✅ **data-model.md**: AuditLog model captures `shopId` for every inventory transaction
- ✅ **contracts/api-rest.md**: All inventory endpoints (`/inventory/adjust`, `/inventory/transfer`) require `shopId` parameter
- ✅ **contracts/api-rest.md**: Order model includes `fulfillmentShopId` to track which shop fulfilled order and stock deduction
- ✅ **research.md**: Prisma transactions documented as implementation pattern for atomic stock updates + audit log creation

**Compliance Status**: ✅ PASS - Data model enforces per-location integrity at database level with foreign keys and unique constraints.

### ✅ II. Real-Time Synchronization

**Design Artifacts Review**:

- ✅ **data-model.md**: All mutable entities have `updatedAt` timestamp for change detection
- ✅ **research.md**: Redis pub/sub pattern documented for broadcasting inventory changes
- ✅ **research.md**: Mobile offline queue pattern documented with AsyncStorage + sync on reconnect
- ✅ **contracts/api-rest.md**: Stock adjustment endpoints return updated `updatedAt` timestamp in response

**Compliance Status**: ✅ PASS - Architecture supports 5-second sync requirement via Redis pub/sub + polling fallback.

### ✅ III. Mobile-First Design

**Design Artifacts Review**:

- ✅ **data-model.md**: Schema denormalized where needed (`priceAtOrder` snapshot) for faster mobile queries
- ✅ **data-model.md**: Indexes on all common mobile queries (product search, stock lookup, alert list)
- ✅ **contracts/api-rest.md**: All responses optimized for mobile bandwidth (minimal JSON payloads)
- ✅ **quickstart.md**: Mobile app setup instructions prioritized with Expo Go quick start
- ✅ **research.md**: Offline-first mobile architecture documented with AsyncStorage queue

**Compliance Status**: ✅ PASS - API contracts and data model support mobile-first principle with offline support.

### ✅ IV. Security & Access Control

**Design Artifacts Review**:

- ✅ **data-model.md**: User model includes `passwordHash` (bcrypt), `mfaSecret`, `mfaEnabled`, `tokenVersion`
- ✅ **data-model.md**: UserRole enum with OWNER/ADMIN/EMPLOYEE for RBAC
- ✅ **data-model.md**: AuditLog model has no UPDATE/DELETE permissions (immutable, 2-year retention)
- ✅ **contracts/api-rest.md**: `/auth/mfa/verify` endpoint for OTP-based MFA flow
- ✅ **contracts/api-rest.md**: All admin endpoints require JWT bearer token authentication
- ✅ **contracts/api-rest.md**: Rate limiting documented (100 req/min authenticated, 10 req/min unauthenticated)
- ✅ **research.md**: JWT with refresh tokens documented; bcrypt salt rounds = 12; RS256 asymmetric signing

**Compliance Status**: ✅ PASS - Security requirements fully addressed in data model and API contracts.

### ✅ V. Alerting & Monitoring

**Design Artifacts Review**:

- ✅ **data-model.md**: Alert model captures `triggeredAt`, `sentAt`, `emailSent`, `pushSent` for 60-second SLA tracking
- ✅ **data-model.md**: Alert model includes `thresholdValue` and `quantityAtTrigger` for audit
- ✅ **contracts/api-rest.md**: `/alerts` endpoint returns alert status with timestamps
- ✅ **contracts/api-rest.md**: `/alerts/:id/contact-supplier` generates pre-filled WhatsApp/SMS message
- ✅ **research.md**: Background job (node-cron every 30s) checks stock thresholds
- ✅ **research.md**: Redis queue (Bull) for alert delivery jobs with retry logic

**Compliance Status**: ✅ PASS - Alert system design supports 60-second delivery SLA with observable timestamps.

### ✅ VI. API-First Architecture

**Design Artifacts Review**:

- ✅ **data-model.md**: Prisma models are pure data structures with no business logic
- ✅ **contracts/api-rest.md**: All business logic exposed via RESTful API endpoints
- ✅ **contracts/api-rest.md**: API versioned as `/api/v1/*` with clear upgrade path to `/api/v2/*`
- ✅ **contracts/api-rest.md**: Consistent response format (success/error envelope) across all endpoints
- ✅ **research.md**: Service layer pattern documented (routes → services → Prisma)
- ✅ **quickstart.md**: Shared API client documented for admin-web, mobile, storefront

**Compliance Status**: ✅ PASS - API-first design with clean separation of concerns and versioning strategy.

---

## Final Constitutional Compliance Report

**Pre-Research Gate** (before Phase 0): ✅ PASS
**Post-Design Gate** (after Phase 1): ✅ PASS

**Summary**: All 6 constitutional principles are satisfied by the design artifacts:

1. ✅ Multi-Location Data Integrity: Database schema enforces at table level
2. ✅ Real-Time Synchronization: Redis pub/sub + offline queue architecture
3. ✅ Mobile-First Design: Expo + offline support + optimized API responses
4. ✅ Security & Access Control: JWT + MFA + RBAC + audit logging
5. ✅ Alerting & Monitoring: node-cron + Redis queue + 60-second SLA tracking
6. ✅ API-First Architecture: REST API with versioning + shared client library

**No design rework required.** Proceed to Phase 2: Task generation (`/speckit.tasks`).

---

## Phase Summary

### ✅ Phase 0: Research (Completed)

- **Output**: [research.md](research.md)
- **Content**: Technology stack decisions, best practices, integration patterns, testing strategy, risks/mitigations
- **Key Decisions**:
  - React 18 + Vite for admin web (fast HMR, no SSR overhead)
  - React Native + Expo SDK 51 for mobile (OTA updates, managed workflow)
  - Node.js 20 + Express + Prisma + PostgreSQL for backend (ACID transactions)
  - Redis 7 for caching + pub/sub (real-time sync)
  - Railway for backend, Vercel for frontends (budget-conscious)
  - Hardcoded shops config (defer dynamic shop management to v2)

### ✅ Phase 1: Design (Completed)

- **Output**:
  - [data-model.md](data-model.md): Prisma schema with 13 entities (User, Product, Shop, Stock, Customer, Order, OrderItem, Payment, Supplier, SupplierProduct, Alert, AuditLog, DeliveryAddress)
  - [contracts/api-rest.md](contracts/api-rest.md): 40+ REST API endpoints with request/response schemas
  - [quickstart.md](quickstart.md): Developer onboarding guide with setup instructions for backend, admin-web, mobile, storefront
- **Key Design Choices**:
  - Composite unique key `(productId, shopId)` on Stock for multi-location integrity
  - Immutable AuditLog with 2-year retention (constitutional requirement)
  - JWT with refresh tokens (15-min access, 7-day refresh)
  - Email OTP for MFA (simpler than TOTP for non-technical users)
  - `priceAtOrder` snapshot in OrderItem for historical accuracy
  - Redis TTL-based caching for product catalog (5-min TTL)

### 🔜 Phase 2: Task Generation (Next Step)

- **Command**: `/speckit.tasks`
- **Expected Output**: [tasks.md](tasks.md) with dependency-ordered task list organized by user story (P1-P4 from spec.md)
- **Task Structure**: Setup → Foundation → User Story 1 (P1) → User Story 2 (P2) → User Story 3 (P3) → User Story 4 (P4) → Refinements

---

## Planning Complete

**Branch**: `001-dukaansync-platform`
**Plan File**: [specs/001-dukaansync-platform/plan.md](specs/001-dukaansync-platform/plan.md)
**Generated Artifacts**:

- ✅ [research.md](research.md) - Technology research and decisions
- ✅ [data-model.md](data-model.md) - Prisma database schema
- ✅ [contracts/api-rest.md](contracts/api-rest.md) - REST API endpoint contracts
- ✅ [quickstart.md](quickstart.md) - Developer setup guide

**Constitutional Compliance**: ✅ All 6 principles satisfied
**Ready for**: `/speckit.tasks` to generate implementation task list

**Next Command**: `/speckit.tasks` (generates actionable task breakdown organized by user story)
