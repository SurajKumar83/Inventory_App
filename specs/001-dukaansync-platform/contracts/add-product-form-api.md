# API Contract: POST /api/v1/products

**Version**: 1.0
**Created**: 2026-03-26
**Consumer**: AddProductForm component
**Provider**: Backend API (Express + Prisma)
**Endpoint**: `POST http://localhost:5000/api/v1/products`

---

## Overview

This contract defines the interface between the AddProductForm frontend component and the backend `POST /api/v1/products` endpoint. The endpoint creates a new product and associated stock records for both shop locations.

---

## Request Specification

### HTTP Method & Path

```
POST /api/v1/products
```

### Headers

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Note**: JWT access token is automatically attached by axios interceptor in `shared/api-client/index.js`

### Request Body

```json
{
  "sku": "string (required)",
  "name": "string (required)",
  "category": "enum (required)",
  "description": "string (optional)",
  "unit": "string (required)",
  "price": "number (required)",
  "imageUrls": ["string array (optional)"],
  "initialStock": {
    "shop1": "number (required)",
    "shop2": "number (required)"
  },
  "reorderLevel": "number (required)"
}
```

### Field Specifications

| Field                | Type   | Required | Constraints                                                                              | Example                                 |
| -------------------- | ------ | -------- | ---------------------------------------------------------------------------------------- | --------------------------------------- |
| `sku`                | string | ✅       | 1-50 chars, unique, alphanumeric + hyphen                                                | `"RICE-001"`                            |
| `name`               | string | ✅       | 3-100 chars                                                                              | `"Basmati Rice Premium"`                |
| `category`           | enum   | ✅       | One of: `STAPLES`, `FRESH_PRODUCE`, `DAIRY`, `PACKAGED_GOODS`, `SPICES`, `PERSONAL_CARE` | `"STAPLES"`                             |
| `description`        | string | ❌       | 0-500 chars                                                                              | `"High-quality basmati rice"`           |
| `unit`               | string | ✅       | 1-20 chars                                                                               | `"kg"`, `"L"`, `"piece"`                |
| `price`              | number | ✅       | > 0, up to 2 decimals                                                                    | `299.99`                                |
| `imageUrls[]`        | array  | ❌       | Valid URLs only                                                                          | `["https://cdn.example.com/image.jpg"]` |
| `initialStock.shop1` | number | ✅       | >= 0 (integer)                                                                           | `100`                                   |
| `initialStock.shop2` | number | ✅       | >= 0 (integer)                                                                           | `50`                                    |
| `reorderLevel`       | number | ✅       | >= 1 (integer)                                                                           | `20`                                    |

### Example Request

```bash
curl -X POST http://localhost:5000/api/v1/products \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "RICE-001",
    "name": "Basmati Rice Premium",
    "category": "STAPLES",
    "description": "High-quality basmati rice from Punjab",
    "unit": "kg",
    "price": 299.99,
    "imageUrls": ["https://cdn.example.com/rice.jpg"],
    "initialStock": {
      "shop1": 100,
      "shop2": 50
    },
    "reorderLevel": 20
  }'
```

---

## Response Specification

### Success Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "sku": "string",
    "name": "string",
    "category": "enum",
    "description": "string or null",
    "unit": "string",
    "price": "number",
    "imageUrls": ["string array"],
    "createdAt": "ISO8601 timestamp",
    "stocks": [
      {
        "shopId": "uuid",
        "shopName": "string",
        "quantity": "number",
        "reorderLevel": "number"
      }
    ]
  }
}
```

### Success Response Example

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "sku": "RICE-001",
    "name": "Basmati Rice Premium",
    "category": "STAPLES",
    "description": "High-quality basmati rice from Punjab",
    "unit": "kg",
    "price": 299.99,
    "imageUrls": ["https://cdn.example.com/rice.jpg"],
    "createdAt": "2026-03-26T10:30:00Z",
    "stocks": [
      {
        "shopId": "shop-1-id",
        "shopName": "Shop 1 - Main Street",
        "quantity": 100,
        "reorderLevel": 20
      },
      {
        "shopId": "shop-2-id",
        "shopName": "Shop 2 - Market Road",
        "quantity": 50,
        "reorderLevel": 20
      }
    ]
  }
}
```

---

## Error Responses

### 400 Bad Request - Validation Error

**Scenario**: Invalid or missing required fields

