#!/bin/sh
set -eu

PROJECT_DIR="${PROJECT_DIR:-/home/cat/uhanku-labs}"

cd "$PROJECT_DIR"

if [ ! -f .env ]; then
  echo "Production deploy aborted: $PROJECT_DIR/.env does not exist." >&2
  exit 1
fi

# Always use the production reverse-proxy configuration during deployment.
# Environment variables exported by the shell take precedence over Compose's
# .env interpolation values.
export NGINX_CONFIG=./docker/nginx/prod/nginx.conf

printf '%s\n' 'Starting production dependencies...'
docker compose up -d mysql

printf '%s\n' 'Building the production application image...'
docker compose build labs

if [ -d "$PROJECT_DIR/storage" ]; then
  printf '%s\n' 'Migrating legacy host media into the production volume...'
  docker compose run --rm --no-deps --user root \
    -v "$PROJECT_DIR/storage:/legacy:ro" \
    labs sh -c '
      if [ ! -e /app/storage/.legacy-host-storage-migrated ]; then
        mkdir -p /app/storage/media /app/storage/media-uploads
        if [ -d /legacy/media ]; then
          cp -a /legacy/media/. /app/storage/media/
        fi
        if [ -d /legacy/media-uploads ]; then
          cp -a /legacy/media-uploads/. /app/storage/media-uploads/
        fi
        touch /app/storage/.legacy-host-storage-migrated
      fi
      chown -R node:node /app/storage
    '
else
  printf '%s\n' 'No legacy host media directory found; using the new production volume.'
fi

printf '%s\n' 'Applying production database migrations...'
docker compose run --rm labs npm run db:deploy

printf '%s\n' 'Starting the production application...'
docker compose up -d --no-deps labs

printf '%s\n' 'Ensuring the production reverse proxy is running...'
docker compose up -d --no-deps nginx

printf '%s\n' 'Production services:'
docker compose ps labs nginx
