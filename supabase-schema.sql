-- Run this in your Supabase SQL Editor (supabase.com → your project → SQL Editor)

-- Schedules table
create table if not exists schedules (
  id          uuid primary key default gen_random_uuid(),
  date        date not null unique,
  blocks      jsonb not null,
  created_at  timestamptz default now()
);

-- Notes table
create table if not exists notes (
  id          uuid primary key default gen_random_uuid(),
  schedule_id uuid references schedules(id) on delete cascade,
  block_id    text not null,
  content     text,
  updated_at  timestamptz default now(),
  unique(schedule_id, block_id)
);

-- Optional: enable Row Level Security (recommended for production)
-- alter table schedules enable row level security;
-- alter table notes enable row level security;
