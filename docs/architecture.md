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
- `src/middleware` owns cross-cutting HTTP behaviour such as error responses.
- `src/errors` contains application errors that can safely cross the HTTP
  boundary.
- `src/lib` contains infrastructure clients such as Prisma.

As features are added, group each feature under `src/modules/<feature>` with
its route, validation, service, and repository code close together. Keep
`app.ts` focused on application assembly.

## Request flow

1. Express receives and parses an HTTP request.
2. A shared Zod contract validates boundary input.
3. A feature service applies business rules.
4. A repository uses Prisma to read or write PostgreSQL.
5. The route validates and returns a shared response contract.
6. Errors are translated into the common API error shape.

## Quality gates

`npm run check` formats, lints, type-checks, tests, and builds every workspace.
GitHub Actions repeats those checks with a PostgreSQL service and applies
committed migrations before the API tests run.
