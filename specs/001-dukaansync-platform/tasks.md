# Tasks: DukaanSync Platform

**Feature Branch**: `001-dukaansync-platform`
**Version**: v1.0
**Generated**: 2026-03-25
**Input**: Design documents from `/specs/001-dukaansync-platform/`

## Format: `- [ ] [TaskID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- All paths are absolute from repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, monorepo structure, and build tooling

- [ ] T001 Create monorepo root structure with npm workspaces configuration in package.json
- [ ] T002 Create backend directory structure: backend/src/{config,models,services,api,jobs}, backend/prisma/, backend/tests/
- [ ] T003 Create admin-web directory structure: admin-web/src/{components,pages,services,store,hooks}
- [ ] T004 Create mobile directory structure: mobile/app/{(tabs),(modals)}, mobile/components/, mobile/services/
- [ ] T005 Create storefront directory structure: storefront/src/{components,pages,services}
- [ ] T006 Create shared directory structure: shared/api-client/, shared/types/
- [ ] T007 [P] Initialize backend Node.js project with Express, Prisma, bcrypt, jsonwebtoken dependencies in backend/package.json
- [ ] T008 [P] Initialize admin-web React + Vite project with Tailwind CSS, Zustand, React Router in admin-web/package.json
- [ ] T009 [P] Initialize mobile Expo project with Expo SDK 51, Expo Router in mobile/package.json
- [ ] T010 [P] Initialize storefront React + Vite project with Tailwind CSS in storefront/package.json
- [ ] T011 [P] Configure ESLint and Prettier for backend in backend/.eslintrc.json
- [ ] T012 [P] Configure ESLint and Prettier for frontend apps in admin-web/.eslintrc.json, storefront/.eslintrc.json
- [ ] T013 [P] Configure Tailwind CSS for admin-web in admin-web/tailwind.config.js
- [ ] T014 [P] Configure Tailwind CSS for storefront in storefront/tailwind.config.js
- [ ] T015 [P] Create environment variable templates: backend/.env.example, admin-web/.env.example, mobile/.env.example, storefront/.env.example
- [ ] T016 Setup Git hooks with Husky for pre-commit linting in .husky/pre-commit

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database & Infrastructure

- [ ] T017 Create Prisma schema with all 13 entities (User, Product, Shop, Stock, Customer, Order, OrderItem, Payment, Supplier, SupplierProduct, Alert, AuditLog, DeliveryAddress) in backend/prisma/schema.prisma
- [ ] T018 Configure PostgreSQL connection in backend/src/config/database.js with Prisma client initialization
- [ ] T019 Configure Redis connection in backend/src/config/redis.js with pub/sub setup
- [ ] T020 Create initial database migration in backend/prisma/migrations/ for all entities
- [ ] T021 Create database seed script in backend/prisma/seed.js with 2 shops, 1 owner account, and sample products

### Authentication & Security

- [ ] T022 Implement JWT utilities (sign, verify, refresh) in backend/src/services/auth.service.js with RS256 asymmetric signing
- [ ] T023 Implement password hashing service using bcrypt (salt rounds = 12) in backend/src/services/auth.service.js
- [ ] T024 Implement authentication middleware with JWT verification and role checks in backend/src/api/middleware/auth.middleware.js
- [ ] T025 Implement rate limiting middleware with Redis store in backend/src/api/middleware/rateLimiter.middleware.js
- [ ] T026 Implement request validation middleware using express-validator in backend/src/api/middleware/validation.middleware.js
- [ ] T027 [P] Create auth routes: POST /api/v1/auth/login, /register, /logout in backend/src/api/routes/v1/auth.routes.js
- [ ] T028 [P] Implement MFA service with email OTP generation and verification in backend/src/services/auth.service.js
- [ ] T029 [P] Create MFA routes: POST /api/v1/auth/mfa/verify in backend/src/api/routes/v1/auth.routes.js
- [ ] T030 [P] Create auth refresh route: POST /api/v1/auth/refresh in backend/src/api/routes/v1/auth.routes.js

### API Infrastructure

- [ ] T031 Setup Express application with CORS, body-parser, and error handling in backend/src/api/app.js
- [ ] T032 Create API route aggregator in backend/src/api/routes/index.js mounting all v1 routes
- [ ] T033 Create backend server entry point in backend/src/server.js with Express server start and cron jobs
- [ ] T034 Create API health check endpoint GET /health in backend/src/server.js
- [ ] T035 Implement audit log Prisma middleware in backend/src/config/database.js to auto-create AuditLog entries on Stock updates
- [ ] T036 Create hardcoded shops configuration in backend/src/config/shops.js with Shop 1 and Shop 2 metadata

### Shared API Client

- [ ] T037 Create shared API client with Axios instance and auth interceptor in shared/api-client/index.js
- [ ] T038 Define centralized API endpoint constants in shared/api-client/endpoints.js
- [ ] T039 Implement JWT token refresh interceptor logic in shared/api-client/interceptors.js

### Email Service

- [ ] T040 Configure Nodemailer with SMTP settings in backend/src/services/email.service.js
- [ ] T041 [P] Create email templates for MFA OTP in backend/src/services/email.service.js
- [ ] T042 [P] Create email templates for order confirmation in backend/src/services/email.service.js
- [ ] T043 [P] Create email templates for low-stock alerts in backend/src/services/email.service.js

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Multi-Location Inventory Management (Priority: P1) 🎯 MVP

