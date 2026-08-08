# Savent

**Know where every dollar goes.**

Savent is a full-stack personal finance application for tracking income and
expenses, managing monthly budgets, and understanding spending habits through
clear dashboards and reports.

> [!NOTE]
> Savent is currently in active development. The repository contains the
> React client, Node.js API, transaction workflow, and authentication
> foundation; product features are being built incrementally.

## Planned features

- Secure account registration and authentication
- Income, expense, and transfer tracking
- Transaction search, filtering, sorting, and categorisation
- Monthly category budgets with progress indicators
- Dashboard summaries for balance, income, expenses, and savings rate
- Spending trends and category reports
- Responsive light and dark interfaces
- Demo data for exploring the application

## Technology

### Client

- React
- TypeScript
- Vite
- ESLint

### Server

- Node.js
- Express
- TypeScript
- Zod
- Helmet

### Data

- PostgreSQL
- Prisma ORM

### Development quality

- Vitest and Supertest
- ESLint and Prettier
- Docker Compose
- GitHub Actions

## Repository structure

Savent uses npm workspaces to keep the frontend, backend, and future shared
packages in one repository.

```text
Savent/
├── apps/
│   ├── client/              # React and Vite frontend
│   └── server/              # Node.js and Express REST API
│       ├── prisma/           # Schema, migrations, and seed data
│       ├── src/
│       │   ├── app.ts       # Express application and middleware
│       │   └── server.ts    # API process entry point
│       └── .env.example
├── packages/
│   └── contracts/          # Shared Zod schemas and TypeScript types
├── docs/
│   └── architecture.md      # System boundaries and request flow
├── scripts/
│   └── setup-env.mjs        # Safe local environment bootstrap
├── .github/                 # CI, Dependabot, and pull request template
├── .gitignore
├── package-lock.json
├── package.json             # Root npm workspace configuration
└── README.md
```

## Getting started

### Requirements

- Node.js 24 LTS recommended
- npm
- Git
- Docker Desktop

### Quick setup

Clone the repository:

```bash
git clone https://github.com/builtbynandan/Savent.git
cd Savent
nvm use
```

Install dependencies, create the local environment file, start PostgreSQL,
apply migrations, and load demo data:

```bash
npm run setup
```

`npm run setup` is safe to run again. It preserves an existing `.env` file and
uses the committed migrations and deterministic seed data.

Start the frontend and API together:

```bash
npm run dev
```

