# Data Model: DukaanSync Platform

**Feature**: DukaanSync multi-shop inventory and e-commerce platform
**Branch**: 001-dukaansync-platform
**Date**: 2026-03-25

## Overview

This document defines the database schema for DukaanSync using Prisma ORM with PostgreSQL. All entities support the 6 constitutional principles: multi-location integrity, real-time sync, mobile-first, security, alerting, and API-first architecture.

## Entity Relationship Diagram

```
User (owner/admin) ──┐
                     │
                     ├─> AuditLog (immutable audit trail)
                     │
                     └─> Alert (low-stock notifications)

Product ──┬─> Stock (quantity at Shop 1)
          │
          └─> Stock (quantity at Shop 2)
          │
          └─> OrderItem (products in orders)
          │
          └─> Supplier (linked via SupplierProduct)

Shop (hardcoded config) ──> Stock (inventory per shop)
                          │
                          └─> Order (fulfillment shop)

Customer ──> Order ──> OrderItem ──> Product
         │
         └─> DeliveryAddress (1:many)

Order ──> Payment (payment status, gateway transaction ID)

Alert ──> Product (which product is low)
      │
      └─> Shop (which shop has low stock)
```

## Core Entities

### User (Owner/Admin)

Represents authenticated admin users (shop owner) who manage the inventory system. Constitution requires MFA for owner accounts.

**Fields**:

- `id` (UUID, PK): Unique user identifier
- `email` (String, unique, indexed): Login email
- `passwordHash` (String): bcrypt-hashed password (salt rounds = 12)
- `firstName` (String): User's first name
- `lastName` (String): User's last name
- `phone` (String, optional): Contact phone number
- `role` (Enum: OWNER, ADMIN): User role for RBAC (future: EMPLOYEE)
- `mfaSecret` (String, optional): OTP secret for MFA (null if MFA not enabled)
- `mfaEnabled` (Boolean, default: false): Whether MFA is active
- `tokenVersion` (Int, default: 0): Incremented on password change to invalidate refresh tokens
- `lastLoginAt` (DateTime, nullable): Last successful login timestamp
- `createdAt` (DateTime): Account creation timestamp
- `updatedAt` (DateTime): Last account update timestamp

**Relationships**:

- `auditLogs` (1:many to AuditLog): All audit logs created by this user
- `alerts` (many:many to Alert via AlertView): Alerts viewed by this user

**Indexes**:

- Unique index on `email`
- Index on `role` for RBAC queries

**Validation Rules**:

- Email must match RFC 5322 format
- Password hash must be bcrypt format (60 chars starting with `$2b$`)
- Phone must match E.164 format if provided

---

### Product

Represents a grocery item available for sale. Each product has separate stock quantities tracked per shop location.

**Fields**:

- `id` (UUID, PK): Unique product identifier
- `sku` (String, unique, indexed): Stock Keeping Unit (barcode or internal identifier)
- `name` (String, indexed): Product name (e.g., "Basmati Rice 5kg")
- `description` (Text, optional): Product description
- `category` (Enum): Product category (STAPLES, FRESH_PRODUCE, DAIRY, PACKAGED_GOODS, SPICES, PERSONAL_CARE, OTHER)
- `price` (Decimal): Base price per unit in INR (uniform across shops)
- `unit` (Enum): Unit of measurement (KG, LITER, PIECE, PACKET)
- `imageUrls` (String[], optional): Array of product image URLs (uploaded to cloud storage)
- `isActive` (Boolean, default: true): Whether product is available for sale
- `createdAt` (DateTime): Product creation timestamp
- `updatedAt` (DateTime): Last product update timestamp

**Relationships**:

- `stock` (1:many to Stock): Stock quantities at each shop
- `orderItems` (1:many to OrderItem): Line items in customer orders
- `supplierProducts` (many:many to Supplier via SupplierProduct): Suppliers for this product
- `alerts` (1:many to Alert): Low-stock alerts for this product

