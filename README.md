# Uhanku Labs

## Production

Create the environment file and replace the example credentials with production values:

```bash
cp .env.example .env
```

Deploy the production application behind Nginx:

```bash
docker compose up --build -d mysql labs nginx
```

Apply database migrations:

```bash
docker compose run --rm labs npm run db:deploy
```

The application is available on the port configured by `NGINX_PORT` in `.env` (port `80` by default).

View service logs with:

```bash
docker compose logs -f labs nginx
```

Stop the production stack with:

```bash
docker compose down
```

### Automatic production deployment

The `CI` workflow deploys to production after the test job succeeds for a push
to `main`. Pull requests and pushes to other branches never receive the
production SSH secrets and never run the deployment job.

The deployment job connects as `cat`, synchronizes the checked-out `main`
working tree to `/home/cat/uhanku-labs`, preserves the server's `.env`, and
runs:

```bash
./scripts/deploy-prod.sh
```

The production deploy script builds the `labs` image, applies Prisma migrations,
starts the `labs` service, and ensures Nginx is running with
`docker/nginx/prod/nginx.conf`.

Create a GitHub Environment named `production` and configure these environment
secrets:

- `PROD_SSH_HOST`: production server hostname or IP address.
- `PROD_SSH_PRIVATE_KEY`: private half of a dedicated SSH deployment key whose
  public half is present in `/home/cat/.ssh/authorized_keys` on the server.
- `PROD_SSH_KNOWN_HOSTS`: a verified `known_hosts` entry for the production
  server. Do not disable SSH host-key checking.
- `PROD_SSH_PORT`: optional SSH port. When omitted, port `22` is used.

The server must have Git, Docker with the Compose plugin, and the `cat` user
must be able to run Docker. `/home/cat/uhanku-labs/.env` must contain the
production database credentials; it remains server-managed and is not changed
by the deployment.
