# Implementation Plan: AddProductForm Component

**Branch**: `001-add-product-form` | **Date**: 2026-03-26 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-dukaansync-platform/spec.md`

## Summary

Add a reusable React modal component `AddProductForm.jsx` to enable shop owners to create new products directly from the admin dashboard inventory page. The form captures product details (SKU, name, category, price, stock levels) and submits to the existing POST /api/v1/products endpoint. This component completes the product management CRUD workflow, transitioning from seed-script-only product creation to full UI-based product management.

## Technical Context

**Language/Version**: JavaScript (Node.js/React 18, ES Modules)
**Primary Dependencies**:

- React 18 (frontend framework)
- Tailwind CSS (styling)
- Axios (HTTP client via inventory.service.js)
- React Router 6 (already in use)

**Storage**: PostgreSQL 16 via Prisma ORM
**Testing**: Manual E2E testing against live backend + cross-browser validation
**Target Platform**: Web (React admin dashboard - admin-web)
**Project Type**: Feature component within web application
**Performance Goals**: Form submission response < 3 seconds, modal render < 200ms
**Constraints**: Must work on mobile (touch-friendly), tablet, and desktop screens
**Scale/Scope**: Single modal component with validation, error handling, and state management

## Constitution Check

**Gate Status**: ✅ PASS - No violations

**Checks**:

- ✅ **Multi-Location Data Integrity**: Form creates Stock records for both Shop 1 and Shop 2 with initialStock values
- ✅ **Real-Time Synchronization**: Created product immediately appears in inventory grid (within 5s sync requirement)
- ✅ **Mobile-First Design**: Form modal uses touch-optimized UI, all action items accessible in <3 taps
- ✅ **Security & Access Control**: Leverages existing JWT authentication, endpoint enforces OWNER/ADMIN role
- ✅ **API-First Architecture**: Uses existing REST endpoint POST /api/v1/products (no direct DB access)

## Project Structure

### Documentation

```text
specs/001-dukaansync-platform/
├── spec.md                       # Feature specification (updated)
├── plan.md                       # This file (implementation plan)
├── tasks.md                      # Task breakdown (updated)
└── contracts/
    └── add-product-form-api.md   # API contract specification
```

### Source Code

```text
admin-web/src/
├── components/
│   ├── common/
│   │   └── Modal.jsx             # ✅ Existing (modal wrapper)
│   └── inventory/
│       ├── AddProductForm.jsx    # ✅ Created (new component)
│       ├── ProductCard.jsx       # ✅ Existing
│       ├── StockAdjustForm.jsx   # ✅ Existing (reference)
│       └── TransferForm.jsx      # ✅ Existing (reference)
│
├── pages/
│   └── Inventory.jsx             # ✅ Modified (integrated button & modal)
│
└── services/
    └── inventory.service.js      # ✅ Existing (createProduct function ready)
```

**Status**: ✅ Implementation complete, ready for testing phase.

## Implementation Approach

### Phase 1: Component Design (✅ Complete)

- Form state management with useState hooks
- Validation logic (client-side before API submission)
- Error handling (field-level + global errors)
- UI/UX design matching existing admin dashboard components

### Phase 2: Integration (✅ Complete)

- Integrated into Inventory.jsx page
- "Add New Product" button triggers modal
- Callback to refresh product list after successful creation
- Form state reset on modal close

### Phase 3: Testing (⏳ Ready)

- Manual E2E testing (happy path, validation, errors)
- API contract validation
- Cross-browser testing
- Accessibility testing (WCAG 2.1 AA)

## Technical Dependencies

**Backend Requirements**:

- ✅ POST /api/v1/products endpoint exists and functional
- ✅ JWT authentication middleware enforces OWNER/ADMIN role
- ✅ Prisma schema supports Product and Stock entities
- ✅ PostgreSQL database initialized with schema

**Frontend Requirements**:

- ✅ React 18 with hooks support
- ✅ Tailwind CSS configured
- ✅ Axios HTTP client with interceptors
- ✅ Modal component available
- ✅ inventory.service.js with createProduct function

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
