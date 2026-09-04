export type UserRole = 'user' | 'admin';
export type AccountStatus = 'approved' | 'pending' | 'rejected';

export interface User {
  id: string;
  mobilePhone: string;
  fullName: string;
  email?: string;
  role: UserRole;
  status: AccountStatus;
  address?: string;
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
  status: 'available' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdAt?: string;
}

export type ActiveTab = 'dashboard' | 'deity-booking' | 'prayer-hosting' | 'calendar' | 'my-bookings' | 'profile' | 'admin';

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
