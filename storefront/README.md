# DukaanSync Storefront

Customer-facing e-commerce storefrontfor DukaanSync grocery delivery.

## 🏗️ Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 3
- **Routing**: React Router 6
- **State Management**: Zustand
- **HTTP Client**: Axios (via shared/api-client)
- **Payment**: Razorpay Checkout
- **Storage**: localStorage for cart persistence
- **Deployment**: Vercel

## 📁 Project Structure

```
storefront/
├── src/
│   ├── components/
│   │   ├── ProductGrid.jsx    # Product cards grid
│   │   ├── SearchBar.jsx      # Debounced search (300ms)
│   │   ├── Cart.jsx           # Cart display with totals
│   │   └── Checkout.jsx       # Checkout flow
│   ├── pages/
│   │   ├── Home.jsx           # Homepage with categories
│   │   ├── Products.jsx       # Product listing
│   │   ├── ProductDetail.jsx  # Single product view
│   │   ├── CartPage.jsx       # Shopping cart
│   │   ├── Checkout.jsx       # Checkout & payment
│   │   └── OrderTracking.jsx  # Order status timeline
│   ├── services/
│   │   ├── order.service.js   # Order API calls
│   │   └── payment.service.js # Razorpay integration
│   ├── store/
│   │   └── cartStore.js       # Cart state (Zustand)
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
- Backend API running
- Razorpay account (test mode for development)

### Installation

```bash
cd storefront
npm install
```

### Environment Configuration

Create `.env` file:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
```

For production:

```env
VITE_API_URL=https://api.dukaansync.com/api/v1
VITE_RAZORPAY_KEY_ID=rzp_live_your_key_id
```

### Get Razorpay Credentials

1. Sign up at https://dashboard.razorpay.com/
2. Navigate to Settings → API Keys
3. Generate Test keys for development
4. Use Live keys for production

### Start Development Server

```bash
npm run dev
```

Application available at: http://localhost:5174

## 🛒 Features

### Homepage

- Hero section with search bar
- Category navigation (Staples, Fresh Produce, Dairy, etc.)
- Featured products grid
- Features section (Free Delivery, Fresh Products, Secure Payment)

### Product Catalog

- Product grid with images
- Search by name/description
- Filter by category
- Pagination (20 products per page)
- Product cards show: image, name, price, category, "Add to Cart" button

### Product Detail

- Large product image
- Full description
- Price per unit
- Stock availability status
- Quantity selector
- "Add to Cart" button
- Breadcrumb navigation

### Shopping Cart

- Cart items with quantity controls (+/-)
- Remove item button
- Order summary:
  - Subtotal
  - Tax (18% GST)
  - Delivery Fee (₹40 or FREE if ≥₹500)
  - Total
- "Proceed to Checkout" button
- Persistent cart (localStorage)
- Empty state with "Browse Products" CTA

### Checkout

- Delivery address form (or select saved address)
- Payment method selection:
  - Razorpay (UPI/Card/NetBanking/Wallets)
  - Cash on Delivery (COD)
- Order notes (optional)
- Order summary
- "Place Order" button

### Payment (Razorpay)

- Modal checkout interface
- Multiple payment options:
  - UPI (Google Pay, PhonePe, Paytm, etc.)
  - Credit/Debit Cards
  - NetBanking
  - Wallets (Paytm, MobiKwik, etc.)
- Automatic payment verification via webhook
- Success: Redirect to order tracking
- Failure: Automatic stock restoration, show error

### Order Tracking

- Order details (number, status, items, prices)
- Status timeline:
  - 📝 Order Placed (PENDING)
  - ✅ Confirmed (CONFIRMED)
  - 📦 Processing (PROCESSING)
  - 🚚 Shipped (SHIPPED)
  - ✨ Delivered (DELIVERED)
  - ❌ Cancelled (CANCELLED)
- Delivery address
- Payment information
- Cancel order button (if PENDING)

