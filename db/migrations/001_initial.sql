create extension if not exists pgcrypto;

create table if not exists waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null default '',
  created_at timestamptz not null default now()
);