**Indexes**:

- Unique index on `sku`
- Index on `name` for search queries
- Index on `category` for category browsing
- Index on `isActive` for active product queries

**Validation Rules**:

- Price must be positive (> 0)
- SKU must be alphanumeric
- At least one image URL must be provided (business rule)

---

### Shop

Represents a physical store location. In v1, shops are hardcoded in `config/shops.js` and not stored in database. This model exists for referential integrity in Stock and Order tables.

**Note**: This is a lightweight reference table. Shop metadata (name, address) lives in application config, not database.

**Fields**:

- `id` (String, PK): Shop identifier ('shop1', 'shop2')
- `name` (String): Display name (e.g., "Shop 1 - Main Street")
- `createdAt` (DateTime): Record creation timestamp

**Relationships**:

- `stock` (1:many to Stock): Inventory quantities at this shop
- `orders` (1:many to Order): Orders fulfilled from this shop

**Indexes**:

- Primary key on `id`

**Migration Path**: When scaling to 3+ shops, add fields: `address`, `phone`, `operatingHours`, `isActive`, and build admin UI for shop CRUD.

---

### Stock

Represents the quantity of a specific product available at a specific shop. Critical for multi-location inventory integrity (constitutional principle I).

**Fields**:

- `id` (UUID, PK): Unique stock record identifier
- `productId` (UUID, FK → Product): Which product
- `shopId` (String, FK → Shop): Which shop location
- `quantity` (Int): Current stock quantity (non-negative)
- `reorderLevel` (Int): Threshold for low-stock alerts (per-shop, per-product)
- `lastRestockedAt` (DateTime, nullable): Timestamp of last restock operation
- `updatedAt` (DateTime): Last stock update timestamp

**Relationships**:

- `product` (many:1 to Product): The product being stocked
- `shop` (many:1 to Shop): The shop location

**Indexes**:

- Composite unique index on `(productId, shopId)` (one stock record per product per shop)
- Index on `quantity` for low-stock queries
- Index on `updatedAt` for recent changes queries

**Business Rules**:

- Quantity cannot be negative (enforced by CHECK constraint)
- All quantity updates must create corresponding AuditLog entry (enforced by Prisma middleware)
- Concurrent updates use row-level locking (`FOR UPDATE` in transactions)

**Validation Rules**:

- `reorderLevel` must be non-negative
- Updates to quantity must include reason in AuditLog

---

### Customer

Represents end-users purchasing from the online storefront. Customers have read-only access to product catalog and their own order history.

**Fields**:

- `id` (UUID, PK): Unique customer identifier
- `email` (String, unique, indexed): Customer email for order confirmations
- `passwordHash` (String): bcrypt-hashed password
- `firstName` (String): Customer first name
- `lastName` (String): Customer last name
- `phone` (String): Contact phone number
- `createdAt` (DateTime): Account creation timestamp
- `updatedAt` (DateTime): Last account update timestamp

**Relationships**:

- `orders` (1:many to Order): Orders placed by this customer
- `deliveryAddresses` (1:many to DeliveryAddress): Saved delivery addresses

**Indexes**:

- Unique index on `email`
- Index on `phone` for customer lookup

**Validation Rules**:

- Email must be unique and valid format
- Phone must match Indian mobile format (+91-XXXXXXXXXX)

---

### DeliveryAddress

Represents saved delivery addresses for customers. Supports multiple addresses per customer.

**Fields**:

- `id` (UUID, PK): Unique address identifier
- `customerId` (UUID, FK → Customer): Customer who owns this address
- `addressLine1` (String): Street address
- `addressLine2` (String, optional): Apartment, suite, etc.
- `city` (String): City name
- `state` (String): State name
- `postalCode` (String): PIN code
- `isDefault` (Boolean, default: false): Default delivery address
- `createdAt` (DateTime): Address creation timestamp
- `updatedAt` (DateTime): Last address update timestamp

