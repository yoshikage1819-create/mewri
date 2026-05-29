-- Mewri v0.10 shared-beta post creation RPC draft.
-- Draft only: do not apply until owner approval and staging review.
--
-- This keeps direct client INSERT policies closed. Authenticated users call only
-- public.create_shared_beta_post; the definer wrapper delegates to private logic.

create or replace function private.create_shared_beta_post(
  p_user_id uuid,
  p_group_id text,
  p_theme_id text,
  p_image_path text,
  p_caption text
)
returns table (
  id text,
  user_id uuid,
  group_id text,
  theme_id text,
  image_url text,
  caption text,
  visibility text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  generated_post_id text;
  generated_event_id text;
  created_timestamp timestamptz := now();
  object_name text;
  image_segments text[];
begin
  if current_user_id is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;

  if current_user_id <> p_user_id then
    raise exception 'identity_mismatch' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.group_members member
    where member.group_id = p_group_id
      and member.user_id = current_user_id
  ) then
    raise exception 'group_membership_required' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.themes theme
    where theme.id = p_theme_id
      and theme.group_id = p_group_id
      and theme.status = 'active'
  ) then
    raise exception 'active_group_theme_required' using errcode = '42501';
  end if;

  image_segments := string_to_array(p_image_path, '/');
  if array_length(image_segments, 1) <> 4
    or image_segments[1] <> 'post-images'
    or image_segments[2] <> p_group_id
    or image_segments[3] <> current_user_id::text
    or image_segments[4] !~ '^[A-Za-z0-9][A-Za-z0-9._-]*$'
    or image_segments[4] in ('.', '..')
  then
    raise exception 'private_image_path_required' using errcode = '22023';
  end if;

  object_name := image_segments[2] || '/' || image_segments[3] || '/' || image_segments[4];
  if not exists (
    select 1
    from storage.objects object
    where object.bucket_id = 'post-images'
      and object.name = object_name
  ) then
    raise exception 'storage_object_not_found' using errcode = '22023';
  end if;

  generated_post_id := 'post_' || replace(gen_random_uuid()::text, '-', '');
  generated_event_id := 'event_' || replace(gen_random_uuid()::text, '-', '');

  insert into public.posts (
    id,
    user_id,
    group_id,
    theme_id,
    image_url,
    caption,
    visibility,
    created_at,
    updated_at
  )
  values (
    generated_post_id,
    current_user_id,
    p_group_id,
    p_theme_id,
    p_image_path,
    coalesce(p_caption, ''),
    'group_only',
    created_timestamp,
    created_timestamp
  );

  insert into public.event_logs (
    id,
    user_id,
    group_id,
    event_name,
    entity_type,
    entity_id,
    metadata,
    created_at
  )
  values (
    generated_event_id,
    current_user_id,
    p_group_id,
    'post_created',
    'post',
    generated_post_id,
    jsonb_build_object('themeId', p_theme_id),
    created_timestamp
  );

  return query
    select
      post.id,
      post.user_id,
      post.group_id,
      post.theme_id,
      post.image_url,
      post.caption,
      post.visibility,
      post.created_at,
      post.updated_at
    from public.posts post
    where post.id = generated_post_id;
end;
$$;

create or replace function public.create_shared_beta_post(
  p_user_id uuid,
  p_group_id text,
  p_theme_id text,
  p_image_path text,
  p_caption text
)
returns table (
  id text,
  user_id uuid,
  group_id text,
  theme_id text,
  image_url text,
  caption text,
  visibility text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = ''
as $$
  select *
  from private.create_shared_beta_post(
    p_user_id,
    p_group_id,
    p_theme_id,
    p_image_path,
    p_caption
  );
$$;

revoke all on function private.create_shared_beta_post(uuid, text, text, text, text) from public;
revoke all on function public.create_shared_beta_post(uuid, text, text, text, text) from public;
revoke all on function private.create_shared_beta_post(uuid, text, text, text, text) from anon;
revoke all on function public.create_shared_beta_post(uuid, text, text, text, text) from anon;
grant execute on function public.create_shared_beta_post(uuid, text, text, text, text) to authenticated;

-- Intentionally no posts, event_logs, or storage.objects INSERT policies.