## 💳 Payment Integration

### Razorpay Checkout Flow

1. **Customer clicks "Place Order"**
2. **Backend creates Order + Payment record**
3. **Backend returns Razorpay order details**
4. **Frontend loads Razorpay modal**
5. **Customer completes payment**
6. **Razorpay sends webhook to backend**
7. **Backend verifies signature (HMAC SHA256)**
8. **Backend confirms order + deducts stock**
9. **Frontend redirects to order tracking**

### Test Cards (Razorpay)

**Success**:

- Card: 4111 1111 1111 1111
- CVV: Any 3 digits
- Expiry: Any future date

**Failure**:

- Card: 4000 0000 0000 0002

### UPI Testing

Use any UPI ID: `success@razorpay` for instant success

## 🎨 Design System

### Colors

**Primary (DukaanSync Green)**:

- `dukaan-green-50`: #f0fdf4
- `dukaan-green-600`: #059669 (buttons, accents)
- `dukaan-green-700`: #047857 (hover states)

**Accent Colors**:

- Red: Error states, remove buttons
- Yellow/Orange: Delivery fee, alerts
- Blue: Links, informational

### Typography

- Large headings for impact (text-3xl, text-4xl, text-5xl)
- Readable body text (text-base, text-lg)
- System font stack for performance

## 📱 Responsive Design

- **Mobile**: Single column, stack elements
- **Tablet**: 2-column product grid
- **Desktop**: 3-4 column product grid
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)

## 🧺 Cart Persistence

Cart stored in localStorage with key `dukaansync-cart`:

```javascript
{
  items: [
    {
      productId: "abc123",
      product: { name: "Basmati Rice", price: 120, ... },
      quantity: 2,
      price: 120
    }
  ]
}
```

Cart survives:

- Page refreshes
- Browser restarts
- Navigation between pages

Cleared on:

- Successful order placement
- Manual clear cart action

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
vercel -prod
```

Or connect GitHub repository for automatic deployments.

### Environment Variables on Vercel

Set in Vercel dashboard:

- `VITE_API_URL`: https://api.dukaansync.com/api/v1
- `VITE_RAZORPAY_KEY_ID`: rzp_live_your_key_id

## 🧪 Testing

### Test Checkout Flow

1. Browse products
2. Add items to cart
3. Go to checkout
4. Fill delivery address
5. Select "Razorpay" payment
6. Use test card: 4111 1111 1111 1111
7. Complete payment
8. Verify order confirmation

### Test COD

1. Complete checkout
2. Select "Cash on Delivery"
3. Click "Place Order"
4. Verify immediate order confirmation

### Test Stock Restoration

1. Complete checkout with Razorpay
2. Use failure card: 4000 0000 0000 0002
3. Verify order cancelled
4. Check stock restored in admin dashboard

## 📊 Performance

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Lighthouse Score**: 90+
- **Bundle Size**: ~200KB (gzipped)

Optimizations:

- Code splitting with React.lazy()
- Image optimization (WebP format)
- Tree-shaking unused code
- Minification and compression

## 🐛 Debugging

### View Cart State

```javascript
// In browser console
localStorage.getItem("dukaansync-cart");
```

### Clear Cart Manually

```javascript
localStorage.removeItem("dukaansync-cart");
location.reload();
```

### Test Payment Webhook Locally

Use ngrok to expose localhost:

```bash
# Install ngrok
npm i -g ngrok

# Expose backend
ngrok http 3000

# Update Razorpay webhook URL:
# Dashboard → Settings → Webhooks → Add Endpoint
# URL: https://your-ngrok-url.ngrok.io/api/v1/orders/payment/webhook
```

## 🔐 Security

- No sensitive data stored in frontend
- Payment handled entirely by Razorpay (PCI DSS compliant)
- Webhook signature verification prevents tampering
- HTTPS required for production
- CORS configured on backend

## 📄 License

MIT
