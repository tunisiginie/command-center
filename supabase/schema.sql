-- Command Center — Supabase schema
-- Run this in the Supabase SQL Editor (Project → SQL Editor → New query).
-- Idempotent: safe to re-run.

-- =========================================================================
-- TILES  (one row per launcher tile, owned by the signed-in user)
-- =========================================================================
create table if not exists public.tiles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  label      text not null,
  tagline    text,                        -- optional; blank keeps the tile minimal
  url        text,                        -- null = "not built yet" -> dimmed, non-navigating
  image_path text,                        -- storage path in the tile-images bucket
  accent     text not null default '#2a41ba',
  position   integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tiles_user_position_idx on public.tiles (user_id, position);

alter table public.tiles enable row level security;

drop policy if exists "Tiles are self-access" on public.tiles;
create policy "Tiles are self-access" on public.tiles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

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
-- STORAGE  (tile images — public-read so <img>/next/image never hits an
-- expired signed URL; writes are still locked to the owning user via RLS)
-- =========================================================================
insert into storage.buckets (id, name, public)
values ('tile-images', 'tile-images', true)
on conflict (id) do nothing;

drop policy if exists "Tile images are publicly readable" on storage.objects;
create policy "Tile images are publicly readable" on storage.objects
  for select
  using (bucket_id = 'tile-images');

-- Path convention: {user_id}/{tile_id}.webp — the first path segment must
-- match the uploader's own auth.uid() to write/replace/delete.
drop policy if exists "Users manage their own tile images" on storage.objects;
create policy "Users manage their own tile images" on storage.objects
  for all
  using (bucket_id = 'tile-images' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'tile-images' and (storage.foldername(name))[1] = auth.uid()::text);
