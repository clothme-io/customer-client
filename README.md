# ClothME Waitlist and Blog

Next.js application for the ClothME waitlist, Payload CMS, Railway Postgres content storage, SEO metadata, analytics, and AI-search-friendly content endpoints.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:3000`.

## Build

```bash
npm run build
```

Next.js serves:

- `/`
- `/blog`
- `/blog/{slug}`
- `/privacy-policy`
- `/sitemap.xml`
- `/robots.txt`
- `/rss.xml`
- `/llms.txt`

## Database

Payload CMS owns the application database schema. Run Payload migrations after setting `DATABASE_URL`:

```bash
npm run cms:sync
```

## Payload CMS

The Payload CMS editor lives at:

```text
/admin/cms
```

Use it for CMS workflows such as media, SEO fields, drafts, scheduled publishing, and location-aware content. `/admin` redirects here.

Useful commands:

```bash
npm run cms:generate:importmap
npm run cms:generate:types
npm run cms:migrate:create
npm run cms:migrate
npm run cms:push
```

## Environment Variables

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_GA_ID=G-8H7MC8EYN1
NEXT_PUBLIC_GTM_ID=
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=

DATABASE_URL=postgresql://user:password@host:port/database
DATABASE_SSL=true
PAYLOAD_SECRET=replace-with-a-long-random-secret

# Creator program — requires backend-api with POST /v1/creator-applications
BACKEND_API_URL=https://your-backend-api.example.com
NEXT_PUBLIC_API_URL=https://your-backend-api.example.com
ADMIN_API_KEY=replace-with-a-long-random-secret
```

The creator application form at `/creators/apply` POSTs to `/api/creator-applications` (a Next.js proxy). The proxy forwards to `BACKEND_API_URL` or `NEXT_PUBLIC_API_URL` with the `/v1` prefix. Set at least one of those URLs on Railway — `BACKEND_API_URL` is preferred because it is read at runtime and does not require a rebuild to change.

## Creator Program

Public routes:

- `/creators` — landing page
- `/creators/apply` — application form
- `/creators/success` — confirmation after submit
- `/admin/creators` — admin dashboard (requires `ADMIN_API_KEY`)

The backend must have migration `0063` applied (`interested_affiliate` column). Run `npm run db:deploy` on the backend service before accepting submissions with the affiliate field.

## Railway Docker Deploy

Railway will use the root `Dockerfile` automatically. The Docker image uses Next.js standalone output from `next.config.js`.

Recommended Railway setup:

- one app service
- one Railway Postgres service
- app service variable `DATABASE_URL=${{Postgres.DATABASE_URL}}`
- app service variable `BACKEND_API_URL=https://api-clothme.com` (your live **customer-microservice** public URL — no trailing slash, no `/v1`)
- app service variable `ADMIN_API_KEY=...` (for `/admin/creators`)
- Railway pre-deploy command: `npm run cms:sync` (not `npm run migrate`)
- Docker deploy from the repository

If your Railway service still has `npm run migrate` as the pre-deploy command, update it to `npm run cms:sync`. The legacy `migrate` script was removed when Payload CMS migrations replaced SQL migrations.

The `cms:sync` script retries Postgres connections while the database wakes (up to 20 attempts, 3s apart). Override with `MIGRATION_MAX_ATTEMPTS` and `MIGRATION_RETRY_DELAY_MS` if needed.

Payload CMS uses the same `DATABASE_URL`. The Docker entrypoint also runs `npm run cms:sync` when `DATABASE_URL` is configured, so schema changes are applied through Payload migrations instead of legacy SQL files.
