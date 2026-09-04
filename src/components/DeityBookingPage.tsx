import React, { useState } from 'react';
import { Deity, DeityBooking, SundaySlotInfo, User } from '../types';
import { storage } from '../services/storage';
import { formatFullSunday, formatMonthYear, formatShortDate, getSundaysInMonth, getSundaysInYear } from '../utils/dateUtils';
import confetti from 'canvas-confetti';
import { DeityIconDisplay } from './BrandLogo';
import { DevoteeAvatar } from './DevoteeAvatar';
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowLeft, 
  Clock, 
  Info, 
  ShieldAlert, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';

interface DeityBookingPageProps {
  currentUser: User;
  onNavigateToMyBookings: () => void;
}

export const DeityBookingPage: React.FC<DeityBookingPageProps> = ({
  currentUser,
  onNavigateToMyBookings
}) => {
  const deities = storage.getDeities().filter(d => d.status === 'active');
  const [selectedDeity, setSelectedDeity] = useState<Deity | null>(null);
  
  // Year and Month selection for Sundays
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(8); // September (0-indexed: 8)

  // Booking Modal Flow State
  const [selectedSlot, setSelectedSlot] = useState<SundaySlotInfo | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [bookingNotes, setBookingNotes] = useState<string>('');
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmedBooking, setConfirmedBooking] = useState<DeityBooking | null>(null);

  // Get Sundays for current view
  const sundays = getSundaysInMonth(selectedYear, selectedMonth);

  const handleSelectSlot = (slot: SundaySlotInfo) => {
    setBookingError(null);
    setSelectedSlot(slot);
    setShowConfirmModal(true);
  };

  const handleConfirmBooking = () => {
    if (!selectedDeity || !selectedSlot) return;

    setIsSubmitting(true);
    setBookingError(null);

    // Simulate minor network / revalidation delay
    setTimeout(() => {
      const result = storage.bookDeity({
        deityId: selectedDeity.id,
        deityName: selectedDeity.name,
        startDate: selectedSlot.date,
        endDate: selectedSlot.nextSunday,
        user: currentUser,
        notes: bookingNotes
      });

      setIsSubmitting(false);

      if (result.success && result.booking) {
        setShowConfirmModal(false);
        setConfirmedBooking(result.booking);
        // Trigger celebratory auspicious confetti
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 }
          });
        } catch {
          // Ignore if blocked in environment
        }
      } else {
        // Strict Rule 22: Display conflict error
        setBookingError(result.error || 'Unable to complete booking. The selected date is no longer available.');
      }
    }, 400);
  };

  // 9. SUCCESS SCREEN
  if (confirmedBooking) {
    return (
      <div className="max-w-xl mx-auto py-8 px-4 text-center">
        <div className="bg-white rounded-3xl border border-[#E0E5DF] p-8 shadow-md relative overflow-hidden">
          <div className="w-16 h-16 bg-[#DCFCE7] text-[#1E5E3A] rounded-full flex items-center justify-center text-3xl mx-auto mb-4 ring-8 ring-[#DCFCE7]/40">
            ✅
          </div>

          <h2 className="text-2xl font-bold text-[#1E2621] font-temple">
            Booking Confirmed
          </h2>
          <p className="text-[#5D6B62] text-xs sm:text-sm mt-1 max-w-md mx-auto">
            Your deity booking has been successfully confirmed.
          </p>

          <div className="my-6 p-5 rounded-2xl bg-[#FAF8F5] border border-[#E0E5DF] text-left space-y-3">
            <div className="flex items-center space-x-3 pb-3 border-b border-[#E0E5DF]">
              <span className="text-3xl">🛕</span>
              <div>
                <span className="text-xs text-[#1E5E3A] font-bold uppercase tracking-wider">Reserved Vigraha</span>
                <h3 className="text-xl font-bold text-[#1E2621] font-temple">{confirmedBooking.deityName}</h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#5D6B62] block">From:</span>
                <span className="font-bold text-[#1E2621]">{formatShortDate(confirmedBooking.startDate)}</span>
              </div>
              <div>
                <span className="text-[#5D6B62] block">To:</span>
                <span className="font-bold text-[#1E2621]">{formatShortDate(confirmedBooking.endDate)}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E0E5DF] text-xs">
              <span className="text-[#5D6B62]">Collection:</span>
              <p className="font-bold text-[#1E2621] mt-0.5">
                After Sunday prayers ({confirmedBooking.collectionTime || '12:30 PM'})
              </p>
            </div>

            <div className="pt-2 text-xs">
              <span className="text-[#5D6B62]">Devotee Family:</span>
              <p className="font-semibold text-[#1E2621]">{confirmedBooking.userName} ({confirmedBooking.userPhone})</p>
            </div>
          </div>

          <div className="space-y-2">
            <button
              id="btn-success-view-bookings"
              onClick={onNavigateToMyBookings}
              className="w-full py-3.5 px-4 bg-[#1E5E3A] hover:bg-[#164E30] text-white font-bold rounded-xl text-sm shadow-xs transition-all cursor-pointer"
            >
              VIEW MY BOOKINGS
            </button>
            <button
              onClick={() => {
                setConfirmedBooking(null);
                setSelectedDeity(null);
                setSelectedSlot(null);
              }}
              className="w-full py-2.5 px-4 text-[#5D6B62] hover:text-[#1E2621] text-xs font-semibold cursor-pointer"
            >
              Book Another Deity
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
            <span className="text-2xl">🛕</span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1E2621] font-temple">
              Deity Booking
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#5D6B62] mt-1">
            Reserve a sacred Vigraha for one Sunday-to-Sunday week to worship at your home.
          </p>
        </div>
      </div>

      {/* 6. DEITIES CARDS SECTION */}
      {!selectedDeity ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#1E2621] font-temple">
              Choose a Sacred Deity
            </h2>
            <span className="text-xs text-[#5D6B62]">{deities.length} Deities Available</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {deities.map(deity => (
              <div
                key={deity.id}
                id={`deity-card-${deity.id}`}
                className="bg-white rounded-2xl border border-[#E0E5DF] p-5 shadow-xs hover:border-[#1E5E3A]/40 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#EBF3ED] text-[#1E5E3A] border border-[#D2DFD5] flex items-center justify-center text-2xl shadow-xs overflow-hidden p-1 shrink-0">
                      <DeityIconDisplay icon={deity.icon} name={deity.name} className="text-2xl" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#1E2621] text-lg font-temple">
                        {deity.name}
                      </h3>
                      <p className="text-[11px] text-[#D97736] font-semibold">{deity.title}</p>
                    </div>
                  </div>

                  <p className="text-xs text-[#5D6B62] leading-relaxed mb-4">
                    {deity.description}
                  </p>

                  {deity.guidelines && (
                    <div className="p-2.5 rounded-xl bg-[#FAFAF7] border border-[#E0E5DF] text-[11px] text-[#5D6B62]">
                      <span className="font-semibold text-[#1E2621]">Seva Tips: </span>
                      {deity.guidelines}
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-[#E0E5DF]">
                  <button
                    id={`btn-select-deity-${deity.id}`}
                    onClick={() => setSelectedDeity(deity)}
                    className="w-full py-2.5 px-4 bg-[#1E5E3A] hover:bg-[#164E30] text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <span>SELECT</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* 7. AFTER SELECTING A DEITY: SELECT SUNDAY */
        <div className="space-y-6">
          {/* Selected Deity Banner with option to change */}
          <div className="bg-[#FAF8F5] border border-[#E0E5DF] rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#EBF3ED] flex items-center justify-center overflow-hidden p-1 shrink-0">
                <DeityIconDisplay icon={selectedDeity.icon} name={selectedDeity.name} className="text-2xl" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#1E5E3A] uppercase tracking-wider">
                  Selected Deity
                </span>
                <h3 className="text-lg font-bold text-[#1E2621] font-temple">
                  {selectedDeity.name}
                </h3>
              </div>
            </div>
            <button
              onClick={() => setSelectedDeity(null)}
              className="flex items-center space-x-1 text-xs font-bold text-[#1E2621] hover:text-[#1E5E3A] px-3 py-1.5 rounded-xl bg-white border border-[#E0E5DF] shadow-2xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Change Deity</span>
            </button>
          </div>

          {/* Month / Year Navigator */}
          <div className="bg-white rounded-2xl border border-[#E0E5DF] p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <CalendarIcon className="w-5 h-5 text-[#1E5E3A]" />
              <div>
                <h3 className="font-bold text-[#1E2621] text-sm font-temple">
                  Select Sunday ({formatMonthYear(selectedMonth, selectedYear)})
                </h3>
                <p className="text-[11px] text-[#5D6B62]">Weekly Sunday-to-Sunday cycle</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                disabled={selectedMonth === 0}
                onClick={() => setSelectedMonth(prev => Math.max(0, prev - 1))}
                className="p-1.5 rounded-lg border border-[#E0E5DF] text-[#5D6B62] hover:bg-[#F4F7F4] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="text-xs font-bold bg-white border border-[#E0E5DF] rounded-lg px-2.5 py-1.5 text-[#1E2621] focus:ring-1 focus:ring-[#1E5E3A]"
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
                className="text-xs font-bold bg-white border border-[#E0E5DF] rounded-lg px-2.5 py-1.5 text-[#1E2621] focus:ring-1 focus:ring-[#1E5E3A]"
              >
                {[2026, 2027, 2028].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

              <button
                disabled={selectedMonth === 11}
                onClick={() => setSelectedMonth(prev => Math.min(11, prev + 1))}
                className="p-1.5 rounded-lg border border-[#E0E5DF] text-[#5D6B62] hover:bg-[#F4F7F4] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sundays List */}
          <div className="space-y-3">
            {sundays.map((slot) => {
              const bookingCheck = storage.isDeityBooked(selectedDeity.id, slot.date);
              const isBooked = bookingCheck.isBooked;
              const isMyBooking = bookingCheck.booking?.userId === currentUser.id;

              return (
                <div
                  key={slot.date}
                  id={`slot-${slot.date}`}
                  className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isBooked
                      ? 'border-[#E0E5DF] bg-[#F4F7F4]/60'
                      : 'border-[#E0E5DF] hover:border-[#1E5E3A]/40 hover:shadow-xs'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-bold text-[#1E2621] font-temple">
                        {slot.fullDisplay}
                      </span>
                      {slot.isPast && (
                        <span className="text-[10px] uppercase font-bold text-[#5D6B62] bg-[#F4F7F4] px-2 py-0.5 rounded-full">
                          Past
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-[#5D6B62] font-medium">
                      Cycle: <span className="text-[#1E2621] font-semibold">{slot.formattedDate} → {slot.formattedNextSunday}</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {/* Consistent Status Badge (Rule 20: Color + Text) */}
                      {isBooked ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EAEFEA] text-[#5D6B62] border border-[#D2DFD5] text-xs font-bold uppercase tracking-wider">
                          <span>⚪</span>
                          <span>BOOKED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#1E5E3A] text-xs font-bold uppercase tracking-wider">
                          <span>🟢</span>
                          <span>AVAILABLE</span>
                        </span>
                      )}

                      {/* Display devotee profile picture and identification for all users */}
                      {isBooked && bookingCheck.booking && (
                        <div className="flex items-center space-x-2 pl-1">
                          <DevoteeAvatar
                            avatarUrl={
                              bookingCheck.booking.userAvatarUrl || 
                              storage.getUserById(bookingCheck.booking.userId)?.avatarUrl
                            }
                            name={bookingCheck.booking.userName}
                            size="xs"
                            showRing
                            ringColor="ring-[#1E5E3A]/20"
                          />
                          <span className="text-xs font-semibold text-[#1E2621]">
                            {isMyBooking ? 'Booked by you' : bookingCheck.booking.userName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Booking Action */}
                  <div className="shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E0E5DF]">
                    {isBooked ? (
                      <button
                        disabled
                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#F4F7F4] text-[#8A968D] text-xs font-bold cursor-not-allowed"
                      >
                        BOOKED
                      </button>
                    ) : (
                      <button
                        id={`btn-book-slot-${slot.date}`}
                        onClick={() => handleSelectSlot(slot)}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#1E5E3A] hover:bg-[#164E30] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                      >
                        BOOK
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 8. DEITY BOOKING CONFIRMATION MODAL */}
      {showConfirmModal && selectedSlot && selectedDeity && (
        <div className="fixed inset-0 z-50 bg-[#1E2621]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E0E5DF] max-w-lg w-full p-6 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0E5DF]">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🛕</span>
                <h3 className="text-lg font-bold text-[#1E2621] font-temple">
                  Confirm Deity Booking
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setBookingError(null);
                }}
                className="text-[#5D6B62] hover:text-[#1E2621] text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Error Message: Rule 22 Collision Protection */}
            {bookingError && (
              <div className="my-4 p-4 rounded-2xl bg-[#FEF9EE] border border-[#F6E6CA] text-[#8F4F19] text-xs flex items-start gap-3 animate-shake">
                <span className="text-xl">⚠️</span>
                <div className="flex-1">
                  <p className="font-bold text-[#8F4F19]">Slot Conflict Detected</p>
                  <p className="mt-1 leading-relaxed">{bookingError}</p>
                </div>
              </div>
            )}

            <div className="my-5 p-4 rounded-2xl bg-[#FAF8F5] border border-[#E0E5DF] space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#E0E5DF]">
                <span className="text-[#5D6B62]">Deity:</span>
                <span className="font-bold text-[#1E2621] text-sm font-temple">{selectedDeity.name}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#5D6B62]">Collection:</span>
                <span className="font-semibold text-[#1E2621]">{selectedSlot.fullDisplay}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#5D6B62]">Time:</span>
                <span className="font-semibold text-[#1E5E3A]">After prayers (12:30 PM)</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#E0E5DF]">
                <span className="text-[#5D6B62]">Return:</span>
                <span className="font-semibold text-[#1E2621]">{selectedSlot.formattedNextSunday}</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#E0E5DF]">
                <span className="text-[#5D6B62]">Devotee:</span>
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

            <div className="mb-4">
              <label className="block text-xs font-bold text-[#1E2621] uppercase tracking-wider mb-1">
                Pooja / Sankalpam Notes (Optional)
              </label>
              <input
                type="text"
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                placeholder="e.g. Birthday pooja or special family archana"
                className="w-full px-3 py-2 text-xs border border-[#E0E5DF] rounded-xl bg-[#FAFAF7] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E5E3A]"
              />
            </div>

            <p className="text-xs text-[#5D6B62] text-center mb-6">
              Are you sure you want to reserve this deity?
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setBookingError(null);
                }}
                disabled={isSubmitting}
                className="py-3 px-4 rounded-xl border border-[#E0E5DF] text-[#5D6B62] font-bold text-xs hover:bg-[#F4F7F4] transition-colors cursor-pointer"
              >
                CANCEL
              </button>

              <button
                type="button"
                id="btn-modal-confirm-booking"
                onClick={handleConfirmBooking}
                disabled={isSubmitting}
                className="py-3 px-4 rounded-xl bg-[#1E5E3A] hover:bg-[#164E30] text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Checking Availability...</span>
                ) : (
                  <span>CONFIRM BOOKING</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
