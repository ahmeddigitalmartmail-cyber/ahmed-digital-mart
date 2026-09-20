-- AHMED DIGITAL & MART — Supabase setup
-- Run this in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  price numeric(12,2) not null default 0,
  stock integer not null default 0 check (stock >= 0),
  category text default 'General',
  image_url text,
  image_path text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  address text not null,
  notes text default '',
  items jsonb not null,
  total numeric(12,2) not null default 0,
  status text not null default 'new' check (status in ('new','confirmed','processing','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.orders enable row level security;

-- The Node backend uses the Supabase secret key, so it can access these tables server-side.
-- Do not expose the secret key in frontend code.

-- Public product images bucket.
insert into storage.buckets (id,name,public)
values ('product-images','product-images',true)
on conflict (id) do update set public=true;

-- Public read for product images.
drop policy if exists "Public product image read" on storage.objects;
create policy "Public product image read"
on storage.objects for select
to public
using (bucket_id = 'product-images');

-- Optional: allow the backend secret key to manage objects. Secret/service keys bypass RLS.
