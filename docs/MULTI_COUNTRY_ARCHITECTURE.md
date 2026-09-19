# LUUNA / CapitalReady multi-country architecture

## Isolation rule

Each country has:
1. its own public country page,
2. its own rule pack,
3. its own backend URL,
4. its own Neon database,
5. its own private document storage namespace/bucket.

Current enabled markets: EE, FI, PL.
Africa-ready, disabled until local review: ZA, KE.

## Request path

Country page -> intake form with market code -> /.netlify/functions/cases -> BACKEND_API_<COUNTRY> -> country Neon DB.

Files are not posted into Neon. Backend returns a signed private-upload URL. Browser uploads to private object storage; only document metadata and extraction results are written into the country database.

## Security

DATABASE_URL_* is backend-only. Never expose it in browser JavaScript or NEXT_PUBLIC/VITE variables.
Rules and UI labels are not a substitute for legal/compliance review. A market must stay disabled until its local rules are approved.
