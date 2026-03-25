# DukaanSync Admin Dashboard

React admin dashboard for managing DukaanSync inventory across two shops.

## 🏗️ Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 3
- **Routing**: React Router 6
- **State Management**: Zustand
- **HTTP Client**: Axios (via shared/api-client)
- **Icons**: Emoji-based
- **Deployment**: Vercel

## 📁 Project Structure

```
admin-web/
├── src/
│   ├── components/
│   │   ├── common/           # Reusable UI components
│   │   │   ├── Button.jsx
│   │   │   └── Modal.jsx
│   │   ├── inventory/        # Inventory-specific components
│   │   │   ├── ProductCard.jsx
│   │   │   ├── StockAdjustForm.jsx
│   │   │   └── TransferForm.jsx
│   │   ├── alerts/           # Alert components
│   │   │   ├── AlertBadge.jsx
│   │   │   └── AlertCard.jsx
│   │   ├── dashboard/        # Dashboard components
│   │   │   ├── DashboardCard.jsx
│   │   │   ├── OverviewMetrics.jsx
│   │   │   └── Sidebar.jsx
│   │   └── orders/           # Order management
│   │       └── OrderList.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx     # Main dashboard with metrics
│   │   ├── Inventory.jsx     # Product & stock management
│   │   ├── Orders.jsx        # Order management
│   │   ├── Alerts.jsx        # Low-stock alerts
│   │   ├── Suppliers.jsx     # Supplier management
│   │   └── Login.jsx         # Authentication
│   ├── hooks/
│   │   └── useRealTimeSync.js  # Real-time inventory sync
│   ├── services/
│   │   ├── inventory.service.js
│   │   ├── alert.service.js
│   │   └── supplier.service.js
│   ├── store/
│   │   ├── authStore.js      # Authentication state
│   │   └── inventoryStore.js # Inventory state
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── vercel.json              # Deployment config
└── package.json
```

## 🚀 Setup

### Prerequisites

- Node.js 20+
- Backend API running at http://localhost:3000

### Installation

```bash
cd admin-web
npm install
```

### Environment Configuration

Create `.env` file:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

For production:

```env
VITE_API_URL=https://api.dukaansync.com/api/v1
```

### Start Development Server

```bash
npm run dev
```

Application available at: http://localhost:5173

## 🎨 Features

### Dashboard

- Real-time metrics (products, low stock, sales, orders)
- Recent orders widget
- Auto-refresh every 30 seconds
- Sidebar navigation
- Click-through from metrics to detail pages

### Inventory Management

- Product list with search and category filters
- Pagination (20 items per page)
- Stock status indicators (in-stock/low-stock/out-of-stock)
- Stock adjustment (add/remove quantities)
- Stock transfer between Shop 1 and Shop 2
- Real-time sync (polls every 2 seconds for updates)
- Product CRUD operations

### Order Management

- Order list with status filters
- Search by order number, customer name/email
- Status updates (PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED)
- Order details with customer info, items, delivery address
- Payment status tracking

### Low-Stock Alerts

- Alert list with severity badges (HIGH/MEDIUM/LOW)
- Mark alerts as viewed
- Contact supplier (email/phone/WhatsApp)
- Filter by status (ACTIVE/RESOLVED)

### Supplier Management

- Supplier list with search
- Add/edit/delete suppliers
- Link products to suppliers
- Contact information (email, phone, WhatsApp)

## 🔐 Authentication

Login with admin credentials:

- Email: `admin@dukaansync.com`
- Password: `Admin@123`

Protected routes redirect to `/login` if not authenticated.

## 🎨 Design System

### Colors

**Primary (DukaanSync Green)**:

- `dukaan-green-50`: #f0fdf4
- `dukaan-green-100`: #d1fae5
- `dukaan-green-600`: #059669
- `dukaan-green-700`: #047857

**Typography**:

- Headings: Large, bold (text-3xl, text-4xl)
- Body: Regular, readable (text-base, text-sm)
- Font Family: System fonts (Inter-like)

### Components

All components use:

- Tailwind CSS for styling
- Consistent spacing (p-4, p-6, gap-4, gap-6)
- Shadow effects (shadow-md, shadow-lg)
- Rounded corners (rounded-lg)
- Hover states for interactive elements

## 📱 Responsive Design

- **Mobile**: Single column layout
- **Tablet**: 2-column grid for cards
- **Desktop**: 3-4 column grid, sidebar navigation
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)

## 🔄 Real-Time Sync

The admin dashboard polls for inventory updates every 2 seconds:

```javascript
// Usage in components
import useRealTimeSync from "../hooks/useRealTimeSync.js";

useRealTimeSync((events) => {
  // Handle inventory update events
  console.log("New events:", events);
  loadProducts(); // Refresh product list
});
```

Events include:

- `stock_adjusted`: Stock quantity changed
- `stock_transferred`: Stock moved between shops

## 🏗️ Build & Deployment

### Build for Production

```bash
npm run build
```

Output in `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Or connect GitHub repository to Vercel for automatic deployments.

### Environment Variables on Vercel

Set in Vercel dashboard:

- `VITE_API_URL`: https://api.dukaansync.com/api/v1

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run with coverage
npm test -- --coverage
```

## 📊 Performance

- Vite HMR for instant updates during development
- Code splitting via React.lazy() for routes
- Tree-shaking to minimize bundle size
- Asset optimization (minification, compression)

## 🐛 Debugging

View Redux DevTools for Zustand stores:

```javascript
// Already configured in store files
```

Enable API request logging:

```javascript
// In shared/api-client/index.js, uncomment:
// console.log('Request:', config);
// console.log('Response:', response);
```

## 📄 License

MIT
