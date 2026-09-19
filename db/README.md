# Country-isolated databases

Use one Neon project/database per production country.

Recommended environment mapping:

- Estonia: DATABASE_URL_EE
- Finland: DATABASE_URL_FI
- Poland: DATABASE_URL_PL
- South Africa (disabled pilot): DATABASE_URL_ZA
- Kenya (disabled pilot): DATABASE_URL_KE

The public Netlify frontend must never receive these values. Netlify routes a request to the correct country backend using BACKEND_API_<COUNTRY>. Each backend owns exactly one country database connection.

Apply db/schema.sql independently to every country database. Country-specific rules live in rules/<COUNTRY>.json.
