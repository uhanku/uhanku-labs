FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache su-exec

COPY package.json package-lock.json ./
RUN npm ci

COPY docker/dev-entrypoint.sh /usr/local/bin/dev-entrypoint.sh

# The named storage volume is initialized from this directory on first mount.
RUN mkdir -p /app/storage/media /app/storage/media-uploads \
  && chown -R node:node /app/storage /app/node_modules \
  && chmod +x /usr/local/bin/dev-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/dev-entrypoint.sh"]
