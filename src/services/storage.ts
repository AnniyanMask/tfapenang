import { Announcement, Deity, DeityBooking, PrayerHosting, TempleBranding, User } from '../types';
import { INITIAL_BOOKINGS, INITIAL_DEITIES, INITIAL_PRAYER_HOSTINGS, INITIAL_USERS } from '../data/initialData';
import { INITIAL_ANNOUNCEMENTS } from '../data/initialAnnouncements';

const STORAGE_KEYS = {
  USERS: 'temple_users_v1',
  CURRENT_USER: 'temple_current_user_v1',
  DEITIES: 'temple_deities_v1',
  DEITY_BOOKINGS: 'temple_deity_bookings_v1',
  PRAYER_HOSTINGS: 'temple_prayer_hostings_v1',
  SIMULATE_CONFLICT: 'temple_simulate_conflict_v1',
  SUPABASE_CONFIG: 'temple_supabase_config_v1',
  TEMPLE_BRANDING: 'temple_branding_v1',
  ANNOUNCEMENTS: 'temple_announcements_v1'
};

export const DEFAULT_TEMPLE_BRANDING: TempleBranding = {
  type: 'image',
  value: '/images/temple-logo.png',
  templeName: 'Temple Of Fine Arts Penang',
  tagline: 'Deity & Sunday Prayer Seva'
};

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  connected: boolean;
}

export const SUPABASE_SQL_SCHEMA = `-- ==========================================================
-- TEMPLE DEITY & SUNDAY PRAYER BOOKING SYSTEM
-- SUPABASE POSTGRESQL SCHEMA WITH ROW LEVEL SECURITY (RLS)
-- ==========================================================

-- 1. Profiles Table (Mobile Phone as Unique Identifier)
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  mobile_phone text not null unique,
  full_name text not null,
  email text,
  role text not null default 'user' check (role in ('user', 'admin')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  address text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Deities Table
create table if not exists public.deities (
  id text primary key,
  name text not null,
  title text not null,
  description text not null,
  icon text not null default '🛕',
  status text not null default 'active' check (status in ('active', 'disabled')),
  guidelines text
);

-- 3. Deity Bookings (Sunday-to-Sunday cycle)
create table if not exists public.deity_bookings (
  id uuid primary key default gen_random_uuid(),
  deity_id text references public.deities(id) on delete restrict,
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
  -- Constraint: Prevent double booking for same deity on same start_date
  constraint unique_deity_active_slot unique (deity_id, start_date)
);

-- 4. Sunday Prayer Hostings
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
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. Temple Branding Table
create table if not exists public.temple_branding (
  id text primary key default 'current',
  type text not null default 'emoji' check (type in ('image', 'emoji')),
  value text not null,
  temple_name text not null default 'Temple Of Fine Arts Penang',
  tagline text not null default 'Shiva Family Deity Booking & Sunday Prayer Portal',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Announcements Table (TFA Penang Notice Board & Circulars)
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

-- 7. Avatar Storage Bucket (shivafamily_avatar)
insert into storage.buckets (id, name, public)
values ('shivafamily_avatar', 'shivafamily_avatar', true)
on conflict (id) do nothing;

-- Row Level Security (RLS) policies
alter table public.profiles enable row level security;
alter table public.deities enable row level security;
alter table public.deity_bookings enable row level security;
alter table public.prayer_hostings enable row level security;
alter table public.temple_branding enable row level security;
alter table public.announcements enable row level security;

-- Public read for deities and general calendar availability
create policy "Anyone can read deities" on public.deities for select using (true);
create policy "Anyone can read prayer schedule" on public.prayer_hostings for select using (true);
create policy "Anyone can view announcements" on public.announcements for select using (true);
create policy "Anyone can view branding" on public.temple_branding for select using (true);
create policy "Approved members can book deities" on public.deity_bookings for insert 
  with check (exists (
    select 1 from public.profiles 
    where id = auth.uid() and status = 'approved'
  ));

create policy "Public can view avatars" on storage.objects
  for select using (bucket_id = 'shivafamily_avatar');

create policy "Devotees can upload avatars" on storage.objects
  for insert with check (bucket_id = 'shivafamily_avatar');
`;

