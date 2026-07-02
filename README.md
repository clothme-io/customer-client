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
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GTM_ID=
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=

DATABASE_URL=postgresql://user:password@host:port/database
DATABASE_SSL=true
PAYLOAD_SECRET=replace-with-a-long-random-secret
```

## Railway Docker Deploy

Railway will use the root `Dockerfile` automatically. The Docker image uses Next.js standalone output from `next.config.js`.

Recommended Railway setup:

- one app service
- one Railway Postgres service
- app service variable `DATABASE_URL=${{Postgres.DATABASE_URL}}`
- Railway pre-deploy command: `npm run cms:sync`
- Docker deploy from the repository

Payload CMS uses the same `DATABASE_URL`. The Docker entrypoint also runs `npm run cms:sync` when `DATABASE_URL` is configured, so schema changes are applied through Payload migrations instead of legacy SQL files.
