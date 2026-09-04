import React, { useState } from 'react';
import { ActiveTab, DeityBooking, PrayerHosting, User } from '../types';
import { storage } from '../services/storage';
import { formatFullSunday, formatShortDate } from '../utils/dateUtils';
import { 
  BookOpen, 
  Flame, 
  HeartHandshake, 
  Clock, 
  AlertCircle, 
  Trash2, 
  Eye, 
  Calendar,
  X,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface MyBookingsPageProps {
  currentUser: User;
  onNavigate: (tab: ActiveTab) => void;
  myDeityBookings: DeityBooking[];
  myPrayerHostings: PrayerHosting[];
  onRefresh: () => void;
}

export const MyBookingsPage: React.FC<MyBookingsPageProps> = ({
  currentUser,
  onNavigate,
  myDeityBookings,
  myPrayerHostings,
  onRefresh
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'deity' | 'prayer'>('deity');

  // Cancel Modal state
  const [bookingToCancel, setBookingToCancel] = useState<DeityBooking | null>(null);
  const [hostingToCancel, setHostingToCancel] = useState<PrayerHosting | null>(null);

  // View Details Modal state
  const [viewBooking, setViewBooking] = useState<DeityBooking | null>(null);
  const [viewHosting, setViewHosting] = useState<PrayerHosting | null>(null);

  const handleCancelDeityBooking = (id: string) => {
    storage.cancelDeityBooking(id);
    setBookingToCancel(null);
    onRefresh();
  };

  const handleCancelPrayerHosting = (date: string) => {
    storage.cancelPrayerHosting(date);
    setHostingToCancel(null);
    onRefresh();
  };

  const activeDeities = myDeityBookings.filter(b => b.status === 'confirmed');
  const activePrayers = myPrayerHostings.filter(h => h.status === 'confirmed');

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">📋</span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1E2621] font-temple">
              My Bookings
            </h1>
            <p className="text-xs sm:text-sm text-[#5D6B62]">
              Manage your reserved deities and scheduled Sunday prayer hostings
            </p>
          </div>
        </div>
      </div>

      {/* Tabs: Deity Bookings | Prayer Hosting */}
      <div className="flex border-b border-[#E0E5DF]">
        <button
          id="tab-my-deity-bookings"
          onClick={() => setActiveSubTab('deity')}
          className={`flex items-center space-x-2 py-3 px-5 border-b-2 font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeSubTab === 'deity'
              ? 'border-[#1E5E3A] text-[#1E5E3A] bg-[#EBF3ED]'
              : 'border-transparent text-[#5D6B62] hover:text-[#1E2621]'
          }`}
        >
          <span className="text-base">🛕</span>
          <span>Deity Bookings</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#1E5E3A]">
            {activeDeities.length}
          </span>
        </button>

        <button
          id="tab-my-prayer-hostings"
          onClick={() => setActiveSubTab('prayer')}
          className={`flex items-center space-x-2 py-3 px-5 border-b-2 font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeSubTab === 'prayer'
              ? 'border-[#D97736] text-[#D97736] bg-[#FEF3EB]'
              : 'border-transparent text-[#5D6B62] hover:text-[#1E2621]'
          }`}
        >
          <span className="text-base">🙏</span>
          <span>Prayer Hosting</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF9EE] text-[#8F4F19]">
            {activePrayers.length}
          </span>
        </button>
      </div>

      {/* Deity Bookings Tab */}
      {activeSubTab === 'deity' && (
        <div className="space-y-4">
          {activeDeities.length === 0 ? (
            /* 24. EMPTY STATE */
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
              <div className="mt-5">
                <button
                  id="btn-empty-book-deity"
                  onClick={() => onNavigate('deity-booking')}
                  className="px-5 py-2.5 bg-[#1E5E3A] hover:bg-[#164E30] text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer"
                >
                  BOOK A DEITY
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeDeities.map((b) => (
                <div
                  key={b.id}
                  className="bg-white rounded-2xl border border-[#E0E5DF] p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">🛕</span>
                        <div>
                          <h3 className="font-bold text-[#1E2621] text-base font-temple">
                            {b.deityName}
                          </h3>
                          <p className="text-xs text-[#5D6B62] font-medium">
                            {formatShortDate(b.startDate)} → {formatShortDate(b.endDate)}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#1E5E3A] text-xs font-bold uppercase tracking-wider">
                        <span>🟢</span>
                        <span>CONFIRMED</span>
                      </span>
                    </div>

                    <div className="py-2 border-y border-[#E0E5DF] text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[#5D6B62]">Collection:</span>
                        <span className="font-semibold text-[#1E2621]">{b.collectionTime}</span>
                      </div>
                      {b.notes && (
                        <div className="flex justify-between">
                          <span className="text-[#5D6B62]">Pooja Note:</span>
                          <span className="font-medium text-[#1E2621] italic truncate max-w-[200px]">{b.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-2 flex items-center gap-2">
                    <button
                      onClick={() => setViewBooking(b)}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#FAF8F5] hover:bg-[#F4F7F4] text-[#1E5E3A] text-xs font-bold transition-colors cursor-pointer border border-[#E0E5DF]"
                    >
                      VIEW
                    </button>
                    <button
                      onClick={() => setBookingToCancel(b)}
                      className="py-2 px-3 rounded-xl bg-[#F4F7F4] hover:bg-[#FEE2E2] text-[#5D6B62] hover:text-[#991B1B] text-xs font-bold transition-colors cursor-pointer"
                    >
                      CANCEL
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Prayer Hosting Tab */}
      {activeSubTab === 'prayer' && (
        <div className="space-y-4">
          {activePrayers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E0E5DF] p-8 text-center shadow-xs">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#FEF3EB] text-[#D97736] flex items-center justify-center text-2xl mb-3">
                🙏
              </div>
              <h3 className="text-base font-bold text-[#1E2621] font-temple">
                No prayer dates reserved
              </h3>
              <p className="text-xs text-[#5D6B62] mt-1 max-w-sm mx-auto">
                Volunteer to host Sunday bhajans and prasadam seva for the community.
              </p>
              <div className="mt-5">
                <button
                  onClick={() => onNavigate('prayer-hosting')}
                  className="px-5 py-2.5 bg-[#D97736] hover:bg-[#B85E22] text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer"
                >
                  HOST PRAYERS
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activePrayers.map((h) => (
                <div
                  key={h.id}
                  className="bg-white rounded-2xl border border-[#E0E5DF] p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">🙏</span>
                        <div>
                          <h3 className="font-bold text-[#1E2621] text-base font-temple">
                            Sunday Prayer
                          </h3>
                          <p className="text-xs text-[#5D6B62] font-medium">
                            {formatFullSunday(h.date)}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#1E5E3A] text-xs font-bold uppercase tracking-wider">
                        <span>🟢</span>
                        <span>CONFIRMED</span>
                      </span>
                    </div>

                    <div className="py-2 border-y border-[#E0E5DF] text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[#5D6B62]">Seva Timings:</span>
                        <span className="font-semibold text-[#1E2621]">10:30 AM to 1:00 PM</span>
                      </div>
                      {h.notes && (
                        <div className="flex justify-between">
                          <span className="text-[#5D6B62]">Prasadam Seva:</span>
                          <span className="font-medium text-[#1E2621] italic truncate max-w-[200px]">{h.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-2 flex items-center gap-2">
                    <button
                      onClick={() => setViewHosting(h)}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#FAF8F5] hover:bg-[#F4F7F4] text-[#D97736] text-xs font-bold transition-colors cursor-pointer border border-[#E0E5DF]"
                    >
                      VIEW
                    </button>
                    <button
                      onClick={() => setHostingToCancel(h)}
                      className="py-2 px-3 rounded-xl bg-[#F4F7F4] hover:bg-[#FEE2E2] text-[#5D6B62] hover:text-[#991B1B] text-xs font-bold transition-colors cursor-pointer"
                    >
                      CANCEL
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* View Deity Details Modal */}
      {viewBooking && (
        <div className="fixed inset-0 z-50 bg-[#1E2621]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E0E5DF] max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-[#E0E5DF]">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🛕</span>
                <h3 className="font-bold text-[#1E2621] text-base font-temple">
                  Deity Booking Details
                </h3>
              </div>
              <button onClick={() => setViewBooking(null)} className="p-1 text-[#5D6B62] hover:text-[#1E2621] font-bold cursor-pointer">
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E0E5DF] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#5D6B62]">Deity:</span>
                <span className="font-bold text-[#1E2621] text-sm font-temple">{viewBooking.deityName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5D6B62]">Start Date:</span>
                <span className="font-semibold text-[#1E2621]">{formatShortDate(viewBooking.startDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5D6B62]">End Date:</span>
                <span className="font-semibold text-[#1E2621]">{formatShortDate(viewBooking.endDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5D6B62]">Collection:</span>
                <span className="font-semibold text-[#1E5E3A]">{viewBooking.collectionTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5D6B62]">Status:</span>
                <span className="font-bold text-[#1E5E3A] uppercase">🟢 Confirmed</span>
              </div>
              {viewBooking.notes && (
                <div className="pt-2 border-t border-[#E0E5DF]">
                  <span className="text-[#5D6B62] block">Notes:</span>
                  <p className="font-medium text-[#1E2621] mt-0.5">{viewBooking.notes}</p>
                </div>
              )}
            </div>

            <div className="text-[11px] text-[#5D6B62] bg-[#F4F7F4] p-3 rounded-xl border border-[#E0E5DF]">
              <p className="font-semibold text-[#1E2621] mb-1">Temple Office Instructions:</p>
              <p>Please bring a clean pooja tray or velvet cloth to receive the sacred Vigraha from the temple priest.</p>
            </div>

            <button
              onClick={() => setViewBooking(null)}
              className="w-full py-2.5 rounded-xl bg-[#1E5E3A] hover:bg-[#164E30] text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* View Prayer Details Modal */}
      {viewHosting && (
        <div className="fixed inset-0 z-50 bg-[#1E2621]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E0E5DF] max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-[#E0E5DF]">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🙏</span>
                <h3 className="font-bold text-[#1E2621] text-base font-temple">
                  Prayer Hosting Details
                </h3>
              </div>
              <button onClick={() => setViewHosting(null)} className="p-1 text-[#5D6B62] hover:text-[#1E2621] font-bold cursor-pointer">
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E0E5DF] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#5D6B62]">Date:</span>
                <span className="font-bold text-[#1E2621]">{formatFullSunday(viewHosting.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5D6B62]">Host:</span>
                <span className="font-semibold text-[#1E2621]">{viewHosting.userName} ({viewHosting.userPhone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5D6B62]">Status:</span>
                <span className="font-bold text-[#1E5E3A] uppercase">🟢 Confirmed</span>
              </div>
              {viewHosting.notes && (
                <div className="pt-2 border-t border-[#E0E5DF]">
                  <span className="text-[#5D6B62] block">Prasadam Menu / Notes:</span>
                  <p className="font-medium text-[#1E2621] mt-0.5">{viewHosting.notes}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setViewHosting(null)}
              className="w-full py-2.5 rounded-xl bg-[#D97736] hover:bg-[#B85E22] text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Dialog (Deity) */}
      {bookingToCancel && (
        <div className="fixed inset-0 z-50 bg-[#1E2621]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#FEE2E2] max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#FEE2E2] text-[#991B1B] flex items-center justify-center text-xl mx-auto">
              ⚠️
            </div>
            <div>
              <h3 className="font-bold text-[#1E2621] text-base font-temple">
                Cancel Deity Booking?
              </h3>
              <p className="text-xs text-[#5D6B62] mt-1">
                Are you sure you want to release <span className="font-bold text-[#1E2621]">{bookingToCancel.deityName}</span> for {formatShortDate(bookingToCancel.startDate)}? This slot will become available for other families.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setBookingToCancel(null)}
                className="py-2.5 px-3 rounded-xl border border-[#E0E5DF] text-[#5D6B62] hover:text-[#1E2621] font-bold text-xs cursor-pointer"
              >
                KEEP BOOKING
              </button>
              <button
                onClick={() => handleCancelDeityBooking(bookingToCancel.id)}
                className="py-2.5 px-3 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                YES, CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Dialog (Prayer) */}
      {hostingToCancel && (
        <div className="fixed inset-0 z-50 bg-[#1E2621]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#FEE2E2] max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#FEE2E2] text-[#991B1B] flex items-center justify-center text-xl mx-auto">
              ⚠️
            </div>
            <div>
              <h3 className="font-bold text-[#1E2621] text-base font-temple">
                Release Sunday Prayer Hosting?
              </h3>
              <p className="text-xs text-[#5D6B62] mt-1">
                Are you sure you want to cancel hosting on <span className="font-bold text-[#1E2621]">{formatFullSunday(hostingToCancel.date)}</span>?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setHostingToCancel(null)}
                className="py-2.5 px-3 rounded-xl border border-[#E0E5DF] text-[#5D6B62] hover:text-[#1E2621] font-bold text-xs cursor-pointer"
              >
                KEEP HOSTING
              </button>
              <button
                onClick={() => handleCancelPrayerHosting(hostingToCancel.date)}
                className="py-2.5 px-3 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                YES, CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
