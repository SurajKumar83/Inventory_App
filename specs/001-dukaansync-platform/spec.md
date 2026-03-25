# Feature Specification: DukaanSync Platform

**Feature Branch**: `001-dukaansync-platform`
**Version**: v1.0
**Created**: 2026-03-25
**Status**: Draft
**Input**: User description: "Build a stunning, high-converting grocery inventory and online store for 'DukaanSync'. 1. Admin Dashboard: Full-screen web app, clean white + green palette, large typography 'Manage Your Two Shops', sidebar navigation, card-based inventory overview with live stock counts and low-stock badges. 2. Product Catalog: Grid of product cards (staples, fresh produce, dairy, packaged, spices, personal care). Each card shows product image, name, price, stock at Shop 1 and Shop 2, reorder level indicator, and an edit button. 3. Online Storefront: Customer-facing web + mobile store with category browsing, search, cart, UPI/card checkout, and order tracking. 4. Two-shop stock engine: Every sale deducts from the correct shop, alerts fire when stock hits reorder level, supplier reorder flow via WhatsApp/SMS."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Multi-Location Inventory Management (Priority: P1)

Shop owner logs into the admin dashboard to check current stock levels across Shop 1 (Main Street) and Shop 2 (Market Road). Owner views real-time inventory counts, identifies products running low at specific locations, and updates stock quantities after receiving supplier deliveries. Owner transfers products between shops when one location has excess and the other is running low.

**Why this priority**: This is the core value proposition - enabling a solo shop owner to manage inventory across two physical locations from a single interface. Without this, the owner cannot track stock accurately or make informed restocking decisions.

**Independent Test**: Can be fully tested by creating products, setting initial stock levels for both shops, performing stock adjustments (add/remove/transfer), and verifying that all changes are accurately reflected in the dashboard with correct per-location counts.

**Acceptance Scenarios**:

1. **Given** owner is logged into the dashboard, **When** viewing the inventory overview, **Then** system displays current stock count for each product at Shop 1 and Shop 2 separately with last updated timestamp
2. **Given** owner selects a product, **When** updating stock quantity at Shop 1, **Then** system saves the change, displays confirmation, and updates only Shop 1's count without affecting Shop 2
3. **Given** owner has 50 units at Shop 1 and 20 units at Shop 2, **When** owner transfers 15 units from Shop 1 to Shop 2, **Then** Shop 1 shows 35 units and Shop 2 shows 35 units with transfer logged in audit trail
4. **Given** owner is viewing inventory on mobile device, **When** performing any stock adjustment, **Then** operation completes in 3 taps or fewer with touch-optimized controls

---

### User Story 2 - Low-Stock Alerts & Supplier Management (Priority: P2)

Shop owner configures reorder levels for each product (e.g., alert when rice falls below 20kg at Shop 1). When stock hits the threshold, owner receives push notification on mobile app and email alert. Owner reviews the alert, checks current supplier pricing, and sends a reorder request to the supplier via WhatsApp or SMS directly from the app.

**Why this priority**: Prevents stockouts which directly impact revenue. Automated alerts ensure the owner never misses critical restocking windows even when not actively monitoring the dashboard.

**Independent Test**: Can be tested by setting reorder thresholds, simulating stock depletion through sales or manual adjustments until threshold is reached, verifying alert delivery within 60 seconds, and confirming supplier communication flow works end-to-end.

**Acceptance Scenarios**:

1. **Given** product reorder level is set to 20 units for Shop 1, **When** stock falls to 20 or below, **Then** system triggers alert within 60 seconds via push notification, email, and in-app dashboard badge
2. **Given** owner receives low-stock alert, **When** opening alert details, **Then** system displays product name, current stock at affected location, reorder level, and supplier contact options
3. **Given** owner is viewing alert for low-stock product, **When** selecting "Contact Supplier" option, **Then** system launches WhatsApp or SMS with pre-filled message containing product name, current stock, and typical reorder quantity
4. **Given** owner is offline when stock hits reorder level, **When** connectivity is restored, **Then** system delivers all pending alerts within 5 seconds of reconnection

---

### User Story 3 - Customer Online Shopping Experience (Priority: P3)

Customer visits DukaanSync storefront on mobile or web, browses products by category (staples, fresh produce, dairy, etc.), searches for specific items, adds products to cart, proceeds to checkout, pays via UPI or card, and receives order confirmation with tracking details. Customer can view order status and estimated delivery time.

**Why this priority**: Extends business reach beyond physical shops, enabling 24/7 revenue generation. While important for growth, the business can operate without online sales initially using just in-store transactions.

**Independent Test**: Can be tested by a user with no admin access navigating the storefront, completing a purchase flow from product discovery through payment, and verifying order appears in the admin dashboard with stock automatically deducted from the fulfillment shop.

