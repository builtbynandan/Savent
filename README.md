# Savent

**Know where every dollar goes.**

Savent is a full-stack personal finance application for tracking income and
expenses, managing monthly budgets, and understanding spending habits through
clear dashboards and reports.

> [!NOTE]
> Savent is currently in active development. The repository contains the
> initial React client and Node.js API foundation; product features are being
> built incrementally.

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

### Transaction API

Cycle 1 provides the first complete product workflow:

| Method | Endpoint                    | Purpose                                   |
| ------ | --------------------------- | ----------------------------------------- |
| `GET`  | `/api/transactions`         | List the demo user's transactions         |
| `GET`  | `/api/transactions/options` | List accounts and categories for the form |
| `POST` | `/api/transactions`         | Validate and create an income or expense  |

The React transaction screen consumes these endpoints and shares its request
and response schemas with the API through `@savent/contracts`.

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

## Development roadmap

- [x] Establish the React and Express workspace foundation
- [x] Add shared Zod API contracts
- [x] Configure PostgreSQL and Prisma
- [x] Add continuous integration
- [x] Add automated contract and API tests
- [x] Add formatting, linting, environment validation, and contributor tooling
- [x] Build transaction creation and listing end to end
- [ ] Add authentication and user data isolation
- [ ] Build budgets, dashboard summaries, and reports
- [ ] Add production deployment and monitoring

## Contributing

Savent is currently an early-stage portfolio project. Bug reports, suggestions,
and focused pull requests are welcome through
[GitHub Issues](https://github.com/builtbynandan/Savent/issues). See
[CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow and
[docs/architecture.md](docs/architecture.md) for the system design.
