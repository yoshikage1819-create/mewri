-- Mewri v0.10 closed shared beta foundation.
-- Draft for owner review and manual application in a real Supabase project.
-- This migration intentionally creates no anonymous write policies.

create schema if not exists private;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (length(trim(display_name)) > 0),
  username text not null unique check (length(trim(username)) > 0),
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_updated_after_created_check check (updated_at >= created_at)
);

create table if not exists public.groups (
  id text primary key,
  name text not null check (length(trim(name)) > 0),
  description text not null default '',
  visibility text not null default 'invite_only'
    check (visibility in ('invite_only', 'private')),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint groups_updated_after_created_check check (updated_at >= created_at)
);

create table if not exists public.group_members (
  id text primary key,
  group_id text not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  constraint group_members_group_user_key unique (group_id, user_id)
);

create table if not exists public.zine_cycles (
  id text primary key,
  group_id text not null references public.groups(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  start_date date not null,
  end_date date not null,
  status text not null check (
    status in ('scheduled', 'active', 'closed', 'generating', 'ready_for_review', 'published', 'archived')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint zine_cycles_date_order_check check (end_date >= start_date),
  constraint zine_cycles_id_group_key unique (id, group_id),
  constraint zine_cycles_group_start_key unique (group_id, start_date),
  constraint zine_cycles_updated_after_created_check check (updated_at >= created_at)
);

create table if not exists public.themes (
  id text primary key,
  group_id text not null references public.groups(id) on delete cascade,
  zine_cycle_id text not null,
  title text not null check (length(trim(title)) > 0),
  description text not null default '',
  theme_date date not null,
  source text not null check (source in ('ai', 'host', 'admin')),
  status text not null check (status in ('scheduled', 'active', 'closed')),
  created_at timestamptz not null default now(),
  constraint themes_id_group_key unique (id, group_id),
  constraint themes_cycle_group_fk foreign key (zine_cycle_id, group_id)
    references public.zine_cycles(id, group_id) on delete cascade,
  constraint themes_cycle_date_key unique (zine_cycle_id, theme_date)
);

create table if not exists public.posts (
  id text primary key,
  user_id uuid not null references public.profiles(id),
  group_id text not null references public.groups(id) on delete cascade,
  theme_id text not null,
  image_url text not null check (
    length(trim(image_url)) > 0
    and image_url not like 'data:%'
  ),
  caption text not null default '',
  visibility text not null default 'group_only' check (visibility = 'group_only'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_id_group_key unique (id, group_id),
  constraint posts_theme_group_fk foreign key (theme_id, group_id)
    references public.themes(id, group_id) on delete cascade,
  constraint posts_updated_after_created_check check (updated_at >= created_at)
);

create table if not exists public.zines (
  id text primary key,
  zine_cycle_id text not null unique,
  group_id text not null references public.groups(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  intro text not null default '',
  cover_post_id text,
  status text not null check (status in ('draft', 'review', 'published', 'archived')),
  created_at timestamptz not null default now(),
  published_at timestamptz,
  constraint zines_id_group_key unique (id, group_id),
  constraint zines_cycle_group_fk foreign key (zine_cycle_id, group_id)
    references public.zine_cycles(id, group_id) on delete cascade,
  constraint zines_cover_post_group_fk foreign key (cover_post_id, group_id)
    references public.posts(id, group_id),
  constraint zines_published_status_check check (
    status <> 'published' or published_at is not null
  )
);

create table if not exists public.zine_pages (
  id text primary key,
  group_id text not null references public.groups(id) on delete cascade,
  zine_id text not null,
  post_id text not null,
  page_number integer not null check (page_number >= 0),
  layout_type text not null check (layout_type in ('cover', 'full_bleed', 'pair', 'caption')),
  ai_caption text,
  editor_note text,
  created_at timestamptz not null default now(),
  constraint zine_pages_zine_group_fk foreign key (zine_id, group_id)
    references public.zines(id, group_id) on delete cascade,
  constraint zine_pages_post_group_fk foreign key (post_id, group_id)
    references public.posts(id, group_id),
  constraint zine_pages_zine_page_key unique (zine_id, page_number)
);

create table if not exists public.event_logs (
  id text primary key,
  user_id uuid references public.profiles(id),
  group_id text references public.groups(id) on delete set null,
  event_name text not null check (length(trim(event_name)) > 0),
  entity_type text,
  entity_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Server-only invitation allowlist. There is intentionally no client policy.
create table if not exists public.beta_invites (
  email text primary key,
  invited_by uuid references public.profiles(id),
  group_id text not null references public.groups(id) on delete cascade,
  accepted_by uuid references public.profiles(id),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists groups_created_by_idx on public.groups (created_by);
create index if not exists group_members_user_id_idx on public.group_members (user_id);
create index if not exists zine_cycles_group_status_idx on public.zine_cycles (group_id, status);
create index if not exists themes_group_date_idx on public.themes (group_id, theme_date);
create index if not exists themes_cycle_idx on public.themes (zine_cycle_id);
create index if not exists posts_group_feed_idx on public.posts (group_id, created_at desc, id desc);
create index if not exists posts_theme_feed_idx on public.posts (theme_id, created_at desc, id desc);
create index if not exists zines_group_published_idx on public.zines (group_id, published_at desc, id desc);
create index if not exists zine_pages_zine_order_idx on public.zine_pages (zine_id, page_number);
create index if not exists zine_pages_group_idx on public.zine_pages (group_id);
create index if not exists event_logs_group_created_idx on public.event_logs (group_id, created_at desc, id desc);

create or replace function private.is_group_member(target_group_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.group_members member
      where member.group_id = target_group_id
        and member.user_id = (select auth.uid())
    );
$$;

create or replace function private.is_group_member_path(target_group_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.group_members member
      where member.group_id = target_group_id
        and member.user_id = (select auth.uid())
    );
$$;

create or replace function private.is_active_group_theme(target_theme_id text, target_group_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.themes theme
    where theme.id = target_theme_id
      and theme.group_id = target_group_id
      and theme.status = 'active'
  );
$$;

revoke all on schema private from public;
grant usage on schema private to authenticated;

revoke all on function private.is_group_member(text) from public;
revoke all on function private.is_group_member_path(text) from public;
revoke all on function private.is_active_group_theme(text, text) from public;
grant execute on function private.is_group_member(text) to authenticated;
grant execute on function private.is_group_member_path(text) to authenticated;

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.zine_cycles enable row level security;
alter table public.themes enable row level security;
alter table public.posts enable row level security;
alter table public.zines enable row level security;
alter table public.zine_pages enable row level security;
alter table public.event_logs enable row level security;
alter table public.beta_invites enable row level security;

-- SQL-created public tables receive only the client privileges required by
-- the policies below. Remaining writes are server-controlled.
revoke all on table
  public.profiles,
  public.groups,
  public.group_members,
  public.zine_cycles,
  public.themes,
  public.posts,
  public.zines,
  public.zine_pages,
  public.event_logs,
  public.beta_invites
from anon, authenticated;

grant select on table
  public.profiles,
  public.groups,
  public.group_members,
  public.zine_cycles,
  public.themes,
  public.posts,
  public.zines,
  public.zine_pages,
  public.event_logs
to authenticated;

create policy "profiles read own record"
on public.profiles for select to authenticated
using (id = (select auth.uid()));

create policy "members read their groups"
on public.groups for select to authenticated
using ((select private.is_group_member(id)));

create policy "members read group membership"
on public.group_members for select to authenticated
using ((select private.is_group_member(group_id)));

create policy "members read zine cycles"
on public.zine_cycles for select to authenticated
using ((select private.is_group_member(group_id)));

create policy "members read themes"
on public.themes for select to authenticated
using ((select private.is_group_member(group_id)));

create policy "members read posts"
on public.posts for select to authenticated
using ((select private.is_group_member(group_id)));

-- No client INSERT policy is provided for posts while the authenticated
-- server route is absent. That route must validate the session, membership,
-- active theme, and uploaded private image before writing with server-only
-- credentials.

create policy "members read zines"
on public.zines for select to authenticated
using ((select private.is_group_member(group_id)));

create policy "members read zine pages"
on public.zine_pages for select to authenticated
using ((select private.is_group_member(group_id)));

create policy "members read group events"
on public.event_logs for select to authenticated
using (group_id is not null and (select private.is_group_member(group_id)));

-- No client policies are provided for group setup, invitations, theme setup,
-- ZINE publishing, page replacement, or event insertion. Those writes remain
-- server controlled and must validate membership/role before using a service key.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-images',
  'post-images',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "members read group post images"
on storage.objects for select to authenticated
using (
  bucket_id = 'post-images'
  and (select private.is_group_member_path((storage.foldername(name))[1]))
);

-- Required object path convention:
-- post-images/<group_id>/<authenticated_user_uuid>/<generated_filename>
--
-- No storage.objects INSERT policy exists in this foundation migration.
-- Upload remains unavailable until the authenticated server route validates
-- MIME type, size, group membership, active theme, and object path before it
-- writes with server-only credentials.
