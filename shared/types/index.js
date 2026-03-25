// Common TypeScript interfaces (can be converted to .ts if needed)

// User types
export const UserRole = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  EMPLOYEE: "EMPLOYEE",
};

// Product types
export const ProductCategory = {
  STAPLES: "STAPLES",
  FRESH_PRODUCE: "FRESH_PRODUCE",
  DAIRY: "DAIRY",
  PACKAGED_GOODS: "PACKAGED_GOODS",
  SPICES: "SPICES",
  PERSONAL_CARE: "PERSONAL_CARE",
  OTHER: "OTHER",
};

export const ProductUnit = {
  KG: "KG",
  LITER: "LITER",
  PIECE: "PIECE",
  PACKET: "PACKET",
};

// Order types
export const OrderStatus = {
  RECEIVED: "RECEIVED",
  PROCESSING: "PROCESSING",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
};

export const PaymentStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
};

// Alert types
export const AlertType = {
  LOW_STOCK: "LOW_STOCK",
  EXPIRY_WARNING: "EXPIRY_WARNING",
};

export const AlertStatus = {
  PENDING: "PENDING",
  SENT: "SENT",
  FAILED: "FAILED",
};

export default {
  UserRole,
  ProductCategory,
  ProductUnit,
  OrderStatus,
  PaymentStatus,
  AlertType,
  AlertStatus,
};
