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
2. Authentication middleware hashes the opaque session cookie and resolves its
   unexpired database session.
3. A shared Zod contract validates boundary input.
4. A feature service applies business rules using the authenticated user ID.
5. Prisma reads or writes only records owned by that user.
6. The route validates and returns a shared response contract.
7. Errors are translated into the common API error shape.

Health and authentication entry endpoints are public. Transaction endpoints
are mounted behind `requireAuthentication` and never select a hard-coded demo
user. New registrations create starter accounts and categories in the same
database transaction as the user, preventing partially prepared workspaces.

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

## Quality gates

`npm run check` formats, lints, type-checks, tests, and builds every workspace.
GitHub Actions repeats those checks with a PostgreSQL service and applies
committed migrations before the API tests run.
