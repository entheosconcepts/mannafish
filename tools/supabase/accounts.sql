-- MannaFish (and any Yadah ministry site) accounts: notes, highlights, recent activity, decal orders.
-- Paste into Supabase → SQL Editor → Run. Safe to run again: it only adds what is missing.
-- Nothing here is fish-specific: a "design" is one way of showing a word (fish, plain scripture, …),
-- and notes and highlights attach to the verse, so they survive any change of design.
-- Every table is locked (row level security): a signed-in person sees and changes only their own rows;
-- orders are written by the site's server only. It does not touch the existing attendee tables.

create extension if not exists pgcrypto;

-- ── catalogue (readable by anyone, written only from the dashboard or the server) ──
create table if not exists public.sites (
  id    text primary key,                 -- 'mannafish', 'yadah', …
  name  text not null
);
insert into public.sites (id, name) values ('mannafish','MannaFish'), ('yadah','Yadah')
  on conflict (id) do nothing;

create table if not exists public.designs (
  id        text primary key,             -- e.g. 'mannafish-fish-es-HOPE'
  site      text not null references public.sites(id),
  word_key  text not null,                -- 'HOPE'
  style     text not null default 'fish', -- 'fish', 'plain', or any new style
  language  text not null default 'en',   -- 'en', 'es', 'tl', 'zh', 'hi', 'el', …
  version   text,                         -- 'KJV', 'RVR1960', …
  verse_ref text,                         -- 'Psalm 42:5'
  active    boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── one row per person ──
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  language      text not null default 'en',
  bible_version text,
  created_at    timestamptz not null default now()
);

-- ── the person's own study ──
create table if not exists public.notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  site       text not null default 'mannafish' references public.sites(id),
  word_key   text,
  verse_ref  text,
  design_id  text references public.designs(id) on delete set null,
  body       text not null default '',
  spoken     boolean not null default false,   -- dictated rather than typed
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists notes_user_idx on public.notes (user_id, updated_at desc);

create table if not exists public.highlights (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  site       text not null default 'mannafish' references public.sites(id),
  verse_ref  text not null,
  version    text,
  color      text not null default 'yellow',
  created_at timestamptz not null default now(),
  unique (user_id, site, verse_ref, version)
);

create table if not exists public.activity (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  site       text not null default 'mannafish' references public.sites(id),
  kind       text not null,               -- 'viewed', 'listened', 'compared', 'opened_verse', …
  word_key   text,
  verse_ref  text,
  design_id  text references public.designs(id) on delete set null,
  at         timestamptz not null default now()
);
create index if not exists activity_user_idx on public.activity (user_id, at desc);

-- ── decal orders (written by the server from the Free Decals form; read by their owner) ──
create table if not exists public.orders (
  id          uuid primary key default gen_random_uuid(),
  site        text not null default 'mannafish' references public.sites(id),
  user_id     uuid references auth.users(id) on delete set null,
  email       text not null,
  ship_name   text, street text, city text, state_zip text,
  status      text not null default 'requested',   -- requested, sent, delivered
  created_at  timestamptz not null default now()
);
create index if not exists orders_email_idx on public.orders (lower(email));
create table if not exists public.order_items (
  id         bigint generated always as identity primary key,
  order_id   uuid not null references public.orders(id) on delete cascade,
  design_id  text references public.designs(id) on delete set null,
  word_key   text,
  language   text,                         -- 'English', 'Español', 'One of each', …
  qty        int not null default 2 check (qty > 0)
);

-- ── keep updated_at honest ──
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists notes_touch on public.notes;
create trigger notes_touch before update on public.notes for each row execute function public.touch_updated_at();

-- ── a profile row for each new sign-in ──
create or replace function public.create_profile_for_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile after insert on auth.users
  for each row execute function public.create_profile_for_new_user();

-- ── locks ──
alter table public.sites       enable row level security;
alter table public.designs     enable row level security;
alter table public.profiles    enable row level security;
alter table public.notes       enable row level security;
alter table public.highlights  enable row level security;
alter table public.activity    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "anyone reads sites" on public.sites;
create policy "anyone reads sites" on public.sites for select to anon, authenticated using (true);
drop policy if exists "anyone reads active designs" on public.designs;
create policy "anyone reads active designs" on public.designs for select to anon, authenticated using (active);

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "own notes" on public.notes;
create policy "own notes" on public.notes for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "own highlights" on public.highlights;
create policy "own highlights" on public.highlights for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "own activity" on public.activity;
create policy "own activity" on public.activity for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- orders: read your own (by account, or by the email you signed in with); no writes from the browser
drop policy if exists "own orders" on public.orders;
create policy "own orders" on public.orders for select to authenticated
  using (user_id = (select auth.uid()) or lower(email) = lower((select auth.jwt() ->> 'email')));
drop policy if exists "own order items" on public.order_items;
create policy "own order items" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id));
