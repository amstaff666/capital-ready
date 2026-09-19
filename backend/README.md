# Country backend template

Deploy one isolated instance per country. The same code may be reused, but each deployment must have its own secrets and database.

Required env:
- MARKET=EE (or FI, PL, ...)
- DATABASE_URL=<country Neon connection string>

Private file storage env:
- S3_ENDPOINT_URL
- S3_BUCKET
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION (optional)

The public frontend calls the country deployment through BACKEND_API_<COUNTRY> in Netlify. Do not expose DATABASE_URL or S3 secrets to the browser.

Endpoints:
- POST /v1/cases
- POST /v1/cases/{case_id}/uploads
- GET /v1/cases/{case_id}/export.json
- GET /v1/cases/{case_id}/export.xlsx
- GET /healthz
