# Tools Workspace

This folder centralizes non-production utilities and generated artifacts.

## Structure

- `test-queries/`: Manual TypeScript scripts for DB/API checks and verification.
- `artifacts/`: Temporary output files such as logs and exported debug data.

## Why this exists

- Keeps root directory clean.
- Keeps all test query scripts in one place.
- Prevents debug outputs from scattering across the repository.

## Run examples

```bash
npx ts-node tools/test-queries/db-checks/check_stock.ts
npx ts-node tools/test-queries/batch/test_batch_stock.ts
npx ts-node tools/test-queries/api/test_endpoint.ts
```
