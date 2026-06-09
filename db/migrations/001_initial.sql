create extension if not exists pgcrypto;

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  category text not null default '',
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'published', 'archived')),
  hero_image_url text not null default '',
  hero_image_alt text not null default '',
  author text not null default 'ClothME Team',
  published_at timestamptz,
  scheduled_for timestamptz,
  reading_time text not null default '',
  ai_summary text not null default '',
  seo_title text not null default '',
  seo_description text not null default '',
  preview_token text not null default encode(gen_random_bytes(24), 'hex'),
  created_by text not null default '',
  updated_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_status_idx on posts(status);
create index if not exists posts_scheduled_for_idx on posts(scheduled_for);
create index if not exists posts_preview_token_idx on posts(preview_token);

create table if not exists post_sections (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  sort_order integer not null default 0,
  heading text not null default '',
  body text not null default ''
);

create index if not exists post_sections_post_id_idx on post_sections(post_id);

create table if not exists post_faqs (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  sort_order integer not null default 0,
  question text not null default '',
  answer text not null default ''
);

create index if not exists post_faqs_post_id_idx on post_faqs(post_id);

create table if not exists post_tags (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  tag text not null default ''
);

create index if not exists post_tags_post_id_idx on post_tags(post_id);

create table if not exists waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null default '',
  created_at timestamptz not null default now()
);
