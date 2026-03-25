# REST API Contracts: DukaanSync Platform

**Feature**: DukaanSync multi-shop inventory and e-commerce platform
**Branch**: 001-dukaansync-platform
**Date**: 2026-03-25
**API Version**: v1

## Base URL

- **Development**: `http://localhost:3000/api/v1`
- **Production**: `https://api.dukaansync.com/api/v1`

## Authentication

All admin endpoints require JWT bearer token in `Authorization` header:

```
Authorization: Bearer <access_token>
```

**Token Expiry**: Access tokens expire after 15 minutes. Use `/auth/refresh` endpoint to obtain new access token with refresh token.

## Common Response Formats

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }
  }
}
```

### Pagination Response

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## Authentication Endpoints

### POST /auth/register

Register a new customer account (storefront only). Owner accounts created manually.

**Access**: Public

**Request**:

```json
{
  "email": "customer@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+91-9876543210"
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "data": {
    "customer": {
      "id": "uuid",
      "email": "customer@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+91-9876543210",
      "createdAt": "2026-03-25T10:00:00Z"
    }
  },
  "message": "Account created successfully"
}
```

**Errors**:

- `400`: Email already exists
- `422`: Invalid email format or weak password

---

### POST /auth/login

Authenticate user (owner or customer) and receive JWT tokens.

**Access**: Public

**Request**:

```json
{
  "email": "owner@dukaansync.com",
  "password": "SecurePass123!",
  "role": "owner"
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900,
    "user": {
      "id": "uuid",
      "email": "owner@dukaansync.com",
      "firstName": "Jane",
      "lastName": "Owner",
      "role": "OWNER",
      "mfaEnabled": true
    },
    "requiresMfa": true
  }
}
```

**Response When MFA Required** (200 OK):

```json
{
  "success": true,
  "data": {
    "requiresMfa": true,
    "mfaSessionToken": "temp_session_token",
    "message": "Please enter the OTP sent to your email"
  }
}
```

**Errors**:

- `401`: Invalid credentials
- `429`: Too many login attempts (rate limit)

---

### POST /auth/mfa/verify

Verify MFA OTP and receive full access tokens.

**Access**: Public (requires mfaSessionToken from login)

**Request**:

```json
{
  "mfaSessionToken": "temp_session_token",
  "otp": "123456"
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900,
    "user": {
      "id": "uuid",
      "email": "owner@dukaansync.com",
      "firstName": "Jane",
      "lastName": "Owner",
      "role": "OWNER",
      "mfaEnabled": true
    }
  }
}
```

**Errors**:

- `401`: Invalid OTP
- `410`: OTP expired (after 5 minutes)
- `429`: Too many OTP attempts

---

### POST /auth/refresh

Refresh access token using refresh token.

**Access**: Public (requires valid refresh token)

**Request**:

```json
{
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  }
}
```

**Errors**:

- `401`: Invalid or expired refresh token
- `403`: Token version mismatch (password changed)

---

### POST /auth/logout

Invalidate refresh token (client-side should delete tokens).

**Access**: Authenticated

**Request**: No body

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Product Endpoints

### GET /products

Get paginated list of products. Supports filtering and search.

**Access**: Public (storefront), Authenticated (admin)

**Query Parameters**:

- `page` (int, default: 1): Page number
- `limit` (int, default: 20, max: 100): Items per page
- `category` (string, optional): Filter by category (STAPLES, FRESH_PRODUCE, etc.)
- `search` (string, optional): Search by product name or SKU
- `isActive` (boolean, default: true): Filter by active status (admin only)

**Request**: `GET /products?page=1&limit=20&category=DAIRY&search=milk`

**Response** (200 OK):

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "sku": "DAIRY-001",
      "name": "Full Cream Milk 1L",
      "description": "Fresh full cream milk",
      "category": "DAIRY",
      "price": 60.0,
      "unit": "LITER",
      "imageUrls": ["https://cdn.dukaansync.com/products/milk-001.jpg"],
      "isActive": true,
      "stock": [
        {
          "shopId": "shop1",
          "shopName": "Shop 1 - Main Street",
          "quantity": 45,
          "reorderLevel": 20
        },
        {
          "shopId": "shop2",
          "shopName": "Shop 2 - Market Road",
          "quantity": 12,
          "reorderLevel": 20
        }
      ],
      "createdAt": "2026-03-20T10:00:00Z",
      "updatedAt": "2026-03-25T08:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

**Errors**:

- `400`: Invalid query parameters

---

### GET /products/:id

Get single product details by ID.

**Access**: Public

**Request**: `GET /products/uuid`

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "sku": "DAIRY-001",
    "name": "Full Cream Milk 1L",
    "description": "Fresh full cream milk",
    "category": "DAIRY",
    "price": 60.0,
    "unit": "LITER",
    "imageUrls": ["https://cdn.dukaansync.com/products/milk-001.jpg"],
    "isActive": true,
    "stock": [
      {
        "shopId": "shop1",
        "shopName": "Shop 1 - Main Street",
        "quantity": 45,
        "reorderLevel": 20,
        "lastRestockedAt": "2026-03-24T14:00:00Z"
      },
      {
        "shopId": "shop2",
        "shopName": "Shop 2 - Market Road",
        "quantity": 12,
        "reorderLevel": 20,
        "lastRestockedAt": "2026-03-23T10:00:00Z"
      }
    ],
    "suppliers": [
      {
        "id": "supplier-uuid",
        "businessName": "ABC Dairy Farms",
        "contactPerson": "Ravi Kumar",
        "phone": "+91-9876543210",
        "whatsappNumber": "+91-9876543210"
      }
    ],
    "createdAt": "2026-03-20T10:00:00Z",
    "updatedAt": "2026-03-25T08:30:00Z"
  }
}
```

