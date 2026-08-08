# Production deployment

Savent ships as two long-running OCI containers, a one-shot migration image,
and requires a PostgreSQL 17 database. The client container serves the React
build through Nginx and proxies `/api` to the Express container, keeping
authentication cookies same-origin.

## Production requirements

- A Linux container host with Docker Engine and Compose v2
- A public HTTPS hostname
- Persistent storage or a managed PostgreSQL 17 service
- Automated database backups
- A log collector that reads container stdout/stderr
- A Prometheus-compatible scraper or uptime monitor

Do not expose PostgreSQL publicly. Terminate TLS at the platform load balancer
or a reverse proxy and forward traffic to the client container only.

## Configure the environment

Copy the committed example without committing the resulting file:

```bash
cp .env.production.example .env.production
```

Replace every placeholder. `CLIENT_URL` must be the exact public HTTPS origin.
If the database password contains URL-reserved characters, percent-encode it in
`DATABASE_URL`.

Generate secrets with a password manager or a cryptographically secure secret
generator. `METRICS_TOKEN` must contain at least 24 characters.

## Build and start

```bash
npm run prod:build
npm run prod:up
```

Compose waits for PostgreSQL, applies committed Prisma migrations once, starts
the API after migration success, and exposes the Nginx client on `APP_PORT`.

For a local production-mode smoke test over HTTP only, temporarily set:

```dotenv
CLIENT_URL=http://localhost:8080
SESSION_COOKIE_SECURE=false
```

Never disable secure cookies on an internet-facing deployment.

## Health and monitoring

| Endpoint            | Use                                                     |
| ------------------- | ------------------------------------------------------- |
| `/api/health/live`  | Process liveness; does not depend on PostgreSQL         |
| `/api/health/ready` | Deployment readiness; returns 503 when PostgreSQL fails |
| `/api/metrics`      | Prometheus-compatible process and HTTP request metrics  |

When `METRICS_TOKEN` is configured, scrape metrics with:

```text
Authorization: Bearer <METRICS_TOKEN>
```

Every API response includes `X-Request-ID`. Logs are newline-delimited JSON and
include the same request ID, HTTP status, duration, and `RELEASE_SHA`. Configure
alerts for:

- readiness failures for more than two minutes;
- sustained HTTP 5xx responses;
- elevated request duration;
- repeated container restarts; and
- PostgreSQL storage or connection exhaustion.

## Release images

Pushing a semantic version tag such as `v1.0.0` runs the release workflow. It
publishes signed-provenance client, server, and migration images to GitHub
Container Registry with both the version and `latest` tags.

Before tagging:

```bash
npm run check
git tag v1.0.0
git push origin v1.0.0
```

Use immutable version tags for deployments. Treat `latest` as a convenience
alias, not a rollback target.

## Backup and rollback

Take a PostgreSQL backup before every deployment containing migrations. Prisma
migrations are forward-only; application rollback does not automatically undo
schema changes.

To roll back application containers:

1. Select the previous known-good version tag.
2. Update both client and server image tags together.
3. Redeploy without rerunning destructive database commands.
4. Confirm `/api/health/ready`, login, dashboard, and transaction creation.

Restore the database only when a migration or data operation damaged data, and
test the restore procedure regularly.

## Operations

```bash
npm run prod:logs
npm run prod:down
```

`prod:down` stops containers but preserves the named PostgreSQL volume. Do not
run `docker compose down --volumes` against production data.
