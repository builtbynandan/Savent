# Contributing to Savent

Thank you for helping improve Savent. Focused issues and pull requests are
welcome.

## Local development

You need Node.js 24, npm, Git, and Docker Desktop.

```bash
git clone https://github.com/builtbynandan/Savent.git
cd Savent
nvm use
cp apps/server/.env.example apps/server/.env
npm run setup
npm run dev
```

The client runs at <http://localhost:5173> and the API at
<http://localhost:3000>.

## Before opening a pull request

Run the same validation used by continuous integration:

```bash
npm run check
```

If you changed the Prisma schema, create and commit a migration:

```bash
npm run db:migrate
```

Never commit `.env` files, database credentials, generated Prisma code, or
build output.

## Commit messages

Savent uses short conventional commit messages:

```text
feat: add transaction creation
fix: reject invalid transfer accounts
test: cover transaction validation
docs: explain local setup
chore: update development tooling
```

Use `feat` for a new user-facing capability, `fix` for a bug fix, and the
other prefixes for work that does not change product behaviour.

## Pull requests

- Keep each pull request focused on one change.
- Explain what changed and how you verified it.
- Add or update tests when behaviour changes.
- Include screenshots for visible interface changes.
- Link the related issue when one exists.
