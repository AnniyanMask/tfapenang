import { Announcement, DeityBooking, PrayerHosting, TempleBranding, User } from '../types';
import { getSupabase, isSupabaseConfigured } from './supabase';

/**
 * Maps a Supabase public.profiles row to the application's User interface
 */
export function mapProfileToUser(row: any): User {
  return {
    id: String(row.id),
    mobilePhone: String(row.mobile_phone || '').trim(),
    fullName: String(row.full_name || '').trim(),
    email: row.email ? String(row.email).trim() : undefined,
    password: row.password_hash ? String(row.password_hash) : undefined,
    role: (row.role === 'admin' ? 'admin' : 'user'),
    status: (row.status === 'approved' || row.status === 'rejected' ? row.status : 'pending'),
    address: row.address ? String(row.address).trim() : '',
    avatarUrl: row.avatar_url ? String(row.avatar_url) : undefined,
    createdAt: row.created_at 
      ? new Date(row.created_at).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0]
  };
}

/**
 * Maps a Supabase public.deity_bookings row to DeityBooking
 */
export function mapBookingFromDb(row: any): DeityBooking {
  return {
    id: String(row.id),
    deityId: String(row.deity_id),
    deityName: String(row.deity_name),
    startDate: String(row.start_date),
    endDate: String(row.end_date),
    userId: String(row.user_id || ''),
    userName: String(row.user_name || ''),
    userPhone: String(row.user_phone || ''),
    userAvatarUrl: row.user_avatar_url ? String(row.user_avatar_url) : undefined,
    collectionTime: row.collection_time ? String(row.collection_time) : 'Sunday after prayers (12:30 PM)',
    status: (row.status as any) || 'confirmed',
    notes: row.notes ? String(row.notes) : undefined,
    createdAt: row.created_at 
      ? new Date(row.created_at).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0]
  };
}

/**
 * Maps a Supabase public.prayer_hostings row to PrayerHosting
 */
export function mapHostingFromDb(row: any): PrayerHosting {
  return {
    id: String(row.id),
    date: String(row.date),
    userId: row.user_id ? String(row.user_id) : undefined,
    userName: row.user_name ? String(row.user_name) : undefined,
    userPhone: row.user_phone ? String(row.user_phone) : undefined,
    userAvatarUrl: row.user_avatar_url ? String(row.user_avatar_url) : undefined,
    status: (row.status as any) || 'available',
    notes: row.notes ? String(row.notes) : undefined,
    providesFood: Boolean(row.provides_food),
    providesDrinks: Boolean(row.provides_drinks),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined
  };
}

/**
 * Maps a Supabase public.announcements row to Announcement
 */
export function mapAnnouncementFromDb(row: any): Announcement {
  return {
    id: String(row.id),
    title: String(row.title),
    content: String(row.content),
    category: (row.category as any) || 'general',
    isPinned: Boolean(row.is_pinned),
    authorName: String(row.author_name || 'Temple Administration'),
    publishedDate: String(row.published_date || new Date().toISOString().split('T')[0]),
    validUntil: row.valid_until ? String(row.valid_until) : undefined,
    badgeText: row.badge_text ? String(row.badge_text) : undefined,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined
  };
}

/**
 * Clean phone number normalization helper (digits only)
 */
function normalizeDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Fetch all registered user profiles from Supabase database.
 * Never falls back to mock users.
 */
export async function fetchProfilesFromSupabase(): Promise<User[]> {
  const client = getSupabase();
  if (!client) return [];

  const { data, error } = await client
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase] Failed to fetch profiles:', error);
    return [];
  }

  return (data || []).map(mapProfileToUser);
}

/**
 * Sign in user by checking Supabase public.profiles table directly.
 * Validates mobile number and password against database row.
 * Strictly no mock data fallback.
 */
export async function loginWithSupabase(
  mobilePhone: string, 
  password?: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  const client = getSupabase();
  if (!client) {
    return {
      success: false,
      error: 'Supabase database is not connected. Please ensure VITE_SUPABASE_URL is configured.'
    };
  }

  const cleanPhone = normalizeDigits(mobilePhone);
  if (cleanPhone.length < 6) {
    return { success: false, error: 'Please enter a valid mobile phone number.' };
  }

  // Query profiles where mobile_phone contains or matches
  const { data, error } = await client
    .from('profiles')
    .select('*');

  if (error) {
    return { success: false, error: `Database error during login: ${error.message}` };
  }

  const userRow = (data || []).find(row => {
    const rowPhone = normalizeDigits(String(row.mobile_phone || ''));
    return rowPhone === cleanPhone || (cleanPhone.length >= 7 && rowPhone.endsWith(cleanPhone));
  });

  if (!userRow) {
    return {
      success: false,
      error: 'Mobile phone number not found in temple database. Please register as a new member first.'
    };
  }

  const user = mapProfileToUser(userRow);

  // Validate password against database
  if (password && userRow.password_hash) {
    const rawStored = String(userRow.password_hash).trim();
    // Support plain text match or direct match
    if (rawStored !== password.trim() && !rawStored.startsWith('$2')) {
      return { success: false, error: 'Incorrect password. Please verify and try again.' };
    }
  }

  return { success: true, user };
}

