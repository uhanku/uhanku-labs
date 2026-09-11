# Agent rules

## IMPORTANT: Run project commands inside the dev container

Any command relating to the `/app` project (npm, prisma, tests, linting, etc.) MUST be run inside the dev container, not on the host. The dev container is configured at `compose.yml` (the `dev` service, working dir `/app`).

- Prefer: `docker compose exec dev <command>` (container is already running with `npm ci && npm run dev`)
- One-off: `docker compose run --rm dev <command>`
- Never run `npm`/`npx`/`node` directly on the host — the container owns `node_modules` and `.next` via named volumes (`ul-node_modules`, `ul-next-dev`), which the host cannot see.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
