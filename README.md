# ClothME Waitlist and Blog

React + Vite application for the ClothME waitlist, custom blog admin, Railway Postgres content storage, Bunny.net image storage, SEO metadata, analytics, and AI-search-friendly content files.

## Run locally

```bash
npm install
npm run dev
```

For the full app with API routes:

```bash
npm run dev:full
```

## Build

```bash
npm run build
```

The build also generates:

- static HTML for `/`, `/blog`, and every `/blog/{slug}` article route
- `dist/sitemap.xml`
- `dist/robots.txt`
- `dist/rss.xml`
- `dist/llms.txt`

## Database

Run migrations after setting `DATABASE_URL`:

```bash
npm run migrate
```

## Admin Blog UI

The custom editor lives at:

```text
/admin/blog
```

It supports:

- drafts
- scheduled posts
- preview links
- publishing
- Bunny.net image uploads
- SEO fields
- article sections
- FAQs
- tags

Admin access is controlled by Clerk and the `ADMIN_EMAILS` allowlist.

Each post gets:

- Article URL at `/blog/{slug}`
- Page title and description
- Canonical URL
- Open Graph and Twitter tags
- BlogPosting JSON-LD
- FAQ JSON-LD
- RSS and sitemap entries during build
- `llms.txt` summary for AI-search crawlers

## Analytics

Copy `.env.example` to `.env` and set any analytics keys:

```bash
VITE_SITE_URL=https://your-domain.com
VITE_GA_ID=G-XXXXXXXXXX
VITE_GTM_ID=GTM-XXXXXXX
VITE_PLAUSIBLE_DOMAIN=your-domain.com
```

## Required Services

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
ADMIN_EMAILS=you@example.com

DATABASE_URL=postgresql://user:password@host:port/database
DATABASE_SSL=true

BUNNY_STORAGE_ZONE=clothme
BUNNY_STORAGE_REGION=
BUNNY_STORAGE_API_KEY=xxxxx
BUNNY_CDN_BASE_URL=https://clothme.b-cdn.net
```

Bunny.net API keys are used only by the server. They are never exposed to the browser.

## Railway Docker Deploy

Railway will use the `Dockerfile` automatically.

Production container behavior:

- installs dependencies with `npm ci`
- runs `npm run build`
- optionally runs `npm run migrate` before startup when `RUN_MIGRATIONS=true`
- serves the built Vite app and API through `npm run start`
- uses Railway's `PORT` env var automatically

Required Railway services:

- one app service
- one Railway Postgres service

Set Railway variables:

```bash
VITE_SITE_URL=https://your-domain.com
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx

CLERK_SECRET_KEY=sk_live_xxxxx
ADMIN_EMAILS=you@example.com

DATABASE_URL=${{Postgres.DATABASE_URL}}
DATABASE_SSL=true
RUN_MIGRATIONS=false

BUNNY_STORAGE_ZONE=your-zone
BUNNY_STORAGE_REGION=
BUNNY_STORAGE_API_KEY=xxxxx
BUNNY_CDN_BASE_URL=https://your-zone.b-cdn.net
```

### Database migrations

Option A: run migrations once from Railway shell:

```bash
npm run migrate
```

Option B: run migrations from Docker startup by setting:

```bash
RUN_MIGRATIONS=true
```

Recommended use:

- set `RUN_MIGRATIONS=true` for the first deploy or a schema-change deploy
- redeploy
- set `RUN_MIGRATIONS=false` afterward

The migration SQL uses `create table if not exists` and safe indexes, but keeping startup migrations opt-in is safer for production.