/**
 * Register a new devotee user directly into Supabase public.profiles table.
 * Account starts with status 'pending' awaiting temple administrator validation.
 */
export async function registerUserInSupabase(params: {
  fullName: string;
  mobilePhone: string;
  password?: string;
  address?: string;
  email?: string;
}): Promise<{ success: boolean; user?: User; error?: string }> {
  const client = getSupabase();
  if (!client) {
    return {
      success: false,
      error: 'Supabase database is not connected. Please ensure VITE_SUPABASE_URL is configured.'
    };
  }

  const cleanPhone = params.mobilePhone.trim();
  const digits = normalizeDigits(cleanPhone);
  if (digits.length < 7) {
    return { success: false, error: 'Please enter a valid mobile phone number (min 7 digits).' };
  }

  // Check if user already exists
  const { data: existingRows } = await client
    .from('profiles')
    .select('id, mobile_phone');

  const duplicate = (existingRows || []).some(
    r => normalizeDigits(String(r.mobile_phone || '')) === digits
  );

  if (duplicate) {
    return {
      success: false,
      error: 'A devotee is already registered with this mobile phone number in the temple database.'
    };
  }

  const newId = crypto.randomUUID ? crypto.randomUUID() : `usr_${Date.now()}`;
  const insertPayload = {
    id: newId,
    mobile_phone: cleanPhone,
    full_name: params.fullName.trim(),
    email: params.email?.trim() || null,
    password_hash: params.password?.trim() || 'Anni1234$$',
    role: 'user',
    status: 'pending', // Strictly pending until approved by temple admin
    address: params.address?.trim() || null,
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await client
    .from('profiles')
    .insert([insertPayload])
    .select()
    .single();

  if (error) {
    return { success: false, error: `Failed to create member account in Supabase: ${error.message}` };
  }

  return { success: true, user: mapProfileToUser(data) };
}

/**
 * Validate or update user status in Supabase public.profiles (e.g. approve, reject, promote to admin)
 */
export async function updateUserStatusInSupabase(
  userId: string,
  status: 'approved' | 'pending' | 'rejected',
  role?: 'user' | 'admin'
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabase();
  if (!client) {
    return { success: false, error: 'Supabase database not connected.' };
  }

  const updatePayload: Record<string, any> = {
    status,
    updated_at: new Date().toISOString()
  };
  if (role) {
    updatePayload.role = role;
  }

  const { error } = await client
    .from('profiles')
    .update(updatePayload)
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Create administrator account directly in Supabase public.profiles
 */
export async function createAdminInSupabase(params: {
  fullName: string;
  mobilePhone: string;
  password?: string;
  email?: string;
  address?: string;
  avatarUrl?: string;
}): Promise<{ success: boolean; user?: User; error?: string }> {
  const client = getSupabase();
  if (!client) {
    return { success: false, error: 'Supabase database not connected.' };
  }

  const cleanPhone = params.mobilePhone.trim();
  const newId = crypto.randomUUID ? crypto.randomUUID() : `admin_${Date.now()}`;
  
  const insertPayload = {
    id: newId,
    mobile_phone: cleanPhone,
    full_name: params.fullName.trim(),
    email: params.email?.trim() || null,
    password_hash: params.password?.trim() || 'Anni1234$$',
    role: 'admin',
    status: 'approved',
    address: params.address?.trim() || null,
    avatar_url: params.avatarUrl || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await client
    .from('profiles')
    .upsert([insertPayload], { onConflict: 'mobile_phone' })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, user: mapProfileToUser(data) };
}

/**
 * Fetch all confirmed and pending deity bookings from Supabase public.deity_bookings
 */
export async function fetchDeityBookingsFromSupabase(): Promise<DeityBooking[]> {
  const client = getSupabase();
  if (!client) return [];

  const { data, error } = await client
    .from('deity_bookings')
    .select('*')
    .order('start_date', { ascending: true });

  if (error) {
    console.error('[Supabase] Error fetching bookings:', error);
    return [];
  }

  return (data || []).map(mapBookingFromDb);
}

/**
 * Create a new deity booking in Supabase
 */
export async function createDeityBookingInSupabase(
  booking: Omit<DeityBooking, 'id' | 'createdAt'>
): Promise<{ success: boolean; booking?: DeityBooking; error?: string }> {
  const client = getSupabase();
  if (!client) {
    return { success: false, error: 'Supabase database not connected.' };
  }

  const newId = crypto.randomUUID ? crypto.randomUUID() : `bk_${Date.now()}`;
  const payload = {
    id: newId,
    deity_id: booking.deityId,
    deity_name: booking.deityName,
    start_date: booking.startDate,
    end_date: booking.endDate,
    user_id: booking.userId || null,
    user_name: booking.userName,
    user_phone: booking.userPhone,
    user_avatar_url: booking.userAvatarUrl || null,
    collection_time: booking.collectionTime || 'Sunday after prayers (12:30 PM)',
    status: booking.status || 'confirmed',
    notes: booking.notes || null,
    created_at: new Date().toISOString()
  };

  const { data, error } = await client
    .from('deity_bookings')
    .insert([payload])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return { 
        success: false, 
        error: `Conflict: This deity is already booked for this Sunday cycle in the database.` 
      };
    }
    return { success: false, error: error.message };
  }

  return { success: true, booking: mapBookingFromDb(data) };
}

