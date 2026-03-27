# Operational Excellence (Phase 2) - System Architecture

This document details the enhancements made during Phase 2 of the Lanka POS overhaul, focusing on accountability, financial integrity, and proactive management.

## 1. Audit Logging System (Traceability)

### Purpose
To ensure all critical system mutations are attributed to specific staff members, providing a tamper-evident trail for price changes, status toggles, and configuration updates.

### Architecture
- **Data Model**: `AuditLog` table stores `staffId`, `staffName`, `action` (e.g., UPDATE_PRICE), `resource` (e.g., Product:123), and JSON snapshots of `oldValues` and `newValues`.
- **Atomic Integrity**: All audit logs are created within the same database transaction as the business logic using `prisma.$transaction`.
- **Centralized Utility**: `src/utils/auditLogger.ts` provides a standardized interface for logging across controllers.

### Instrumented Modules
- **Products**: Tracks price updates, name changes, and status (active/inactive) toggles.
- **Settings**: Tracks all global system configuration changes.
- **Staff**: Tracks creation, role/name updates, deletion, and password resets.
- **Customers**: Tracks creation, contact info updates, and deletion.

---

## 2. Shift Reconciliation Framework

### Purpose
To identify financial discrepancies at the end of every work shift, enabling managers to track "Overage" or "Shortage" patterns.

### Mechanics
- **Backend Aggregation**: `getShiftReconciliation` calculates `variance = countedCash - expectedCash` for all closed shifts.
- **UI Integration**: A dedicated tab in `Reports Dashboard` allows managers to filter by date range and staff.
- **Exportability**: Managers can export reconciliation data to CSV for external audits.

---

## 3. Global Notification Center

### Purpose
To transform Lanka POS from a reactive system to a proactive one by alerting staff to critical events without requiring manual report checks.

### Components
- **`useNotificationStore`**: A Zustand-based store for managing active and historical alerts.
- **`NotificationCenter.tsx`**: A premium UI component with unread badges, integrated into both Admin and POS headers.
- **Proactive Stock Monitor**: `useStockMonitor.ts` hook polls inventory levels in the background and triggers "Low Stock" alerts automatically.

---

## 4. Key Files & Locations
- **Backend**: `src/utils/auditLogger.ts`, `src/controllers/reports.controller.ts`.
- **Frontend**: `client/src/components/NotificationCenter.tsx`, `client/src/hooks/useStockMonitor.ts`.
- **Database**: `prisma/schema.prisma` (`AuditLog` model).
