create table if not exists public.profiles (id uuid primary key references auth.users(id) on delete cascade, display_name text, created_at timestamptz default now());
create table if not exists public.courses (id text primary key, title text not null, description text not null, created_at timestamptz default now());