**Errors**:

- `404`: Product not found

---

### POST /products

Create a new product (admin only).

**Access**: Authenticated (OWNER/ADMIN only)

**Request**:

```json
{
  "sku": "FRESH-042",
  "name": "Organic Tomatoes",
  "description": "Fresh organic tomatoes",
  "category": "FRESH_PRODUCE",
  "price": 40.0,
  "unit": "KG",
  "imageUrls": ["https://cdn.dukaansync.com/products/tomato-001.jpg"],
  "initialStock": [
    {
      "shopId": "shop1",
      "quantity": 50,
      "reorderLevel": 15
    },
    {
      "shopId": "shop2",
      "quantity": 30,
      "reorderLevel": 10
    }
  ]
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "sku": "FRESH-042",
    "name": "Organic Tomatoes",
    "category": "FRESH_PRODUCE",
    "price": 40.0,
    "unit": "KG",
    "imageUrls": ["https://cdn.dukaansync.com/products/tomato-001.jpg"],
    "isActive": true,
    "stock": [
      {
        "shopId": "shop1",
        "quantity": 50,
        "reorderLevel": 15
      },
      {
        "shopId": "shop2",
        "quantity": 30,
        "reorderLevel": 10
      }
    ],
    "createdAt": "2026-03-25T10:30:00Z"
  },
  "message": "Product created successfully"
}
```

**Errors**:

- `400`: SKU already exists
- `403`: Insufficient permissions
- `422`: Validation errors (invalid price, missing required fields)

---

### PUT /products/:id

Update product details (admin only).

**Access**: Authenticated (OWNER/ADMIN only)

**Request**:

```json
{
  "name": "Organic Tomatoes 1kg Pack",
  "price": 45.0,
  "description": "Fresh organic tomatoes, pesticide-free",
  "isActive": true
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "sku": "FRESH-042",
    "name": "Organic Tomatoes 1kg Pack",
    "description": "Fresh organic tomatoes, pesticide-free",
    "price": 45.0,
    "updatedAt": "2026-03-25T11:00:00Z"
  },
  "message": "Product updated successfully"
}
```

**Errors**:

- `403`: Insufficient permissions
- `404`: Product not found
- `422`: Validation errors

---

### DELETE /products/:id

Delete product (soft delete - sets isActive to false).

**Access**: Authenticated (OWNER only)

**Request**: `DELETE /products/uuid`

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

**Errors**:

- `403`: Insufficient permissions
- `404`: Product not found
- `409`: Cannot delete product with active orders

