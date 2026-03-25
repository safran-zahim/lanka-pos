# Test Queries

Manual scripts used for debugging and one-off verification.

## Folders

- `db-checks/`: Database inspection scripts.
- `batch/`: Batch/FIFO verification scripts.
- `api/`: Endpoint reachability tests.

## Script Inventory

### db-checks
- `check_expenses_debug.ts`
- `check_product_status.ts`
- `check_stock.ts`
- `check_users.ts`
- `dump_db.ts`

### batch
- `test_0_0.ts`
- `test_batch_stock.ts`
- `verify_batches.ts`

### api
- `test_endpoint.ts`

## Usage

Run from repository root:

```bash
npx ts-node tools/test-queries/<folder>/<script>.ts
```

## Notes

- These scripts are for manual testing and troubleshooting.
- They are not part of CI tests unless explicitly wired later.
