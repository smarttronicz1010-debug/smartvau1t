
-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- file categories
create type public.file_category as enum ('text','image','zip','pdf','video');

-- files
create table public.files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  filename text not null,
  category public.file_category not null,
  storage_path text,
  text_content text,
  file_size bigint not null default 0,
  mime_type text,
  deleted boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index files_user_active_idx on public.files (user_id, deleted, created_at desc);
create index files_user_category_idx on public.files (user_id, category, deleted, created_at desc);
grant select, insert, update, delete on public.files to authenticated;
grant all on public.files to service_role;
alter table public.files enable row level security;
create policy "files_select_own" on public.files for select to authenticated using (user_id = auth.uid());
create policy "files_insert_own" on public.files for insert to authenticated with check (user_id = auth.uid());
create policy "files_update_own" on public.files for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "files_delete_own" on public.files for delete to authenticated using (user_id = auth.uid());

create trigger files_set_updated_at before update on public.files
  for each row execute function public.set_updated_at();

-- storage policies for the 'vault' bucket (bucket created via storage tool)
-- Files live under {user_id}/... — only the owner can access them.
create policy "vault_select_own" on storage.objects for select to authenticated
  using (bucket_id = 'vault' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "vault_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'vault' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "vault_update_own" on storage.objects for update to authenticated
  using (bucket_id = 'vault' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "vault_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'vault' and (storage.foldername(name))[1] = auth.uid()::text);