**Acceptance Scenarios**:

1. **Given** customer visits storefront, **When** browsing products by category, **Then** system displays product grid with images, names, prices, and "Add to Cart" button for items in stock at either shop
2. **Given** customer has items in cart, **When** proceeding to checkout, **Then** system displays order summary, delivery address form, and payment options (UPI, credit/debit card)
3. **Given** customer completes payment, **When** order is confirmed, **Then** system deducts stock from the designated fulfillment shop, sends order confirmation email with tracking link, and displays order in customer's account
4. **Given** customer is on mobile device, **When** searching for product by name, **Then** system returns relevant results within 2 seconds with touch-optimized result cards
5. **Given** product is out of stock at both shops, **When** customer views product details, **Then** system displays "Currently Unavailable" message instead of "Add to Cart" button

---

### User Story 4 - Visual Dashboard Overview (Priority: P4)

Shop owner opens the admin dashboard to a full-screen interface with clean white background, green accent colors, and large typography displaying "Manage Your Two Shops". Sidebar navigation provides quick access to Inventory, Orders, Alerts, Suppliers, and Reports sections. Main content area shows card-based overview with key metrics: total products, low-stock items count, today's sales, and pending orders. Each card uses visual indicators (badges, color coding) for status.

**Why this priority**: Enhances user experience and operational efficiency but is not critical for core functionality. The owner can manage inventory without a visually polished dashboard initially.

**Independent Test**: Can be tested by logging into the dashboard, verifying all visual elements render correctly across different screen sizes, and checking that metric cards display accurate real-time data pulled from inventory and order systems.

**Acceptance Scenarios**:

1. **Given** owner logs into admin dashboard, **When** dashboard loads, **Then** system displays full-screen interface with white + green color scheme, large "Manage Your Two Shops" heading, and sidebar navigation menu
2. **Given** owner is viewing the dashboard, **When** looking at the overview cards, **Then** system displays total product count, number of low-stock items with red badge, today's sales total, and pending order count with auto-refresh every 30 seconds
3. **Given** owner clicks on "Low Stock" badge showing 5 items, **When** badge is clicked, **Then** system navigates to filtered inventory view showing only the 5 products below reorder threshold
4. **Given** owner is on a tablet device, **When** rotating between portrait and landscape, **Then** dashboard layout adapts responsively while maintaining usability and readability

---

### Edge Cases