**Relationships**:

- `customer` (many:1 to Customer): Customer who owns this address
- `orders` (1:many to Order): Orders delivered to this address

**Indexes**:

- Index on `customerId` for customer address queries
- Index on `postalCode` for delivery zone queries

**Business Rules**:

- Only one address per customer can have `isDefault = true`

---

### Order

Represents a customer purchase transaction from the online storefront. Constitution requires automatic stock deduction from fulfillment shop upon payment confirmation.

**Fields**:

- `id` (UUID, PK): Unique order identifier
- `orderNumber` (String, unique, indexed): Human-readable order number (e.g., "DS-20260325-0001")
- `customerId` (UUID, FK → Customer): Customer who placed the order
- `fulfillmentShopId` (String, FK → Shop): Which shop fulfills this order (stock deducted from here)
- `deliveryAddressId` (UUID, FK → DeliveryAddress): Delivery address
- `status` (Enum): Order status (RECEIVED, PROCESSING, OUT_FOR_DELIVERY, DELIVERED, CANCELLED)
- `subtotal` (Decimal): Sum of line item prices (before tax and delivery fee)
- `tax` (Decimal): Tax amount (e.g., GST)
- `deliveryFee` (Decimal): Delivery charge
- `total` (Decimal): Final amount (subtotal + tax + deliveryFee)
- `paymentStatus` (Enum): Payment status (PENDING, PAID, FAILED, REFUNDED)
- `paymentGatewayTransactionId` (String, optional): Razorpay/Stripe transaction ID
- `notes` (Text, optional): Customer notes or admin internal notes
- `createdAt` (DateTime): Order creation timestamp (when payment initiated)
- `paidAt` (DateTime, nullable): Payment confirmation timestamp
- `updatedAt` (DateTime): Last order update timestamp

**Relationships**:

- `customer` (many:1 to Customer): Customer who placed the order
- `fulfillmentShop` (many:1 to Shop): Shop fulfilling the order
- `deliveryAddress` (many:1 to DeliveryAddress): Delivery address
- `items` (1:many to OrderItem): Products in this order
- `payment` (1:1 to Payment): Payment details

**Indexes**:

- Unique index on `orderNumber`
- Index on `customerId` for customer order history
- Index on `fulfillmentShopId` for shop order queries
- Index on `status` for order filtering
- Index on `createdAt` for recent orders queries

**Business Rules**:

- Order creation triggers stock deduction transaction (atomic with OrderItem creation and Stock update)
- If payment fails, order status → CANCELLED and stock is restored
- Stock deduction happens in `fulfillmentShopId` shop location

**Validation Rules**:

- Total must equal subtotal + tax + deliveryFee (enforced by application logic)
- Status transitions must follow valid flow: RECEIVED → PROCESSING → OUT_FOR_DELIVERY → DELIVERED

---

### OrderItem

Represents a line item in an order (product + quantity + price snapshot).

**Fields**:

- `id` (UUID, PK): Unique order item identifier
- `orderId` (UUID, FK → Order): Parent order
- `productId` (UUID, FK → Product): Product being ordered
- `quantity` (Int): Quantity ordered
- `priceAtOrder` (Decimal): Product price at time of order (snapshot, may differ from current product price)
- `subtotal` (Decimal): quantity × priceAtOrder
- `createdAt` (DateTime): Order item creation timestamp

**Relationships**:

- `order` (many:1 to Order): Parent order
- `product` (many:1 to Product): Product being ordered

**Indexes**:

- Index on `orderId` for order line item queries
- Index on `productId` for product sales analytics

**Business Rules**:

- `priceAtOrder` is snapshot of `Product.price` at order creation time (historical accuracy)
- Quantity must be positive (> 0)

---

### Payment

Represents payment transaction details for an order. Supports Razorpay/Stripe payment gateways.

**Fields**:

