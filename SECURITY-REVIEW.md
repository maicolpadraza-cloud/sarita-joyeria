# Security review

## Scope and result

Reviewed the catalog API, administrator authentication, MySQL access, product rendering, security headers, environment-file handling, and production configuration.

There are no known unresolved code-level security findings from this review. One medium-severity configuration weakness was found and fixed during the hardening work.

## Finding

| Severity | Status | Location | Finding and remediation |
|---|---|---|---|
| Medium | Fixed | `src/lib/db.ts:29` | Production could previously connect to MySQL without TLS when `DB_SSL` was unset. Production now fails to start unless `DB_SSL=true`; TLS certificate verification remains enabled. Set `DB_SSL=true` in the production environment. |

## Other checks

- Product, login, and product-ID API inputs use strict validation; unknown product fields are rejected.
- SQL statements use placeholders for dynamic values. No user-controlled SQL string concatenation was found.
- API error responses are generic; internal database errors are logged server-side rather than returned to clients.
- Product text is rendered as text, not injected HTML; external links use `rel="noopener noreferrer"`.
- `/api/seed` and `/api/db-test` are removed; the sample-data loader is a CLI script.
- Security headers and crawler exclusions for `/admin` and `/api` are configured.
- `.env.local` remains ignored and was not modified. No likely secret patterns were found in the scanned Git history; `.env.example` is the only tracked environment file.
- `npm audit` reported zero vulnerabilities.

## Deployment follow-up

- Configure `DB_SSL=true` and the required MySQL connection variables in production.
- Use a dedicated MySQL account with only the permissions the application needs, as documented in `database/README.md`.
- A query of the live TiDB product table during the ImageKit integration found no `data:` URI images. Product image URLs are validated against local paths and the configured Unsplash/ImageKit hosts.
