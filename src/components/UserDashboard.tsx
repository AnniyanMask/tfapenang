import React from 'react';
import { ActiveTab, DeityBooking, PrayerHosting, User } from '../types';
import { storage } from '../services/storage';
import { formatShortDate, formatFullSunday } from '../utils/dateUtils';
import { DevoteeAvatar } from './DevoteeAvatar';
import { 
  Calendar, 
  Sparkles, 
  Clock, 
  CheckCircle, 
  ChevronRight, 
  AlertTriangle,
  ArrowRight,
  HeartHandshake,
  Flame,
  ShieldCheck,
  Info,
  Bell,
  Pin
} from 'lucide-react';

interface UserDashboardProps {
  currentUser: User;
  onNavigate: (tab: ActiveTab) => void;
  myDeityBookings: DeityBooking[];
  myPrayerHostings: PrayerHosting[];
  onViewBookingDetails: (booking: DeityBooking) => void;
  onViewHostingDetails: (hosting: PrayerHosting) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  currentUser,
  onNavigate,
  myDeityBookings,
  myPrayerHostings,
  onViewBookingDetails,
  onViewHostingDetails,
}) => {
  const activeDeityBookings = myDeityBookings.filter(b => b.status === 'confirmed');
  const activePrayerHostings = myPrayerHostings.filter(h => h.status === 'confirmed');
  const hasAnyBookings = activeDeityBookings.length > 0 || activePrayerHostings.length > 0;
  const isPendingValidation = currentUser.status === 'pending';
  const announcements = storage.getAnnouncements();
  const highlightedNotices = announcements.slice(0, 2);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Pending Validation Alert (Supabase Admin Requirement) */}
      {isPendingValidation && (
        <div className="p-4 rounded-2xl bg-[#FEF9EE] border border-[#F6E6CA] shadow-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#D97736] shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-[#8F4F19]">
              Account Registered — Awaiting Admin Validation
            </h3>
            <p className="text-xs text-[#8F4F19]/90 mt-1 leading-relaxed">
              Welcome, {currentUser.fullName}! Your mobile number (<span className="font-semibold">{currentUser.mobilePhone}</span>) has been submitted for validation by the Temple Committee. You can explore available dates; once approved, your reservations will be finalized.
            </p>
          </div>
        </div>
      )}

      {/* Top Welcome Section */}
      <div className="bg-[#1E5E3A] rounded-3xl p-6 sm:p-8 text-white shadow-xs relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <button
              onClick={() => onNavigate('profile')}
              className="shrink-0 relative group focus:outline-none cursor-pointer"
              title="Update profile picture"
            >
              <DevoteeAvatar
                avatarUrl={currentUser.avatarUrl}
                name={currentUser.fullName}
                size="lg"
                showRing
                ringColor="ring-white/50"
              />
              <span className="absolute -bottom-1 -right-1 bg-white text-[#1E5E3A] text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-xs opacity-90 group-hover:opacity-100 transition-opacity">
                Edit
              </span>
            </button>
            <div>
              <div className="flex items-center gap-2 text-emerald-100 text-xs font-semibold tracking-wider uppercase mb-1">
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>Shiva Family Portal</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-temple tracking-tight">
                Welcome, {currentUser.fullName}
              </h1>
              <p className="text-emerald-100/90 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
                Reserve a sacred deity to grace your home for an auspicious Sunday-to-Sunday week, or volunteer to host Sunday community prayers.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs font-medium text-white">
                  📱 {currentUser.mobilePhone}
                </span>
                <button
                  onClick={() => onNavigate('profile')}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  <span>📷 Update Profile Picture</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Temple Notice Board & Circulars Highlight */}
      {highlightedNotices.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E0E5DF] p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-[#EBF3ED] text-[#1E5E3A] flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-[#1E2621] uppercase tracking-wider font-temple">
                TFA Penang Notice Board &amp; Announcements
              </h2>
            </div>
            <button
              onClick={() => onNavigate('notice-board')}
              className="text-xs font-bold text-[#1E5E3A] hover:text-[#164E30] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View All ({announcements.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {highlightedNotices.map((ann) => (
              <div
                key={ann.id}
                onClick={() => onNavigate('notice-board')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  ann.isPinned
                    ? 'bg-[#FEFAF4] border-[#FDE7C7] hover:border-[#FBD197]'
                    : 'bg-[#FAFAF7] border-[#E0E5DF] hover:border-[#CDE0D4]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                    {ann.isPinned && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[#FEF3EB] text-[#D97736] border border-[#FEE2C7]">
                        <Pin className="w-2.5 h-2.5 fill-[#D97736]" />
                        PINNED
                      </span>
                    )}
                    {ann.badgeText && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#EBF3ED] text-[#1E5E3A] border border-[#CDE0D4]">
                        {ann.badgeText}
                      </span>
                    )}
                    <span className="text-[10px] text-[#5D6B62] ml-auto">
                      {ann.publishedDate}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-[#1E2621] font-temple line-clamp-1">
                    {ann.title}
                  </h3>
                  <p className="text-[11px] text-[#5D6B62] mt-1 line-clamp-2 leading-relaxed">
                    {ann.content}
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-black/5 flex items-center justify-between text-[10px]">
                  <span className="text-[#8A968D]">By {ann.authorName}</span>
                  <span className="text-[#1E5E3A] font-bold">Read details →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Large Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Action Card 1: Book a Deity */}
        <div className="bg-[#FAF8F5] rounded-2xl border border-[#E0E5DF] p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between group relative overflow-hidden">
          <div className="text-9xl absolute -right-10 -top-10 opacity-5 pointer-events-none select-none">
            🛕
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-[#EBF3ED] text-[#1E5E3A] flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform shadow-xs">
              🛕
            </div>
            <h2 className="text-xl font-bold text-[#1E2621] font-temple">
              Book a Deity
            </h2>
            <p className="text-[#5D6B62] text-sm mt-2 leading-relaxed">
              Reserve a deity for one Sunday-to-Sunday week. Welcome the divine presence into your home altar.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E0E5DF] relative z-10">
            <button
              id="btn-dashboard-book-deity"
              onClick={() => onNavigate('deity-booking')}
              className="w-full py-3 px-4 bg-[#1E5E3A] hover:bg-[#164E30] text-white font-bold rounded-xl text-sm shadow-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <span>BOOK DEITY</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Card 2: Host Sunday Prayers */}
        <div className="bg-[#FAF8F5] rounded-2xl border border-[#E0E5DF] p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between group relative overflow-hidden">
          <div className="text-9xl absolute -right-10 -top-10 opacity-5 pointer-events-none select-none">
            🙏
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-[#FEF3EB] text-[#D97736] flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform shadow-xs">
              🙏
            </div>
            <h2 className="text-xl font-bold text-[#1E2621] font-temple">
              Host Sunday Prayers
            </h2>
            <p className="text-[#5D6B62] text-sm mt-2 leading-relaxed">
              Choose an available Sunday to host the prayers. Sponsor the bhajans, satsang, and community prasadam seva.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E0E5DF] relative z-10">
            <button
              id="btn-dashboard-book-prayer"
              onClick={() => onNavigate('prayer-hosting')}
              className="w-full py-3 px-4 bg-[#D97736] hover:bg-[#B85E22] text-white font-bold rounded-xl text-sm shadow-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <span>BOOK PRAYER DATE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. UPCOMING BOOKINGS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#1E2621] font-temple">
              My Upcoming Bookings
            </h2>
            <p className="text-xs text-[#5D6B62]">
              Active deity reservations and Sunday prayer hosting dates
            </p>
          </div>
          {hasAnyBookings && (
            <button
              onClick={() => onNavigate('my-bookings')}
              className="text-xs font-bold text-[#1E5E3A] hover:text-[#164E30] flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {!hasAnyBookings ? (
          /* Empty State (Rule 24) */
          <div className="bg-white rounded-2xl border border-[#E0E5DF] p-8 text-center shadow-xs">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#EBF3ED] text-[#1E5E3A] flex items-center justify-center text-2xl mb-3">
              📅
            </div>
            <h3 className="text-base font-bold text-[#1E2621] font-temple">
              No bookings yet
            </h3>
            <p className="text-xs text-[#5D6B62] mt-1 max-w-sm mx-auto">
              &quot;You don&apos;t have any upcoming bookings.&quot;
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <button
                onClick={() => onNavigate('deity-booking')}
                className="px-5 py-2.5 bg-[#1E5E3A] hover:bg-[#164E30] text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer transition-colors"
              >
                BOOK A DEITY
              </button>
              <button
                onClick={() => onNavigate('prayer-hosting')}
                className="px-5 py-2.5 bg-[#D97736] hover:bg-[#B85E22] text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer transition-colors"
              >
                HOST PRAYERS
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Deity Booking Cards */}
            {activeDeityBookings.map((booking) => (
              <div 
                key={booking.id}
                className="bg-white rounded-2xl border border-[#E0E5DF] p-5 shadow-xs hover:border-[#1E5E3A]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">🛕</span>
                      <div>
                        <h3 className="font-bold text-[#1E2621] text-base font-temple">
                          {booking.deityName}
                        </h3>
                        <p className="text-[11px] text-[#5D6B62]">Deity Reservation</p>
                      </div>
                    </div>
                    {/* Status indicator with emoji + text for accessibility */}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#1E5E3A] text-xs font-bold uppercase tracking-wider">
                      <span>🟢</span>
                      <span>CONFIRMED</span>
                    </span>
                  </div>

                  <div className="space-y-2 py-2 border-y border-[#E0E5DF] text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#5D6B62]">Reservation Period:</span>
                      <span className="font-bold text-[#1E2621]">
                        {formatShortDate(booking.startDate)} → {formatShortDate(booking.endDate)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#5D6B62]">Collection:</span>
                      <span className="font-semibold text-[#1E5E3A]">
                        {booking.collectionTime || 'Sunday after prayers'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2">
                  <button
                    onClick={() => onViewBookingDetails(booking)}
                    className="w-full py-2 px-3 rounded-xl bg-[#F4F7F4] hover:bg-[#E0E5DF] text-[#1E2621] text-xs font-bold transition-colors cursor-pointer"
                  >
                    VIEW DETAILS
                  </button>
                </div>
              </div>
            ))}

            {/* Prayer Hosting Cards */}
            {activePrayerHostings.map((hosting) => (
              <div 
                key={hosting.id}
                className="bg-white rounded-2xl border border-[#E0E5DF] p-5 shadow-xs hover:border-[#D97736]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">🙏</span>
                      <div>
                        <h3 className="font-bold text-[#1E2621] text-base font-temple">
                          Sunday Prayer Hosting
                        </h3>
                        <p className="text-[11px] text-[#5D6B62]">Community Seva</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#1E5E3A] text-xs font-bold uppercase tracking-wider">
                      <span>🟢</span>
                      <span>CONFIRMED</span>
                    </span>
                  </div>

                  <div className="space-y-2 py-2 border-y border-[#E0E5DF] text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#5D6B62]">Hosting Date:</span>
                      <span className="font-bold text-[#1E2621]">
                        {formatFullSunday(hosting.date)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#5D6B62]">Schedule:</span>
                      <span className="font-semibold text-[#1E5E3A]">
                        10:30 AM Pooja &amp; 12:30 PM Prasadam
                      </span>
                    </div>
                    {(hosting.providesFood || hosting.providesDrinks) && (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[#5D6B62]">Offerings:</span>
                        <div className="flex items-center gap-1.5">
                          {hosting.providesFood && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF3ED] text-[#1E5E3A] border border-[#D2DFD5]" title="Food Provided">
                              <span>🍃</span>
                              <span>Food</span>
                            </span>
                          )}
                          {hosting.providesDrinks && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3EB] text-[#B85E22] border border-[#FAD7C0]" title="Coffee & Drinks Provided">
                              <span>☕</span>
                              <span>Drinks</span>
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-2">
                  <button
                    onClick={() => onViewHostingDetails(hosting)}
                    className="w-full py-2 px-3 rounded-xl bg-[#F4F7F4] hover:bg-[#E0E5DF] text-[#1E2621] text-xs font-bold transition-colors cursor-pointer"
                  >
                    VIEW DETAILS
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Community Notice & Care of Vigrahas Guidelines */}
      <div className="bg-white rounded-2xl border border-[#E0E5DF] p-5 shadow-xs">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-[#1E5E3A] shrink-0 mt-0.5" />
          <div className="text-xs text-[#5D6B62] space-y-1">
            <h4 className="font-bold text-[#1E2621] font-temple text-sm">
              Sacred Tradition &amp; Deity Protocol
            </h4>
            <p>
              • Deities are collected each Sunday following the main sanctum prayer (approx. 12:30 PM).
            </p>
            <p>
              • Please return the deity on the concluding Sunday before 5:00 AM so the sanctum can prepare for the incoming family.
            </p>
            <p>
              • Maintain a serene and satvic environment in your home altar throughout the holy week.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
