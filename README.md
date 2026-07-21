# AI Money Flow client portal

Public client-facing loan intake and dashboard flow for Netlify.

## Route map

- `/` - premium AI Money Flow landing page rendered by the Vite/React app.
- `/start.html` - client route choice: `Eraisikule` or `Ettevõttele`.
- `/intake-personal.html` - personal loan intake form.
- `/intake-company.html` - company financing intake form with company details and extra uploads.
- `/submitted.html` - confirmation page after form submission.
- `/dashboard.html` - client-visible case dashboard.

## Netlify build settings

The repo uses `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"
```

The build creates `dist/index.html` and then copies the static client flow pages
and shared assets into `dist`, so every hosting provider receives the same
complete artifact.

## Data safety

The public forms are UI demos. They do not POST data or upload documents. Only
the selected route type (`personal` or `company`) and a demo timestamp are
stored in `localStorage`; direct identifiers, IBANs, financial details and file
names are not persisted.

Real submissions must remain disabled until an authenticated API, private
document storage, access controls and retention rules are connected.

## Local behavior

On every host, `assets/app.js` intercepts form submission and redirects to the
demo confirmation page without transmitting the entered values.

## Public branding

Public pages show only `AI Money Flow`. Internal or old project names are not used in the client-facing flow.
