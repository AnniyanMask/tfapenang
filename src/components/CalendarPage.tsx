import React, { useState } from 'react';
import { Deity, DeityBooking, PrayerHosting, SundaySlotInfo, User } from '../types';
import { storage } from '../services/storage';
import { formatFullSunday, formatMonthYear, formatShortDate, getSundaysInMonth, getSundaysInYear } from '../utils/dateUtils';
import { DevoteeAvatar } from './DevoteeAvatar';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  HeartHandshake, 
  Flame, 
  CheckCircle2, 
  X,
  Info,
  ArrowRight
} from 'lucide-react';

interface CalendarPageProps {
  currentUser: User;
  onBookDeityForSunday: (deityId: string, slot: SundaySlotInfo) => void;
  onHostPrayerForSunday: (slot: SundaySlotInfo) => void;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({
  currentUser,
  onBookDeityForSunday,
  onHostPrayerForSunday
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [selectedMonth, setSelectedMonth] = useState<number>(8); // September 2026 (index 8)

  const deities = storage.getDeities().filter(d => d.status === 'active');
  const sundaysInMonth = getSundaysInMonth(selectedYear, selectedMonth);

  // Selected Sunday for detailed inspection (Default to Sep 13, 2026 as per prompt example!)
  const [inspectedSunday, setInspectedSunday] = useState<SundaySlotInfo | null>(
    sundaysInMonth.find(s => s.date === '2026-09-13') || sundaysInMonth[0] || null
  );

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* 13. TOP CALENDAR CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">📅</span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1E2621] font-temple">
              Temple Seva Calendar
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#5D6B62] mt-1">
            Browse weekly deity reservations and Sunday prayer hosting throughout the year.
          </p>
        </div>

        {/* Year Selector & View Mode Switch */}
        <div className="flex items-center space-x-3 self-start sm:self-auto">
          {/* Year Dropdown */}
          <div className="flex items-center space-x-1.5 bg-white px-3 py-1.5 rounded-xl border border-[#E0E5DF] shadow-2xs">
            <span className="text-xs font-bold text-[#5D6B62]">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => {
                const yr = Number(e.target.value);
                setSelectedYear(yr);
                const updated = getSundaysInMonth(yr, selectedMonth);
                setInspectedSunday(updated[0] || null);
              }}
              className="text-xs font-bold bg-transparent text-[#1E2621] focus:outline-none cursor-pointer"
            >
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
              <option value={2028}>2028</option>
              <option value={2029}>2029</option>
            </select>
          </div>

          {/* Month / Year View Toggle */}
          <div className="flex rounded-xl bg-[#F4F7F4] p-1 border border-[#E0E5DF]">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'month' 
                  ? 'bg-white text-[#1E2621] shadow-xs' 
                  : 'text-[#5D6B62] hover:text-[#1E2621]'
              }`}
            >
              Month View
            </button>
            <button
              onClick={() => setViewMode('year')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'year' 
                  ? 'bg-white text-[#1E2621] shadow-xs' 
                  : 'text-[#5D6B62] hover:text-[#1E2621]'
              }`}
            >
              Year View
            </button>
          </div>
        </div>
      </div>

      {/* 14. MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Month Navigator & Sundays List */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-2xl border border-[#E0E5DF] p-4 shadow-xs flex items-center justify-between">
              <button
                disabled={selectedMonth === 0}
                onClick={() => {
                  const m = Math.max(0, selectedMonth - 1);
                  setSelectedMonth(m);
                  const updated = getSundaysInMonth(selectedYear, m);
                  setInspectedSunday(updated[0] || null);
                }}
                className="p-1.5 rounded-lg border border-[#E0E5DF] text-[#5D6B62] hover:bg-[#F4F7F4] disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <h2 className="text-base sm:text-lg font-bold text-[#1E2621] font-temple">
                {formatMonthYear(selectedMonth, selectedYear)}
              </h2>

              <button
                disabled={selectedMonth === 11}
                onClick={() => {
                  const m = Math.min(11, selectedMonth + 1);
                  setSelectedMonth(m);
                  const updated = getSundaysInMonth(selectedYear, m);
                  setInspectedSunday(updated[0] || null);
                }}
                className="p-1.5 rounded-lg border border-[#E0E5DF] text-[#5D6B62] hover:bg-[#F4F7F4] disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Visual Sunday Date Highlights */}
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-[#5D6B62] uppercase tracking-wider px-1">
                Select a Sunday to View Availability
              </p>

              {sundaysInMonth.map((slot) => {
                const isSelected = inspectedSunday?.date === slot.date;
                const hosting = storage.getPrayerHostingForDate(slot.date);
                const hasHost = hosting && hosting.status === 'confirmed';

                // Count booked deities for this slot
                const bookedDeitiesCount = deities.filter(
                  d => storage.isDeityBooked(d.id, slot.date).isBooked
                ).length;

                return (
                  <div
                    key={slot.date}
                    onClick={() => setInspectedSunday(slot)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#FAF8F5] border-[#1E5E3A] ring-2 ring-[#1E5E3A]/20 shadow-xs'
                        : 'bg-white border-[#E0E5DF] hover:border-[#1E5E3A]/40 hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#1E5E3A]"></span>
                        <h3 className="font-bold text-[#1E2621] text-sm sm:text-base font-temple">
                          {slot.fullDisplay}
                        </h3>
                      </div>
                      <p className="text-xs text-[#5D6B62]">
                        Period: {slot.formattedDate} → {slot.formattedNextSunday}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 text-right">
                      <div className="hidden sm:block text-right">
                        <div className="text-[11px] font-semibold text-[#5D6B62]">
                          {bookedDeitiesCount} / {deities.length} Deities Booked
                        </div>
                        <div className="text-[11px] text-[#5D6B62] flex items-center gap-1 justify-end">
                          <span>Prayer Host: {hasHost ? '⚪ Assigned' : '🟢 Open'}</span>
                          {hasHost && (
                            <span className="inline-flex items-center gap-0.5 ml-1">
                              {hosting.providesFood && <span title="Food Provided">🍃</span>}
                              {hosting.providesDrinks && <span title="Coffee & Drinks Provided">☕</span>}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-[#5D6B62] transition-transform ${isSelected ? 'translate-x-1 text-[#1E5E3A]' : ''}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Sunday Inspector Details */}
          <div className="lg:col-span-5">
            {inspectedSunday ? (
              <div className="bg-white rounded-3xl border border-[#E0E5DF] p-5 sm:p-6 shadow-md sticky top-6 space-y-5">
                <div className="border-b border-[#E0E5DF] pb-3">
                  <span className="text-[11px] font-bold text-[#1E5E3A] uppercase tracking-wider">
                    Selected Sunday Details
                  </span>
                  <h3 className="text-lg font-bold text-[#1E2621] font-temple mt-0.5">
                    {inspectedSunday.fullDisplay}
                  </h3>
                  <p className="text-xs text-[#5D6B62]">
                    Week Cycle: {inspectedSunday.formattedDate} to {inspectedSunday.formattedNextSunday}
                  </p>
                </div>

                {/* Deity Availability List */}
                <div>
                  <h4 className="text-xs font-bold text-[#5D6B62] uppercase tracking-wider mb-2.5 flex items-center justify-between">
                    <span>Deity Availability</span>
                    <span className="text-[10px] text-[#8A968D] normal-case">Sunday-to-Sunday</span>
                  </h4>

                  <div className="space-y-2 text-xs">
                    {deities.map(d => {
                      const check = storage.isDeityBooked(d.id, inspectedSunday.date);
                      const isBooked = check.isBooked;

                      return (
                        <div
                          key={d.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E0E5DF]"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-base">{d.icon}</span>
                            <span className="font-bold text-[#1E2621]">{d.name}</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            {isBooked ? (
                              <div className="flex items-center space-x-2">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EAEFEA] text-[#5D6B62] border border-[#D2DFD5] text-[10px] font-bold uppercase tracking-wider">
                                  <span>⚪</span>
                                  <span>Booked</span>
                                </span>
                                {check.booking && (
                                  <div className="flex items-center space-x-1.5" title={`Booked by ${check.booking.userName}`}>
                                    <DevoteeAvatar
                                      avatarUrl={
                                        check.booking.userAvatarUrl || 
                                        storage.getUserById(check.booking.userId)?.avatarUrl
                                      }
                                      name={check.booking.userName}
                                      size="xs"
                                      showRing
                                      ringColor="ring-[#1E5E3A]/20"
                                    />
                                    <span className="text-[11px] font-semibold text-[#1E2621] max-w-[85px] truncate">
                                      {check.booking.userName.split(' ')[0]}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#1E5E3A] text-[10px] font-bold uppercase tracking-wider">
                                  <span>🟢</span>
                                  <span>Available</span>
                                </span>
                                <button
                                  onClick={() => onBookDeityForSunday(d.id, inspectedSunday)}
                                  className="px-2.5 py-1 bg-[#1E5E3A] hover:bg-[#164E30] text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-2xs"
                                >
                                  Book
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Prayer Host Section */}
                <div className="pt-3 border-t border-[#E0E5DF]">
                  <h4 className="text-xs font-bold text-[#5D6B62] uppercase tracking-wider mb-2">
                    Prayer Host
                  </h4>

                  {(() => {
                    const hosting = storage.getPrayerHostingForDate(inspectedSunday.date);
                    const isBooked = hosting && hosting.status === 'confirmed';
                    const hostAvatar = isBooked
                      ? (hosting.userAvatarUrl || (hosting.userId ? storage.getUserById(hosting.userId)?.avatarUrl : undefined))
                      : undefined;

                    return (
                      <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E0E5DF] flex items-center justify-between">
                        <div>
                          {isBooked ? (
                            <div className="flex items-center space-x-3">
                              <DevoteeAvatar
                                avatarUrl={hostAvatar}
                                name={hosting.userName || 'Devotee'}
                                size="md"
                                showRing
                                ringColor="ring-[#1E5E3A]/20"
                              />
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EAEFEA] text-[#5D6B62] border border-[#D2DFD5] text-xs font-bold uppercase tracking-wider">
                                    <span>⚪</span>
                                    <span>Booked</span>
                                  </span>
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
                                <p className="text-xs font-bold text-[#1E2621]">
                                  Host: {hosting.userName || 'Devotee Family'}
                                </p>
                                {hosting.notes && (
                                  <p className="text-[10px] text-[#5D6B62] italic truncate max-w-[190px]">
                                    {hosting.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#1E5E3A] text-xs font-bold uppercase tracking-wider mb-1">
                                <span>🟢</span>
                                <span>Available</span>
                              </span>
                              <p className="text-xs text-[#5D6B62]">
                                Open for community sponsorship &amp; seva
                              </p>
                            </div>
                          )}
                        </div>

                        {!isBooked && (
                          <button
                            id="btn-calendar-host-prayers"
                            onClick={() => onHostPrayerForSunday(inspectedSunday)}
                            className="px-3 py-2 bg-[#1E5E3A] hover:bg-[#164E30] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                          >
                            HOST PRAYERS
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-white rounded-2xl border border-[#E0E5DF] text-[#5D6B62] text-xs">
                Select a Sunday on the left to view deity availability
              </div>
            )}
          </div>
        </div>
      )}

      {/* 13. YEAR VIEW (Overview of all 12 Months) */}
      {viewMode === 'year' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#1E2621] font-temple">
              Year {selectedYear} Full Sunday Schedule
            </h2>
            <span className="text-xs text-[#5D6B62]">12 Months Overview</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {months.map((monthName, monthIdx) => {
              const monthSundays = getSundaysInMonth(selectedYear, monthIdx);

              return (
                <div
                  key={monthName}
                  className="bg-white rounded-2xl border border-[#E0E5DF] p-4 shadow-2xs hover:border-[#1E5E3A]/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-[#E0E5DF] mb-3">
                      <h3 className="font-bold text-[#1E2621] text-sm font-temple">
                        {monthName}
                      </h3>
                      <span className="text-[11px] text-[#5D6B62]">
                        {monthSundays.length} Sundays
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {monthSundays.map(s => {
                        const bookedCount = deities.filter(
                          d => storage.isDeityBooked(d.id, s.date).isBooked
                        ).length;
                        const hosting = storage.getPrayerHostingForDate(s.date);
                        const hasHost = hosting && hosting.status === 'confirmed';

                        return (
                          <div
                            key={s.date}
                            onClick={() => {
                              setSelectedMonth(monthIdx);
                              setInspectedSunday(s);
                              setViewMode('month');
                            }}
                            className="p-1.5 rounded-lg hover:bg-[#FAF8F5] flex items-center justify-between text-xs cursor-pointer"
                          >
                            <span className="font-semibold text-[#1E2621]">
                              {s.formattedDate.split(' ')[0]} {s.formattedDate.split(' ')[1]}
                            </span>
                            <div className="flex items-center space-x-1 text-[10px]">
                              <span className={`px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                                bookedCount === deities.length 
                                  ? 'bg-[#FEE2E2] text-[#991B1B]' 
                                  : 'bg-[#DCFCE7] text-[#1E5E3A]'
                              }`}>
                                {deities.length - bookedCount} open
                              </span>
                              <span className={`px-1.5 py-0.5 rounded font-bold uppercase tracking-wider inline-flex items-center gap-0.5 ${
                                hasHost ? 'bg-[#F4F7F4] text-[#5D6B62]' : 'bg-[#DCFCE7] text-[#1E5E3A]'
                              }`}>
                                <span>{hasHost ? 'Host ✓' : 'Need Host'}</span>
                                {hasHost && hosting?.providesFood && <span>🍃</span>}
                                {hasHost && hosting?.providesDrinks && <span>☕</span>}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedMonth(monthIdx);
                      setViewMode('month');
                    }}
                    className="mt-4 pt-2 border-t border-[#E0E5DF] w-full text-center text-xs font-bold text-[#1E5E3A] hover:text-[#164E30] cursor-pointer"
                  >
                    Open Month View →
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