---

## Inventory Endpoints

### POST /inventory/adjust

Adjust stock quantity for a product at a specific shop (add or remove stock).

**Access**: Authenticated (OWNER/ADMIN only)

**Request**:

```json
{
  "productId": "uuid",
  "shopId": "shop1",
  "adjustment": 25,
  "reason": "Received new stock from supplier ABC Dairy Farms",
  "type": "ADD"
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "stock": {
      "productId": "uuid",
      "shopId": "shop1",
      "quantity": 70,
      "reorderLevel": 20,
      "lastRestockedAt": "2026-03-25T11:15:00Z",
      "updatedAt": "2026-03-25T11:15:00Z"
    },
    "auditLog": {
      "id": "audit-uuid",
      "action": "STOCK_ADD",
      "changes": {
        "before": 45,
        "after": 70,
        "adjustment": 25,
        "reason": "Received new stock from supplier ABC Dairy Farms"
      },
      "timestamp": "2026-03-25T11:15:00Z"
    }
  },
  "message": "Stock adjusted successfully"
}
```

**Errors**:

- `400`: Invalid adjustment (e.g., removing more stock than available)
- `403`: Insufficient permissions
- `404`: Product or shop not found
- `422`: Missing reason field

---

### POST /inventory/transfer

Transfer stock between Shop 1 and Shop 2.

**Access**: Authenticated (OWNER/ADMIN only)

**Request**:

```json
{
  "productId": "uuid",
  "fromShopId": "shop1",
  "toShopId": "shop2",
  "quantity": 15,
  "reason": "Shop 2 running low, Shop 1 has excess"
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "fromStock": {
      "shopId": "shop1",
      "quantity": 30,
      "updatedAt": "2026-03-25T11:20:00Z"
    },
    "toStock": {
      "shopId": "shop2",
      "quantity": 27,
      "updatedAt": "2026-03-25T11:20:00Z"
    },
    "auditLog": {
      "id": "audit-uuid",
      "action": "STOCK_TRANSFER",
      "changes": {
        "productId": "uuid",
        "fromShop": "shop1",
        "toShop": "shop2",
        "quantity": 15,
        "reason": "Shop 2 running low, Shop 1 has excess"
      },
      "timestamp": "2026-03-25T11:20:00Z"
    }
  },
  "message": "Stock transferred successfully"
}
```

**Errors**:

- `400`: Insufficient stock at source shop
- `403`: Insufficient permissions
- `404`: Product or shop not found
- `422`: Invalid transfer (same shop, missing reason)

---

### GET /inventory/history/:productId

Get audit trail for a specific product's inventory changes.

**Access**: Authenticated (OWNER/ADMIN only)

**Query Parameters**:

- `shopId` (string, optional): Filter by shop
- `startDate` (ISO 8601, optional): Filter by date range start
- `endDate` (ISO 8601, optional): Filter by date range end
- `page` (int, default: 1)
- `limit` (int, default: 50)

**Request**: `GET /inventory/history/uuid?shopId=shop1&page=1`

**Response** (200 OK):

```json
{
  "success": true,
  "data": [
    {
      "id": "audit-uuid",
      "action": "STOCK_ADD",
      "user": {
        "id": "user-uuid",
        "firstName": "Jane",
        "lastName": "Owner"
      },
      "shopId": "shop1",
      "changes": {
        "before": 45,
        "after": 70,
        "adjustment": 25,
        "reason": "Received new stock from supplier"
      },
      "timestamp": "2026-03-25T11:15:00Z"
    },
    {
      "id": "audit-uuid-2",
      "action": "STOCK_TRANSFER",
      "user": {
        "id": "user-uuid",
        "firstName": "Jane",
        "lastName": "Owner"
      },
      "changes": {
        "fromShop": "shop1",
        "toShop": "shop2",
        "quantity": 15
      },
      "timestamp": "2026-03-25T11:20:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 127,
    "totalPages": 3
  }
}
```

---

## Order Endpoints (Customer Storefront)

### POST /orders

Create new order (customer checkout).

**Access**: Authenticated (customer)

**Request**:

