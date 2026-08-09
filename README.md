# Savent

**Know where every dollar goes.**

Savent is a full-stack personal finance application for recording income,
expenses, and transfers; managing accounts and categories; setting monthly
budgets; and understanding spending through focused reports.

The project is a complete portfolio V1. It combines a responsive React client,
an authenticated Node.js API, PostgreSQL persistence, shared runtime contracts,
automated tests, and production container workflows in one repository.

## Product capabilities

- Private registration, sign-in, sign-out, and session restoration
- Checking, savings, cash, credit, investment, and custom account management
- Income, expense, and transfer creation, editing, details, and deletion
- Transaction search, filters, sorting, pagination, and filtered totals
- Custom income and expense categories with archive-safe history
- Monthly category budgets with on-track, near-limit, and over-budget states
- Balance, income, expense, savings-rate, six-month, and category reporting
- Responsive light and dark themes with keyboard and screen-reader support
- A deterministic demo workspace with realistic six-month activity

## Engineering highlights

- **User isolation:** every financial query is scoped to the authenticated user,
  including related accounts, categories, budgets, and transfers.
- **Secure sessions:** passwords use Node.js `scrypt`; browsers receive an
  opaque HTTP-only, same-site cookie while PostgreSQL stores only a SHA-256
  token hash. Authentication endpoints are rate limited.
- **Exact money handling:** PostgreSQL `Decimal(14,2)` values remain Prisma
  Decimal values through balance and dashboard aggregation. Account histories
  are summarized by bounded database aggregate queries.
- **Shared contracts:** Zod schemas in `@savent/contracts` validate request and
  response shapes on both sides of the API boundary.
- **Operational readiness:** production images run as non-root users, migrations
  execute as a one-shot release task, services are health gated, and the API
  exposes structured logs, liveness/readiness checks, and protected metrics.
- **Quality gates:** GitHub Actions verifies formatting, linting, types, tests,
  builds, production Compose configuration, and both Docker images.

## Stack

| Area     | Technology                                                    |
| -------- | ------------------------------------------------------------- |
| Client   | React 19, TypeScript, Vite 8                                  |
| API      | Node.js 24, Express 5, TypeScript, Zod, Helmet                |
| Data     | PostgreSQL 18, Prisma 7                                       |
| Testing  | Vitest, Testing Library, Supertest                            |
| Tooling  | npm workspaces, ESLint, Prettier, Docker Compose              |
| Delivery | GitHub Actions, GHCR images, SBOM and provenance attestations |

## Architecture

```text
Browser (React + shared contracts)
        │ credentialed JSON over /api
        ▼
Express API
  ├─ security, CORS, rate limits, request IDs
  ├─ authentication and ownership middleware
  ├─ accounts, categories, transactions, budgets, reports
  └─ structured errors, health checks, metrics
        │ Prisma with exact Decimal values
        ▼
PostgreSQL
```

```text
Savent/
├── apps/
│   ├── client/             # React application and component tests
│   └── server/             # Express API, Prisma schema, migrations, tests
├── packages/contracts/     # Shared Zod schemas and TypeScript types
├── docs/                   # Architecture, deployment, and rollback guidance
├── scripts/                # Safe local environment bootstrap
├── .github/                # CI, release, Dependabot, and PR configuration
├── compose.production.yml  # Health-gated production topology
└── docker-compose.yml      # Local PostgreSQL service
```

See [docs/architecture.md](docs/architecture.md) for system boundaries and
[docs/deployment.md](docs/deployment.md) for the production runbook.

## Run locally

### Requirements

- Node.js 24
- npm
- Docker Desktop
- Git

Clone and prepare the complete development environment:

```bash
git clone https://github.com/builtbynandan/Savent.git
cd Savent
nvm use
npm run setup
```

`npm run setup` installs dependencies, preserves an existing local `.env`,
starts PostgreSQL, applies committed migrations, and restores deterministic
demo data. It is safe to run again.

Start the client and API together:

```bash
npm run dev
```

- Client: [http://localhost:5173](http://localhost:5173)
- API: [http://localhost:3000](http://localhost:3000)

Demo credentials:

```text
Email:    demo@savent.app
Password: Demo1234!
```

## Verification

Run the same primary quality gate used by CI:

```bash
npm run check
```

The suite covers shared contracts, authentication and ownership boundaries,
account balances, categories, transactions, budgets, dashboard calculations,
health endpoints, client interactions, notifications, themes, and dialog focus.

Production dependency vulnerabilities can be checked with:

```bash
npm audit --omit=dev
```

## Commands

| Command                                 | Purpose                                                    |
| --------------------------------------- | ---------------------------------------------------------- |
| `npm run setup`                         | Prepare dependencies, environment, database, and demo data |
| `npm run dev`                           | Start the client and API in watch mode                     |
| `npm run check`                         | Run formatting, linting, types, tests, and builds          |
| `npm test`                              | Run all automated tests                                    |
| `npm run db:up` / `npm run db:down`     | Start or stop local PostgreSQL                             |
| `npm run db:migrate`                    | Create and apply a development migration                   |
| `npm run db:migrate:deploy`             | Apply committed migrations                                 |
| `npm run db:seed`                       | Restore the deterministic demo workspace                   |
| `npm run prod:build`                    | Build production client and API images                     |
| `npm run prod:up` / `npm run prod:down` | Start or stop the production stack                         |
| `npm run prod:logs`                     | Follow production container logs                           |

## API surface

All financial routes require a valid browser session.

| Area           | Endpoints                                                              |
| -------------- | ---------------------------------------------------------------------- |
| Authentication | `POST /api/auth/register`, `POST /login`, `GET /me`, `POST /logout`    |
| Accounts       | `GET/POST /api/accounts`, `PUT /:id`, `PATCH /:id/archive`             |
| Categories     | `GET/POST /api/categories`, `PUT /:id`, `PATCH /:id/archive`           |
| Transactions   | `GET/POST /api/transactions`, `GET/PUT/DELETE /:id`, `GET /options`    |
| Dashboard      | `GET /api/dashboard`, `POST /budgets`, `PUT/DELETE /budgets/:id`       |
| Operations     | liveness, readiness, database health, and protected Prometheus metrics |

Transaction lists accept search, type, account, category, date range, sort,
page, and page-size parameters. API responses use stable shared schemas and
structured error codes.

## Production notes

Savent’s production Compose topology contains a private PostgreSQL service, a
one-shot migration container, a health-gated API, and an Nginx-served client.
A real internet deployment still requires operator-provided HTTPS termination,
secrets, backups, monitoring storage, and a PostgreSQL-capable container host.

Current product boundaries are deliberate: balances are AUD-only, bank feeds
are not connected, and financial data is entered manually. Savent is a
portfolio application, not financial advice or a regulated banking product.

## Contributing

Focused issues and pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md)
before starting and keep changes scoped, tested, and free of local environment
files or secrets.
