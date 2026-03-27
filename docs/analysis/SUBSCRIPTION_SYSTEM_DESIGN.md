# Subscription System Design

## 1. Overview

The Lanka POS subscription system has been simplified from a multi-plan catalog model to a single-entity configuration model controlled directly by the developer (`super_admin`). This removal of complexity ensures that the system status, payment cycles, and expiration dates are centrally managed without the overhead of plan relations.

## 2. Database Schema

### 2.1 `AppConfig` Model

The `AppConfig` model serves as the single source of truth for the current system state.

- **`subscriptionStatus`**: (`active`, `blocked`, `canceled`, `past_due`) Determines if the system is operational.
- **`subscriptionExpiresAt`**: DateTime or null. If null and `isNeverEnd` is false, the system is considered expired.
- **`isNeverEnd`**: Boolean. If true, bypasses expiration checks (Lifetime/Infinite subscription).
- **`isSystemDisabled`**: Boolean. A global "kill-switch". If true, no non-`super_admin` can log in regardless of subscription status.
- **`paymentCycle`**: (`monthly`, `yearly`) Indicates the billing frequency for administrative tracking.
- **`clientNote`**: String or null. Developer-only internal note about the client or subscription details.

### 2.2 `SubscriptionHistory` Model

Every modification to the subscription configuration is logged for audit purposes.

- **`action`**: A comma-separated list of changes (e.g., `status_change,expiry_set`).
- **`previousStatus` / `newStatus`**: Snapshot of the status change.
- **`previousExpiresAt` / `newExpiresAt`**: Snapshot of the expiry change.
- **`paymentCycle`**: Snapshot of the payment cycle during the change.
- **`isNeverEnd` / `isSystemDisabled`**: Snapshots of the toggle states.
- **`note`**: A reason or developer comment provided at the time of update.
- **`changedBy`**: Relation to the `Staff` member who made the change.

## 3. Enforcement Logic

Subscription enforcement is performed **exclusively at login** to minimize API overhead and prevent mid-session interruptions.

### 3.1 Gating Rules

The `isSubscriptionValid` utility in `src/utils/appConfig.ts` evaluates validity based on:
1.  **System Disabled**: If `isSystemDisabled` is true, access is blocked.
2.  **Status Blocked/Canceled**: If `subscriptionStatus` is `blocked` or `canceled`, access is blocked.
3.  **Expiration**: If `isNeverEnd` is false and `subscriptionExpiresAt` is in the past, access is blocked.

### 3.2 Developer Bypass

Users with the `super_admin` role bypass all subscription and system-disable checks, ensuring the developer can always access the control panel to rectify status issues.

## 4. User Interface

- **Developer View (`/admin/system-subscription`)**: Full control over all subscription parameters and history.
- **Admin/Manager View (`/admin/plans`)**: Read-only dashboard showing current status, days remaining, and payment history.
- **Dashboard Widget**: Proactive status card showing expiry warnings (Amber < 30 days, Red < 7 days).
- **POS Banner**: Dismissable alert banner in the terminal interface when expiration is near.