- What happens when customer attempts to purchase quantity exceeding available stock at both shops?
- How does system handle simultaneous stock adjustments from multiple devices (e.g., owner updating stock on mobile while sales automatically deduct on web dashboard)?
- What occurs when supplier reorder message fails to send via WhatsApp/SMS due to network error?
- How are orders fulfilled when customer's selected item is available at both shops (which shop's stock is deducted)?
- What happens if payment gateway times out during checkout but payment was actually processed?
- How does system behave when owner sets reorder level higher than current stock (immediate alert or wait for next stock change)?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST maintain separate inventory counts for Shop 1 and Shop 2 for each product with atomic updates ensuring data consistency
- **FR-002**: System MUST provide admin dashboard accessible via web browser with authentication requiring username and password
- **FR-003**: System MUST display product catalog in grid layout showing product image, name, price per unit, current stock at Shop 1, current stock at Shop 2, and reorder level indicator
- **FR-004**: System MUST allow owner to create, edit, and delete products with fields for name, category, price, images, and per-shop reorder levels
- **FR-005**: System MUST support product categories including staples, fresh produce, dairy, packaged goods, spices, and personal care (custom category management deferred to v2)
- **FR-006**: System MUST enable stock quantity adjustments (add, remove, transfer between shops) with mandatory reason/note field for audit trail
- **FR-007**: System MUST trigger low-stock alert when product quantity at any shop falls to or below configured reorder level, delivering notification within 60 seconds
- **FR-008**: System MUST send alerts via push notification to mobile app, email, and in-app dashboard badge simultaneously
- **FR-009**: System MUST provide supplier contact list with name, phone number, email, and products supplied (suppliers are shared across both shops)
- **FR-010**: System MUST generate pre-filled WhatsApp or SMS message with product name, current stock, and suggested reorder quantity (calculated as 2× reorder level minus current stock, rounded up to supplier minimum order quantity, default 10 units) when owner initiates supplier contact; failures logged with retry button in alerts interface, system retries up to 3 times with 5-minute intervals
- **FR-011**: System MUST provide customer-facing storefront accessible on web and mobile with responsive design
- **FR-012**: System MUST support product browsing by category with visual grid layout showing product cards
- **FR-013**: System MUST provide search functionality returning results within 2 seconds based on product name or category keywords using case-insensitive partial match (PostgreSQL ILIKE) with minimum 2 characters required
- **FR-014**: System MUST implement shopping cart allowing customers to add/remove items, adjust quantities, and view total price
- **FR-015**: System MUST support checkout process with delivery address collection, payment method selection (UPI, credit card, debit card), and order confirmation
- **FR-016**: System MUST integrate with payment gateway supporting UPI and card payments with secure tokenization
- **FR-017**: System MUST automatically deduct purchased quantities from designated fulfillment shop's inventory upon successful payment
- **FR-018**: System MUST send order confirmation email with order number, items, total price, delivery address, and tracking information
- **FR-019**: System MUST provide order tracking page showing order status (received, processing, out for delivery, delivered) with timestamps
- **FR-020**: System MUST synchronize inventory changes across all interfaces (admin web, admin mobile, customer storefront) within 5 seconds under normal network conditions (defined as 4G mobile: 50Mbps down, 10Mbps up, <100ms latency, or better; degraded mode 10-30s sync for 3G: 5Mbps down, <500ms latency)
- **FR-021**: System MUST implement role-based access control distinguishing between owner/admin role and customer role with appropriate permission restrictions
- **FR-022**: System MUST enforce password authentication with minimum 12-character requirement and mandatory multi-factor authentication for owner account
- **FR-023**: System MUST maintain immutable audit log recording all inventory transactions (who, what, when, which shop) retained for minimum 2 years
- **FR-024**: System MUST prevent product from being added to cart when out of stock at all shops, displaying "Currently Unavailable" instead
- **FR-025**: System MUST handle simultaneous stock updates using conflict resolution based on server-side transaction commit timestamp (UTC) as authoritative source; client timestamps are advisory only
- **FR-026**: System MUST queue offline operations (stock adjustments, transfers) and automatically sync when connectivity is restored
- **FR-027**: System MUST display dashboard with white background, green accent colors (primary: green-600 #059669, hover: green-700 #047857, light backgrounds: green-100 #d1fae5), large "Manage Your Two Shops" heading, and sidebar navigation
- **FR-028**: System MUST show overview cards displaying total product count, low-stock item count with badge, today's sales total, and pending order count with auto-refresh every 30 seconds
- **FR-029**: System MUST select fulfillment shop for customer orders by choosing the shop with higher stock quantity; on tie, prefer Shop 1 as default; expose selected shop in order confirmation
- **FR-030**: System MUST retry payment webhook verification up to 3 times with exponential backoff (1min, 5min, 15min); unresolved payments flagged in admin dashboard for manual review after 24 hours
- **FR-031**: System MUST enforce JWT refresh token expiry after 7 days of inactivity as per session timeout policy
- **FR-032**: System MUST encrypt Personal Identifiable Information (PII) at rest using AES-256 encryption
- **FR-033**: System MUST use TLS 1.3 or higher for all network connections between clients and backend API
- **FR-034**: System MUST comply with PCI-DSS principles by never storing payment card data; use tokenization via payment gateway for all card transactions

### Key Entities _(include if feature involves data)_

- **Product**: Represents a grocery item available for sale. Attributes include name, description, category (one of: Staples, Fresh Produce, Dairy, Packaged Goods, Spices & Condiments, Personal Care), base price, image URLs, barcode/SKU, and per-shop reorder levels. Each product has separate stock quantities tracked per shop location.

- **Shop/Location**: Represents a physical store location (Shop 1 or Shop 2). Attributes include shop name, address, contact phone, operating hours. Used to partition inventory data and determine fulfillment location for orders.

- **Stock**: Represents the quantity of a specific product available at a specific shop. Attributes include product reference, shop reference, current quantity, reorder level threshold, last updated timestamp. Changes to stock create audit trail entries.

- **Customer**: Represents end-user purchasing from online storefront. Attributes include name, email, phone, delivery addresses, payment methods (tokenized), order history. Customers have read-only access to product catalog and their own orders.

- **Order**: Represents a customer purchase transaction. Attributes include order number, customer reference, order date/time, line items (product, quantity, price), subtotal, tax, delivery fee, total, payment status, fulfillment shop, delivery address, order status (received/processing/out for delivery/delivered), tracking information.

- **Supplier**: Represents vendor providing products to shops. Attributes include business name, contact person, phone, email, WhatsApp number, products supplied, typical lead time, payment terms. Used for reorder workflow.

- **Alert**: Represents a low-stock notification. Attributes include product reference, shop reference, triggered timestamp, alert type (low-stock), threshold value, current quantity at trigger time, delivery status (sent/pending), viewed status.

- **User/Owner**: Represents authenticated admin user managing the system. Attributes include name, email, phone, hashed password, multi-factor authentication secret, role (owner/admin), last login timestamp.

- **OrderItem**: Represents a line item in an order linking Order to Product. Attributes include product reference, quantity ordered, price snapshot at time of order (historical accuracy), subtotal. Ensures order history remains accurate even if product prices change later.

- **Payment**: Represents payment transaction details for an order. Attributes include order reference (1:1 relationship), payment gateway (Razorpay/Stripe/UPI/Card), gateway transaction ID, amount, currency (INR), status (pending/success/failed/refunded), failure reason, timestamps. Tracks payment confirmation for order fulfillment.

- **DeliveryAddress**: Represents saved customer shipping addresses. Attributes include customer reference, address lines, city, state, postal code, default flag. Supports multiple addresses per customer for reusable delivery locations.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Shop owner can view current stock levels for all products across both shops in under 3 seconds from dashboard load
- **SC-002**: Low-stock alerts are delivered to owner within 60 seconds of stock falling to reorder level via push notification, email, and in-app badge
- **SC-003**: Owner can complete common tasks (check stock, adjust quantity, transfer between shops) in 3 taps or fewer on mobile app
- **SC-004**: Inventory updates sync across all interfaces (web dashboard, mobile app, customer storefront) within 5 seconds under normal network conditions
- **SC-005**: Customers can complete product search and receive results within 2 seconds on mobile devices
- **SC-006**: Customers can complete entire purchase flow (browse → cart → checkout → payment) in under 5 minutes on first attempt
- **SC-007**: System prevents stockout errors by ensuring 100% accuracy in multi-location inventory tracking, measured by: (a) zero instances of negative stock counts, (b) zero discrepancies between audit log and stock table verified by daily reconciliation job, (c) zero oversold orders confirmed by stock validation before payment processing
- **SC-008**: System supports 1000 concurrent users (customers + owner) without performance degradation, maintaining API response times under 300ms (p95)
- **SC-009**: Mobile storefront achieves Lighthouse performance score of 90 or higher on mid-range devices
- **SC-010**: Admin dashboard loads and becomes interactive within 2 seconds on standard broadband connection (defined as wired/WiFi: 25Mbps down, 5Mbps up, <50ms latency)
- **SC-011**: System maintains 99.5% uptime measured over 30-day periods excluding scheduled maintenance windows
- **SC-012**: 90% of customers successfully complete checkout on first attempt without encountering errors or confusion

## Assumptions

### Technical Assumptions

- Target users (shop owners) have smartphones with data connectivity and use WhatsApp for business communication
- Customers have internet access via mobile or desktop browsers to access online storefront
- Payment gateway integration will use a third-party service (e.g., Razorpay, Stripe) supporting UPI and card payments with tokenization
- Product images will be uploaded and stored by shop owner; system does not auto-generate or source images
- Initial product data (names, prices, categories) will be manually entered by owner; no bulk import from existing POS system in v1

### Business Assumptions

- Delivery logistics (driver assignment, route optimization) are out of scope; system only tracks order status manually updated by owner
- Both shops operate in the same region/city with owner personally managing restocking and transfers
- Product pricing is uniform across both shops (no per-location pricing in v1)
- Inventory counts represent physical stock only; system does not handle concepts like reserved/allocated stock for pending orders
- Owner is sole admin user initially; multi-user access with employee roles and per-location permissions is deferred to future version
- System operates in single currency (INR ₹ assumed based on UPI payment method)

### Scope Limitations (Out of Scope for v1.0)

- Barcode/QR code scanning for quick stock updates is out of scope for v1; all entries are manual
- Returns and refunds workflow is simplified; detailed RMA process deferred to future version
- Purchase orders and supplier invoicing are tracked externally; system only facilitates communication for reorders

---

## Glossary

**Technical Acronyms:**

- **API**: Application Programming Interface - standardized way for different software systems to communicate
- **JWT**: JSON Web Token - secure token format for authentication
- **MFA**: Multi-Factor Authentication - security requiring two or more verification methods
- **OTP**: One-Time Password - temporary code sent via email or SMS for verification
- **RBAC**: Role-Based Access Control - permission system based on user roles
- **SKU**: Stock Keeping Unit - unique identifier for each product (barcode or internal code)
- **TLS**: Transport Layer Security - encryption protocol for secure network communication
- **UPI**: Unified Payments Interface - real-time payment system used in India

**Security Standards:**

- **AES-256**: Advanced Encryption Standard with 256-bit key - industry-standard encryption algorithm
- **PCI-DSS**: Payment Card Industry Data Security Standard - security requirements for handling card payments

**Technical Terms:**

- **ACID**: Atomicity, Consistency, Isolation, Durability - database transaction reliability principles
- **CRUD**: Create, Read, Update, Delete - basic database operations
- **GST**: Goods and Services Tax - Indian tax system
- **SMS**: Short Message Service - text messaging

---

_End of Specification_