class StorageService {
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initDefaults();
  }

  private initDefaults() {
    // Purge obsolete mock test data from localStorage
    const MOCK_PHONES = new Set(['9876543210', '9876543211', '9876543212', '9876543213', '9876543214']);
    const MOCK_BOOKING_PREFIXES = ['bk_ganesha_sep6', 'bk_shiva_sep13', 'bk_meru_sep13', 'bk_krishna_sep13'];
    const MOCK_HOSTING_IDS = new Set(['ph_2026_09_06', 'ph_2026_09_20', 'ph_2026_10_04']);

    const existingUsers = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!existingUsers) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    } else {
      try {
        let parsed: User[] = JSON.parse(existingUsers);
        parsed = parsed.filter(u => !MOCK_PHONES.has(u.mobilePhone) && !u.id.startsWith('usr_ananth') && !u.id.startsWith('usr_kumar') && !u.id.startsWith('usr_raj') && !u.id.startsWith('usr_priya') && u.id !== 'usr_admin');
        if (!parsed.some(u => u.mobilePhone === '0162216904')) {
          parsed.unshift(INITIAL_USERS[0]);
        }
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(parsed));
      } catch {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      }
    }

    if (!localStorage.getItem(STORAGE_KEYS.DEITIES)) {
      localStorage.setItem(STORAGE_KEYS.DEITIES, JSON.stringify(INITIAL_DEITIES));
    }

    const existingBookings = localStorage.getItem(STORAGE_KEYS.DEITY_BOOKINGS);
    if (!existingBookings) {
      localStorage.setItem(STORAGE_KEYS.DEITY_BOOKINGS, JSON.stringify(INITIAL_BOOKINGS));
    } else {
      try {
        let parsedBookings: DeityBooking[] = JSON.parse(existingBookings);
        parsedBookings = parsedBookings.filter(b => !MOCK_BOOKING_PREFIXES.includes(b.id) && !MOCK_PHONES.has(b.userPhone));
        localStorage.setItem(STORAGE_KEYS.DEITY_BOOKINGS, JSON.stringify(parsedBookings));
      } catch {
        localStorage.setItem(STORAGE_KEYS.DEITY_BOOKINGS, JSON.stringify([]));
      }
    }

    const existingHostings = localStorage.getItem(STORAGE_KEYS.PRAYER_HOSTINGS);
    if (!existingHostings) {
      localStorage.setItem(STORAGE_KEYS.PRAYER_HOSTINGS, JSON.stringify(INITIAL_PRAYER_HOSTINGS));
    } else {
      try {
        let parsedHostings: PrayerHosting[] = JSON.parse(existingHostings);
        parsedHostings = parsedHostings.filter(h => !MOCK_HOSTING_IDS.has(h.id) && !(h.userPhone && MOCK_PHONES.has(h.userPhone)));
        localStorage.setItem(STORAGE_KEYS.PRAYER_HOSTINGS, JSON.stringify(parsedHostings));
      } catch {
        localStorage.setItem(STORAGE_KEYS.PRAYER_HOSTINGS, JSON.stringify([]));
      }
    }

    const currentUserRaw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!currentUserRaw) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_USERS[0]));
    } else {
      try {
        const curUser: User = JSON.parse(currentUserRaw);
        if (MOCK_PHONES.has(curUser.mobilePhone) || curUser.id.startsWith('usr_ananth') || curUser.id === 'usr_admin') {
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_USERS[0]));
        }
      } catch {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_USERS[0]));
      }
    }

    if (!localStorage.getItem(STORAGE_KEYS.TEMPLE_BRANDING)) {
      localStorage.setItem(STORAGE_KEYS.TEMPLE_BRANDING, JSON.stringify(DEFAULT_TEMPLE_BRANDING));
    }
  }

  public subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  // --- Users & Auth ---
  public getUsers(): User[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      return data ? JSON.parse(data) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  }

  public getCurrentUser(): User | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public setCurrentUser(user: User | null) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
    this.notify();
  }

  public loginWithPhone(mobilePhone: string, password?: string): { success: boolean; user?: User; error?: string } {
    const cleanPhone = mobilePhone.trim().replace(/\D/g, '');
    const users = this.getUsers();
    
    // Find matching user (check either full phone or contains)
    const user = users.find(u => {
      const uPhone = u.mobilePhone.replace(/\D/g, '');
      return uPhone === cleanPhone || (cleanPhone.length >= 7 && uPhone.endsWith(cleanPhone));
    });

    if (!user) {
      return { success: false, error: 'Mobile Phone not registered in temple community. Please register first.' };
    }

    if (password && user.password && user.password !== password) {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }

    this.setCurrentUser(user);
    return { success: true, user };
  }

  public registerUser(params: {
    fullName: string;
    mobilePhone: string;
    password?: string;
    address?: string;
    email?: string;
  }): { success: boolean; user?: User; error?: string } {
    const cleanPhone = params.mobilePhone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 7) {
      return { success: false, error: 'Please enter a valid mobile phone number.' };
    }

    const users = this.getUsers();
    if (users.some(u => u.mobilePhone.replace(/\D/g, '') === cleanPhone)) {
      return { success: false, error: 'A member is already registered with this Mobile Phone number.' };
    }

    const newUser: User = {
      id: `usr_${Date.now()}`,
      mobilePhone: params.mobilePhone.trim(),
      fullName: params.fullName.trim(),
      email: params.email?.trim(),
      password: params.password?.trim() || 'temple123',
      role: 'user',
      status: 'pending', // Requires admin validation against Supabase as specified
      address: params.address?.trim() || '',
      createdAt: new Date().toISOString().split('T')[0]
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.setCurrentUser(newUser);
    this.notify();

    return { success: true, user: newUser };
  }

  public createAdminUser(params: {
    fullName: string;
    mobilePhone: string;
    password?: string;
    email?: string;
    address?: string;
    avatarUrl?: string;
  }): { success: boolean; user?: User; error?: string } {
    const cleanPhone = params.mobilePhone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 7) {
      return { success: false, error: 'Please enter a valid mobile phone number (min 7 digits).' };
    }

    const users = this.getUsers();
    if (users.some(u => u.mobilePhone.replace(/\D/g, '') === cleanPhone)) {
      return { success: false, error: 'A user with this mobile phone number already exists.' };
    }

    const newAdmin: User = {
      id: `admin_${Date.now()}`,
      mobilePhone: params.mobilePhone.trim(),
      fullName: params.fullName.trim(),
      email: params.email?.trim() || '',
      password: params.password?.trim() || 'Anni1234$$',
      role: 'admin',
      status: 'approved', // Pre-approved with full administrative privileges
      address: params.address?.trim() || '',
      avatarUrl: params.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString().split('T')[0]
    };

    users.push(newAdmin);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.notify();

    return { success: true, user: newAdmin };
  }

  public updateUserStatus(userId: string, status: 'approved' | 'pending' | 'rejected', role?: 'user' | 'admin') {
    const users = this.getUsers().map(u => {
      if (u.id === userId) {
        return {
          ...u,
          status,
          role: role || u.role
        };
      }
      return u;
    });

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    
    // If updating current user
    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      this.setCurrentUser({ ...current, status, role: role || current.role });
    } else {
      this.notify();
    }
  }

  public getUserById(userId: string): User | undefined {
    return this.getUsers().find(u => u.id === userId);
  }

  public updateUserProfile(userId: string, updates: Partial<Pick<User, 'fullName' | 'address' | 'avatarUrl' | 'email'>>) {
    const users = this.getUsers().map(u => {
      if (u.id === userId) {
        return {
          ...u,
          ...updates
        };
      }
      return u;
    });
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // Synchronize avatar across active deity bookings & prayer hostings
    if (updates.avatarUrl !== undefined || updates.fullName !== undefined) {
      const bookings = this.getDeityBookings().map(b => {
        if (b.userId === userId) {
          return {
            ...b,
            ...(updates.avatarUrl !== undefined ? { userAvatarUrl: updates.avatarUrl } : {}),
            ...(updates.fullName ? { userName: updates.fullName } : {})
          };
        }
        return b;
      });
      localStorage.setItem(STORAGE_KEYS.DEITY_BOOKINGS, JSON.stringify(bookings));

      const hostings = this.getPrayerHostings().map(h => {
        if (h.userId === userId) {
          return {
            ...h,
            ...(updates.avatarUrl !== undefined ? { userAvatarUrl: updates.avatarUrl } : {}),
            ...(updates.fullName ? { userName: updates.fullName } : {})
          };
        }
        return h;
      });
      localStorage.setItem(STORAGE_KEYS.PRAYER_HOSTINGS, JSON.stringify(hostings));
    }

    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      this.setCurrentUser({
        ...current,
        ...updates
      });
    } else {
      this.notify();
    }
  }

  // --- Deities ---
  public getDeities(): Deity[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DEITIES);
      return data ? JSON.parse(data) : INITIAL_DEITIES;
    } catch {
      return INITIAL_DEITIES;
    }
  }

  public updateDeity(deity: Deity) {
    const deities = this.getDeities().map(d => d.id === deity.id ? deity : d);
    localStorage.setItem(STORAGE_KEYS.DEITIES, JSON.stringify(deities));
    this.notify();
  }

  public addDeity(deity: Deity) {
    const deities = this.getDeities();
    deities.push(deity);
    localStorage.setItem(STORAGE_KEYS.DEITIES, JSON.stringify(deities));
    this.notify();
  }

  public toggleDeityStatus(deityId: string) {
    const deities = this.getDeities().map(d => {
      if (d.id === deityId) {
        return { ...d, status: d.status === 'active' ? 'disabled' : 'active' as const };
      }
      return d;
    });
    localStorage.setItem(STORAGE_KEYS.DEITIES, JSON.stringify(deities));
    this.notify();
  }

  // --- Deity Bookings ---
  public getDeityBookings(): DeityBooking[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DEITY_BOOKINGS);
      return data ? JSON.parse(data) : INITIAL_BOOKINGS;
    } catch {
      return INITIAL_BOOKINGS;
    }
  }

  public isDeityBooked(deityId: string, startDate: string): { isBooked: boolean; booking?: DeityBooking } {
    const bookings = this.getDeityBookings();
    const activeBooking = bookings.find(
      b => b.deityId === deityId && b.startDate === startDate && b.status === 'confirmed'
    );
    return {
      isBooked: !!activeBooking,
      booking: activeBooking
    };
  }

  /**
   * Revalidates slot before confirming to satisfy:
   * "If another user has already booked a slot while the current user is viewing it, the system must refresh/revalidate availability before confirmation.
   * If it is no longer available, show:
   * ⚠️ Sorry, this slot has just been booked by someone else. Please select another available date."
   */
  public bookDeity(params: {
    deityId: string;
    deityName: string;
    startDate: string;
    endDate: string;
    user: User;
    notes?: string;
  }): { success: boolean; booking?: DeityBooking; error?: string } {
    // 1. Check simulated concurrent collision test flag
    if (this.isConflictSimulated()) {
      return {
        success: false,
        error: 'Sorry, this slot has just been booked by someone else. Please select another available date.'
      };
    }

    // 2. Strict live re-validation
    const existing = this.isDeityBooked(params.deityId, params.startDate);
    if (existing.isBooked) {
      return {
        success: false,
        error: 'Sorry, this slot has just been booked by someone else. Please select another available date.'
      };
    }

    const newBooking: DeityBooking = {
      id: `bk_${Date.now()}`,
      deityId: params.deityId,
      deityName: params.deityName,
      startDate: params.startDate,
      endDate: params.endDate,
      userId: params.user.id,
      userName: params.user.fullName,
      userPhone: params.user.mobilePhone,
      userAvatarUrl: params.user.avatarUrl,
      collectionTime: 'Sunday after prayers (12:30 PM)',
      status: 'confirmed',
      notes: params.notes || '',
      createdAt: new Date().toISOString().split('T')[0]
    };

    const bookings = this.getDeityBookings();
    bookings.push(newBooking);
    localStorage.setItem(STORAGE_KEYS.DEITY_BOOKINGS, JSON.stringify(bookings));
    this.notify();

    return { success: true, booking: newBooking };
  }

  public cancelDeityBooking(bookingId: string) {
    const bookings = this.getDeityBookings().map(b => {
      if (b.id === bookingId) {
        return { ...b, status: 'cancelled' as const };
      }
      return b;
    });
    localStorage.setItem(STORAGE_KEYS.DEITY_BOOKINGS, JSON.stringify(bookings));
    this.notify();
  }

  // --- Prayer Hosting ---
  public getPrayerHostings(): PrayerHosting[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRAYER_HOSTINGS);
      return data ? JSON.parse(data) : INITIAL_PRAYER_HOSTINGS;
    } catch {
      return INITIAL_PRAYER_HOSTINGS;
    }
  }

  public getPrayerHostingForDate(date: string): PrayerHosting | null {
    const hostings = this.getPrayerHostings();
    return hostings.find(h => h.date === date) || null;
  }

  public bookPrayerHosting(params: {
    date: string;
    user: User;
    notes?: string;
    providesFood?: boolean;
    providesDrinks?: boolean;
  }): { success: boolean; hosting?: PrayerHosting; error?: string } {
    if (this.isConflictSimulated()) {
      return {
        success: false,
        error: 'Sorry, this slot has just been booked by someone else. Please select another available date.'
      };
    }

    const currentHosting = this.getPrayerHostingForDate(params.date);
    if (currentHosting && currentHosting.status === 'confirmed') {
      return {
        success: false,
        error: 'Sorry, this Sunday has just been reserved by another host. Please select another available date.'
      };
    }

    const hostings = this.getPrayerHostings();
    const existingIndex = hostings.findIndex(h => h.date === params.date);

    const updatedHosting: PrayerHosting = {
      id: existingIndex >= 0 ? hostings[existingIndex].id : `ph_${params.date.replace(/-/g, '_')}`,
      date: params.date,
      userId: params.user.id,
      userName: params.user.fullName,
      userPhone: params.user.mobilePhone,
      userAvatarUrl: params.user.avatarUrl,
      status: 'confirmed',
      notes: params.notes || 'Devotee Sunday prayer hosting',
      providesFood: params.providesFood ?? false,
      providesDrinks: params.providesDrinks ?? false,
      createdAt: new Date().toISOString().split('T')[0]
    };

    if (existingIndex >= 0) {
      hostings[existingIndex] = updatedHosting;
    } else {
      hostings.push(updatedHosting);
    }

    localStorage.setItem(STORAGE_KEYS.PRAYER_HOSTINGS, JSON.stringify(hostings));
    this.notify();

    return { success: true, hosting: updatedHosting };
  }

  public updatePrayerHosting(date: string, updates: Partial<PrayerHosting>): { success: boolean; hosting?: PrayerHosting } {
    const hostings = this.getPrayerHostings();
    const existingIndex = hostings.findIndex(h => h.date === date);

    if (existingIndex >= 0) {
      const updated = {
        ...hostings[existingIndex],
        ...updates
      };
      hostings[existingIndex] = updated;
      localStorage.setItem(STORAGE_KEYS.PRAYER_HOSTINGS, JSON.stringify(hostings));
      this.notify();
      return { success: true, hosting: updated };
    } else {
      const newHosting: PrayerHosting = {
        id: `ph_${date.replace(/-/g, '_')}`,
        date,
        userId: updates.userId ?? null,
        userName: updates.userName ?? null,
        userPhone: updates.userPhone ?? null,
        userAvatarUrl: updates.userAvatarUrl ?? null,
        status: updates.status ?? 'confirmed',
        notes: updates.notes ?? '',
        providesFood: updates.providesFood ?? false,
        providesDrinks: updates.providesDrinks ?? false,
        createdAt: new Date().toISOString().split('T')[0]
      };
      hostings.push(newHosting);
      localStorage.setItem(STORAGE_KEYS.PRAYER_HOSTINGS, JSON.stringify(hostings));
      this.notify();
      return { success: true, hosting: newHosting };
    }
  }

  public cancelPrayerHosting(date: string) {
    const hostings = this.getPrayerHostings().map(h => {
      if (h.date === date) {
        return {
          ...h,
          userId: null,
          userName: null,
          userPhone: null,
          status: 'available' as const,
          notes: '',
          providesFood: false,
          providesDrinks: false
        };
      }
      return h;
    });

    localStorage.setItem(STORAGE_KEYS.PRAYER_HOSTINGS, JSON.stringify(hostings));
    this.notify();
  }

  // --- Conflict Simulator for UI Protection Testing (Test Completed) ---
  public isConflictSimulated(): boolean {
    return false;
  }

  public setSimulateConflict(_simulate: boolean) {
    // Test completed and removed
  }

  // --- Temple Branding (Logo & Icon customizer) ---
  public getTempleBranding(): TempleBranding {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TEMPLE_BRANDING);
      if (!data) return DEFAULT_TEMPLE_BRANDING;
      const parsed = JSON.parse(data);
      if (parsed.templeName === 'Temple Of Fine Arts' || !parsed.templeName) {
        parsed.templeName = 'Temple Of Fine Arts Penang';
        localStorage.setItem(STORAGE_KEYS.TEMPLE_BRANDING, JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      return DEFAULT_TEMPLE_BRANDING;
    }
  }

  public setTempleBranding(branding: TempleBranding) {
    localStorage.setItem(STORAGE_KEYS.TEMPLE_BRANDING, JSON.stringify(branding));
    this.notify();
  }

  // --- Temple Announcement / Notice Board ---
  public getAnnouncements(): Announcement[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(INITIAL_ANNOUNCEMENTS));
        return INITIAL_ANNOUNCEMENTS;
      }
      const list: Announcement[] = JSON.parse(data);
      // Sort: pinned first, then by publishedDate desc
      return list.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime();
      });
    } catch {
      return INITIAL_ANNOUNCEMENTS;
    }
  }

  public addAnnouncement(announcement: Omit<Announcement, 'id' | 'createdAt'>): Announcement {
    const list = this.getAnnouncements();
    const newAnn: Announcement = {
      ...announcement,
      id: 'ann_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString()
    };
    list.unshift(newAnn);
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(list));
    this.notify();
    return newAnn;
  }

  public updateAnnouncement(id: string, updates: Partial<Announcement>): boolean {
    const list = this.getAnnouncements();
    const idx = list.findIndex(a => a.id === id);
    if (idx === -1) return false;
    list[idx] = { ...list[idx], ...updates };
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(list));
    this.notify();
    return true;
  }

  public deleteAnnouncement(id: string): boolean {
    const list = this.getAnnouncements();
    const filtered = list.filter(a => a.id !== id);
    if (filtered.length === list.length) return false;
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(filtered));
    this.notify();
    return true;
  }

  public togglePinAnnouncement(id: string): boolean {
    const list = this.getAnnouncements();
    const target = list.find(a => a.id === id);
    if (!target) return false;
    target.isPinned = !target.isPinned;
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(list));
    this.notify();
    return true;
  }

  // --- Reset data to clean state ---
  public resetToDefault() {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.DEITIES, JSON.stringify(INITIAL_DEITIES));
    localStorage.setItem(STORAGE_KEYS.DEITY_BOOKINGS, JSON.stringify(INITIAL_BOOKINGS));
    localStorage.setItem(STORAGE_KEYS.PRAYER_HOSTINGS, JSON.stringify(INITIAL_PRAYER_HOSTINGS));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_USERS[0]));
    localStorage.setItem(STORAGE_KEYS.TEMPLE_BRANDING, JSON.stringify(DEFAULT_TEMPLE_BRANDING));
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(INITIAL_ANNOUNCEMENTS));
    localStorage.removeItem(STORAGE_KEYS.SIMULATE_CONFLICT);
    this.notify();
  }
}

export const storage = new StorageService();
