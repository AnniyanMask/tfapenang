export type UserRole = 'user' | 'admin';
export type AccountStatus = 'approved' | 'pending' | 'rejected';

export interface User {
  id: string;
  mobilePhone: string;
  fullName: string;
  email?: string;
  password?: string;
  role: UserRole;
  status: AccountStatus;
  address?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Deity {
  id: string;
  name: string;
  title: string;
  description: string;
  icon: string;
  status: 'active' | 'disabled';
  guidelines?: string;
}

export type BookingStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled';

export interface DeityBooking {
  id: string;
  deityId: string;
  deityName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  userId: string;
  userName: string;
  userPhone: string;
  userAvatarUrl?: string;
  collectionTime: string;
  status: BookingStatus;
  notes?: string;
  createdAt: string;
}

export interface PrayerHosting {
  id: string;
  date: string; // Sunday date YYYY-MM-DD
  userId: string | null;
  userName: string | null;
  userPhone: string | null;
  userAvatarUrl?: string | null;
  status: 'available' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  providesFood?: boolean;   // 🍃 Food provided / prasadam
  providesDrinks?: boolean; // ☕ Coffee / drinks
  createdAt?: string;
}

export type ActiveTab = 'dashboard' | 'deity-booking' | 'prayer-hosting' | 'calendar' | 'notice-board' | 'my-bookings' | 'profile' | 'admin';

export type AnnouncementCategory = 'festival' | 'puja' | 'general' | 'seva';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  isPinned: boolean;
  authorName: string;
  publishedDate: string; // YYYY-MM-DD
  validUntil?: string;   // optional expiry/event date
  badgeText?: string;    // e.g. "Special Notice", "Auspicious Festival"
  createdAt?: string;
}

export interface SundaySlotInfo {
  date: string; // YYYY-MM-DD
  formattedDate: string; // e.g. "6 Sep 2026"
  fullDisplay: string; // e.g. "Sunday, 6 September 2026"
  nextSunday: string; // YYYY-MM-DD
  formattedNextSunday: string; // e.g. "13 Sep 2026"
  isPast: boolean;
}

export interface TempleBranding {
  type: 'image' | 'emoji';
  value: string; // URL/base64 data URL if image, or emoji character(s)
  templeName?: string;
  tagline?: string;
}