```json
{
  "items": [
    {
      "productId": "uuid",
      "quantity": 2
    },
    {
      "productId": "uuid2",
      "quantity": 1
    }
  ],
  "deliveryAddressId": "address-uuid",
  "fulfillmentShopId": "shop1",
  "notes": "Please deliver before 5 PM"
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "data": {
    "order": {
      "id": "order-uuid",
      "orderNumber": "DS-20260325-0001",
      "items": [
        {
          "productId": "uuid",
          "productName": "Full Cream Milk 1L",
          "quantity": 2,
          "priceAtOrder": 60.0,
          "subtotal": 120.0
        },
        {
          "productId": "uuid2",
          "productName": "Organic Tomatoes",
          "quantity": 1,
          "priceAtOrder": 45.0,
          "subtotal": 45.0
        }
      ],
      "subtotal": 165.0,
      "tax": 24.75,
      "deliveryFee": 30.0,
      "total": 219.75,
      "status": "RECEIVED",
      "paymentStatus": "PENDING",
      "createdAt": "2026-03-25T11:30:00Z"
    },
    "payment": {
      "id": "payment-uuid",
      "gateway": "RAZORPAY",
      "amount": 219.75,
      "currency": "INR",
      "razorpayOrderId": "order_JQjF3yKlTxQRJy"
    }
  },
  "message": "Order created successfully. Complete payment to confirm."
}
```

**Errors**:

- `400`: Invalid items (out of stock, inactive products)
- `403`: Unauthorized (must be authenticated customer)
- `404`: Delivery address not found
- `422`: Validation errors

---

### POST /orders/:id/payment/webhook

Payment gateway webhook (Razorpay/Stripe) for async payment confirmation.

**Access**: Webhook (validates signature)

**Request**:

```json
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_JQjF3yKlTxQRJy",
        "order_id": "order_JQjF3yKlTxQRJy",
        "amount": 21975,
        "status": "captured"
      }
    }
  }
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

**Side Effects**:

- Updates Order.paymentStatus to PAID
- Sets Order.paidAt timestamp
- Deducts stock from fulfillment shop (atomic transaction)
- Sends order confirmation email to customer
- Creates audit log for stock deduction

**Errors**:

- `401`: Invalid webhook signature
- `404`: Order not found

---

### GET /orders/:id

Get order details (customer can only view own orders, admin can view all).

**Access**: Authenticated

**Request**: `GET /orders/order-uuid`

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "id": "order-uuid",
    "orderNumber": "DS-20260325-0001",
    "customer": {
      "id": "customer-uuid",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+91-9876543210"
    },
    "items": [
      {
        "productId": "uuid",
        "productName": "Full Cream Milk 1L",
        "quantity": 2,
        "priceAtOrder": 60.0,
        "subtotal": 120.0
      }
    ],
    "deliveryAddress": {
      "addressLine1": "123 Main Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "postalCode": "400001"
    },
    "fulfillmentShop": {
      "id": "shop1",
      "name": "Shop 1 - Main Street"
    },
    "subtotal": 165.0,
    "tax": 24.75,
    "deliveryFee": 30.0,
    "total": 219.75,
    "status": "PROCESSING",
    "paymentStatus": "PAID",
    "paidAt": "2026-03-25T11:35:00Z",
    "createdAt": "2026-03-25T11:30:00Z",
    "updatedAt": "2026-03-25T11:35:00Z"
  }
}
```

**Errors**:

- `403`: Customer trying to view another customer's order
- `404`: Order not found

---

### GET /orders

Get list of orders (paginated).

**Access**: Authenticated

**Query Parameters** (admin only):

- `status` (string, optional): Filter by status
- `customerId` (string, optional): Filter by customer
- `fulfillmentShopId` (string, optional): Filter by shop
- `startDate` (ISO 8601, optional)
- `endDate` (ISO 8601, optional)
- `page` (int, default: 1)
- `limit` (int, default: 20)

**Request** (customer): `GET /orders` (returns only own orders)

**Request** (admin): `GET /orders?status=RECEIVED&fulfillmentShopId=shop1&page=1`

**Response** (200 OK):