- `id` (UUID, PK): Unique payment identifier
- `orderId` (UUID, FK → Order, unique): Associated order (1:1 relationship)
- `gateway` (Enum): Payment gateway (RAZORPAY, STRIPE, UPI, CARD)
- `gatewayTransactionId` (String, indexed): Transaction ID from payment gateway
- `amount` (Decimal): Payment amount (should match Order.total)
- `currency` (String, default: 'INR'): Currency code
- `status` (Enum): Payment status (PENDING, SUCCESS, FAILED, REFUNDED)
- `failureReason` (Text, optional): Error message if payment failed
- `createdAt` (DateTime): Payment initiation timestamp
- `completedAt` (DateTime, nullable): Payment completion timestamp

**Relationships**:

- `order` (1:1 to Order): Associated order

**Indexes**:

- Unique index on `orderId` (one payment per order)
- Index on `gatewayTransactionId` for webhook lookups
- Index on `status` for payment reconciliation

**Business Rules**:

- Payment webhook handler updates status asynchronously
- If payment SUCCESS, update Order.paymentStatus → PAID and Order.paidAt timestamp
- If payment FAILED, update Order.status → CANCELLED and restore stock

---

### Supplier

Represents a vendor providing products to shops. Used for reorder workflow (WhatsApp/SMS integration).

**Fields**:

- `id` (UUID, PK): Unique supplier identifier
- `businessName` (String): Supplier business name
- `contactPerson` (String): Primary contact person name
- `email` (String, unique, optional): Supplier email
- `phone` (String): Contact phone number
- `whatsappNumber` (String, optional): WhatsApp number for reorder messages
- `address` (Text, optional): Supplier address
- `paymentTerms` (String, optional): Payment terms (e.g., "30 days net")
- `leadTimeDays` (Int, optional): Typical lead time for delivery
- `isActive` (Boolean, default: true): Whether supplier is active
- `createdAt` (DateTime): Supplier creation timestamp
- `updatedAt` (DateTime): Last supplier update timestamp

**Relationships**:

- `supplierProducts` (many:many to Product via SupplierProduct): Products supplied

**Indexes**:

- Index on `businessName` for supplier search
- Index on `isActive` for active supplier queries

**Validation Rules**:

- Phone or email must be provided (at least one contact method)

---

### SupplierProduct (Join Table)

Links suppliers to products they provide. Supports many-to-many relationship (one product can have multiple suppliers, one supplier can provide multiple products).

**Fields**:

- `id` (UUID, PK): Unique join record identifier
- `supplierId` (UUID, FK → Supplier): Supplier
- `productId` (UUID, FK → Product): Product
- `supplierSku` (String, optional): Supplier's SKU for this product (may differ from our SKU)
- `costPrice` (Decimal, optional): Cost price from this supplier
- `createdAt` (DateTime): Relationship creation timestamp

**Relationships**:

- `supplier` (many:1 to Supplier)
- `product` (many:1 to Product)

**Indexes**:

- Composite unique index on `(supplierId, productId)` (prevent duplicate links)
- Index on `supplierId` for supplier product queries
- Index on `productId` for product supplier queries

---

### Alert

Represents a low-stock notification triggered when inventory falls below reorder level. Constitution requires 60-second alert delivery via push, email, and in-app badge.

**Fields**:

- `id` (UUID, PK): Unique alert identifier
- `productId` (UUID, FK → Product): Product with low stock
- `shopId` (String, FK → Shop): Shop location with low stock
- `alertType` (Enum, default: LOW_STOCK): Alert type (currently only LOW_STOCK; future: EXPIRY_WARNING)
- `thresholdValue` (Int): Reorder level that triggered alert
- `quantityAtTrigger` (Int): Actual quantity when alert triggered
- `status` (Enum): Alert status (PENDING, SENT, FAILED)
- `emailSent` (Boolean, default: false): Whether email sent successfully
- `pushSent` (Boolean, default: false): Whether push notification sent successfully
- `triggeredAt` (DateTime): Alert trigger timestamp
- `sentAt` (DateTime, nullable): Alert delivery completion timestamp
- `viewedByUsers` (UUID[]): Array of user IDs who viewed this alert in dashboard

