# Architecture

Savent is an npm workspaces monorepo containing one web client, one API, and a
shared contracts package.

```text
React client ───────┐
                    ├──> @savent/contracts
Express API ────────┘
      │
      ├──> Prisma
      │      │
      │      └──> PostgreSQL
      │
      ├──> Session authentication middleware
      │
      └──> HTTP error and environment boundaries
```

## Workspaces

- `apps/client` contains the React and Vite interface.
- `apps/server` contains the Express API, Prisma schema, migrations, and seed.
- `packages/contracts` contains Zod schemas and inferred TypeScript types that
  define values crossing the HTTP boundary.

The client must not import server implementation code. Both applications may
import `@savent/contracts`. Database models stay inside the server; API
contracts are designed for clients rather than exposing Prisma records
directly.

## Server boundaries

- `src/config` validates process-level configuration at startup.
- `src/middleware` owns cross-cutting HTTP behaviour such as authentication and
  error responses.
- `src/errors` contains application errors that can safely cross the HTTP
  boundary.
- `src/lib` contains infrastructure clients such as Prisma.

As features are added, group each feature under `src/modules/<feature>` with
its route, validation, service, and repository code close together. Keep
`app.ts` focused on application assembly.

## Request flow

1. Express receives and parses an HTTP request.
2. Observability middleware assigns or propagates a request ID and records the
   request duration, status, and normalised path.
3. Authentication middleware hashes the opaque session cookie and resolves its
   unexpired database session.
4. A shared Zod contract validates boundary input.
5. A feature service applies business rules using the authenticated user ID.
6. Prisma reads or writes only records owned by that user.
7. The route validates and returns a shared response contract.
8. Errors are translated into the common API error shape.

Health and authentication entry endpoints are public. Transaction endpoints
are mounted behind `requireAuthentication` and never select a hard-coded demo
user. New registrations create starter accounts and categories in the same
database transaction as the user, preventing partially prepared workspaces.

## Account lifecycle

Accounts are user-owned aggregates with an opening balance and a calculated
current balance. Income increases the source account, expenses decrease it,
and transfers decrease the source while increasing the destination. The API
calculates balances from transactions instead of persisting a second mutable
balance value that could drift.

Closing an account archives it rather than deleting it. Archived accounts stay
attached to historical transactions but are excluded from transaction forms
and the active dashboard balance. At least one active account is required so a
user can always record new activity.

## Category lifecycle

Categories are user-owned labels split into income and expense kinds. Custom
categories may change their name, colour, and icon, while starter categories
remain stable defaults. The kind is immutable after creation so existing
transaction semantics and expense-budget rules cannot silently change.

Categories are archived instead of deleted. Historical transactions and
budgets retain their category relationship and remain reportable, while new
transaction and budget validation accepts only active categories. Usage counts
help users understand the impact before archiving a category.

## Authentication model

- Passwords use Node.js `scrypt` with a unique random salt.
- Login and registration create a 256-bit opaque session token.
- PostgreSQL stores only the SHA-256 token hash and a seven-day expiry.
- The raw token is sent in an HTTP-only, same-site cookie and marked secure in
  production.
- Logout deletes the server-side session and clears the browser cookie.
- Foreign transaction, account, and category identifiers are treated as
  unavailable rather than revealing ownership information.

## Dashboard and reporting

The dashboard module is read-optimised application logic rather than stored
summary data. For a requested `YYYY-MM` period it combines:

- active account opening balances;
- income and expense transactions through the end of the month;
- user-owned category budgets for that month;
- six months of transaction history for trend reporting; and
- category relations for spending distribution.

This keeps transactions as the source of truth and prevents summary tables from
drifting. Budget rows are persisted because they are user intent, while spent,
remaining, percentage, savings rate, and chart series are calculated by the
server. Every dashboard and budget query includes the authenticated user ID.

## Production topology and observability

The production Compose topology keeps PostgreSQL on a private network, runs
database migrations as a one-shot prerequisite, and starts the API only after
the database and migrations are ready. Nginx serves the built client, proxies
`/api` requests to Express, and is the only service that publishes a host port.

The API writes structured JSON logs to standard output. Every request carries
an `X-Request-ID`, which is returned to the caller and included in its completion
log. Prometheus metrics expose request counts, response duration sums, process
uptime, and release metadata; route identifiers are normalised to avoid
unbounded metric labels.

Liveness reports whether the API process can serve requests. Readiness also
checks PostgreSQL and should control whether a deployment receives traffic.
The metrics endpoint can be protected with a bearer token. Production images
run as non-root users and expose immutable release identifiers for correlation
between deployments, health responses, metrics, and logs.

## Quality gates

`npm run check` formats, lints, type-checks, tests, and builds every workspace.
GitHub Actions repeats those checks with a PostgreSQL service and applies
committed migrations before the API tests run.
