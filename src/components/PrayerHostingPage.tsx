import React, { useState } from 'react';
import { PrayerHosting, SundaySlotInfo, User } from '../types';
import { storage } from '../services/storage';
import { formatFullSunday, formatMonthYear, getSundaysInMonth } from '../utils/dateUtils';
import confetti from 'canvas-confetti';
import { DevoteeAvatar } from './DevoteeAvatar';
import { 
  HeartHandshake, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Utensils,
  Music,
  Users
} from 'lucide-react';

interface PrayerHostingPageProps {
  currentUser: User;
  onNavigateToMyBookings: () => void;
}

export const PrayerHostingPage: React.FC<PrayerHostingPageProps> = ({
  currentUser,
  onNavigateToMyBookings
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(8); // September 2026

  // Booking Modal Flow
  const [selectedSlot, setSelectedSlot] = useState<SundaySlotInfo | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [prasadamNote, setPrasadamNote] = useState<string>('');
  const [providesFood, setProvidesFood] = useState<boolean>(false);
  const [providesDrinks, setProvidesDrinks] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [confirmedHosting, setConfirmedHosting] = useState<PrayerHosting | null>(null);

  const sundays = getSundaysInMonth(selectedYear, selectedMonth);

  const handleSelectSunday = (slot: SundaySlotInfo) => {
    setBookingError(null);
    setSelectedSlot(slot);
    setPrasadamNote('');
    setProvidesFood(false);
    setProvidesDrinks(false);
    setShowConfirmModal(true);
  };

  const handleConfirmHosting = () => {
    if (!selectedSlot) return;

    setIsSubmitting(true);
    setBookingError(null);

    setTimeout(() => {
      const result = storage.bookPrayerHosting({
        date: selectedSlot.date,
        user: currentUser,
        notes: prasadamNote || 'Sunday prayer seva & prasadam',
        providesFood,
        providesDrinks
      });

      setIsSubmitting(false);

      if (result.success && result.hosting) {
        setShowConfirmModal(false);
        setConfirmedHosting(result.hosting);
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 }
          });
        } catch {
          // ignore
        }
      } else {
        setBookingError(result.error || 'Sorry, this Sunday has just been reserved by someone else.');
      }
    }, 400);
  };

  // Success Screen
  if (confirmedHosting) {
    return (
      <div className="max-w-xl mx-auto py-8 px-4 text-center">
        <div className="bg-white rounded-3xl border border-[#E0E5DF] p-8 shadow-md relative overflow-hidden">
          <div className="w-16 h-16 bg-[#DCFCE7] text-[#1E5E3A] rounded-full flex items-center justify-center text-3xl mx-auto mb-4 ring-8 ring-[#DCFCE7]/40">
            🙏
          </div>

          <h2 className="text-2xl font-bold text-[#1E2621] font-temple">
            Prayer Hosting Confirmed!
          </h2>
          <p className="text-[#5D6B62] text-xs sm:text-sm mt-1 max-w-md mx-auto">
            Thank you for volunteering to host the community Sunday prayers.
          </p>

          <div className="my-6 p-5 rounded-2xl bg-[#FAF8F5] border border-[#E0E5DF] text-left space-y-3">
            <div>
              <span className="text-xs text-[#1E5E3A] font-bold uppercase tracking-wider block">Hosting Date</span>
              <h3 className="text-lg font-bold text-[#1E2621] font-temple">
                {formatFullSunday(confirmedHosting.date)}
              </h3>
            </div>

            <div className="text-xs space-y-1.5 pt-2 border-t border-[#E0E5DF]">
              <div className="flex justify-between">
                <span className="text-[#5D6B62]">Prayer Seva Schedule:</span>
                <span className="font-bold text-[#1E2621]">10:30 AM Bhajan &amp; Satsang</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5D6B62]">Community Prasadam:</span>
                <span className="font-bold text-[#1E5E3A]">After prayers (12:30 PM)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#5D6B62]">Host Offerings:</span>
                <div className="flex items-center gap-1.5">
                  {confirmedHosting.providesFood && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#EBF3ED] text-[#1E5E3A] border border-[#D2DFD5]">
                      <span>🍃</span>
                      <span>Food</span>
                    </span>
                  )}
                  {confirmedHosting.providesDrinks && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF3EB] text-[#B85E22] border border-[#FAD7C0]">
                      <span>☕</span>
                      <span>Drinks (Coffee)</span>
                    </span>
                  )}
                  {!confirmedHosting.providesFood && !confirmedHosting.providesDrinks && (
                    <span className="text-xs text-[#5D6B62]">Prayer Seva</span>
                  )}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5D6B62]">Host Family:</span>
                <span className="font-bold text-[#1E2621]">{confirmedHosting.userName}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              id="btn-prayer-success-view-bookings"
              onClick={onNavigateToMyBookings}
              className="w-full py-3.5 px-4 bg-[#1E5E3A] hover:bg-[#164E30] text-white font-bold rounded-xl text-sm shadow-xs transition-all cursor-pointer"
            >
              VIEW MY BOOKINGS
            </button>
            <button
              onClick={() => {
                setConfirmedHosting(null);
                setSelectedSlot(null);
              }}
              className="w-full py-2.5 px-4 text-[#5D6B62] hover:text-[#1E2621] text-xs font-semibold cursor-pointer"
            >
              View All Prayer Dates
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🙏</span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1E2621] font-temple">
              Sunday Prayer Hosting
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#5D6B62] mt-1">
            Choose an available Sunday to host the community prayers, bhajans, and holy prasadam.
          </p>
        </div>

        {/* Month & Year Navigation */}
        <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-2xl border border-[#E0E5DF] shadow-2xs self-start sm:self-auto">
          <button
            disabled={selectedMonth === 0}
            onClick={() => setSelectedMonth(prev => Math.max(0, prev - 1))}
            className="p-1 rounded-lg hover:bg-[#F4F7F4] disabled:opacity-30 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-[#5D6B62]" />
          </button>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="text-xs font-bold bg-transparent text-[#1E2621] focus:outline-none cursor-pointer"
          >
            {[
              'January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December'
            ].map((m, idx) => (
              <option key={m} value={idx}>{m}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="text-xs font-bold bg-transparent text-[#1E2621] focus:outline-none cursor-pointer"
          >
            {[2026, 2027, 2028].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <button
            disabled={selectedMonth === 11}
            onClick={() => setSelectedMonth(prev => Math.min(11, prev + 1))}
            className="p-1 rounded-lg hover:bg-[#F4F7F4] disabled:opacity-30 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 text-[#5D6B62]" />
          </button>
        </div>
      </div>

      {/* Seva Highlights Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-white rounded-2xl border border-[#E0E5DF] flex items-center space-x-3 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-[#FEF3EB] text-[#D97736] border border-[#F6DAC2] flex items-center justify-center shrink-0">
            <Music className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#1E2621]">Bhajans &amp; Aarti</h4>
            <p className="text-[11px] text-[#5D6B62]">Lead or coordinate chants</p>
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-[#E0E5DF] flex items-center space-x-3 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-[#EBF3ED] text-[#1E5E3A] border border-[#D2DFD5] flex items-center justify-center shrink-0">
            <Utensils className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#1E2621]">Prasadam Seva</h4>
            <p className="text-[11px] text-[#5D6B62]">Blessed feast for devotees</p>
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-[#E0E5DF] flex items-center space-x-3 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-[#F4F7F4] text-[#1E2621] border border-[#E0E5DF] flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#1E2621]">Family Sankalpam</h4>
            <p className="text-[11px] text-[#5D6B62]">Special blessing for host family</p>
          </div>
        </div>
      </div>

      {/* 10. SUNDAYS LIST & CARDS */}
      <div className="bg-white rounded-2xl border border-[#E0E5DF] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E0E5DF] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-4 h-4 text-[#1E5E3A]" />
            <h2 className="text-sm sm:text-base font-bold text-[#1E2621] font-temple">
              {formatMonthYear(selectedMonth, selectedYear)} Prayer Calendar
            </h2>
          </div>
          <span className="text-xs text-[#5D6B62] font-medium">All Sundays</span>
        </div>

        {/* Desktop Table View (visible on md+) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F7F4] border-b border-[#E0E5DF] text-[#5D6B62] uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-5">Sunday</th>
                <th className="py-3 px-5">Host</th>
                <th className="py-3 px-5">Offerings</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0E5DF]">
              {sundays.map((slot) => {
                const hosting = storage.getPrayerHostingForDate(slot.date);
                const isBooked = hosting && hosting.status === 'confirmed';
                const hostName = isBooked ? (hosting.userName || 'Devotee') : '—';
                const hostAvatar = isBooked 
                  ? (hosting.userAvatarUrl || (hosting.userId ? storage.getUserById(hosting.userId)?.avatarUrl : undefined))
                  : undefined;

                return (
                  <tr key={slot.date} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-3.5 px-5 font-bold text-[#1E2621]">
                      {slot.formattedDate}
                    </td>
                    <td className="py-3.5 px-5 text-[#1E2621] font-medium">
                      {isBooked ? (
                        <div className="flex items-center space-x-2.5">
                          <DevoteeAvatar
                            avatarUrl={hostAvatar}
                            name={hostName}
                            size="sm"
                            showRing
                            ringColor="ring-[#1E5E3A]/20"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-[#1E2621] text-xs leading-tight truncate max-w-[160px]">
                              {hostName}
                            </p>
                            <span className="text-[10px] text-[#5D6B62]">Host Devotee</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[#8A968D] text-xs font-medium">— Open —</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      {isBooked ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {hosting.providesFood && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#EBF3ED] text-[#1E5E3A] border border-[#D2DFD5]" title="Food Provided">
                              <span>🍃</span>
                              <span>Food</span>
                            </span>
                          )}
                          {hosting.providesDrinks && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FEF3EB] text-[#B85E22] border border-[#FAD7C0]" title="Coffee & Drinks Provided">
                              <span>☕</span>
                              <span>Drinks</span>
                            </span>
                          )}
                          {!hosting.providesFood && !hosting.providesDrinks && (
                            <span className="text-[11px] text-[#8A968D] italic">—</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#8A968D] italic">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      {isBooked ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EAEFEA] text-[#5D6B62] border border-[#D2DFD5] font-bold uppercase tracking-wider text-xs">
                          <span>⚪</span>
                          <span>BOOKED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#1E5E3A] font-bold uppercase tracking-wider text-xs">
                          <span>🟢</span>
                          <span>AVAILABLE</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      {isBooked ? (
                        <span className="text-xs font-bold text-[#8A968D] bg-[#F4F7F4] px-3 py-1.5 rounded-xl inline-block">
                          BOOKED
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSelectSunday(slot)}
                          className="px-4 py-1.5 bg-[#1E5E3A] hover:bg-[#164E30] text-white font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
                        >
                          HOST THIS SUNDAY
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden divide-y divide-[#E0E5DF]">
          {sundays.map((slot) => {
            const hosting = storage.getPrayerHostingForDate(slot.date);
            const isBooked = hosting && hosting.status === 'confirmed';
            const hostName = isBooked ? (hosting.userName || 'Devotee') : null;
            const hostAvatar = isBooked 
              ? (hosting.userAvatarUrl || (hosting.userId ? storage.getUserById(hosting.userId)?.avatarUrl : undefined))
              : undefined;

            return (
              <div key={slot.date} className="p-4 flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1E2621] text-sm font-temple">
                    {slot.fullDisplay}
                  </span>
                  {isBooked ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EAEFEA] text-[#5D6B62] border border-[#D2DFD5] text-xs font-bold uppercase tracking-wider">
                      <span>⚪</span>
                      <span>BOOKED</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#1E5E3A] text-xs font-bold uppercase tracking-wider">
                      <span>🟢</span>
                      <span>AVAILABLE</span>
                    </span>
                  )}
                </div>

                {isBooked ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E0E5DF]">
                      <DevoteeAvatar
                        avatarUrl={hostAvatar}
                        name={hostName || 'Devotee'}
                        size="md"
                        showRing
                        ringColor="ring-[#1E5E3A]/30"
                      />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#1E5E3A] tracking-wider block">
                          Prayer Host Family
                        </span>
                        <p className="font-bold text-[#1E2621] text-xs">{hostName}</p>
                      </div>
                    </div>
                    {(hosting.providesFood || hosting.providesDrinks) && (
                      <div className="flex flex-wrap items-center gap-1.5 px-1">
                        {hosting.providesFood && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#EBF3ED] text-[#1E5E3A] border border-[#D2DFD5]">
                            <span>🍃</span>
                            <span>Food Provided</span>
                          </span>
                        )}
                        {hosting.providesDrinks && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FEF3EB] text-[#B85E22] border border-[#FAD7C0]">
                            <span>☕</span>
                            <span>Drinks Provided</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-[#5D6B62] flex items-center justify-between">
                    <span>Host:</span>
                    <span className="font-semibold text-[#1E5E3A]">Open for Community Devotees</span>
                  </div>
                )}

                <div>
                  {isBooked ? (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-xl bg-[#F4F7F4] text-[#8A968D] text-xs font-bold cursor-not-allowed text-center"
                    >
                      BOOKED
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSelectSunday(slot)}
                      className="w-full py-2.5 rounded-xl bg-[#1E5E3A] hover:bg-[#164E30] text-white text-xs font-bold shadow-2xs text-center cursor-pointer"
                    >
                      HOST THIS SUNDAY
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 11. PRAYER HOSTING BOOKING MODAL */}
      {showConfirmModal && selectedSlot && (
        <div className="fixed inset-0 z-50 bg-[#1E2621]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E0E5DF] max-w-lg w-full p-6 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0E5DF]">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🙏</span>
                <h3 className="text-lg font-bold text-[#1E2621] font-temple">
                  Host Sunday Prayers
                </h3>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-[#5D6B62] hover:text-[#1E2621] text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {bookingError && (
              <div className="my-4 p-4 rounded-2xl bg-[#FEF9EE] border border-[#F6E6CA] text-[#8F4F19] text-xs flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="font-bold text-[#8F4F19]">Notice</p>
                  <p className="mt-1 leading-relaxed">{bookingError}</p>
                </div>
              </div>
            )}

            <div className="my-5 p-4 rounded-2xl bg-[#FAF8F5] border border-[#E0E5DF] space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#5D6B62]">Date:</span>
                <span className="font-bold text-[#1E2621] text-sm font-temple">
                  {selectedSlot.fullDisplay}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#5D6B62]">Prayer hosting:</span>
                <span className="font-semibold text-[#1E5E3A]">After Sunday prayers</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#E0E5DF]">
                <span className="text-[#5D6B62]">Host Devotee:</span>
                <div className="flex items-center space-x-2">
                  <DevoteeAvatar
                    avatarUrl={currentUser.avatarUrl}
                    name={currentUser.fullName}
                    size="xs"
                    showRing
                  />
                  <span className="font-semibold text-[#1E2621]">{currentUser.fullName}</span>
                </div>
              </div>
            </div>

            {/* Food & Drinks Hospitality Offerings Checkboxes */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-[#1E2621] uppercase tracking-wider mb-2">
                Food &amp; Drinks Offerings (Host Seva)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label className={`flex items-center space-x-3 p-3 rounded-2xl border cursor-pointer select-none transition-all ${
                  providesFood 
                    ? 'bg-[#EBF3ED] border-[#1E5E3A] ring-1 ring-[#1E5E3A]/30' 
                    : 'bg-[#FAFAF7] border-[#E0E5DF] hover:border-[#1E5E3A]/40'
                }`}>
                  <input
                    type="checkbox"
                    checked={providesFood}
                    onChange={(e) => setProvidesFood(e.target.checked)}
                    className="w-4 h-4 rounded text-[#1E5E3A] focus:ring-[#1E5E3A] accent-[#1E5E3A]"
                  />
                  <span className="text-xl">🍃</span>
                  <div className="text-left leading-tight">
                    <span className="text-xs font-bold text-[#1E2621] block">Food Provided</span>
                    <span className="text-[10px] text-[#5D6B62]">Prasadam / meal</span>
                  </div>
                </label>

                <label className={`flex items-center space-x-3 p-3 rounded-2xl border cursor-pointer select-none transition-all ${
                  providesDrinks 
                    ? 'bg-[#FEF3EB] border-[#D97736] ring-1 ring-[#D97736]/30' 
                    : 'bg-[#FAFAF7] border-[#E0E5DF] hover:border-[#D97736]/40'
                }`}>
                  <input
                    type="checkbox"
                    checked={providesDrinks}
                    onChange={(e) => setProvidesDrinks(e.target.checked)}
                    className="w-4 h-4 rounded text-[#D97736] focus:ring-[#D97736] accent-[#D97736]"
                  />
                  <span className="text-xl">☕</span>
                  <div className="text-left leading-tight">
                    <span className="text-xs font-bold text-[#1E2621] block">Drinks Provided</span>
                    <span className="text-[10px] text-[#5D6B62]">Coffee &amp; beverages</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-[#1E2621] uppercase tracking-wider mb-1">
                Planned Prasadam / Sponsorship (Optional)
              </label>
              <input
                type="text"
                value={prasadamNote}
                onChange={(e) => setPrasadamNote(e.target.value)}
                placeholder="e.g. Tamarind Rice &amp; Kesari, or Fruit Prasadam"
                className="w-full px-3 py-2 text-xs border border-[#E0E5DF] rounded-xl bg-[#FAFAF7] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E5E3A]"
              />
            </div>

            <p className="text-xs text-[#5D6B62] text-center mb-6">
              Would you like to host the prayers on this date?
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="py-3 px-4 rounded-xl border border-[#E0E5DF] text-[#5D6B62] font-bold text-xs hover:bg-[#F4F7F4] transition-colors cursor-pointer"
              >
                CANCEL
              </button>

              <button
                type="button"
                id="btn-confirm-prayer-hosting"
                onClick={handleConfirmHosting}
                disabled={isSubmitting}
                className="py-3 px-4 rounded-xl bg-[#1E5E3A] hover:bg-[#164E30] text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Reserving Sunday...</span>
                ) : (
                  <span>CONFIRM</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