```json
{
  "success": false,
  "error": "Validation error",
  "details": {
    "sku": "SKU must be between 1 and 50 characters",
    "price": "Price must be a positive number"
  }
}
```

### 409 Conflict - Duplicate SKU

**Scenario**: Product with same SKU already exists

```json
{
  "success": false,
  "error": "Product with SKU 'RICE-001' already exists"
}
```

**Status Code**: 409 Conflict

### 401 Unauthorized - Missing/Invalid Authentication

**Scenario**: No JWT token or token expired

```json
{
  "success": false,
  "error": "Unauthorized - Please log in again",
  "code": "AUTH_REQUIRED"
}
```

**Status Code**: 401 Unauthorized

### 403 Forbidden - Insufficient Permissions

**Scenario**: User role is not OWNER or ADMIN

```json
{
  "success": false,
  "error": "Forbidden - Insufficient permissions to create products",
  "code": "PERMISSION_DENIED"
}
```

**Status Code**: 403 Forbidden

### 500 Internal Server Error

**Scenario**: Unexpected server error

```json
{
  "success": false,
  "error": "Internal server error",
  "code": "INTERNAL_ERROR"
}
```

**Status Code**: 500 Internal Server Error

---

## Client Implementation (inventory.service.js)

### Existing Function Signature

The `createProduct()` function already exists in `admin-web/src/services/inventory.service.js`:

```javascript
export const createProduct = async (productData) => {
  const response = await apiClient.post("/products", productData);
  return response.data;
};
```

### Usage in AddProductForm

```javascript
import { createProduct } from "../../services/inventory.service.js";

try {
  const response = await createProduct(payload);
  // response.data contains the created product and stocks
  onSuccess(response.data);
} catch (error) {
  if (error.response?.status === 409) {
    // Handle duplicate SKU
  } else {
    // Handle other errors
  }
}
```

---

## Backend Implementation Details

**Route Handler**: `backend/src/api/routes/v1/products.routes.js` (POST endpoint)

**Service Method**: `backend/src/services/product.service.js#createProduct()`

**Middleware**:

- `auth.middleware.js` - Validates JWT token, sets req.user
- `authorizationMiddleware` - Enforces OWNER/ADMIN role
- `validationMiddleware` - Validates request payload

**Database Operations**:

1. Validate payload and check for duplicate SKU
2. Create Product record in PostgreSQL
3. Create Stock records for Shop 1 and Shop 2
4. Return created product with stock information
5. Log audit trail in transaction

---

## Rate Limiting & Constraints

- **Rate Limit**: 100 requests per minute per authenticated user
- **Timeout**: 30 seconds
- **Payload Size**: Max 10 MB
- **Simultaneous Requests**: No limit (server-side conflict resolution by timestamp)

---

## Monitoring & Alerts

**Backend Monitoring**:

- Log all product creation attempts (success/failure)
- Alert on repeated 409 (duplicate SKU) errors from same user (possible automation/scraping)
- Alert on unusual creation volume (>100 products/hour)
- Monitor API response time (target: <500ms p95)

**Frontend Monitoring**:

- Track form abandonment rate
- Monitor submit errors and error types
- Track validation error frequency
- Monitor time-to-submit (from form open to successful creation)

---

## Versioning & Deprecation

**Current Version**: v1.0 (stable)

**Availability**: Indefinite (no planned deprecation)

**Breaking Changes**: None anticipated in near-term

**Backwards Compatibility**: N/A (initial version)

---

## Testing Scenarios

### Test Case 1: Valid Product Creation

```
Given: Valid product payload with all required fields
When: POST request sent
Then: 201 response with created product and stocks
```

### Test Case 2: Duplicate SKU

```
Given: SKU "RICE-001" already exists
When: POST request with SKU "RICE-001"
Then: 409 response with error message
```

### Test Case 3: Missing Required Field

```
Given: Payload missing "name" field
When: POST request sent
Then: 400 response with validation error
```

### Test Case 4: Invalid Price

```
Given: Payload with price = -10
When: POST request sent
Then: 400 response with error "Price must be positive"
```

### Test Case 5: Unauthorized Request

```
Given: Request without JWT token
When: POST request sent
Then: 401 response
```

### Test Case 6: Insufficient Permissions

```
Given: JWT token for CUSTOMER role
When: POST request sent
Then: 403 response
```