**Relationships**:

- `product` (many:1 to Product): Product with low stock
- `shop` (many:1 to Shop): Shop location

**Indexes**:

- Index on `productId` for product alert history
- Index on `shopId` for shop alert queries
- Index on `status` for pending alert queries
- Index on `triggeredAt` for recent alerts

**Business Rules**:

- Alert triggered by background job (node-cron every 30 seconds)
- Alert considered delivered when both `emailSent` and `pushSent` are true
- Alert marked SENT when delivery completes; status updated to SENT, `sentAt` timestamp set
- Duplicate alerts prevented: don't create new alert if existing alert for same product+shop within last 24 hours

**Validation Rules**:

- `quantityAtTrigger` must be ≤ `thresholdValue` (enforced by application logic)

---

### AuditLog

Represents immutable audit trail for all inventory transactions. Constitution requires 2-year retention and traceability of who/what/when/which shop.

**Fields**:

- `id` (UUID, PK): Unique audit log entry identifier
- `userId` (UUID, FK → User): User who performed the action
- `action` (Enum): Action type (STOCK_ADD, STOCK_REMOVE, STOCK_TRANSFER, PRODUCT_CREATE, PRODUCT_UPDATE, PRODUCT_DELETE, ORDER_CREATE, ORDER_CANCEL)
- `resourceType` (Enum): Resource type affected (PRODUCT, STOCK, ORDER, SUPPLIER, etc.)
- `resourceId` (UUID): ID of affected resource
- `shopId` (String, FK → Shop, optional): Shop location (for inventory actions)
- `changes` (JSON): Detailed change data (before/after values, reason, notes)
- `ipAddress` (String, optional): IP address of request
- `userAgent` (String, optional): User agent of request
- `timestamp` (DateTime, indexed): Audit log creation timestamp

**Relationships**:

- `user` (many:1 to User): User who performed the action
- `shop` (many:1 to Shop, optional): Shop location (if inventory action)

**Indexes**:

- Index on `userId` for user action history
- Index on `resourceType` + `resourceId` for resource audit trail
- Index on `shopId` for shop-specific audit queries
- Index on `timestamp` for time-range queries

**Database Constraints**:

- **Immutable**: No UPDATE or DELETE permissions on AuditLog table (append-only)
- Enforced via PostgreSQL row security policy or application-level database user permissions

**Business Rules**:

- Created automatically by Prisma middleware on Stock mutations
- Prisma `$use` middleware intercepts `update`, `create`, `delete` on Stock model
- Audit log creation is part of same transaction as resource mutation (atomic)

**Retention Policy**:

- Audit logs retained for minimum 2 years (constitutional requirement)
- Background job archives logs older than 2 years to cold storage (S3)

---

## Enums

### UserRole

- `OWNER`: Full system access, MFA required
- `ADMIN`: Full system access (future use)
- `EMPLOYEE`: Limited access, scoped to specific shops (future use)

### ProductCategory

- `STAPLES`: Rice, flour, lentils, etc.
- `FRESH_PRODUCE`: Fruits, vegetables
- `DAIRY`: Milk, cheese, yogurt
- `PACKAGED_GOODS`: Canned goods, packaged snacks
- `SPICES`: Spices and condiments
- `PERSONAL_CARE`: Soap, shampoo, toiletries
- `OTHER`: Miscellaneous items

### ProductUnit

- `KG`: Kilogram
- `LITER`: Liter
- `PIECE`: Individual pieces
- `PACKET`: Pre-packaged units

### OrderStatus

- `RECEIVED`: Order received, awaiting processing
- `PROCESSING`: Order being prepared for delivery
- `OUT_FOR_DELIVERY`: Order with delivery partner
- `DELIVERED`: Order delivered to customer
- `CANCELLED`: Order cancelled (payment failed or customer request)

