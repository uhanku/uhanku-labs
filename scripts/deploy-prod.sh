#!/bin/sh
set -eu

PROJECT_DIR="${PROJECT_DIR:-/home/cat/uhanku-labs}"
DEP_HASH_FILE="$PROJECT_DIR/.deploy-dependencies.sha256"

cd "$PROJECT_DIR"

if [ ! -f .env ]; then
echo "Production deploy aborted: $PROJECT_DIR/.env does not exist." >&2
exit 1
fi

if [ ! -f package.json ] || [ ! -f package-lock.json ]; then
echo "Production deploy aborted: package.json or package-lock.json is missing." >&2
exit 1
fi

printf '%s\n' 'Starting production dependencies...'
docker compose up -d --wait mysql

printf '%s\n' 'Building the production runtime image...'
docker compose build labs

printf '%s\n' 'Building the branded Open WebUI image...'
docker compose build open-webui

# Run Node/npm inside Docker while writing application artifacts directly

# to the Ubuntu host through the .:/app bind mount.

run_labs() {
docker compose run --rm --no-deps 
--user "$(id -u):$(id -g)" 
--env HOME=/tmp 
labs "$@"
}

# The storage directory is a Docker volume rather than part of the host bind

# mount. Make sure the same UID/GID used for builds can access it.

printf '%s\n' 'Ensuring storage directories and permissions...'
docker compose run --rm --no-deps 
--user root 
labs sh -c "mkdir -p /app/storage/media /app/storage/media-uploads 
&& chown -R $(id -u):$(id -g) /app/storage 
&& chmod -R u+rwX /app/storage"

CURRENT_DEP_HASH="$(
{
sha256sum package.json
sha256sum package-lock.json
} | sha256sum | awk '{print $1}'
)"

PREVIOUS_DEP_HASH=""

if [ -f "$DEP_HASH_FILE" ]; then
PREVIOUS_DEP_HASH="$(cat "$DEP_HASH_FILE")"
fi

DEPENDENCIES_CHANGED=0

if [ ! -d node_modules ]; then
printf '%s\n' 'node_modules does not exist.'
DEPENDENCIES_CHANGED=1
elif [ "$CURRENT_DEP_HASH" != "$PREVIOUS_DEP_HASH" ]; then
printf '%s\n' 'package.json/package-lock.json changed.'
DEPENDENCIES_CHANGED=1
else
printf '%s\n' 'Dependencies unchanged; reusing existing node_modules.'
fi

# Stop the running application before modifying shared dependencies/build files.

docker compose stop labs 2>/dev/null || true

if [ "$DEPENDENCIES_CHANGED" -eq 1 ]; then
printf '%s\n' 'Installing application dependencies inside Docker...'
run_labs npm ci --include=dev

# Only save the hash after npm ci succeeds.

printf '%s\n' "$CURRENT_DEP_HASH" > "$DEP_HASH_FILE"
else
printf '%s\n' 'Skipping npm ci.'
fi

printf '%s\n' 'Generating Prisma client...'
run_labs npm run db:generate

printf '%s\n' 'Building the production application...'
run_labs npm run build

printf '%s\n' 'Applying production database migrations...'
run_labs npm run db:deploy

printf '%s\n' 'Starting the production application...'
docker compose up -d --no-deps --force-recreate labs

printf '%s\n' 'Starting Open WebUI...'
docker compose up -d --no-deps open-webui

printf '%s\n' 'Ensuring the production reverse proxy is running...'
docker compose up -d --no-deps nginx

printf '%s\n' 'Production services:'
docker compose ps labs open-webui nginx
