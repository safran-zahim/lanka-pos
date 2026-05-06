# Lanka POS - Feature Adoption & Roadmap Plan

This document outlines the strategic steps to adopt missing features and refine the system for full operational maturity.

## 1. Feature Gap Analysis

| Feature | Current State | Adoption Recommendation |
| :--- | :--- | :--- |
| **Gift Vouchers** | Not Implemented | Create `GiftCard` model with unique code, balance, and expiry. Add "Pay with Voucher" to POS. |
| **Advanced Taxes** | Global JSON Setting | Migrate from a single Setting to a `TaxRule` model linked to `Category`. |
| **Subscription Plans** | Simplified Status | Enable the existing `SubscriptionPlan` model for automated billing and feature gating. |
| **Audit Coverage** | 80% (Core Modules) | Extend `logAudit` utility to `Expense` and `PettyCash` controllers for full compliance. |
| **Customer Credit** | Logic Operational | Add real-time debt indicator in POS when a customer is selected. |

## 2. Adoption Roadmap (Phased Approach)

### Phase 1: Operational Cleanup (Immediate)
- **Extend Audit Logging**: Instrument the Expense and Petty Cash controllers to ensure 100% traceability.
- **Credit Visibility**: Improve UI feedback in the POS checkout flow when a customer is approaching their credit limit.

### Phase 2: Financial Refinement (Short-Term)
- **Gift Voucher System**: Implement issuing and redemption logic. This will drive customer retention.
- **Hierarchical Taxes**: Allow setting different tax rates for specific categories (e.g., Higher tax for Luxury goods).

### Phase 3: Subscription & Scaling (Medium-Term)
- **Plan Automation**: Connect the frontend to the `SubscriptionPlan` catalog to allow automated upgrades/renewals.
- **Multi-Location Engine**: Refactor products to support warehouse-specific stock levels.

## 3. Implementation Strategy for "Gift Vouchers" (Sample)

### Schema (Potential):
```prisma
model GiftCard {
  id        Int      @id @default(autoincrement())
  code      String   @unique
  balance   Decimal
  expiryDate DateTime?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
}
```

### Integration Points:
- **POS**: Add "Gift Card" as a payment method in the checkout modal.
- **Validation**: API endpoint to verify code and balance before deduction.
- **Ledger**: Track voucher usage as a specific payment type in sales history.

## 4. Risks & Mitigations

- **Risk**: Stock variance during multi-batch returns.
- **Mitigation**: Use the recently verified FIFO return logic to ensure stock is restored to the correct batch ID.

- **Risk**: Performance degradation with high-volume audit logs.
- **Mitigation**: Implement log rotation or archival for audit records older than 12 months.