### PaymentStatus

- `PENDING`: Payment initiated, awaiting confirmation
- `PAID`: Payment successful
- `FAILED`: Payment failed
- `REFUNDED`: Payment refunded to customer

### PaymentGateway

- `RAZORPAY`: Razorpay payment gateway
- `STRIPE`: Stripe payment gateway
- `UPI`: UPI direct payment
- `CARD`: Credit/debit card

### AlertType

- `LOW_STOCK`: Stock below reorder level
- `EXPIRY_WARNING`: Product approaching expiry (future use)

### AlertStatus

- `PENDING`: Alert triggered, delivery in progress
- `SENT`: Alert successfully delivered
- `FAILED`: Alert delivery failed (will retry)

### AuditAction

- `STOCK_ADD`: Added stock quantity
- `STOCK_REMOVE`: Removed stock quantity
- `STOCK_TRANSFER`: Transferred stock between shops
- `PRODUCT_CREATE`: Created new product
- `PRODUCT_UPDATE`: Updated product details
- `PRODUCT_DELETE`: Deleted product
- `ORDER_CREATE`: Created new order
- `ORDER_CANCEL`: Cancelled order
- `SUPPLIER_CREATE`: Created supplier
- `SUPPLIER_UPDATE`: Updated supplier

### AuditResourceType

- `PRODUCT`
- `STOCK`
- `ORDER`
- `SUPPLIER`
- `USER`
- `CUSTOMER`

---

## Prisma Schema Snippet

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String      @id @default(uuid())
  email         String      @unique
  passwordHash  String
  firstName     String
  lastName      String
  phone         String?
  role          UserRole    @default(OWNER)
  mfaSecret     String?
  mfaEnabled    Boolean     @default(false)
  tokenVersion  Int         @default(0)
  lastLoginAt   DateTime?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  auditLogs     AuditLog[]

  @@index([email])
  @@index([role])
}

model Product {
  id              String            @id @default(uuid())
  sku             String            @unique
  name            String
  description     String?
  category        ProductCategory
  price           Decimal           @db.Decimal(10, 2)
  unit            ProductUnit
  imageUrls       String[]
  isActive        Boolean           @default(true)
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  stock           Stock[]
  orderItems      OrderItem[]
  supplierProducts SupplierProduct[]
  alerts          Alert[]

  @@index([sku])
  @@index([name])
  @@index([category])
  @@index([isActive])
}

model Shop {
  id        String   @id
  name      String
  createdAt DateTime @default(now())

  stock     Stock[]
  orders    Order[]
  alerts    Alert[]
  auditLogs AuditLog[]
}

model Stock {
  id               String    @id @default(uuid())
  productId        String
  shopId           String
  quantity         Int       @default(0)
  reorderLevel     Int       @default(10)
  lastRestockedAt  DateTime?
  updatedAt        DateTime  @updatedAt

  product          Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  shop             Shop      @relation(fields: [shopId], references: [id])

  @@unique([productId, shopId])
  @@index([quantity])
  @@index([updatedAt])
}

model Customer {
  id               String            @id @default(uuid())
  email            String            @unique
  passwordHash     String
  firstName        String
  lastName         String
  phone            String
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt

  orders           Order[]
  deliveryAddresses DeliveryAddress[]

  @@index([email])
  @@index([phone])
}

model DeliveryAddress {
  id           String   @id @default(uuid())
  customerId   String
  addressLine1 String
  addressLine2 String?
  city         String
  state        String
  postalCode   String
  isDefault    Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  customer     Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  orders       Order[]

  @@index([customerId])
  @@index([postalCode])
}

