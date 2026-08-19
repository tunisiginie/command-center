-- Command Center — Supabase schema
-- Run this in the Supabase SQL Editor (Project → SQL Editor → New query).
-- Idempotent: safe to re-run.
--
-- NOTE: this app has NO LOGIN. There is a single shared board and the
-- policies below are deliberately open — anyone holding the public anon key
-- (i.e. anyone who loads the site) can read and write tiles. That is an
-- accepted tradeoff for a personal launcher behind an unguessable URL, not
-- an oversight. Re-introducing auth means restoring `auth.uid() = user_id`
-- policies and the `user_id` NOT NULL constraint.

-- =========================================================================
-- TILES
-- =========================================================================
create table if not exists public.tiles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users (id) on delete cascade, -- unused; kept for a future re-add of auth
  label      text not null,
  tagline    text,                        -- optional; blank keeps the tile minimal
  url        text,                        -- null = "not built yet" -> dimmed, non-navigating
  image_path text,                        -- storage path in the tile-images bucket
  accent     text not null default '#2a41ba',
  position   integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tiles alter column user_id drop not null;

create index if not exists tiles_position_idx on public.tiles (position);

alter table public.tiles enable row level security;

drop policy if exists "Tiles are self-access" on public.tiles;
drop policy if exists "Tiles are open" on public.tiles;
create policy "Tiles are open" on public.tiles
  for all using (true) with check (true);

-- Keep updated_at current on every edit.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tiles_set_updated_at on public.tiles;
create trigger tiles_set_updated_at
  before update on public.tiles
  for each row execute function public.set_updated_at();

-- =========================================================================
-- STORAGE  (tile images at tiles/{tile_id}.webp)
-- Create the bucket via Dashboard → Storage → New bucket, named
-- `tile-images`, marked Public. The SQL insert into storage.buckets is
-- unreliable and silently no-ops.
-- =========================================================================
drop policy if exists "Tile images are publicly readable" on storage.objects;
create policy "Tile images are publicly readable" on storage.objects
  for select using (bucket_id = 'tile-images');

drop policy if exists "Users manage their own tile images" on storage.objects;
drop policy if exists "Tile images are open" on storage.objects;
create policy "Tile images are open" on storage.objects
  for all
  using (bucket_id = 'tile-images')
  with check (bucket_id = 'tile-images');
