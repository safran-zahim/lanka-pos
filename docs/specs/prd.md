# Product Requirements Document (PRD) - Lanka POS

## 1. Vision & Strategy
Lanka POS is designed to be a lightweight, yet powerful, point-of-sale and inventory management system for retail businesses in Sri Lanka. It balances modern UI/UX with robust backend logic for stock tracking, customer loyalty, and credit management.

## 2. Target Audience
- **Retail Store Owners**: Need simple inventory tracking and sales reporting.
- **Cashiers**: Need a fast, intuitive interface for checkout and returns.
- **Managers**: Need to track staff performance, shift reconciliation, and supplier debts.

## 3. Key Feature Modules

### 3.1 Point of Sale (POS)
- **High-Speed Checkout**: Support barcode scanning and keyboard shortcuts.
- **Multi-Payment Support**: Cash, Card, Credit (Debt), and Split payments.
- **Parked Sales**: Save current cart to serve another customer and restore it later.
- **Returns & Refunds**: Process returns against a parent sale with quantity verification and prorated tax/discount adjustments.
- **Digital Receipts**: Professional receipt generation with thermal print support.

### 3.2 Inventory & Procurement
- **Product Management**: CRUD for Products with Units, Brands, and hierarchical Categories (Sub-Categories).
- **FIFO Stock Management**: Automatically deduct from oldest purchase batches first to ensure accurate cost-of-goods-sold (COGS).
- **Low Stock Alerts**: Real-time visual alerts and notifications when stock falls below reorder levels.
- **Purchase Orders**: Multi-item procurement from suppliers with tracking of paid vs. due amounts.

### 3.3 Customer & Loyalty
- **Customer CRM**: Centralized database for customer contact info and history.
- **Loyalty Program**: Auto-calculation of points based on sales; simple redemption flow.
- **Credit (Debt) Management**: Global and per-customer credit limits; debt repayment tracking with FIFO allocation.

### 3.4 Operational Finance
- **Shift Management**: Drawer tracking (Open/Close), Petty Cash (In/Out), and Expected Cash reconciliation.
- **Expense Tracking**: Logging of operational costs (Utilities, Rent, Supplier payments).
- **Business Intelligence**: Dashboards for Net Sales, Gross Profit, Top Performers, and Inventory Velocity.

## 4. Current Gaps & Future Roadmap

### 4.1 Missing Features (Future Potential)
- **Gift Vouchers**: Support for issuing and redeeming physical/digital gift cards.
- **Advanced Tax Customization**: Support for category-specific tax rates (e.g., VAT vs. SSCL) and region-based rules.
- **Subscription Plans**: Implementation of a "Plan" catalog with tiered feature unlocking.
- **Multi-Store & Cloud Sync**: Centralized management for multiple physical branches.

### 4.2 Known Functional Issues
- Audit log coverage not yet applied to Expenses and Petty Cash.
- Customer credit limit enforcement is active in logic but needs better UI visibility during checkout.

## 5. UI/UX Principles
- **Modern Retail Aesthetics**: Clean gradients, semantic color coding (Success/Warning/Danger), and premium dark-mode support.
- **Responsiveness**: Mobile-first design for tablet-based POS setups.
- **Micro-Animations**: Subtle feedback for actions (Button clicks, Toast notifications).

## 6. Success Metrics
- Reduction in checkout time.
- Accuracy of batch-based stock counts.
- Zero variance in shift cash reconciliation.
