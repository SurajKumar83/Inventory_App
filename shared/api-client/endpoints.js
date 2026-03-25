// API endpoint constants
export const ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
    MFA_VERIFY: "/auth/mfa/verify",
  },

  // Products
  PRODUCTS: {
    LIST: "/products",
    GET: (id) => `/products/${id}`,
    CREATE: "/products",
    UPDATE: (id) => `/products/${id}`,
    DELETE: (id) => `/products/${id}`,
  },

  // Inventory
  INVENTORY: {
    ADJUST: "/inventory/adjust",
    TRANSFER: "/inventory/transfer",
    HISTORY: (productId) => `/inventory/history/${productId}`,
  },

  // Orders
  ORDERS: {
    LIST: "/orders",
    GET: (id) => `/orders/${id}`,
    CREATE: "/orders",
    UPDATE_STATUS: (id) => `/orders/${id}/status`,
    CANCEL: (id) => `/orders/${id}/cancel`,
    PAYMENT_WEBHOOK: "/orders/payment/webhook",
  },

  // Suppliers
  SUPPLIERS: {
    LIST: "/suppliers",
    GET: (id) => `/suppliers/${id}`,
    CREATE: "/suppliers",
    UPDATE: (id) => `/suppliers/${id}`,
    DELETE: (id) => `/suppliers/${id}`,
    LINK_PRODUCT: (id) => `/suppliers/${id}/products`,
  },

  // Alerts
  ALERTS: {
    LIST: "/alerts",
    GET: (id) => `/alerts/${id}`,
    UNVIEWED_COUNT: "/alerts/unviewed-count",
    MARK_VIEWED: (id) => `/alerts/${id}/mark-viewed`,
    CONTACT_SUPPLIER: (id) => `/alerts/${id}/contact-supplier`,
  },

  // Dashboard
  DASHBOARD: {
    STATS: "/dashboard/stats",
    LOW_STOCK: "/dashboard/low-stock",
    RECENT_ORDERS: "/dashboard/recent-orders",
  },

  // Customers (for storefront)
  CUSTOMERS: {
    PROFILE: "/customers/profile",
    ADDRESSES: "/customers/addresses",
    CREATE_ADDRESS: "/customers/addresses",
    UPDATE_ADDRESS: (id) => `/customers/addresses/${id}`,
    DELETE_ADDRESS: (id) => `/customers/addresses/${id}`,
  },
};

export default ENDPOINTS;