model Order {
  id                      String        @id @default(uuid())
  orderNumber             String        @unique
  customerId              String
  fulfillmentShopId       String
  deliveryAddressId       String
  status                  OrderStatus   @default(RECEIVED)
  subtotal                Decimal       @db.Decimal(10, 2)
  tax                     Decimal       @db.Decimal(10, 2)
  deliveryFee             Decimal       @db.Decimal(10, 2)
  total                   Decimal       @db.Decimal(10, 2)
  paymentStatus           PaymentStatus @default(PENDING)
  paymentGatewayTransactionId String?
  notes                   String?
  createdAt               DateTime      @default(now())
  paidAt                  DateTime?
  updatedAt               DateTime      @updatedAt

  customer                Customer      @relation(fields: [customerId], references: [id])
  fulfillmentShop         Shop          @relation(fields: [fulfillmentShopId], references: [id])
  deliveryAddress         DeliveryAddress @relation(fields: [deliveryAddressId], references: [id])
  items                   OrderItem[]
  payment                 Payment?

  @@index([orderNumber])
  @@index([customerId])
  @@index([fulfillmentShopId])
  @@index([status])
  @@index([createdAt])
}

model OrderItem {
  id           String   @id @default(uuid())
  orderId      String
  productId    String
  quantity     Int
  priceAtOrder Decimal  @db.Decimal(10, 2)
  subtotal     Decimal  @db.Decimal(10, 2)
  createdAt    DateTime @default(now())

  order        Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product      Product  @relation(fields: [productId], references: [id])

  @@index([orderId])
  @@index([productId])
}

model Payment {
  id                   String         @id @default(uuid())
  orderId              String         @unique
  gateway              PaymentGateway
  gatewayTransactionId String
  amount               Decimal        @db.Decimal(10, 2)
  currency             String         @default("INR")
  status               PaymentStatus  @default(PENDING)
  failureReason        String?
  createdAt            DateTime       @default(now())
  completedAt          DateTime?

  order                Order          @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId])
  @@index([gatewayTransactionId])
  @@index([status])
}

model Supplier {
  id               String            @id @default(uuid())
  businessName     String
  contactPerson    String
  email            String?           @unique
  phone            String
  whatsappNumber   String?
  address          String?
  paymentTerms     String?
  leadTimeDays     Int?
  isActive         Boolean           @default(true)
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt

  supplierProducts SupplierProduct[]

  @@index([businessName])
  @@index([isActive])
}

model SupplierProduct {
  id          String   @id @default(uuid())
  supplierId  String
  productId   String
  supplierSku String?
  costPrice   Decimal? @db.Decimal(10, 2)
  createdAt   DateTime @default(now())

  supplier    Supplier @relation(fields: [supplierId], references: [id], onDelete: Cascade)
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([supplierId, productId])
  @@index([supplierId])
  @@index([productId])
}

model Alert {
  id                String      @id @default(uuid())
  productId         String
  shopId            String
  alertType         AlertType   @default(LOW_STOCK)
  thresholdValue    Int
  quantityAtTrigger Int
  status            AlertStatus @default(PENDING)
  emailSent         Boolean     @default(false)
  pushSent          Boolean     @default(false)
  triggeredAt       DateTime    @default(now())
  sentAt            DateTime?
  viewedByUsers     String[]

  product           Product     @relation(fields: [productId], references: [id], onDelete: Cascade)
  shop              Shop        @relation(fields: [shopId], references: [id])

  @@index([productId])
  @@index([shopId])
  @@index([status])
  @@index([triggeredAt])
}

model AuditLog {
  id           String             @id @default(uuid())
  userId       String
  action       AuditAction
  resourceType AuditResourceType
  resourceId   String
  shopId       String?
  changes      Json
  ipAddress    String?
  userAgent    String?
  timestamp    DateTime           @default(now())

  user         User               @relation(fields: [userId], references: [id])
  shop         Shop?              @relation(fields: [shopId], references: [id])

  @@index([userId])
  @@index([resourceType, resourceId])
  @@index([shopId])
  @@index([timestamp])
}

enum UserRole {
  OWNER
  ADMIN
  EMPLOYEE
}