```json
{
  "success": true,
  "data": [
    {
      "id": "order-uuid",
      "orderNumber": "DS-20260325-0001",
      "customerName": "John Doe",
      "total": 219.75,
      "status": "RECEIVED",
      "paymentStatus": "PAID",
      "fulfillmentShop": "Shop 1 - Main Street",
      "createdAt": "2026-03-25T11:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 87,
    "totalPages": 5
  }
}
```

---

### PATCH /orders/:id/status

Update order status (admin only).

**Access**: Authenticated (OWNER/ADMIN only)

**Request**:

```json
{
  "status": "OUT_FOR_DELIVERY"
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "id": "order-uuid",
    "status": "OUT_FOR_DELIVERY",
    "updatedAt": "2026-03-25T14:00:00Z"
  },
  "message": "Order status updated successfully"
}
```

**Errors**:

- `400`: Invalid status transition
- `403`: Insufficient permissions
- `404`: Order not found

---

## Alert Endpoints

### GET /alerts

Get list of low-stock alerts (admin only).

**Access**: Authenticated (OWNER/ADMIN only)

**Query Parameters**:

- `shopId` (string, optional): Filter by shop
- `status` (string, optional): Filter by status (PENDING, SENT)
- `viewedByMe` (boolean, optional): Filter by viewed status
- `page` (int, default: 1)
- `limit` (int, default: 50)

**Request**: `GET /alerts?status=PENDING&shopId=shop1`

**Response** (200 OK):

```json
{
  "success": true,
  "data": [
    {
      "id": "alert-uuid",
      "product": {
        "id": "product-uuid",
        "name": "Full Cream Milk 1L",
        "sku": "DAIRY-001"
      },
      "shop": {
        "id": "shop1",
        "name": "Shop 1 - Main Street"
      },
      "alertType": "LOW_STOCK",
      "thresholdValue": 20,
      "quantityAtTrigger": 12,
      "status": "SENT",
      "emailSent": true,
      "pushSent": true,
      "triggeredAt": "2026-03-25T08:30:00Z",
      "sentAt": "2026-03-25T08:30:45Z",
      "viewedByMe": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 15,
    "totalPages": 1
  }
}
```

---

### POST /alerts/:id/view

Mark alert as viewed by current user.

**Access**: Authenticated (OWNER/ADMIN only)

**Request**: `POST /alerts/alert-uuid/view`

**Response** (200 OK):

```json
{
  "success": true,
  "message": "Alert marked as viewed"
}
```

---

### POST /alerts/:id/contact-supplier

Generate pre-filled WhatsApp/SMS message for supplier reorder.

**Access**: Authenticated (OWNER/ADMIN only)

