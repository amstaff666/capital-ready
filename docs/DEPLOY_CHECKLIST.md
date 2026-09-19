# Multi-country deploy checklist

## GitHub / Netlify
- merge only after npm run verify passes
- configure BACKEND_API_EE, BACKEND_API_FI, BACKEND_API_PL in Netlify server-side env
- never add DATABASE_URL_* to browser/VITE/NEXT_PUBLIC variables

## Per-country backend
Deploy backend/ independently per country:
- MARKET=EE / FI / PL
- DATABASE_URL=<that country's Neon DB>
- private S3-compatible bucket credentials
- RULES_FILE=/app/rules/<COUNTRY>.json

## Database
Apply db/schema.sql to a clean country database.
Do not apply this canonical schema blindly on the legacy aimoneyflow database because its existing document/banking tables use an older shape.

## Storage
Each country gets a separate private bucket or strictly isolated namespace.
Configure bucket CORS to allow PUT from the public frontend origin only for signed upload URLs.

## Smoke test
1. open country page
2. submit a synthetic test applicant
3. verify case exists only in that country's DB
4. upload a synthetic PDF/XLSX
5. verify file is private and Neon contains metadata only
6. mark upload complete
7. verify extraction_status=queued
8. export JSON and XLSX
9. verify another country's DB contains no copy of the case