enum ProductCategory {
  STAPLES
  FRESH_PRODUCE
  DAIRY
  PACKAGED_GOODS
  SPICES
  PERSONAL_CARE
  OTHER
}

enum ProductUnit {
  KG
  LITER
  PIECE
  PACKET
}

enum OrderStatus {
  RECEIVED
  PROCESSING
  OUT_FOR_DELIVERY
  DELIVERED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}

enum PaymentGateway {
  RAZORPAY
  STRIPE
  UPI
  CARD
}

enum AlertType {
  LOW_STOCK
  EXPIRY_WARNING
}

enum AlertStatus {
  PENDING
  SENT
  FAILED
}

enum AuditAction {
  STOCK_ADD
  STOCK_REMOVE
  STOCK_TRANSFER
  PRODUCT_CREATE
  PRODUCT_UPDATE
  PRODUCT_DELETE
  ORDER_CREATE
  ORDER_CANCEL
  SUPPLIER_CREATE
  SUPPLIER_UPDATE
}

enum AuditResourceType {
  PRODUCT
  STOCK
  ORDER
  SUPPLIER
  USER
  CUSTOMER
}
```

---

## Constitutional Compliance Verification

### ✅ I. Multi-Location Data Integrity

- **Stock model**: Composite unique key `(productId, shopId)` ensures separate records per location
- **Atomic transactions**: Prisma `$transaction` wraps Stock updates + AuditLog creation
- **Audit trail**: Every stock mutation logged with `shopId`, `userId`, `timestamp`

### ✅ II. Real-Time Synchronization

- **updatedAt timestamps**: All mutable entities have `updatedAt` for change detection
- **Redis integration**: Application publishes inventory changes to Redis pub/sub (not in schema)
- **Offline support**: Mobile app queues operations in AsyncStorage (application layer)

### ✅ III. Mobile-First Design

- **Schema simplicity**: Denormalized where needed (e.g., `priceAtOrder` snapshot) for faster mobile queries
- **Indexes**: All common mobile queries have indexes (product search, stock lookup, alert list)

### ✅ IV. Security & Access Control

- **Password security**: `passwordHash` field with bcrypt, `tokenVersion` for refresh token invalidation
- **MFA**: `mfaSecret` and `mfaEnabled` fields on User model
- **Role-based access**: `UserRole` enum with OWNER/ADMIN/EMPLOYEE (future)
- **Immutable audit**: AuditLog has no UPDATE/DELETE permissions

### ✅ V. Alerting & Monitoring

- **Alert model**: Captures `triggeredAt`, `sentAt`, `emailSent`, `pushSent` for 60-second SLA tracking
- **Threshold tracking**: `thresholdValue` and `quantityAtTrigger` fields for alert audit
- **Duplicate prevention**: Business logic checks for existing alerts within 24 hours

### ✅ VI. API-First Architecture

- **Clean entities**: No business logic in models (Prisma models are pure data)
- **Service layer**: Application services encapsulate business rules (not in schema)
- **Versioning**: Schema supports backward-compatible additions (new fields, enums)

---

## Migration Strategy

### Initial Migration (v1.0.0)

1. Create all tables and enums
2. Seed Shop table with hardcoded Shop 1 and Shop 2
3. Create default owner user with MFA disabled (manual enable post-setup)
4. Create sample product categories

### Future Migrations

- **v1.1.0**: Add `expiryDate` field to Stock for expiry tracking
- **v2.0.0**: Migrate hardcoded shops to dynamic Shop management (add `address`, `phone`, `isActive` fields)
- **v2.1.0**: Add `Employee` role and `employeeShopAccess` table for per-location permissions

---

## Next Steps (Phase 1 Continued)

With data model complete, proceed to:

1. **contracts/api-rest.md**: Document REST API endpoint contracts with request/response shapes based on these entities
2. **quickstart.md**: Developer onboarding guide with Prisma setup instructions
