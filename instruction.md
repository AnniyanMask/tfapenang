# Temple Of Fine Arts Penang • Shiva Family Portal
## Supabase Database Setup, Schema Guide & Update Instructions

> **MANDATORY DIRECTIVE:**  
> Every time changes are made to the application data models, tables, columns, constraints, or storage buckets, **you MUST update `schema.sql`** to maintain 100% parity with the production application. Always write the exact SQL query required to update existing databases.

---

## 1. Quick Setup: Running `schema.sql` in Supabase

1. **Log in to Supabase:**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard) and select your project (or create a new project).

2. **Open the SQL Editor:**
   - In the left sidebar, click the **SQL Editor** icon (terminal icon with `_>`).
   - Click **New query** (or press `New Query` button).

3. **Execute the Schema:**
   - Open `/schema.sql` from this project.
   - Copy the entire SQL contents and paste them into the Supabase SQL editor.
   - Click **Run** (green button or `Ctrl+Enter` / `Cmd+Enter`).
   - Confirm that the query succeeds with message: `Success. No rows returned`.

4. **Verify Generated Resources:**
   - **Table Editor:** Confirm that the following 6 tables exist:
     - `profiles`
     - `deities`
     - `deity_bookings`
     - `prayer_hostings`
     - `temple_branding`
     - `announcements`
   - **Storage:** Under **Storage > Buckets**, verify that the public bucket `shivafamily_avatar` is created.
   - **Authentication / Row Level Security (RLS):** RLS is enabled on all tables with explicit read/write policies.

5. **Configure Client Environment Variables:**
   - In your `.env` (or AI Studio Settings), add:
     ```env
     VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
     VITE_SUPABASE_ANON_KEY="your-anon-public-key"
     VITE_SUPABASE_AVATAR_BUCKET="shivafamily_avatar"
     ```

---

## 2. Database Architecture & Table Reference

| Table | Primary Key | Description | Key Constraints & Indexes |
| :--- | :--- | :--- | :--- |
| `public.profiles` | `id (uuid)` | Devotees & temple administrators | `mobile_phone` UNIQUE, `password_hash`, role in `('user','admin')`, status in `('pending','approved','rejected')` |
| `public.deities` | `id (text)` | Sacred Vigrahas catalog | status in `('active','disabled')` |
| `public.deity_bookings` | `id (uuid)` | Sunday-to-Sunday sanctum reservations | `unique_deity_active_slot (deity_id, start_date)` to prevent double booking |
| `public.prayer_hostings` | `id (uuid)` | Sunday community satsang & prasadam | `date` UNIQUE |
| `public.temple_branding` | `id (text)` | Temple logo, name, tagline customizer | type in `('image','emoji')` |
| `public.announcements` | `id (text)` | TFA Penang notice board & circulars | category in `('festival','puja','seva','general')`, `is_pinned` boolean |
| `storage.buckets` | `id = 'shivafamily_avatar'` | Devotee profile photo storage | Public read, authenticated or devotee upload |

---

## 3. Mandatory Protocol for Schema Changes

Whenever new features, columns, or tables are introduced to the app:
1. **Update `/schema.sql`** immediately with the new table/column definitions and idempotent constraints (`IF NOT EXISTS`).
2. **Add the corresponding migration query** in the Incremental Updates section below so that existing databases can be upgraded without data loss.

---

## 4. SQL Queries to Update Existing Databases (Migrations)

If you already have an active Supabase database and need to apply incremental updates without re-creating existing tables:

### Update 1: Add or Update the Announcements (TFA Penang Notice Board & Circulars) Table
```sql
-- 1. Create announcements table if missing
create table if not exists public.announcements (
  id text primary key,
  title text not null,
  content text not null,
  category text not null default 'general' check (category in ('festival', 'puja', 'seva', 'general')),
  is_pinned boolean not null default false,
  author_name text not null default 'Temple Administration',
  published_date date not null default current_date,
  valid_until date,
  badge_text text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set descriptive comment for TFA Penang Notice Board & Circulars
comment on table public.announcements is 'TFA Penang Notice Board & Circulars';

-- 2. Indexes for fast sorting and category filters
create index if not exists idx_announcements_pinned on public.announcements (is_pinned, published_date desc);
create index if not exists idx_announcements_category on public.announcements (category);

-- 3. Enable RLS and public policies
alter table public.announcements enable row level security;

drop policy if exists "Anyone can view announcements" on public.announcements;
create policy "Anyone can view announcements" on public.announcements
  for select using (true);

drop policy if exists "Admins can manage announcements" on public.announcements;
create policy "Admins can manage announcements" on public.announcements
  for all using (true);
```

