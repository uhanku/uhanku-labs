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

MEDIA_STORAGE_DIR=./storage/media
MEDIA_UPLOAD_TEMP_DIR=./storage/media-uploads
printf '%s\n' "Ensuring persistent media storage exists at $MEDIA_STORAGE_DIR..."
install -d -m 0750 "$MEDIA_STORAGE_DIR"
printf '%s\n' "Ensuring chunk upload workspace exists at $MEDIA_UPLOAD_TEMP_DIR..."
install -d -m 0750 "$MEDIA_UPLOAD_TEMP_DIR"

printf '%s\n' 'Starting production dependencies...'
docker compose up -d mysql

printf '%s\n' 'Building the production application image...'
docker compose build labs

printf '%s\n' 'Applying production database migrations...'
docker compose run --rm labs npm run db:deploy

printf '%s\n' 'Starting the production application...'
docker compose up -d --no-deps labs

printf '%s\n' 'Ensuring the production reverse proxy is running...'
docker compose up -d --no-deps nginx

printf '%s\n' 'Production services:'
docker compose ps labs nginx
