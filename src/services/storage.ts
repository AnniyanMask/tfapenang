import { Deity, DeityBooking, PrayerHosting, TempleBranding, User } from '../types';
import { INITIAL_BOOKINGS, INITIAL_DEITIES, INITIAL_PRAYER_HOSTINGS, INITIAL_USERS } from '../data/initialData';

const STORAGE_KEYS = {
  USERS: 'temple_users_v1',
  CURRENT_USER: 'temple_current_user_v1',
  DEITIES: 'temple_deities_v1',
  DEITY_BOOKINGS: 'temple_deity_bookings_v1',
  PRAYER_HOSTINGS: 'temple_prayer_hostings_v1',
  SIMULATE_CONFLICT: 'temple_simulate_conflict_v1',
  SUPABASE_CONFIG: 'temple_supabase_config_v1',
  TEMPLE_BRANDING: 'temple_branding_v1'
};

export const DEFAULT_TEMPLE_BRANDING: TempleBranding = {
  type: 'image',
  value: '/images/temple-logo.png',
  templeName: 'Temple Of Fine Arts',
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
  status text not null default 'available' check (status in ('available', 'confirmed', 'completed', 'cancelled')),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Row Level Security (RLS) policies
alter table public.profiles enable row level security;
alter table public.deities enable row level security;
alter table public.deity_bookings enable row level security;
alter table public.prayer_hostings enable row level security;

-- Public read for deities and general calendar availability
create policy "Anyone can read deities" on public.deities for select using (true);
create policy "Anyone can read prayer schedule" on public.prayer_hostings for select using (true);
create policy "Approved members can book deities" on public.deity_bookings for insert 
  with check (exists (
    select 1 from public.profiles 
    where id = auth.uid() and status = 'approved'
  ));
`;

class StorageService {
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initDefaults();
  }

  private initDefaults() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DEITIES)) {
      localStorage.setItem(STORAGE_KEYS.DEITIES, JSON.stringify(INITIAL_DEITIES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DEITY_BOOKINGS)) {
      localStorage.setItem(STORAGE_KEYS.DEITY_BOOKINGS, JSON.stringify(INITIAL_BOOKINGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PRAYER_HOSTINGS)) {
      localStorage.setItem(STORAGE_KEYS.PRAYER_HOSTINGS, JSON.stringify(INITIAL_PRAYER_HOSTINGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
      // Default to logged-in user: Ananth Sharma
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_USERS[1]));
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

  public loginWithPhone(mobilePhone: string): { success: boolean; user?: User; error?: string } {
    const cleanPhone = mobilePhone.trim().replace(/\D/g, '');
    const users = this.getUsers();
    
    // Find matching user (check either full phone or contains)
    const user = users.find(u => {
      const uPhone = u.mobilePhone.replace(/\D/g, '');
      return uPhone === cleanPhone || (cleanPhone.length >= 4 && uPhone.endsWith(cleanPhone));
    });

    if (!user) {
      return { success: false, error: 'Mobile Phone not registered in temple community. Please register first.' };
    }

    this.setCurrentUser(user);
    return { success: true, user };
  }

  public registerUser(params: {
    fullName: string;
    mobilePhone: string;
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
      status: 'confirmed',
      notes: params.notes || 'Devotee Sunday prayer hosting',
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

  public cancelPrayerHosting(date: string) {
    const hostings = this.getPrayerHostings().map(h => {
      if (h.date === date) {
        return {
          ...h,
          userId: null,
          userName: null,
          userPhone: null,
          status: 'available' as const,
          notes: ''
        };
      }
      return h;
    });

    localStorage.setItem(STORAGE_KEYS.PRAYER_HOSTINGS, JSON.stringify(hostings));
    this.notify();
  }

  // --- Conflict Simulator for UI Protection Testing ---
  public isConflictSimulated(): boolean {
    return localStorage.getItem(STORAGE_KEYS.SIMULATE_CONFLICT) === 'true';
  }

  public setSimulateConflict(simulate: boolean) {
    localStorage.setItem(STORAGE_KEYS.SIMULATE_CONFLICT, simulate ? 'true' : 'false');
    this.notify();
  }

  // --- Temple Branding (Logo & Icon customizer) ---
  public getTempleBranding(): TempleBranding {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TEMPLE_BRANDING);
      return data ? JSON.parse(data) : DEFAULT_TEMPLE_BRANDING;
    } catch {
      return DEFAULT_TEMPLE_BRANDING;
    }
  }

  public setTempleBranding(branding: TempleBranding) {
    localStorage.setItem(STORAGE_KEYS.TEMPLE_BRANDING, JSON.stringify(branding));
    this.notify();
  }

  // --- Reset demo data ---
  public resetToDefault() {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.DEITIES, JSON.stringify(INITIAL_DEITIES));
    localStorage.setItem(STORAGE_KEYS.DEITY_BOOKINGS, JSON.stringify(INITIAL_BOOKINGS));
    localStorage.setItem(STORAGE_KEYS.PRAYER_HOSTINGS, JSON.stringify(INITIAL_PRAYER_HOSTINGS));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_USERS[1]));
    localStorage.setItem(STORAGE_KEYS.TEMPLE_BRANDING, JSON.stringify(DEFAULT_TEMPLE_BRANDING));
    localStorage.setItem(STORAGE_KEYS.SIMULATE_CONFLICT, 'false');
    this.notify();
  }
}

export const storage = new StorageService();
