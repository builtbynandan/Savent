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

### Installation

Clone the repository:

```bash
git clone https://github.com/builtbynandan/Savent.git
cd Savent
```

Install all workspace dependencies from the repository root:

```bash
npm install
```

Create the server's local environment file:

```bash
cp apps/server/.env.example apps/server/.env
```

The default development configuration is:

```dotenv
PORT=3000
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://savent:savent@localhost:5432/savent?schema=public
```

Start PostgreSQL:

```bash
npm run db:up
```

Apply migrations and load the development data:

```bash
npm run db:migrate
npm run db:seed
```

### Run the client

```bash
npm run dev:client
```

The frontend is normally available at
[`http://localhost:5173`](http://localhost:5173).

### Run the API

Open a second terminal at the repository root:

```bash
npm run dev:server
```

The API is available at [`http://localhost:3000`](http://localhost:3000).

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

Stop PostgreSQL when you are finished:

```bash
npm run db:down
```

## Available commands

Run these commands from the repository root:

| Command | Purpose |
| --- | --- |
| `npm run dev:client` | Start the React development server |
| `npm run dev:server` | Start the API in watch mode |
| `npm run typecheck` | Type-check workspaces that provide a type-check script |
| `npm run build` | Build all workspaces |
| `npm run lint --workspace=@savent/client` | Lint the React client |
| `npm run db:up` | Start PostgreSQL with Docker Compose |
| `npm run db:down` | Stop PostgreSQL |
| `npm run db:generate` | Generate the Prisma Client |
| `npm run db:migrate` | Create and apply development migrations |
| `npm run db:seed` | Load deterministic demo data |
| `npm run db:studio` | Open Prisma Studio |

## Development roadmap

- [x] Establish the React and Express workspace foundation
- [x] Add shared Zod API contracts
- [x] Configure PostgreSQL and Prisma
- [x] Add continuous integration
- [ ] Build transaction creation and listing end to end
- [ ] Add authentication and user data isolation
- [ ] Build budgets, dashboard summaries, and reports
- [ ] Add automated tests and deployment

## Contributing

Savent is currently an early-stage portfolio project. Bug reports, suggestions,
and focused pull requests are welcome through
[GitHub Issues](https://github.com/builtbynandan/Savent/issues).