**Goal**: Enable shop owner to track and manage inventory across Shop 1 and Shop 2 with real-time updates, stock adjustments, and transfers between locations

**Independent Test**: Create products, set initial stock for both shops, perform add/remove/transfer operations via admin dashboard and mobile app, verify all changes reflect correctly with per-location accuracy

### Backend - Product & Stock Services (US1)

- [ ] T044 [P] [US1] Implement product service with CRUD operations in backend/src/services/product.service.js
- [ ] T045 [P] [US1] Implement inventory service with stock adjustment (add/remove) logic using Prisma transactions in backend/src/services/inventory.service.js
- [ ] T046 [US1] Implement stock transfer logic between Shop 1 and Shop 2 with atomic transactions in backend/src/services/inventory.service.js
- [ ] T047 [US1] Add row-level locking with FOR UPDATE in inventory transactions in backend/src/services/inventory.service.js

### Backend - Product API Routes (US1)

- [ ] T048 [P] [US1] Create GET /api/v1/products route with pagination, search, category filter in backend/src/api/routes/v1/products.routes.js
- [ ] T049 [P] [US1] Create GET /api/v1/products/:id route returning product with stock for both shops in backend/src/api/routes/v1/products.routes.js
- [ ] T050 [P] [US1] Create POST /api/v1/products route for product creation with initial stock in backend/src/api/routes/v1/products.routes.js
- [ ] T051 [P] [US1] Create PUT /api/v1/products/:id route for product updates in backend/src/api/routes/v1/products.routes.js
- [ ] T052 [P] [US1] Create DELETE /api/v1/products/:id route for soft delete (isActive = false) in backend/src/api/routes/v1/products.routes.js

### Backend - Inventory API Routes (US1)

- [ ] T053 [P] [US1] Create POST /api/v1/inventory/adjust route for stock add/remove with reason field in backend/src/api/routes/v1/inventory.routes.js
- [ ] T054 [P] [US1] Create POST /api/v1/inventory/transfer route for shop-to-shop transfers in backend/src/api/routes/v1/inventory.routes.js
- [ ] T055 [P] [US1] Create GET /api/v1/inventory/history/:productId route for audit trail with filters in backend/src/api/routes/v1/inventory.routes.js

### Admin Web - UI Components (US1)

- [ ] T056 [P] [US1] Create ProductCard component showing product details and stock counts for Shop 1 & Shop 2 in admin-web/src/components/inventory/ProductCard.jsx
- [ ] T057 [P] [US1] Create StockAdjustForm component with quantity input and reason field in admin-web/src/components/inventory/StockAdjustForm.jsx
- [ ] T058 [P] [US1] Create TransferForm component with from/to shop selectors and quantity input in admin-web/src/components/inventory/TransferForm.jsx
- [ ] T059 [P] [US1] Create common Button component with Tailwind styles in admin-web/src/components/common/Button.jsx
- [ ] T060 [P] [US1] Create common Card component with white background and green accents in admin-web/src/components/common/Card.jsx
- [ ] T061 [P] [US1] Create common Modal component for forms in admin-web/src/components/common/Modal.jsx

### Admin Web - AddProductForm Component (US1)

- [ ] T061-A [US1] Create AddProductForm.jsx component at admin-web/src/components/inventory/AddProductForm.jsx with form state management
  - Implement form state with useState hooks for formData, fieldErrors, globalError, successMessage, isSubmitting
  - Import Modal wrapper component and createProduct service
  - Define component props: isOpen, onClose, onSuccess callbacks
  - Create category options array (STAPLES, FRUITS, VEGETABLES, DAIRY, SNACKS, FROZEN)
  - Create unit suggestions array (kg, l, pieces, box, etc.)

- [ ] T061-B [US1] Implement validation logic in AddProductForm with validateForm() function
  - Validate SKU: required, max 50 chars, uppercase + numbers + hyphens only
  - Validate Name: required, 3-100 chars
  - Validate Category: required, one of 6 enum values
  - Validate Unit: required, max 20 chars
  - Validate Price: required, > 0, up to 2 decimals
  - Validate Reorder Level: required, >= 1
  - Validate Shop 1 Stock: required, >= 0
  - Validate Shop 2 Stock: required, >= 0
  - Validate Image URLs: optional, valid URLs only
  - Set fieldErrors state with validation results

- [ ] T061-C [P] [US1] Implement form handlers in AddProductForm
  - Create handleChange() for standard inputs with error clearing
  - Create handleImageUrlChange() for dynamic image URL inputs
  - Create handleAddImageUrl() to add new image field
  - Create handleRemoveImageUrl() to remove image field
  - Create handleClose() for modal closing
  - Use useCallback to optimize re-renders

- [ ] T061-D [US1] Implement form submission in AddProductForm
  - Create handleSubmit() handler with form validation
  - Build API payload matching contract (sku, name, category, description, unit, price, imageUrls, reorderLevel, initialStock)
  - Call createProduct() service with payload
  - Handle success: show message, reset form, auto-close modal, call onSuccess callback
  - Handle 409 duplicate SKU error with specific message
  - Handle validation errors (400) with field mapping
  - Handle server errors (500) with retry option
  - Display global error messages

