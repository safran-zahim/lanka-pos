# Dashboard Intelligence & Business Tracking System

## Overview
The Lanka POS Dashboard has been transformed into a high-density Business Intelligence (BI) center. It provides real-time tracking of financial health, product performance, and inventory velocity.

## Key Performance Indicators (The "Pulse")
The dashboard header (Pulse bar) tracks five critical metrics using high-fidelity gradient cards:
1.  **Today's Revenue**: Total sales (gross) for the current day.
2.  **Today's Profit**: Net profit (Gross Sales - Cost Price) for the current day.
3.  **Average Transaction Value (ATV)**: How much the average customer spends per visit.
4.  **Inventory Value**: Total monetary value of all stock on hand.
5.  **Stock Health**: Real-time status of inventory levels, alerting if any items are below their reorder points.

## Product Intelligence
### Top Performing Products
- **Logic**: Aggregates `SaleItem` data over the last 30 days.
- **Metrics**: Displays Quantity Sold and Total Revenue generated.
- **Linkage**: `reports.controller.ts -> getDashboardInsights`.

### Brand Mix Distribution
- **Logic**: Calculates revenue contribution grouped by Product Brand.
- **Visual**: Doughnut chart representing market share within the store.

### Slow Movers Alert
- **Logic**: Identifies products that have stock-on-hand but zero sales in the last 30 days.
- **Purpose**: Helps business owners identify dead stock for promotions or liquidations.

## UI/UX Enhancements
### Dynamic Sidebar Alerts
- The "Low Stock" menu item in the `AdminLayout` sidebar now features a live badge showing the number of items requiring attention.
- Color Logic: Red for critical inventory alerts.

### Aesthetic Alignment
- Dashboard cards now use the same premium gradient/shadow design language as the Reports Page, ensuring a unified professional feel across the Admin interface.

## Technical Architecture
### Backend (Node.js/Prisma)
- **Controller**: `src/controllers/reports.controller.ts`.
- **Optimization**: Uses bulk fetching and in-memory aggregation to minimize database load compared to legacy O(N) queries.
- **Calculation**: Multiplies `SaleItem.price` * `SaleItem.quantity` to ensure 100% financial accuracy across different batches.

### Frontend (React/Vite)
- **Page**: `client/src/pages/Dashboard.tsx`.
- **Layout**: `client/src/layouts/AdminLayout.tsx`.
- **Charts**: Implementation using `react-chartjs-2`.
