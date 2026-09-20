#!/bin/sh
set -eu

# Docker Desktop can start this container before the repo bind mount is fully
# available, which makes `npm ci` fail with a missing package-lock.json.
for _ in $(seq 1 60); do
  [ -f /app/package-lock.json ] && [ -f /app/compose.yml ] && break
  sleep 1
done
if [ ! -f /app/package-lock.json ]; then
  echo "dev-entrypoint: repo bind mount not ready (no package-lock.json after 60s)" >&2
  exit 1
fi

# Named volumes may predate the node-user image and retain root ownership.
# Repair them before handing control to the unprivileged application process.
mkdir -p /app/.next
chown -R node:node /app/.next /app/node_modules /app/storage

exec su-exec node "$@"