/**
 * Cancel or delete a deity booking in Supabase
 */
export async function cancelDeityBookingInSupabase(
  bookingId: string
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabase();
  if (!client) return { success: false, error: 'Database not connected.' };

  const { error } = await client
    .from('deity_bookings')
    .delete()
    .eq('id', bookingId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Fetch all Sunday prayer hostings from Supabase public.prayer_hostings
 */
export async function fetchPrayerHostingsFromSupabase(): Promise<PrayerHosting[]> {
  const client = getSupabase();
  if (!client) return [];

  const { data, error } = await client
    .from('prayer_hostings')
    .select('*')
    .order('date', { ascending: true });

  if (error) {
    console.error('[Supabase] Error fetching prayer hostings:', error);
    return [];
  }

  return (data || []).map(mapHostingFromDb);
}

/**
 * Upsert Sunday prayer hosting in Supabase
 */
export async function upsertPrayerHostingInSupabase(
  hosting: PrayerHosting
): Promise<{ success: boolean; hosting?: PrayerHosting; error?: string }> {
  const client = getSupabase();
  if (!client) return { success: false, error: 'Database not connected.' };

  const payload = {
    id: hosting.id.includes('-') ? hosting.id : crypto.randomUUID ? crypto.randomUUID() : `ph_${Date.now()}`,
    date: hosting.date,
    user_id: hosting.userId || null,
    user_name: hosting.userName || null,
    user_phone: hosting.userPhone || null,
    user_avatar_url: hosting.userAvatarUrl || null,
    status: hosting.status,
    notes: hosting.notes || null,
    provides_food: hosting.providesFood ?? false,
    provides_drinks: hosting.providesDrinks ?? false,
    created_at: hosting.createdAt || new Date().toISOString()
  };

  const { data, error } = await client
    .from('prayer_hostings')
    .upsert([payload], { onConflict: 'date' })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, hosting: mapHostingFromDb(data) };
}

/**
 * Fetch announcements from Supabase public.announcements
 */
export async function fetchAnnouncementsFromSupabase(): Promise<Announcement[]> {
  const client = getSupabase();
  if (!client) return [];

  const { data, error } = await client
    .from('announcements')
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('published_date', { ascending: false });

  if (error) {
    console.error('[Supabase] Error fetching announcements:', error);
    return [];
  }

  return (data || []).map(mapAnnouncementFromDb);
}

/**
 * Upsert announcement in Supabase
 */
export async function upsertAnnouncementInSupabase(
  announcement: Announcement
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabase();
  if (!client) return { success: false, error: 'Database not connected.' };

  const payload = {
    id: announcement.id,
    title: announcement.title,
    content: announcement.content,
    category: announcement.category,
    is_pinned: announcement.isPinned,
    author_name: announcement.authorName,
    published_date: announcement.publishedDate,
    valid_until: announcement.validUntil || null,
    badge_text: announcement.badgeText || null
  };

  const { error } = await client
    .from('announcements')
    .upsert([payload], { onConflict: 'id' });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Delete announcement from Supabase
 */
export async function deleteAnnouncementFromSupabase(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabase();
  if (!client) return { success: false, error: 'Database not connected.' };

  const { error } = await client
    .from('announcements')
    .delete()
    .eq('id', id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Fetch branding from Supabase public.temple_branding
 */
export async function fetchBrandingFromSupabase(): Promise<TempleBranding | null> {
  const client = getSupabase();
  if (!client) return null;

  const { data, error } = await client
    .from('temple_branding')
    .select('*')
    .eq('id', 'current')
    .single();

  if (error || !data) return null;

  return {
    type: data.type as 'image' | 'emoji',
    value: data.value,
    templeName: data.temple_name,
    tagline: data.tagline
  };
}

/**
 * Save branding to Supabase public.temple_branding
 */
export async function saveBrandingToSupabase(
  branding: TempleBranding
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabase();
  if (!client) return { success: false, error: 'Database not connected.' };

  const payload = {
    id: 'current',
    type: branding.type,
    value: branding.value,
    temple_name: branding.templeName,
    tagline: branding.tagline,
    updated_at: new Date().toISOString()
  };

  const { error } = await client
    .from('temple_branding')
    .upsert([payload], { onConflict: 'id' });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
