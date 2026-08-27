#!/bin/sh
set -eu

PROJECT_DIR="${PROJECT_DIR:-/home/cat/uhanku-labs}"

cd "$PROJECT_DIR"

if [ ! -f .env ]; then
  echo "Production deploy aborted: $PROJECT_DIR/.env does not exist." >&2
  exit 1
fi

printf '%s\n' 'Starting production dependencies...'
docker compose up -d mysql

# The production image no longer bakes in node_modules or a build; it bind-mounts
# the host source tree (see compose.yml labs service), so install and build here.
printf '%s\n' 'Installing application dependencies on host...'
npm ci

printf '%s\n' 'Generating Prisma client...'
npm run db:generate

printf '%s\n' 'Building the production application on host...'
npm run build

printf '%s\n' 'Building the production application image...'
docker compose build labs

printf '%s\n' 'Building the branded Open WebUI image...'
docker compose build open-webui

printf '%s\n' 'Applying production database migrations...'
docker compose run --rm labs npm run db:deploy

printf '%s\n' 'Starting the production application...'
docker compose up -d --no-deps labs

printf '%s\n' 'Starting Open WebUI...'
docker compose up -d --no-deps open-webui

printf '%s\n' 'Ensuring the production reverse proxy is running...'
docker compose up -d --no-deps nginx

printf '%s\n' 'Production services:'
docker compose ps labs open-webui nginx
