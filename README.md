# Uhanku Labs

## Production

Create the environment file and replace the example credentials with production values:

```bash
cp .env.example .env
```

Deploy the production application behind Nginx:

```bash
docker compose up --build -d mysql labs open-webui nginx
```

Apply database migrations:

```bash
docker compose run --rm labs npm run db:deploy
```

The application is available on the port configured by `NGINX_PORT` in `.env` (port `80` by default).

Open WebUI is available at `http://chat.uhanku.com`. Configure the
server-managed `.env` with an OpenRouter key before starting the stack:

```dotenv
OPENROUTER_API_KEY=<openrouter-api-key>
OPENWEBUI_WEBUI_URL=http://chat.uhanku.com
OPENWEBUI_CORS_ALLOW_ORIGIN=http://chat.uhanku.com
```

The Open WebUI database and uploaded files are stored in the Docker-managed
`ul-open-webui` volume. The production deployment script selects
`docker/nginx/prod/nginx.conf` automatically.

View service logs with:

```bash
docker compose logs -f labs nginx
```

Stop the production stack with:

```bash
docker compose down
```

Verify SearXNG from inside the Open WebUI container (the response should
include both `results` and `unresponsive_engines`):

```bash
docker compose exec open-webui python -c 'import json, urllib.parse, urllib.request; u="http://searxng:8080/search?" + urllib.parse.urlencode({"q":"OpenAI","format":"json"}); d=json.load(urllib.request.urlopen(u)); print("results:", len(d.get("results", []))); print("unresponsive_engines:", d.get("unresponsive_engines", []))'
```

Media is stored in the Docker-managed `ul-storage-prod` volume. Development
uses a separate `ul-storage-dev` volume, so local uploads cannot modify
production media. Both application containers run as the image `node` user;
the storage directories are initialized with matching ownership.

### Local media-admin development

The development Nginx configuration serves the application at
`labs.uhanku.test`. Add this entry to the host machine's `/etc/hosts` file:

```text
127.0.0.1 labs.uhanku.test
127.0.0.1 chat.uhanku.test
```

Start the development stack with:

```bash
docker compose up --build -d mysql dev nginx
```

Then open:

```text
http://labs.uhanku.test
```

Open WebUI is available at `http://chat.uhanku.test`. For local OpenRouter
access, set these values in `.env`:

```dotenv
OPENROUTER_API_KEY=<openrouter-api-key>
OPENWEBUI_WEBUI_URL=http://chat.uhanku.test
OPENWEBUI_CORS_ALLOW_ORIGIN=http://chat.uhanku.test
```

Do not open the login page at `http://0.0.0.0:3000`. `0.0.0.0` is the
container's bind address, not a browser-facing hostname, and the media routes
intentionally reject it. Media authentication redirects are relative so they
preserve the hostname used by the browser.

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

The production deploy script builds the `labs` and patched Open WebUI images,
applies Prisma migrations, starts both services, and ensures Nginx is running
with `docker/nginx/prod/nginx.conf`. The Open WebUI image patch removes the
automatic ` (Open WebUI)` suffix from custom names such as `u-chat`.

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

## Hermes agent

The `hermes` Compose service runs the Hermes agent gateway with its state
persisted in the repository root's `.hermes/` directory (mounted at
`/opt/data`; never committed).

### Setup

Copy the Hermes variables from `.env.example` into `.env`:

```bash
HERMES_UID=1000        # UID that owns ./.hermes inside the container
HERMES_GID=1000        # GID that owns ./.hermes inside the container
HERMES_USERNAME=       # dashboard basic-auth username
HERMES_PASSWORD=       # dashboard basic-auth password
HERMES_AUTH_SECRET=    # long random value, e.g. openssl rand -hex 32
HERMES_API_SERVER_KEY= # API server key, e.g. openssl rand -hex 32
```

The image refuses to run as an arbitrary `--user`. Instead it starts as root
and remaps its internal `hermes` user to `HERMES_UID`/`HERMES_GID`, chowning
the data volume at boot, so files in `./.hermes/` land owned by your host
user. Keep both values set to the UID/GID that owns `./.hermes/` on the host
(`1000` by default).

Start the service:

```bash
docker compose up -d hermes
```

Run the interactive setup wizard to configure providers and integrations:

```bash
docker exec -it server-hermes-1 hermes setup
```

The Web UI is available at `http://ai.uhanku.test` through the Nginx reverse
proxy (dev) or directly on port `9119`; the dashboard also listens on
`127.0.0.1:8642`.

### Browser configuration

The browser stack is configured declaratively in `.hermes/config.yaml`:

```yaml
browser:
  backend: "off"
  cloud_provider: "local"
  engine: "chrome"
```

`backend: "off"` disables the external Browser Use CLI backend. Hermes then
serves browsing through its built-in `browser_*` tools; it does not disable
browser functionality.

Restart the service after editing `config.yaml` so the gateway picks up the
change:

```bash
docker compose restart hermes
```

Verify the effective configuration with:

```bash
docker exec hermes hermes config get browser.backend
docker exec hermes hermes config get browser.cloud_provider
docker exec hermes hermes config get browser.engine
```

If the `config get` commands are unavailable, inspect the effective file
instead:

```bash
docker exec hermes cat /opt/data/config.yaml
```

## Authenticated media uploads

Uhanku Labs exposes a private upload UI at `/media-admin` and public media at
`https://labs.uhanku.com/media/<media>`. The upload UI uses a dedicated
username/password configured only through the server environment. Uploaded
filenames are generated by the application, written with exclusive-create
semantics, and stored outside Next.js `public/` so they can only be served by
the guarded `/media/[media]` route.

Configure these values in the server-managed `.env` file:

```dotenv
MEDIA_ADMIN_USERNAME=<username>
MEDIA_ADMIN_PASSWORD_HASH=<scrypt hash>
MEDIA_SESSION_SECRET=<long random secret>
MEDIA_MAX_UPLOAD_BYTES=52428800
```

Generate the password hash without putting the password in source control:

```bash
read -s MEDIA_PASSWORD_INPUT
export MEDIA_PASSWORD_INPUT
node scripts/hash-media-password.mjs
unset MEDIA_PASSWORD_INPUT
```

Generate a session secret with a cryptographically secure generator, for
example:

```bash
openssl rand -base64 48
```

The production Nginx configuration rejects unknown hostnames before proxying to
Next.js. The `/media/[media]` route also validates the request host and serves
files only for `labs.uhanku.com` in production. The development-only equivalent
is `labs.uhanku.test`.

Supported uploads are JPEG, PNG, WebP, GIF, AVIF, MP4, WebM, MP3, OGG, WAV,
and M4A. File contents are checked against their declared media type and the
server enforces the configured size limit. Uploads are transferred in chunks
and are kept outside the public media directory until server-side reconstruction
and signature validation succeed. Public media supports byte-range requests so
browsers can seek through audio and video files.

Chunk transport can be tuned independently of the maximum final file size:

```dotenv
MEDIA_UPLOAD_CHUNK_BYTES=5242880
MEDIA_UPLOAD_TEMP_MAX_AGE_MS=86400000
```

`MEDIA_UPLOAD_CHUNK_BYTES` defaults to 5 MiB and is bounded by the application
to a safe per-request range. Incomplete upload workspaces are removed on
cancellation and expired workspaces are cleaned up when the media manager or
upload APIs are used.
