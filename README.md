# ClothME Waitlist and Blog

Next.js application for the ClothME waitlist, custom blog admin, Railway Postgres content storage, Bunny.net image storage, SEO metadata, analytics, and AI-search-friendly content endpoints.

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

Run migrations after setting `DATABASE_URL`:

```bash
npm run migrate
```

## Admin Blog UI

The custom editor lives at:

```text
/admin/blog
```

It supports drafts, scheduled posts, preview links, publishing, Bunny.net image uploads, SEO fields, article sections, FAQs, and tags.

Admin access is controlled by Clerk and the `ADMIN_EMAILS` allowlist.

## Payload CMS

The Payload CMS editor lives at:

```text
/admin/cms
```

This is separate from the custom `/admin/blog` editor. Use it for richer CMS workflows such as media, SEO fields, drafts, scheduled publishing, and location-aware content.

Useful commands:

```bash
npm run cms:generate:importmap
npm run cms:generate:types
npm run cms:migrate:create
npm run cms:migrate
```

## Environment Variables

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GTM_ID=
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=

CLERK_SECRET_KEY=sk_live_xxxxx
ADMIN_EMAILS=you@example.com

DATABASE_URL=postgresql://user:password@host:port/database
DATABASE_SSL=true
RUN_MIGRATIONS=false
PAYLOAD_SECRET=replace-with-a-long-random-secret
PAYLOAD_DB_PUSH=true

BUNNY_STORAGE_ZONE=your-zone
BUNNY_STORAGE_REGION=
BUNNY_STORAGE_API_KEY=xxxxx
BUNNY_CDN_BASE_URL=https://your-zone.b-cdn.net
```

Bunny.net API keys are used only by the server. They are never exposed to the browser.

## Railway Docker Deploy

Railway will use the root `Dockerfile` automatically. The Docker image uses Next.js standalone output from `next.config.js`.

Recommended Railway setup:

- one app service
- one Railway Postgres service
- app service variable `DATABASE_URL=${{Postgres.DATABASE_URL}}`
- Railway pre-deploy command: `npm run migrate`
- Docker deploy from the repository

You can also run migrations from the container entrypoint by setting:

```bash
RUN_MIGRATIONS=true
```

For production, Railway's pre-deploy command is preferred because migrations run before the new version starts serving traffic.

Payload CMS uses the same `DATABASE_URL`. For the first Railway deployment, keep `PAYLOAD_DB_PUSH=true` so Payload can create its own CMS tables. After the CMS is stable and migrations are in place, you can switch to `PAYLOAD_DB_PUSH=false` and run Payload migrations with `npm run cms:migrate`.