### Update 2: Add Temple Branding (Logo & Title) Table
```sql
create table if not exists public.temple_branding (
  id text primary key default 'current',
  type text not null default 'emoji' check (type in ('image', 'emoji')),
  value text not null,
  temple_name text not null default 'Temple Of Fine Arts Penang',
  tagline text not null default 'Shiva Family Deity Booking & Sunday Prayer Portal',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.temple_branding enable row level security;

drop policy if exists "Anyone can view branding" on public.temple_branding;
create policy "Anyone can view branding" on public.temple_branding
  for select using (true);

drop policy if exists "Admins can update branding" on public.temple_branding;
create policy "Admins can update branding" on public.temple_branding
  for all using (true);
```

### Update 3: Add Avatar Support to Profiles & Storage Bucket
```sql
-- 1. Add avatar_url column to profiles
alter table public.profiles add column if not exists avatar_url text;

-- 2. Ensure storage bucket exists
insert into storage.buckets (id, name, public)
values ('shivafamily_avatar', 'shivafamily_avatar', true)
on conflict (id) do update set public = true;

-- 3. Ensure storage access policies exist
drop policy if exists "Public can view avatars" on storage.objects;
create policy "Public can view avatars" on storage.objects
  for select using (bucket_id = 'shivafamily_avatar');

drop policy if exists "Devotees can upload avatars" on storage.objects;
create policy "Devotees can upload avatars" on storage.objects
  for insert with check (bucket_id = 'shivafamily_avatar');
```

### Update 4: Add Deity Guidelines and Booking Collection Time
```sql
-- Add guidelines to deities table
alter table public.deities add column if not exists guidelines text;

-- Add collection_time to deity bookings
alter table public.deity_bookings add column if not exists collection_time text default 'Sunday after prayers (12:30 PM)';
```

### Update 5: Add Food (🍃) and Drinks (Coffee ☕) Offerings to Sunday Prayer Hostings
```sql
-- Add food and drinks offering flags to prayer hostings
alter table public.prayer_hostings add column if not exists provides_food boolean not null default false;
alter table public.prayer_hostings add column if not exists provides_drinks boolean not null default false;

-- Add descriptive comments
comment on column public.prayer_hostings.provides_food is 'Host provides food / prasadam (🍃)';
comment on column public.prayer_hostings.provides_drinks is 'Host provides coffee / drinks (☕)';
```

### Update 6: Add Password Hash Support to Profiles Table
```sql
-- Add password_hash column to profiles table for secure local credential support
alter table public.profiles add column if not exists password_hash text;
```

---

## 5. Mock Data Purge & Administrator Creation Queries

### 5.1 One-Click Purge of All Mock Data
Execute this block to wipe all mock bookings, mock hostings, and old mock users:
```sql
-- 1. Remove all mock deity bookings
truncate table public.deity_bookings cascade;

-- 2. Remove all mock Sunday prayer hostings
truncate table public.prayer_hostings cascade;

-- 3. Delete old mock demo users
delete from public.profiles 
where mobile_phone in ('9876543210', '9876543211', '9876543212', '9876543213', '9876543214');
```

### 5.2 Create Official Administrator Account (Mobile: `0162216904`, Password: `Anni1234$$`)
Execute this query in your Supabase SQL Editor to insert or update the primary administrator:
```sql
-- Ensure pgcrypto is enabled for bcrypt hashing
create extension if not exists "pgcrypto";

-- Insert or update Administrator in public.profiles
insert into public.profiles (
  id,
  mobile_phone,
  full_name,
  email,
  password_hash,
  role,
  status,
  address,
  avatar_url,
  created_at,
  updated_at
)
values (
  '01622169-0400-4000-8000-000000000001',
  '0162216904',
  'Temple Administrator',
  'admin@tfapenang.org',
  crypt('Anni1234$$', gen_salt('bf')),
  'admin',
  'approved',
  'Temple Of Fine Arts Penang Office',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
  now(),
  now()
)
on conflict (mobile_phone) do update set
  full_name = excluded.full_name,
  role = 'admin',
  status = 'approved',
  password_hash = excluded.password_hash,
  updated_at = now();
```

---

## 6. Helpful Administrative SQL Queries

### Approve a Pending Devotee Account
```sql
update public.profiles
set status = 'approved'
where mobile_phone = '0123456789';
```

### Promote an Account to Temple Administrator
```sql
update public.profiles
set role = 'admin', status = 'approved'
where mobile_phone = '0162216904';
```

### Query All Confirmed Deity Bookings for an Upcoming Sunday
```sql
select 
  b.deity_name,
  b.start_date,
  b.end_date,
  p.full_name as devotee_name,
  p.mobile_phone,
  b.collection_time,
  b.status
from public.deity_bookings b
left join public.profiles p on b.user_id = p.id
where b.start_date = '2026-09-13' and b.status = 'confirmed';
```

### Query Open / Available Sunday Prayer Dates
```sql
select date, status, notes
from public.prayer_hostings
where status = 'available' and date >= current_date
order by date asc;
```

### Pin or Unpin an Announcement
```sql
update public.announcements
set is_pinned = true
where id = 'ann_portal_launch_2026';
```
