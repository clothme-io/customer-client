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

Run migrations after setting `DATABASE_URL`:

```bash
npm run migrate
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
RUN_MIGRATIONS=false
PAYLOAD_SECRET=replace-with-a-long-random-secret
PAYLOAD_DB_PUSH=true
```

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

Payload CMS uses the same `DATABASE_URL`. For the first Railway deployment, keep `PAYLOAD_DB_PUSH=true` so the Docker entrypoint can create its own CMS tables before the app starts. After the CMS is stable and migrations are in place, you can switch to `PAYLOAD_DB_PUSH=false` and run Payload migrations with `npm run cms:migrate`.