The frontend is normally available at
[`http://localhost:5173`](http://localhost:5173), and the API at
[`http://localhost:3000`](http://localhost:3000).

Sign in to the seeded demo workspace with:

```text
Email:    demo@savent.app
Password: Demo1234!
```

The generated local environment uses:

```dotenv
PORT=3000
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://savent:savent@localhost:5432/savent?schema=public
```

Check the health endpoint:

```bash
curl http://localhost:3000/api/health
```

Example response:

```json
{
  "status": "ok",
  "service": "savent-api",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

Check PostgreSQL connectivity:

```bash
curl http://localhost:3000/api/health/database
```

### Authentication API

Cycle 3 adds database-backed browser sessions and user data isolation:

| Method | Endpoint             | Purpose                                      |
| ------ | -------------------- | -------------------------------------------- |
| `POST` | `/api/auth/register` | Create a user and private starter workspace  |
| `POST` | `/api/auth/login`    | Verify credentials and create a session      |
| `GET`  | `/api/auth/me`       | Restore the signed-in user from their cookie |
| `POST` | `/api/auth/logout`   | Revoke the current session                   |

Passwords are hashed with `scrypt`. The browser receives an opaque, HTTP-only,
same-site session cookie; only its SHA-256 hash is stored in PostgreSQL. All
transaction routes require a valid session and scope reads and writes to the
authenticated user.

### Transaction API

Cycles 1 and 2 provide a complete transaction-management workflow. Cycle 3
protects every endpoint with authentication:

| Method   | Endpoint                    | Purpose                                            |
| -------- | --------------------------- | -------------------------------------------------- |
| `GET`    | `/api/transactions`         | Search, filter, sort, and paginate transactions    |
| `GET`    | `/api/transactions/options` | List accounts and categories for forms and filters |
| `GET`    | `/api/transactions/:id`     | Retrieve one transaction's details                 |
| `POST`   | `/api/transactions`         | Validate and create income, expenses, or transfers |
| `PUT`    | `/api/transactions/:id`     | Validate and replace an existing transaction       |
| `DELETE` | `/api/transactions/:id`     | Permanently remove a transaction owned by the user |

The list endpoint accepts `search`, `type`, `accountId`, `categoryId`,
`dateFrom`, `dateTo`, `sort`, `page`, and `pageSize` query parameters. Its
response includes filtered income and expense totals plus pagination metadata.

The React transaction screen consumes these endpoints and shares its request
and response schemas with the API through `@savent/contracts`.

### Dashboard and budget API

Cycle 4 adds monthly planning and reporting behind the same authenticated user
boundary:

| Method   | Endpoint                       | Purpose                                     |
| -------- | ------------------------------ | ------------------------------------------- |
| `GET`    | `/api/dashboard?month=YYYY-MM` | KPIs, budget progress, and spending reports |
| `POST`   | `/api/dashboard/budgets`       | Create a monthly expense-category budget    |
| `PUT`    | `/api/dashboard/budgets/:id`   | Update a user-owned budget                  |
| `DELETE` | `/api/dashboard/budgets/:id`   | Delete a user-owned budget                  |

The dashboard calculates current balance, monthly income and expenses, savings
rate, budget usage, six-month income-versus-expense trends, and category
spending. Budget progress moves through on-track, near-limit, and over-budget
states using actual transactions for the selected month.

Stop PostgreSQL when you are finished:

```bash
npm run db:down
```

## Available commands

Run these commands from the repository root:

| Command                     | Purpose                                          |
| --------------------------- | ------------------------------------------------ |
| `npm run setup`             | Prepare a complete local development environment |
| `npm run dev`               | Start the client and API together                |
| `npm run dev:client`        | Start the React development server               |
| `npm run dev:server`        | Start the API in watch mode                      |
| `npm run check`             | Run every local and CI quality gate              |
| `npm test`                  | Run all automated tests                          |
| `npm run lint`              | Lint every workspace                             |
| `npm run format`            | Format the repository with Prettier              |
| `npm run typecheck`         | Type-check every workspace                       |
| `npm run build`             | Build all workspaces                             |
| `npm run db:up`             | Start PostgreSQL with Docker Compose             |
| `npm run db:down`           | Stop PostgreSQL                                  |
| `npm run db:generate`       | Generate the Prisma Client                       |
| `npm run db:migrate`        | Create and apply development migrations          |
| `npm run db:migrate:deploy` | Apply existing migrations                        |
| `npm run db:seed`           | Load deterministic demo data                     |
| `npm run db:studio`         | Open Prisma Studio                               |
| `npm run prod:build`        | Build production client and API containers       |
| `npm run prod:up`           | Migrate and start the production Compose stack   |
| `npm run prod:down`         | Stop production containers without deleting data |
| `npm run prod:logs`         | Follow structured production container logs      |

## Development roadmap

- [x] Establish the React and Express workspace foundation
- [x] Add shared Zod API contracts
- [x] Configure PostgreSQL and Prisma
- [x] Add continuous integration
- [x] Add automated contract and API tests
- [x] Add formatting, linting, environment validation, and contributor tooling
- [x] Build transaction creation and listing end to end
- [x] Add transaction search, filters, sorting, and pagination
- [x] Add transaction details, editing, transfers, and guarded deletion
- [x] Add authentication and user data isolation
- [x] Build budgets, dashboard summaries, and reports
- [x] Add production deployment and monitoring

## Production operations

Savent includes production client and API containers, health-gated Compose
orchestration, automatic migration execution, structured JSON logs,
Prometheus-compatible metrics, release image publishing, and rollback guidance.

See [the production deployment runbook](docs/deployment.md) before operating an
internet-facing instance. A live deployment requires a PostgreSQL-capable
container host, HTTPS hostname, secrets, and backups supplied by the operator.

## Contributing

Savent is currently an early-stage portfolio project. Bug reports, suggestions,
and focused pull requests are welcome through
[GitHub Issues](https://github.com/builtbynandan/Savent/issues). See
[CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow and
[docs/architecture.md](docs/architecture.md) for the system design.
