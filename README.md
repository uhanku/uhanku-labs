# Uhanku Labs

## Production

Create the environment file and replace the example credentials with production values:

```bash
cp .env.example .env
```

Deploy the production application behind Nginx:

```bash
docker compose up --build -d mysql prod nginx
```

Apply database migrations:

```bash
docker compose run --rm prod npm run db:deploy
```

The application is available on the port configured by `NGINX_PORT` in `.env` (port `80` by default).

View service logs with:

```bash
docker compose logs -f prod nginx
```

Stop the production stack with:

```bash
docker compose down
```
