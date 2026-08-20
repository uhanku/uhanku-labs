#!/bin/sh
set -eu

# Named volumes may predate the node-user image and retain root ownership.
# Repair them before handing control to the unprivileged application process.
chown -R node:node /app/node_modules /app/storage

exec su-exec node "$@"

