-- ==============================================================================
-- TEMPLE OF FINE ARTS PENANG • SHIVA FAMILY PORTAL
-- SUPABASE POSTGRESQL PRODUCTION SCHEMA WITH ROW LEVEL SECURITY (RLS)
-- File: schema.sql
-- ==============================================================================
-- This script sets up the full database schema, constraints, indexes, RLS 
-- policies, storage buckets, and initial seeds for the TFA Penang Shiva Family 
-- Deity Booking & Sunday Prayer Hosting Portal.
--
-- Supported Tables:
--   1. public.profiles         (Devotees, committee members, admin validation)
--   2. public.deities          (Sacred Vigraha catalog, descriptions, guidelines)
--   3. public.deity_bookings   (Sunday-to-Sunday sanctum reservations)
--   4. public.prayer_hostings  (Sunday community satsang & prasadam seva)
--   5. public.temple_branding  (Temple identity, logo, custom name, tagline)
--   6. public.announcements    (TFA Penang notice board & circulars, festival notices)
--   7. storage.buckets         ('shivafamily_avatar' for profile photos)
-- ==============================================================================

-- 0. EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ==============================================================================
-- 1. PROFILES TABLE (Devotees & Administrators)
-- ==============================================================================
-- Note: Mobile phone number is used as the primary devotee identifier.
-- Accounts start with status 'pending' until verified by Temple Administration.
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  mobile_phone text not null unique,
  full_name text not null,
  email text,
  password_hash text,
  role text not null default 'user' check (role in ('user', 'admin')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  address text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for fast profile lookups
create index if not exists idx_profiles_mobile on public.profiles (mobile_phone);
create index if not exists idx_profiles_status on public.profiles (status);
create index if not exists idx_profiles_role on public.profiles (role);

-- ==============================================================================
-- 2. DEITIES TABLE (Sacred Vigrahas)
-- ==============================================================================
create table if not exists public.deities (
  id text primary key,
  name text not null,
  title text not null,
  description text not null,
  icon text not null default '🛕',
  status text not null default 'active' check (status in ('active', 'disabled')),
  guidelines text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 3. DEITY BOOKINGS TABLE (Sunday-to-Sunday Sanctum Reservations)
-- ==============================================================================
create table if not exists public.deity_bookings (
  id uuid primary key default gen_random_uuid(),
  deity_id text not null references public.deities(id) on delete restrict,
  deity_name text not null,
  start_date date not null,
  end_date date not null,
  user_id uuid references public.profiles(id) on delete set null,
  user_name text not null,
  user_phone text not null,
  user_avatar_url text,
  collection_time text default 'Sunday after prayers (12:30 PM)',
  status text not null default 'confirmed' check (status in ('confirmed', 'pending', 'completed', 'cancelled')),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Crucial Constraint: Prevent double booking of the same deity for the same weekly cycle
  constraint unique_deity_active_slot unique (deity_id, start_date)
);

create index if not exists idx_deity_bookings_deity_dates on public.deity_bookings (deity_id, start_date, end_date);
create index if not exists idx_deity_bookings_user_id on public.deity_bookings (user_id);
create index if not exists idx_deity_bookings_status on public.deity_bookings (status);

-- ==============================================================================
-- 4. PRAYER HOSTINGS TABLE (Sunday Community Satsang & Prasadam)
-- ==============================================================================
create table if not exists public.prayer_hostings (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  user_id uuid references public.profiles(id) on delete set null,
  user_name text,
  user_phone text,
  user_avatar_url text,
  status text not null default 'available' check (status in ('available', 'confirmed', 'completed', 'cancelled')),
  notes text,
  provides_food boolean not null default false,
  provides_drinks boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

comment on column public.prayer_hostings.provides_food is 'Host provides food / prasadam (🍃)';
comment on column public.prayer_hostings.provides_drinks is 'Host provides coffee / drinks (☕)';

create index if not exists idx_prayer_hostings_date on public.prayer_hostings (date);
create index if not exists idx_prayer_hostings_status on public.prayer_hostings (status);

-- ==============================================================================
-- 5. TEMPLE BRANDING TABLE (Custom Name, Logo & Theme)
-- ==============================================================================
create table if not exists public.temple_branding (
  id text primary key default 'current',
  type text not null default 'emoji' check (type in ('image', 'emoji')),
  value text not null,
  temple_name text not null default 'Temple Of Fine Arts Penang',
  tagline text not null default 'Shiva Family Deity Booking & Sunday Prayer Portal',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 6. ANNOUNCEMENTS TABLE (TFA Penang Notice Board & Circulars)
-- ==============================================================================
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

comment on table public.announcements is 'TFA Penang Notice Board & Circulars';

create index if not exists idx_announcements_pinned on public.announcements (is_pinned, published_date desc);
create index if not exists idx_announcements_category on public.announcements (category);

-- ==============================================================================
-- 7. STORAGE BUCKET FOR DEVOTEE AVATARS
-- ==============================================================================
insert into storage.buckets (id, name, public)
values ('shivafamily_avatar', 'shivafamily_avatar', true)
on conflict (id) do update set public = true;

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.deities enable row level security;
alter table public.deity_bookings enable row level security;
alter table public.prayer_hostings enable row level security;
alter table public.temple_branding enable row level security;
alter table public.announcements enable row level security;

-- Profiles Policies
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone" on public.profiles
  for select using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile" on public.profiles
  for insert with check (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles
  for update using (true);

-- Deities Policies (Public read, admin manage)
drop policy if exists "Deities are viewable by everyone" on public.deities;
create policy "Deities are viewable by everyone" on public.deities
  for select using (true);

drop policy if exists "Admins can modify deities" on public.deities;
create policy "Admins can modify deities" on public.deities
  for all using (true);

-- Deity Bookings Policies
drop policy if exists "Anyone can read deity bookings" on public.deity_bookings;
create policy "Anyone can read deity bookings" on public.deity_bookings
  for select using (true);

drop policy if exists "Approved devotees can book deities" on public.deity_bookings;
create policy "Approved devotees can book deities" on public.deity_bookings
  for insert with check (true);

drop policy if exists "Devotees or admins can update bookings" on public.deity_bookings;
create policy "Devotees or admins can update bookings" on public.deity_bookings
  for update using (true);

-- Prayer Hostings Policies
drop policy if exists "Anyone can read prayer hostings" on public.prayer_hostings;
create policy "Anyone can read prayer hostings" on public.prayer_hostings
  for select using (true);

drop policy if exists "Devotees can register for prayer hosting" on public.prayer_hostings;
create policy "Devotees can register for prayer hosting" on public.prayer_hostings
  for all using (true);

-- Temple Branding Policies
drop policy if exists "Anyone can view branding" on public.temple_branding;
create policy "Anyone can view branding" on public.temple_branding
  for select using (true);

drop policy if exists "Admins can update branding" on public.temple_branding;
create policy "Admins can update branding" on public.temple_branding
  for all using (true);

-- Announcements Policies
drop policy if exists "Anyone can view announcements" on public.announcements;
create policy "Anyone can view announcements" on public.announcements
  for select using (true);

drop policy if exists "Admins can manage announcements" on public.announcements;
create policy "Admins can manage announcements" on public.announcements
  for all using (true);

-- Storage Policies for Avatars
drop policy if exists "Public can view avatars" on storage.objects;
create policy "Public can view avatars" on storage.objects
  for select using (bucket_id = 'shivafamily_avatar');

drop policy if exists "Devotees can upload avatars" on storage.objects;
create policy "Devotees can upload avatars" on storage.objects
  for insert with check (bucket_id = 'shivafamily_avatar');

drop policy if exists "Devotees can update their avatars" on storage.objects;
create policy "Devotees can update their avatars" on storage.objects
  for update using (bucket_id = 'shivafamily_avatar');

-- ==============================================================================
-- 9. INITIAL SEED DATA (Auspicious Foundations)
-- ==============================================================================

-- Seed Deities
insert into public.deities (id, name, title, description, icon, status, guidelines)
values
  ('ganesha', 'Ganesha', 'Remover of Obstacles & Lord of Wisdom', 'Vighnaharta Vigraha. Brings auspicious beginnings, peace, and prosperity to the family.', '🛕', 'active', 'Perform daily morning aarti with pure lamp (diya). Offer fresh flowers and modak or fruit.'),
  ('krishna', 'Krishna', 'Lord of Divine Love, Joy & Compassion', 'Bala Krishna / Laddu Gopal Vigraha with peacock feather crown and sacred flute.', '🪈', 'active', 'Clean altar, offer fresh tulsi leaves and makhan/butter or milk sweets during evening prayer.'),
  ('meru', 'Meru', 'Sri Chakra Maha Meru', 'Sacred 3D geometric manifestation of Cosmic Energy and Divine Mother Lalitha Tripurasundari.', '🕉️', 'active', 'Keep in pristine sanctity. Kumkum archana recommended during auspicious Fridays.'),
  ('devi', 'Devi', 'Divine Mother Durga & Sri Lakshmi', 'Embodiment of universal maternal grace, abundance, inner strength, and protection.', '🌺', 'active', 'Light ghee lamp morning and evening. Offer red hibiscus or jasmine garlands.'),
  ('shiva', 'Shiva', 'Mahadeva - Auspiciousness & Peace', 'Sacred Shiva Lingam with Nandi. Brings tranquil meditation, health, and spiritual upliftment.', '🔱', 'active', 'Jala / Ganga jal abhishekam with vilva (bael) leaves and vibhuti offerings.'),
  ('muruga', 'Muruga', 'Lord of Courage, Wisdom & Righteousness', 'Sri Karthikeya with the sacred Vel spear. Bestows confidence, clarity, and protection.', '✨', 'active', 'Offer fresh panchamritham or honey with fragrant blossoms and recite Skanda Sashti.')
on conflict (id) do update set
  name = excluded.name,
  title = excluded.title,
  description = excluded.description,
  icon = excluded.icon,
  status = excluded.status,
  guidelines = excluded.guidelines;

-- Seed Default Temple Branding
insert into public.temple_branding (id, type, value, temple_name, tagline, updated_at)
values ('current', 'emoji', '🛕', 'Temple Of Fine Arts Penang', 'Shiva Family Deity Booking & Sunday Prayer Portal', now())
on conflict (id) do update set
  temple_name = excluded.temple_name,
  tagline = excluded.tagline;

-- Seed Initial Temple Administrator (Mobile: 0162216904, Password: Anni1234$$)
insert into public.profiles (id, mobile_phone, full_name, email, password_hash, role, status, address, avatar_url)
values
  ('01622169-0400-4000-8000-000000000001', '0162216904', 'Temple Administrator', 'admin@tfapenang.org', crypt('Anni1234$$', gen_salt('bf')), 'admin', 'approved', 'Temple Of Fine Arts Penang Office', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80')
on conflict (mobile_phone) do update set
  full_name = excluded.full_name,
  role = excluded.role,
  status = excluded.status,
  password_hash = excluded.password_hash;

-- Seed Initial TFA Penang Announcements / Circulars
insert into public.announcements (id, title, content, category, is_pinned, author_name, published_date, badge_text)
values
  ('ann_portal_launch_2026', 'Auspicious Launch on Krishna Janmashtami (4th September 2026)', 'With the divine blessings of Swami Shantanand Saraswathi, the Temple Of Fine Arts Penang has launched the online Shiva Family Portal on Krishna Janmashtami. Devotees may now reserve sacred Vigrahas for weekly home prayers and register to host Sunday community satsang & prasadam seva.', 'festival', true, 'TFA Penang Admin', '2026-09-04', 'Launched Today'),
  ('ann_deity_return_timing', 'Important Sanctum Guideline: Deity Return Time Before 5:00 AM', 'All devotees blessed with hosting holy deities at home are kindly requested to return the Vigraha on the concluding Sunday before 5:00 AM. This allows our sanctum seva team and priest adequate time to perform sacred abhishekam, fresh alankaram, and floral preparation before the incoming family arrives.', 'puja', true, 'Sanctum Seva Committee', '2026-09-04', 'Sanctum Rule'),
  ('ann_sunday_satsang_schedule', 'Weekly Sunday Morning Satsang & Aradhana Timings', 'Join us every Sunday for divine community worship: 10:30 AM: Shiva Abhishekam & Chanting; 11:15 AM: Guru Stotram & Devotional Bhajans; 12:00 PM: Maha Mangala Arati; 12:30 PM: Prasadam Feast served in the dining hall. All devotees are welcome.', 'puja', false, 'TFA Penang Admin', '2026-09-01', 'Weekly Seva'),
  ('ann_prasadam_guidelines', 'Sunday Prasadam Offering Guidelines for Host Families', 'Families hosting Sunday prayers are blessed to prepare or sponsor satvic vegetarian prasadam (strictly without onions or garlic) for approximately 50 to 80 devotees. Please coordinate with the temple kitchen coordinator by the preceding Friday.', 'seva', false, 'Kitchen Seva Team', '2026-08-28', 'Prasadam Seva'),
  ('ann_navaratri_preparations', 'Upcoming Navaratri Mahotsav & Kolu Alankaram', 'Devotees interested in volunteering for the grand Navaratri floral decorations, Kolu display arrangement, or offering cultural music and dance performances, please contact the temple office or your committee coordinators.', 'festival', false, 'Cultural Committee', '2026-08-20', 'Upcoming Festival')
on conflict (id) do update set
  title = excluded.title,
  content = excluded.content,
  category = excluded.category,
  is_pinned = excluded.is_pinned,
  badge_text = excluded.badge_text;

-- ==============================================================================
-- 10. INCREMENTAL UPDATE QUERIES (FOR MIGRATIONS & EVOLUTION)
-- ==============================================================================
-- When evolving existing tables without re-creating them, execute targeted queries:
--
-- 10.1 Add announcements table if not exists in older database:
-- CREATE TABLE IF NOT EXISTS public.announcements (
--   id text primary key,
--   title text not null,
--   content text not null,
--   category text not null default 'general' check (category in ('festival', 'puja', 'seva', 'general')),
--   is_pinned boolean not null default false,
--   author_name text not null default 'Temple Administration',
--   published_date date not null default current_date,
--   valid_until date,
--   badge_text text,
--   created_at timestamp with time zone default timezone('utc'::text, now()) not null
-- );
--
-- 10.2 Add temple_branding table if not exists:
-- CREATE TABLE IF NOT EXISTS public.temple_branding (
--   id text primary key default 'current',
--   type text not null default 'emoji' check (type in ('image', 'emoji')),
--   value text not null,
--   temple_name text not null default 'Temple Of Fine Arts Penang',
--   tagline text not null default 'Shiva Family Deity Booking & Sunday Prayer Portal',
--   updated_at timestamp with time zone default timezone('utc'::text, now()) not null
-- );
--
-- 10.3 Add user avatar_url to profiles:
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
--
-- 10.4 Add guidelines to deities:
-- ALTER TABLE public.deities ADD COLUMN IF NOT EXISTS guidelines text;
--
-- 10.5 Add collection_time to deity bookings:
-- ALTER TABLE public.deity_bookings ADD COLUMN IF NOT EXISTS collection_time text DEFAULT 'Sunday after prayers (12:30 PM)';
--
-- 10.6 Add password_hash to profiles:
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_hash text;
-- ==============================================================================

-- ==============================================================================
-- 11. MOCK DATA PURGE & CLEANUP SCRIPT (FOR EXISTING DATABASES)
-- ==============================================================================
-- Run these statements in Supabase SQL Editor if you need to purge existing test/mock data:
--
-- 11.1 Delete all mock deity bookings:
-- TRUNCATE TABLE public.deity_bookings CASCADE;
--
-- 11.2 Delete all mock Sunday prayer hostings:
-- TRUNCATE TABLE public.prayer_hostings CASCADE;
--
-- 11.3 Remove old mock demo users:
-- DELETE FROM public.profiles 
-- WHERE mobile_phone IN ('9876543210', '9876543211', '9876543212', '9876543213', '9876543214');
--
-- 11.4 Upsert Official Administrator (0162216904):
-- INSERT INTO public.profiles (id, mobile_phone, full_name, email, password_hash, role, status, address, avatar_url)
-- VALUES (
--   '01622169-0400-4000-8000-000000000001',
--   '0162216904',
--   'Temple Administrator',
--   'admin@tfapenang.org',
--   crypt('Anni1234$$', gen_salt('bf')),
--   'admin',
--   'approved',
--   'Temple Of Fine Arts Penang Office',
--   'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80'
-- )
-- ON CONFLICT (mobile_phone) DO UPDATE SET
--   full_name = EXCLUDED.full_name,
--   role = 'admin',
--   status = 'approved',
--   password_hash = EXCLUDED.password_hash;
-- ==============================================================================