**Request**: `POST /alerts/alert-uuid/contact-supplier`

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "supplier": {
      "id": "supplier-uuid",
      "businessName": "ABC Dairy Farms",
      "contactPerson": "Ravi Kumar",
      "phone": "+91-9876543210",
      "whatsappNumber": "+91-9876543210"
    },
    "message": "Hi Ravi, we need to reorder Full Cream Milk 1L. Current stock at Shop 1: 12 units. Reorder level: 20 units. Suggested quantity: 50 units. Please confirm availability. - DukaanSync",
    "whatsappUrl": "https://wa.me/919876543210?text=Hi%20Ravi...",
    "smsUrl": "sms:+919876543210?body=Hi%20Ravi..."
  }
}
```

---

## Supplier Endpoints

### GET /suppliers

Get list of suppliers (admin only).

**Access**: Authenticated (OWNER/ADMIN only)

**Query Parameters**:

- `search` (string, optional): Search by business name
- `isActive` (boolean, default: true)
- `page` (int, default: 1)
- `limit` (int, default: 20)

**Request**: `GET /suppliers?search=dairy&page=1`

**Response** (200 OK):

```json
{
  "success": true,
  "data": [
    {
      "id": "supplier-uuid",
      "businessName": "ABC Dairy Farms",
      "contactPerson": "Ravi Kumar",
      "phone": "+91-9876543210",
      "whatsappNumber": "+91-9876543210",
      "email": "ravi@abcdairy.com",
      "address": "Farm Road, Pune",
      "paymentTerms": "30 days net",
      "leadTimeDays": 2,
      "isActive": true,
      "productsSupplied": [
        {
          "id": "product-uuid",
          "name": "Full Cream Milk 1L",
          "sku": "DAIRY-001"
        }
      ],
      "createdAt": "2026-03-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "totalPages": 1
  }
}
```

---

### POST /suppliers

Create new supplier (admin only).

**Access**: Authenticated (OWNER/ADMIN only)

**Request**:

```json
{
  "businessName": "XYZ Spices Co.",
  "contactPerson": "Suresh Patel",
  "phone": "+91-9876543211",
  "whatsappNumber": "+91-9876543211",
  "email": "suresh@xyzspices.com",
  "address": "Spice Market, Delhi",
  "paymentTerms": "15 days net",
  "leadTimeDays": 7,
  "productIds": ["product-uuid-1", "product-uuid-2"]
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "data": {
    "id": "supplier-uuid-new",
    "businessName": "XYZ Spices Co.",
    "contactPerson": "Suresh Patel",
    "createdAt": "2026-03-25T12:00:00Z"
  },
  "message": "Supplier created successfully"
}
```

---

## Dashboard Endpoints

### GET /dashboard/stats

Get overview metrics for dashboard (admin only).

**Access**: Authenticated (OWNER/ADMIN only)

**Query Parameters**:

- `shopId` (string, optional): Filter by shop (defaults to all shops)

**Request**: `GET /dashboard/stats?shopId=shop1`

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "totalProducts": 487,
    "lowStockItems": 12,
    "todaySales": {
      "total": 15678.5,
      "orderCount": 42
    },
    "pendingOrders": 8,
    "recentAlerts": [
      {
        "id": "alert-uuid",
        "productName": "Full Cream Milk 1L",
        "shopName": "Shop 1 - Main Street",
        "quantityAtTrigger": 12,
        "triggeredAt": "2026-03-25T08:30:00Z"
      }
    ],
    "stockSummary": {
      "shop1": {
        "totalProducts": 487,
        "lowStockCount": 7,
        "outOfStockCount": 2
      },
      "shop2": {
        "totalProducts": 487,
        "lowStockCount": 5,
        "outOfStockCount": 1
      }
    }
  }
}
```

---

## Rate Limiting

- **Authenticated Endpoints**: 100 requests/minute per user
- **Public Endpoints** (login, register, storefront browsing): 10 requests/minute per IP
- **OTP Verification**: 5 attempts per 15 minutes per user

**Rate Limit Headers**:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1648215600
```

**Rate Limit Exceeded Response** (429):

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in 60 seconds.",
    "details": {
      "retryAfter": 60
    }
  }
}
```

---

## Error Codes

| Code                  | HTTP Status | Description                             |
| --------------------- | ----------- | --------------------------------------- |
| `VALIDATION_ERROR`    | 422         | Request validation failed               |
| `UNAUTHORIZED`        | 401         | Invalid or missing authentication       |
| `FORBIDDEN`           | 403         | Insufficient permissions                |
| `NOT_FOUND`           | 404         | Resource not found                      |
| `CONFLICT`            | 409         | Resource conflict (e.g., duplicate SKU) |
| `RATE_LIMIT_EXCEEDED` | 429         | Too many requests                       |
| `INTERNAL_ERROR`      | 500         | Server error                            |
| `SERVICE_UNAVAILABLE` | 503         | Service temporarily unavailable         |

---

## Constitutional Compliance Notes

✅ **Multi-Location Integrity**: All inventory endpoints include `shopId` parameter; stock adjustments are atomic transactions
✅ **Real-Time Sync**: Stock updates trigger Redis pub/sub events (clients poll `/events/poll` endpoint)
✅ **Mobile-First**: All endpoints return concise JSON optimized for mobile bandwidth
✅ **Security**: JWT authentication, MFA for owner, rate limiting, RBAC on all admin endpoints
✅ **Alerting**: `/alerts` endpoints support 60-second SLA tracking with `triggeredAt` and `sentAt` timestamps
✅ **API-First**: All business logic exposed via versioned REST API (`/api/v1/`)
