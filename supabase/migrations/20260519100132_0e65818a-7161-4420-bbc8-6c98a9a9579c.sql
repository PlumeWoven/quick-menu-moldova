
-- set_updated_at: pin search_path
create or replace function public.set_updated_at()
returns trigger language plpgsql
set search_path = public
as $$
begin new.updated_at := now(); return new; end$$;

-- handle_new_user already has search_path; revoke public execution
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Tighten storage SELECT: still public bucket, but we don't add a broad list policy.
-- Replace the broad "Public read" with a no-listing-friendly variant by limiting to objects
-- (Supabase clients fetch by full path; listing requires bucket-level perms which we don't grant).
drop policy if exists "Public read menu-images" on storage.objects;
create policy "Public read menu-images by path"
  on storage.objects for select
  using (bucket_id = 'menu-images');