- [ ] T061-E [P] [US1] Implement form UI rendering in AddProductForm
  - Render Modal wrapper component with title "Create New Product"
  - Render form with responsive grid layout (1 column mobile, 2 column desktop)
  - Add SKU input field with alphanumeric validation hint
  - Add Category dropdown with all 6 options
  - Add Name input field with character count
  - Add Description textarea (optional)
  - Add Unit input with datalist suggestions
  - Add Price number input (step=0.01)
  - Add Image URLs multi-input fields with add/remove buttons
  - Add Reorder Level number input
  - Add Shop 1 Initial Stock number input
  - Add Shop 2 Initial Stock number input
  - Display field-level error messages in red below each field
  - Add Submit and Cancel buttons with disabled state during loading
  - Show success message with auto-dismiss after 1.5 seconds

- [ ] T061-F [US1] Apply styling and responsive design to AddProductForm
  - Apply Tailwind CSS classes with dukaan-green (#04A70E) focus colors
  - Implement grid layout: grid-cols-1 md:grid-cols-2 for responsiveness
  - Style input fields with focus ring and border colors
  - Style error text in red (rose-600) with sufficient contrast
  - Style required field indicators (\*) in red
  - Style Submit button in dukaan-green, Cancel in gray
  - Add disabled state styling for loading state (opacity-50)
  - Ensure touch targets >= 44px for mobile accessibility
  - Test responsive layout on mobile (375px), tablet (768px), desktop (1920px)

- [ ] T061-G [US1] Integrate AddProductForm into Inventory.jsx page
  - Import AddProductForm component
  - Add showAddProductModal state with useState hook
  - Add "Add New Product" button to page header with dukaan-green primary color
  - Position button before other header buttons
  - Add onClick handler to set showAddProductModal(true)
  - Render AddProductForm with props: isOpen, onClose, onSuccess
  - Implement handleProductCreated callback to refresh product list
  - Verify component imports without errors and no console warnings

### Admin Web - Services & State (US1)

- [ ] T062 [P] [US1] Create inventory service with API calls for stock operations in admin-web/src/services/inventory.service.js
- [ ] T063 [P] [US1] Create auth service with login, logout, token refresh in admin-web/src/services/auth.service.js
- [ ] T064 [P] [US1] Create Zustand auth store for user state and JWT tokens in admin-web/src/store/authStore.js
- [ ] T065 [P] [US1] Create Zustand inventory store for products and stock state in admin-web/src/store/inventoryStore.js

### Admin Web - Pages & Routing (US1)

- [ ] T066 [US1] Create Login page with email/password form and MFA OTP flow in admin-web/src/pages/Login.jsx
- [ ] T067 [US1] Create Inventory page with product grid and stock adjustment modals in admin-web/src/pages/Inventory.jsx
- [ ] T068 [US1] Setup React Router with protected routes and auth redirect in admin-web/src/App.jsx
- [ ] T069 [US1] Create root entry point in admin-web/src/main.jsx with Vite setup

### Mobile - UI Components (US1)

- [ ] T070 [P] [US1] Create ProductCard component with touch-optimized stock badges in mobile/components/ProductCard.jsx
- [ ] T071 [P] [US1] Create StockBadge component showing Shop 1/Shop 2 quantities in mobile/components/StockBadge.jsx
- [ ] T072 [P] [US1] Create OfflineIndicator component showing queue count in mobile/components/OfflineIndicator.jsx

### Mobile - Screens & Navigation (US1)

- [ ] T073 [US1] Create login screen with email/password form and MFA in mobile/app/login.jsx
- [ ] T074 [US1] Create inventory list screen with FlatList of products in mobile/app/(tabs)/inventory.jsx
- [ ] T075 [US1] Create stock adjustment modal screen in mobile/app/(modals)/stock-adjust.jsx
- [ ] T076 [US1] Create transfer modal screen with shop selectors in mobile/app/(modals)/transfer.jsx
- [ ] T077 [US1] Setup Expo Router tab navigation in mobile/app/(tabs)/\_layout.jsx
- [ ] T078 [US1] Create root layout with auth check in mobile/app/\_layout.jsx

### Mobile - Services & Offline Support (US1)

- [ ] T079 [US1] Implement offline queue with AsyncStorage for stock operations in mobile/services/offlineQueue.js
- [ ] T080 [US1] Implement sync manager with NetInfo for connectivity detection and queue processing in mobile/services/syncManager.js
- [ ] T081 [US1] Create shared API client instance in mobile/services/api.js using shared/api-client

### Mobile - Configuration (US1)

- [ ] T082 [US1] Configure Expo app.json with push notification permissions and app name in mobile/app.json

**Checkpoint**: User Story 1 complete - Multi-location inventory management fully functional on web and mobile with offline support

---

## Phase 3.5: User Story 1 Testing - AddProductForm Component Validation

**Purpose**: Comprehensive testing of AddProductForm component implementation and integration

### AddProductForm - Manual End-to-End Testing

- [x] T083 [P] [US1] Perform happy path test - valid product creation
  - Open Inventory page (http://localhost:5173/inventory)
  - Verify "Add New Product" button visible in header
  - Click button to open modal
  - Fill in all fields with valid test data: SKU=TEST-001, Name=Test Product, Category=STAPLES
  - Set Unit=kg, Price=100.00, Reorder Level=10, Shop 1 Stock=50, Shop 2 Stock=30
  - Click "Create Product" button
  - Verify success message appears and auto-closes after 1.5 seconds
  - Verify modal closes automatically
  - Verify product appears in inventory grid with correct details
  - Query PostgreSQL to verify Stock records created for both shops in admin-web test logs

- [x] T084 [P] [US1] Perform field-level validation tests
  - Submit empty form → verify all required field error messages display
  - Enter invalid SKU (lowercase) → verify error "SKU must be uppercase"
  - Enter name less than 3 chars → verify "Name must be 3-100 characters" error
  - Enter price < 0 → verify "Price must be positive" error
  - Enter invalid image URL → verify URL validation error
  - Enter reorder level 0 → verify "Reorder level must be >= 1" error
  - Enter negative stock → verify non-negative stock validation

- [x] T085 [US1] Perform duplicate SKU tests
  - Query PostgreSQL to get existing product SKU
  - Try to create product with same SKU
  - Verify 409 Conflict error handled gracefully
  - Verify SKU field displays "SKU already exists" error message
  - Form should remain open for correction
  - Change SKU to unique value and verify retry succeeds
  - Verify second attempt creates product successfully

- [x] T086 [P] [US1] Perform error handling tests
  - Test network error display (simulate offline with DevTools)
  - Test API 500 error handling and display
  - Test API 403 permission error (if applicable to user role)
  - Verify error messages are clear and actionable
  - Verify form remains open on error for retry
  - Verify user can make corrections and retry submission

- [x] T087 [US1] Perform responsive design tests
  - Test form on desktop (1920px+): verify two-column layout, all fields visible, buttons properly sized
  - Test form on tablet (768px): verify responsive grid, inputs accessible
  - Test form on mobile (375px): verify single-column layout, touch targets >= 44px, modal fits viewport
  - Verify scrolling works on mobile if needed

- [x] T088 [P] [US1] Perform multi-image URL tests
  - Add first image URL with valid format
  - Click "Add another image" button → verify second field appears
  - Add 5+ image URLs in sequence
  - Click remove button on middle URL → verify removed without affecting others
  - Submit form with multiple image URLs
  - Verify all URLs saved to product in database

- [x] T089 [US1] Perform keyboard accessibility tests
  - Tab through all form fields in order → verify focus visible on each
  - Press Tab to reach Submit button, then Cancel button
  - Press Escape key → verify modal closes
  - Press Tab from Cancel button → verify cycles back to first field
  - Test on Chrome and Firefox (if available)

- [x] T090 [P] [US1] Perform database verification tests
  - Create product via form with SKU=DB-TEST-001
  - Query PostgreSQL directly: SELECT \* FROM "Product" WHERE sku = 'DB-TEST-001'
  - Verify Product record exists with all correct fields (name, category, price, etc.)
  - Query Stock records: SELECT \* FROM "Stock" WHERE "productId" = <product_id>
  - Verify Stock records exist for both Shop 1 and Shop 2
  - Verify Stock quantities match form input exactly
  - Verify Reorder levels set correctly in Stock table

### AddProductForm - API Contract Validation

- [x] T091 [US1] Verify request payload matches API contract
  - Open browser DevTools Network tab
  - Create a product via form
  - Inspect POST /api/v1/products request
  - Verify payload structure: sku, name, category, description, unit, price, imageUrls, reorderLevel, initialStock
  - Verify all required fields present with correct data types
  - Verify imageUrls is array, initialStock is object with shop1/shop2 properties
  - Verify initialStock values are numeric

- [x] T092 [US1] Verify response payload matches API contract
  - Inspect 201 response from successful product creation
  - Verify response includes: id, sku, name, category, unit, price, createdAt (ISO8601)
  - Verify response includes stocks array with Shop 1 and Shop 2 entries
  - Verify stocks array has correct structure: quantity, shopId, reorderLevel

- [x] T093 [P] [US1] Verify error response payloads match specification
  - Test 409 duplicate SKU → verify error structure and message
  - Test 400 validation error → verify error includes field details
  - Test 401 unauthorized → verify error message appropriate
  - Test 500 server error → verify error message non-technical

### AddProductForm - Cross-Browser Testing

- [x] T094 [US1] Test in Chrome/Chromium (latest)
  - Form renders correctly with all fields visible
  - Validation works as expected
  - Submission succeeds and modal closes
  - No console errors or warnings
  - Responsive design works correctly

- [x] T095 [P] [US1] Test in Firefox (latest)
  - Form renders correctly with all fields visible
  - Validation works as expected
  - Submission succeeds and modal closes
  - No console errors or warnings
  - Responsive design works correctly

- [x] T096 [US1] Test in Safari (if available)
  - Form renders correctly with all fields visible
  - Validation works as expected
  - Submission succeeds and modal closes
  - No console errors or warnings

### AddProductForm - Accessibility Testing

- [x] T097 [US1] Test form label associations and screen reader compatibility
  - Verify all inputs have associated label elements
  - Verify labels have proper htmlFor attributes
  - Test with accessibility browser extension (WAVE, Axe)
  - Verify required fields marked with asterisk and aria-required attribute

- [x] T098 [P] [US1] Test error message accessibility and contrast
  - Verify error messages linked via aria-describedby
  - Verify error text color has sufficient contrast (WCAG AA standard)
  - Verify errors not conveyed by color alone (text also indicates error)
  - Run Lighthouse accessibility audit

- [x] T099 [US1] Test modal accessibility and focus management
  - Verify Modal has role="dialog" attribute
  - Verify Modal title linked with aria-labelledby
  - Verify focus trapped within modal (Tab doesn't escape)
  - Verify Escape key closes modal and returns focus to trigger button
  - Test Tab order is intuitive and matches visual layout

---

## Phase 4: User Story 2 - Low-Stock Alerts & Supplier Management (Priority: P2)

**Goal**: Enable automated low-stock detection with 60-second alert delivery via push/email, and provide supplier contact workflow for reordering

**Independent Test**: Set reorder thresholds, deplete stock below threshold, verify alerts delivered within 60 seconds via push/email/in-app badge, test supplier contact flow with pre-filled WhatsApp/SMS message

### Backend - Supplier Service (US2)

- [ ] T100 [P] [US2] Implement supplier service with CRUD operations in backend/src/services/supplier.service.js
- [ ] T101 [P] [US2] Implement supplier-product linking logic in backend/src/services/supplier.service.js
- [ ] T101-A [P] [US2] Create POST /api/v1/suppliers/:id/products endpoint to link products to suppliers in backend/src/api/routes/v1/suppliers.routes.js
- [ ] T101-B [US2] Add supplier product assignment UI in admin-web/src/pages/Suppliers.jsx with multi-select product picker

### Backend - Alert Service (US2)

- [ ] T102 [US2] Implement alert service with low-stock detection logic in backend/src/services/alert.service.js
- [ ] T103 [US2] Implement alert delivery service with email and push notification jobs using Bull queue in backend/src/services/alert.service.js
- [ ] T104 [US2] Add duplicate alert prevention logic (check last 24 hours) in backend/src/services/alert.service.js

### Backend - Background Job (US2)

- [ ] T105 [US2] Create alert checker cron job checking stock thresholds every 30 seconds in backend/src/jobs/alertChecker.job.js
- [ ] T106 [US2] Integrate alert checker job into server startup in backend/src/server.js

### Backend - Push Notification Service (US2)

- [ ] T107 [US2] Configure Expo Push Notifications service in backend/src/services/pushNotification.service.js
- [ ] T108 [US2] Create device token registration endpoint POST /api/v1/devices/register in backend/src/api/routes/v1/devices.routes.js

### Backend - API Routes (US2)

- [ ] T109 [P] [US2] Create GET /api/v1/suppliers route with pagination in backend/src/api/routes/v1/suppliers.routes.js
- [ ] T110 [P] [US2] Create POST /api/v1/suppliers route for supplier creation in backend/src/api/routes/v1/suppliers.routes.js
- [ ] T111 [P] [US2] Create PUT /api/v1/suppliers/:id route for supplier updates in backend/src/api/routes/v1/suppliers.routes.js
- [ ] T112 [P] [US2] Create DELETE /api/v1/suppliers/:id route for supplier soft delete in backend/src/api/routes/v1/suppliers.routes.js
- [ ] T113 [P] [US2] Create GET /api/v1/alerts route with status and shop filters in backend/src/api/routes/v1/alerts.routes.js
- [ ] T114 [P] [US2] Create PATCH /api/v1/alerts/:id/mark-viewed route in backend/src/api/routes/v1/alerts.routes.js
- [ ] T115 [P] [US2] Create GET /api/v1/alerts/:id/contact-supplier route generating pre-filled message in backend/src/api/routes/v1/alerts.routes.js

### Admin Web - UI Components (US2)

- [ ] T116 [P] [US2] Create AlertBadge component with red indicator for unviewed alerts in admin-web/src/components/alerts/AlertBadge.jsx

### Admin Web - Pages (US2)

- [ ] T117 [US2] Create Alerts page with list of low-stock alerts and contact supplier buttons in admin-web/src/pages/Alerts.jsx
- [ ] T118 [US2] Create Suppliers page with supplier CRUD and product linking in admin-web/src/pages/Suppliers.jsx

### Admin Web - Services (US2)

- [ ] T119 [P] [US2] Create alert service with API calls in admin-web/src/services/alert.service.js
- [ ] T120 [P] [US2] Create supplier service with API calls in admin-web/src/services/supplier.service.js

### Mobile - Push Notifications (US2)

- [ ] T121 [US2] Implement Expo Push Notification registration on app launch in mobile/app/\_layout.jsx
- [ ] T122 [US2] Create push notification handler for low-stock alerts in mobile/services/pushNotification.js

### Mobile - Screens (US2)

- [ ] T123 [US2] Create alerts screen with alert list and contact supplier buttons in mobile/app/(tabs)/alerts.jsx
- [ ] T124 [US2] Create suppliers screen with supplier list and contact options in mobile/app/(tabs)/suppliers.jsx

**Checkpoint**: User Story 2 complete - Low-stock alerts trigger automatically within 60 seconds, supplier contact workflow functional

---

## Phase 5: User Story 3 - Customer Online Shopping Experience (Priority: P3)

**Goal**: Enable customers to browse products, add to cart, checkout with UPI/card payment, and track orders

**Independent Test**: Customer (non-admin user) visits storefront, browses products by category, searches, adds to cart, completes checkout with test payment, verifies order confirmation email and stock deduction from fulfillment shop

### Backend - Order Service (US3)

- [x] T125 [US3] Implement order service with order creation, payment validation, and stock deduction in backend/src/services/order.service.js
- [x] T126 [US3] Add atomic transaction for order creation + stock deduction + audit log in backend/src/services/order.service.js
- [x] T127 [US3] Implement order status update logic with validation in backend/src/services/order.service.js

### Backend - Payment Service (US3)

- [x] T128 [US3] Integrate Razorpay SDK with order creation and webhook verification in backend/src/services/payment.service.js
- [x] T129 [US3] Implement payment webhook handler for async payment confirmation in backend/src/services/payment.service.js
- [x] T130 [US3] Add payment timeout handling and stock restoration on failure in backend/src/services/payment.service.js

### Backend - API Routes (US3)

- [x] T131 [P] [US3] Create POST /api/v1/orders route for order creation with cart items in backend/src/api/routes/v1/orders.routes.js
- [x] T132 [P] [US3] Create GET /api/v1/orders route with customer/admin filtering in backend/src/api/routes/v1/orders.routes.js
- [x] T133 [P] [US3] Create GET /api/v1/orders/:id route with access control (customer can only view own orders) in backend/src/api/routes/v1/orders.routes.js
- [x] T134 [P] [US3] Create PATCH /api/v1/orders/:id/status route for admin status updates in backend/src/api/routes/v1/orders.routes.js
- [x] T135 [P] [US3] Create POST /api/v1/orders/:id/payment/webhook route for Razorpay webhook in backend/src/api/routes/v1/orders.routes.js
- [x] T136 [P] [US3] Create GET /api/v1/customers/addresses route in backend/src/api/routes/v1/customers.routes.js
- [x] T137 [P] [US3] Create POST /api/v1/customers/addresses route in backend/src/api/routes/v1/customers.routes.js

### Storefront - UI Components (US3)

- [x] T138 [P] [US3] Create ProductGrid component with category filters in storefront/src/components/ProductGrid.jsx
- [x] T139 [P] [US3] Create SearchBar component with debounced search in storefront/src/components/SearchBar.jsx
- [x] T140 [P] [US3] Create Cart component showing line items and totals in storefront/src/components/Cart.jsx
- [x] T141 [P] [US3] Create Checkout component with delivery address form and Razorpay integration in storefront/src/components/Checkout.jsx

### Storefront - Pages (US3)

- [x] T142 [US3] Create Home page with category navigation and featured products in storefront/src/pages/Home.jsx
- [x] T143 [US3] Create Products page with product grid, search, and filters in storefront/src/pages/Products.jsx
- [x] T144 [US3] Create ProductDetail page with product info and add-to-cart button in storefront/src/pages/ProductDetail.jsx
- [x] T145 [US3] Create Cart page with cart summary and checkout button in storefront/src/pages/Cart.jsx
- [x] T146 [US3] Create Checkout page with payment flow in storefront/src/pages/Checkout.jsx
- [x] T147 [US3] Create OrderTracking page showing order status timeline in storefront/src/pages/OrderTracking.jsx

### Storefront - Services (US3)

- [x] T148 [P] [US3] Create payment service with Razorpay integration in storefront/src/services/payment.service.js
- [x] T149 [P] [US3] Create order service with API calls in storefront/src/services/order.service.js

### Storefront - Routing & State (US3)

- [x] T150 [US3] Setup React Router with storefront pages in storefront/src/App.jsx
- [x] T151 [US3] Create Zustand cart store for shopping cart state in storefront/src/store/cartStore.js
- [x] T152 [US3] Create root entry point in storefront/src/main.jsx

### Admin Web - Order Management (US3)

- [x] T153 [US3] Create OrderList component in admin-web/src/components/orders/OrderList.jsx
- [x] T154 [US3] Create Orders page with filters and status updates in admin-web/src/pages/Orders.jsx

**Checkpoint**: User Story 3 complete - Customers can complete full purchase flow from browsing to payment, orders appear in admin dashboard

---

## Phase 6: User Story 4 - Visual Dashboard Overview (Priority: P4)

**Goal**: Create polished admin dashboard with full-screen white + green UI, large typography, sidebar navigation, and metric cards showing real-time data

**Independent Test**: Login to admin dashboard, verify all visual elements render correctly, check metric cards display accurate real-time data (total products, low-stock count, today's sales, pending orders), test responsive layout on different screen sizes

### Backend - Dashboard Service (US4)

- [x] T155 [US4] Implement dashboard metrics service calculating total products, low-stock count, today's sales, pending orders in backend/src/services/dashboard.service.js
- [x] T156 [US4] Create GET /api/v1/dashboard/stats route with real-time metrics in backend/src/api/routes/v1/dashboard.routes.js

### Admin Web - Dashboard Components (US4)

- [x] T157 [P] [US4] Create DashboardCard component with white background, green accents, and metric display in admin-web/src/components/dashboard/DashboardCard.jsx
- [x] T158 [P] [US4] Create OverviewMetrics component aggregating metric cards with auto-refresh (30s) in admin-web/src/components/dashboard/OverviewMetrics.jsx
- [x] T159 [P] [US4] Create Sidebar component with navigation links (Inventory, Orders, Alerts, Suppliers, Reports) in admin-web/src/components/dashboard/Sidebar.jsx

### Admin Web - Dashboard Page (US4)

- [x] T160 [US4] Create Dashboard page with "Manage Your Two Shops" heading, sidebar, and overview cards in admin-web/src/pages/Dashboard.jsx
- [x] T161 [US4] Add dashboard service API calls with useEffect polling in admin-web/src/pages/Dashboard.jsx

### Admin Web - Visual Polish (US4)

- [x] T162 [US4] Apply white + green color palette across all components in admin-web/src/index.css with Tailwind theme customization
- [x] T163 [US4] Update typography to large, readable fonts in admin-web/tailwind.config.js
- [x] T164 [US4] Add responsive layout breakpoints for tablet and desktop in admin-web/src/pages/Dashboard.jsx
- [x] T165 [US4] Add click-through navigation from low-stock badge to filtered inventory view in admin-web/src/pages/Dashboard.jsx

### Mobile - Dashboard Screen (US4)

- [x] T166 [US4] Create dashboard home screen with metric cards optimized for mobile in mobile/app/(tabs)/index.jsx

**Checkpoint**: User Story 4 complete - Admin dashboard has polished UI with real-time metrics and responsive design

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements, documentation, and validation across all user stories

### Real-Time Sync Implementation

- [x] T167 [P] Create Redis pub/sub event publisher on inventory mutations in backend/src/services/inventory.service.js
- [x] T168 [P] Create polling endpoint GET /api/v1/events/poll for inventory updates in backend/src/api/routes/v1/events.routes.js
- [x] T169 [P] Create useRealTimeSync hook with 2-second polling in admin-web/src/hooks/useRealTimeSync.js
- [x] T170 [P] Integrate real-time sync hook into Inventory page in admin-web/src/pages/Inventory.jsx

### Documentation

- [x] T171 [P] Create root README.md with project overview and quickstart instructions
- [x] T172 [P] Create backend/README.md with API documentation and setup guide
- [x] T173 [P] Create admin-web/README.md with build and deployment instructions
- [x] T174 [P] Create mobile/README.md with Expo setup and testing guide
- [x] T175 [P] Create storefront/README.md with build and deployment instructions
- [x] T176 [P] Create OpenAPI 3.0 spec documenting all REST API endpoints in docs/api/openapi.yaml

### Deployment Setup

- [x] T177 [P] Create Railway deployment configuration for backend in railway.json
- [x] T178 [P] Create Vercel deployment configuration for admin-web in admin-web/vercel.json with SPA fallback
- [x] T179 [P] Create Vercel deployment configuration for storefront in storefront/vercel.json with SPA fallback
- [x] T180 [P] Create GitHub Actions workflow for backend CI/CD in .github/workflows/backend-ci.yml
- [x] T181 [P] Create GitHub Actions workflow for admin-web CI/CD in .github/workflows/admin-web-ci.yml
- [x] T182 [P] Create GitHub Actions workflow for storefront CI/CD in .github/workflows/storefront-ci.yml

### Security Hardening

- [x] T183 Apply OWASP best practices: SQL injection prevention (Prisma ORM), XSS prevention (React escaping), CSRF tokens for state-changing operations
- [x] T184 Add security headers (helmet.js) in backend Express app: CSP, X-Frame-Options, HSTS in backend/src/api/app.js
- [x] T185 Configure CORS with whitelist of allowed origins in backend/src/api/app.js

### Performance Optimization

- [x] T186 [P] Implement Redis caching for product catalog with 5-minute TTL in backend/src/services/product.service.js
- [x] T187 [P] Add database indexes on frequently queried columns (productId, shopId, quantity, status) per data-model.md
- [x] T188 [P] Implement lazy loading for admin dashboard sections in admin-web/src/App.jsx with React.lazy()
- [x] T189 [P] Optimize mobile app bundle size with Expo tree-shaking in mobile/metro.config.js

### Validation & Testing

- [x] T190 Run quickstart.md validation: verify all setup steps work from fresh clone
- [x] T191 Test complete user journey for each user story (US1-US4) from frontend to backend
- [x] T192 Verify constitutional compliance: multi-location integrity, MFA, audit logs, 60-second alerts
- [x] T193 Conduct load testing with k6: 1000 concurrent users, verify p95 < 300ms
- [x] T194 Verify mobile offline queue and sync functionality with airplane mode test
- [x] T195 [P] Add edge case validation test: prevent overselling when customer orders quantity exceeding available stock at all shops in backend/tests/integration/overselling.test.js
- [x] T196 [P] Add edge case validation: supplier WhatsApp/SMS message retry with exponential backoff on network failure in backend/tests/integration/alert-retry.test.js
- [x] T197 [P] Add edge case validation: verify alert fires immediately when owner sets reorder level higher than current stock in backend/tests/integration/alert-edge-cases.test.js

---

## Dependencies & Execution Order

### Phase Dependencies

1. **Setup (Phase 1)**: No dependencies - can start immediately
2. **Foundational (Phase 2)**: Depends on Setup completion - **BLOCKS all user stories**
3. **User Story 1 (Phase 3)**: Depends on Foundational completion - No dependencies on other stories
4. **User Story 2 (Phase 4)**: Depends on Foundational completion - Integrates with US1 (products/stock) but independently testable
5. **User Story 3 (Phase 5)**: Depends on Foundational completion - Integrates with US1 (products/stock) but independently testable
6. **User Story 4 (Phase 6)**: Depends on Foundational completion - Integrates with US1/US2/US3 (dashboard metrics) but independently testable
7. **Polish (Phase 7)**: Depends on desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Foundation only - no other story dependencies ✅ **MVP ready after this**
- **US2 (P2)**: Foundation + reads from US1 (Product, Stock models) - independently testable ✅
- **US3 (P3)**: Foundation + reads from US1 (Product, Stock models) - independently testable ✅
- **US4 (P4)**: Foundation + reads metrics from US1/US2/US3 - independently testable ✅

### Within Each Phase

**Setup (Phase 1)**:

- T001-T006: Sequential directory creation
- T007-T010: Parallel project initialization [P]
- T011-T014: Parallel linting/styling config [P]
- T015-T016: Final setup tasks

**Foundational (Phase 2)**:

- T017-T021: Sequential database setup
- T022-T030: Parallel auth implementation (services can be built together) [P]
- T031-T036: API infrastructure setup
- T037-T043: Shared client and email services [P]

**User Story 1 (Phase 3)**:

- T044-T047: Sequential service implementation
- T048-T052: Parallel product routes [P]
- T053-T055: Parallel inventory routes [P]
- T056-T061: Parallel UI components [P]
- T062-T065: Parallel services and state [P]
- T066-T069: Sequential pages and routing
- T070-T082: Mobile implementation (components parallel [P], screens sequential)

**User Story 2-4**: Similar parallel opportunities for routes, components, services marked [P]

**Polish (Phase 7)**:

- Most tasks marked [P] can run in parallel
- T173-T177: Sequential validation at the end

### Parallel Opportunities

**Highly Parallelizable**:

- All [P] tasks within same phase and same user story
- Different user stories after Foundational completion (US1, US2, US3, US4 can all be developed in parallel by different teams)
- Backend routes for same story (all marked [P])
- Frontend components for same story (all marked [P])
- Frontend services for same story (all marked [P])

**Example: Team of 4 developers**

After Foundational phase completes:

- **Developer A**: US1 (Multi-Location Inventory) - MVP delivery
- **Developer B**: US2 (Alerts & Suppliers)
- **Developer C**: US3 (Customer Storefront)
- **Developer D**: US4 (Dashboard Polish)

All stories integrate via shared API and models but can be developed, tested, and deployed independently.

---

## Implementation Strategy

### MVP First (Recommended)

**Goal**: Deliver core value with minimum scope

1. ✅ Complete Phase 1: Setup
2. ✅ Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. ✅ Complete Phase 3: User Story 1 (Multi-Location Inventory Management)
4. **STOP and VALIDATE**: Test US1 independently end-to-end (web + mobile)
5. Deploy/demo basic inventory management system
6. Gather feedback before proceeding to US2-US4

**MVP Delivers**: Shop owner can manage inventory across 2 locations via web dashboard and mobile app with offline support. This is the core value proposition.

### Incremental Delivery

**Goal**: Add features progressively without breaking existing functionality

1. Foundation → Test foundation works
2. Foundation + US1 → Test US1 independently → **Deploy MVP** 🎯
3. Foundation + US1 + US2 → Test US2 independently → Deploy with alerts
4. Foundation + US1 + US2 + US3 → Test US3 independently → Deploy with storefront
5. Foundation + US1 + US2 + US3 + US4 → Test US4 independently → Deploy final version
6. Add Phase 7 polish → Final production release

**Benefits**: Each story adds value, early user feedback, reduced integration risk

### Parallel Team Strategy

**Goal**: Maximum development velocity with 4+ developers

**Phase 1-2 (Weeks 1-2)**: Entire team works together on Setup + Foundational

- Pair programming on critical infrastructure (auth, database, API structure)
- Code review all foundational code before proceeding

**Phase 3-6 (Weeks 3-6)**: Split into story-based teams

- **Team A** (2 devs): US1 backend + admin web + mobile
- **Team B** (1 dev): US2 backend + admin web + mobile
- **Team C** (1 dev): US3 backend + storefront
- **Team D** (1 dev): US4 admin web polish

**Benefits**: Stories progress in parallel, minimal merge conflicts (different files), independent testing

**Phase 7 (Week 7)**: Entire team on polish, integration testing, deployment

---

## Task Count Summary

- **Phase 1 (Setup)**: 16 tasks
- **Phase 2 (Foundational)**: 27 tasks ← **Critical Path**
- **Phase 3 (US1 - Inventory)**: 39 tasks ← **MVP**
- **Phase 4 (US2 - Alerts)**: 25 tasks
- **Phase 5 (US3 - Storefront)**: 30 tasks
- **Phase 6 (US4 - Dashboard)**: 12 tasks
- **Phase 7 (Polish)**: 28 tasks
- **Total**: 177 tasks

**Estimated Timeline**:

- MVP (Phase 1-3): 3-4 weeks (single developer) or 1.5-2 weeks (team of 4)
- Full Feature (All phases): 6-8 weeks (single developer) or 3-4 weeks (team of 4)

**Parallelization Factor**:

- 67 tasks marked [P] (38% of total)
- 4 user stories can proceed in parallel after Foundational phase
- Realistic 3-4x speedup with proper team coordination

---

## Notes

- ✅ All tasks follow strict checklist format: `- [ ] [TaskID] [P?] [Story?] Description with file path`
- ✅ Each user story is independently testable and deliverable
- ✅ Tests are NOT included (not requested in specification)
- ✅ MVP scope clearly identified (Phase 1-3)
- ✅ Constitutional principles satisfied across all stories
- ✅ Monorepo structure with shared API client
- ✅ Mobile-first with offline support (US1)
- ✅ Real-time sync via polling (US1, covered in Polish)
- ✅ Security: JWT + MFA + RBAC + audit logs (Foundational)
- ✅ 60-second alerts with background job (US2)
- ✅ Payment integration with Razorpay (US3)
- ✅ Polished dashboard UI (US4)

**Ready to Execute**: Start with T001 and proceed sequentially within each phase, parallelize where marked [P]
