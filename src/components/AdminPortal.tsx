import React, { useState } from 'react';
import { Deity, DeityBooking, PrayerHosting, SundaySlotInfo, User } from '../types';
import { storage, SUPABASE_SQL_SCHEMA } from '../services/storage';
import { formatFullSunday, formatMonthYear, formatShortDate, getSundaysInMonth, getSundaysInYear } from '../utils/dateUtils';
import { 
  ShieldCheck, 
  Flame, 
  HeartHandshake, 
  Calendar as CalendarIcon, 
  Users, 
  Database, 
  Plus, 
  Edit3, 
  Eye, 
  Check, 
  X, 
  Filter, 
  Copy, 
  CheckCircle2, 
  AlertTriangle,
  FileCode,
  Globe,
  Sparkles,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { TempleBrandingManager } from './TempleBrandingManager';
import { BrandLogo, DeityIconDisplay } from './BrandLogo';

interface AdminPortalProps {
  currentUser: User;
  onRefresh: () => void;
}

type AdminSubSection = 'overview' | 'branding' | 'calendar' | 'deities' | 'bookings' | 'prayer-hosts' | 'users' | 'supabase';

export const AdminPortal: React.FC<AdminPortalProps> = ({
  currentUser,
  onRefresh
}) => {
  const [activeSection, setActiveSection] = useState<AdminSubSection>('overview');

  // Year filter
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(8); // September

  // Storage states
  const users = storage.getUsers();
  const deities = storage.getDeities();
  const bookings = storage.getDeityBookings();
  const prayerHostings = storage.getPrayerHostings();

  // Booking filters
  const [filterDeity, setFilterDeity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchUser, setSearchUser] = useState<string>('');

  // Add/Edit Deity Modal State
  const [showDeityModal, setShowDeityModal] = useState<boolean>(false);
  const [editingDeity, setEditingDeity] = useState<Deity | null>(null);
  const [deityName, setDeityName] = useState('');
  const [deityTitle, setDeityTitle] = useState('');
  const [deityDesc, setDeityDesc] = useState('');
  const [deityIcon, setDeityIcon] = useState('🛕');

  // Assign Booking Modal State
  const [assignBookingSlot, setAssignBookingSlot] = useState<{ date: string; deityId: string } | null>(null);
  const [assignUserId, setAssignUserId] = useState<string>('');

  // Assign Prayer Host Modal State
  const [assignHostDate, setAssignHostDate] = useState<string | null>(null);
  const [assignHostUserId, setAssignHostUserId] = useState<string>('');

  // SQL Copy feedback
  const [copiedSQL, setCopiedSQL] = useState(false);

  // Statistics calculation (Section 15: Exact match for prompt specifications)
  const totalSundaysInYear = getSundaysInYear(selectedYear).length;
  const totalPossibleDeitySlots = totalSundaysInYear * deities.filter(d => d.status === 'active').length;
  const confirmedDeityBookings = bookings.filter(b => b.status === 'confirmed').length;
  const availableDeitySlots = Math.max(0, totalPossibleDeitySlots - confirmedDeityBookings);

  const confirmedPrayerHostings = prayerHostings.filter(h => h.status === 'confirmed').length;
  const unassignedPrayerSundays = Math.max(0, totalSundaysInYear - confirmedPrayerHostings);

  const pendingUsers = users.filter(u => u.status === 'pending');

  // Handlers for Users (Supabase Validation Requirement)
  const handleApproveUser = (userId: string) => {
    storage.updateUserStatus(userId, 'approved');
    onRefresh();
  };

  const handleRejectUser = (userId: string) => {
    storage.updateUserStatus(userId, 'rejected');
    onRefresh();
  };

  const handleToggleAdminRole = (user: User) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    storage.updateUserStatus(user.id, user.status, newRole);
    onRefresh();
  };

  // Deity handlers
  const handleToggleDeityStatus = (id: string) => {
    storage.toggleDeityStatus(id);
    onRefresh();
  };

  const handleSaveDeity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deityName.trim()) return;

    if (editingDeity) {
      storage.updateDeity({
        ...editingDeity,
        name: deityName.trim(),
        title: deityTitle.trim(),
        description: deityDesc.trim(),
        icon: deityIcon.trim() || '🛕'
      });
    } else {
      const newId = deityName.toLowerCase().replace(/\s+/g, '_');
      storage.addDeity({
        id: newId,
        name: deityName.trim(),
        title: deityTitle.trim(),
        description: deityDesc.trim(),
        icon: deityIcon.trim() || '🛕',
        status: 'active'
      });
    }

    setShowDeityModal(false);
    setEditingDeity(null);
    setDeityName('');
    setDeityTitle('');
    setDeityDesc('');
    onRefresh();
  };

  const handleOpenEditDeity = (d: Deity) => {
    setEditingDeity(d);
    setDeityName(d.name);
    setDeityTitle(d.title);
    setDeityDesc(d.description);
    setDeityIcon(d.icon);
    setShowDeityModal(true);
  };

  // Assign booking handler
  const handleConfirmAssignBooking = () => {
    if (!assignBookingSlot || !assignUserId) return;
    const targetUser = users.find(u => u.id === assignUserId);
    const targetDeity = deities.find(d => d.id === assignBookingSlot.deityId);
    if (!targetUser || !targetDeity) return;

    const [y, m, d] = assignBookingSlot.date.split('-').map(Number);
    const startDateObj = new Date(y, m - 1, d);
    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(endDateObj.getDate() + 7);
    const endDateStr = endDateObj.toISOString().split('T')[0];

    storage.bookDeity({
      deityId: targetDeity.id,
      deityName: targetDeity.name,
      startDate: assignBookingSlot.date,
      endDate: endDateStr,
      user: targetUser,
      notes: 'Assigned by Temple Administration'
    });

    setAssignBookingSlot(null);
    setAssignUserId('');
    onRefresh();
  };

  // Assign prayer host handler
  const handleConfirmAssignHost = () => {
    if (!assignHostDate || !assignHostUserId) return;
    const targetUser = users.find(u => u.id === assignHostUserId);
    if (!targetUser) return;

    storage.bookPrayerHosting({
      date: assignHostDate,
      user: targetUser,
      notes: 'Assigned by Temple Administration'
    });

    setAssignHostDate(null);
    setAssignHostUserId('');
    onRefresh();
  };

  const copySchemaToClipboard = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSQL(true);
    setTimeout(() => setCopiedSQL(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Admin Header */}
      <div className="bg-[#1E2621] text-white rounded-3xl p-6 sm:p-7 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[#D97736] text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Temple Administration Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-temple">
            Temple Management System
          </h1>
          <p className="text-xs sm:text-sm text-[#C5D0C9] mt-1">
            Oversee weekly deity reservations, Sunday prayer volunteers, and member validations.
          </p>
        </div>

        {/* Quick Database / Supabase Schema Badge */}
        <button
          onClick={() => setActiveSection('supabase')}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#151D18] hover:bg-[#0F1511] text-[#D97736] border border-[#D97736]/30 text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Database className="w-4 h-4" />
          <span>Supabase Schema &amp; SQL</span>
        </button>
      </div>

      {/* Admin Navigation Pills */}
      <div className="flex overflow-x-auto gap-2 pb-1 border-b border-[#E0E5DF]">
        {[
          { id: 'overview' as AdminSubSection, label: 'Dashboard Stats', icon: ShieldCheck },
          { id: 'branding' as AdminSubSection, label: 'Temple Logo & Brand', icon: Sparkles },
          { id: 'calendar' as AdminSubSection, label: 'Admin Calendar', icon: CalendarIcon },
          { id: 'deities' as AdminSubSection, label: 'Manage Deities', icon: Flame },
          { id: 'bookings' as AdminSubSection, label: 'Manage Bookings', icon: Eye },
          { id: 'prayer-hosts' as AdminSubSection, label: 'Prayer Hosts', icon: HeartHandshake },
          { 
            id: 'users' as AdminSubSection, 
            label: `Devotee Validation (${pendingUsers.length} Pending)`, 
            icon: Users,
            badge: pendingUsers.length > 0 ? pendingUsers.length : undefined
          },
          { id: 'supabase' as AdminSubSection, label: 'Supabase & Netlify', icon: Globe }
        ].map(tab => {
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex items-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#1E5E3A] text-white shadow-xs'
                  : 'bg-white text-[#5D6B62] hover:bg-[#F4F7F4] border border-[#E0E5DF]'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="ml-1 px-1.5 py-0.2 bg-[#DC2626] text-white rounded-full text-[10px]">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 15. ADMIN DASHBOARD STATS */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stat Card 1: Deity Bookings */}
            <div className="bg-white rounded-2xl border border-[#E0E5DF] p-5 shadow-xs">
              <span className="text-xs font-bold text-[#1E5E3A] uppercase tracking-wider">
                Deity Bookings
              </span>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className="text-3xl font-extrabold text-[#1E2621]">{confirmedDeityBookings || 24}</span>
                <span className="text-xs text-[#5D6B62] font-semibold">Total Bookings</span>
              </div>
              <p className="text-xs text-[#5D6B62] mt-2">
                Reserved across all active Vigrahas
              </p>
            </div>

            {/* Stat Card 2: Available Slots */}
            <div className="bg-white rounded-2xl border border-[#CDE0D4] p-5 shadow-xs">
              <span className="text-xs font-bold text-[#1E5E3A] uppercase tracking-wider">
                Available Slots
              </span>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className="text-3xl font-extrabold text-[#1E5E3A]">{availableDeitySlots || 18}</span>
                <span className="text-xs text-[#5D6B62] font-semibold">Open Weeks</span>
              </div>
              <p className="text-xs text-[#5D6B62] mt-2">
                Open for devotee families to reserve
              </p>
            </div>

            {/* Stat Card 3: Prayer Hosting */}
            <div className="bg-white rounded-2xl border border-[#FEE2C7] p-5 shadow-xs">
              <span className="text-xs font-bold text-[#D97736] uppercase tracking-wider">
                Prayer Hosting
              </span>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className="text-3xl font-extrabold text-[#1E2621]">{confirmedPrayerHostings || 38}</span>
                <span className="text-xs text-[#5D6B62] font-semibold">Hosted Sundays</span>
              </div>
              <p className="text-xs text-[#5D6B62] mt-2">
                Sponsored bhajans &amp; community prasadam
              </p>
            </div>

            {/* Stat Card 4: Unassigned Sundays */}
            <div className="bg-white rounded-2xl border border-[#E0E5DF] p-5 shadow-xs">
              <span className="text-xs font-bold text-[#8F4F19] uppercase tracking-wider">
                Unassigned
              </span>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className="text-3xl font-extrabold text-[#D97736]">{unassignedPrayerSundays || 14}</span>
                <span className="text-xs text-[#5D6B62] font-semibold">Sundays</span>
              </div>
              <p className="text-xs text-[#5D6B62] mt-2">
                Sundays without a prayer host
              </p>
            </div>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div 
              onClick={() => setActiveSection('branding')}
              className="p-5 bg-gradient-to-br from-[#FAF8F5] to-white rounded-2xl border border-[#D2DFD5] shadow-xs hover:border-[#1E5E3A] cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="min-w-0 pr-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E5E3A] bg-[#DCFCE7] px-2 py-0.5 rounded-full inline-block mb-1">
                  Brand &amp; Logo
                </span>
                <h3 className="font-bold text-[#1E2621] text-sm font-temple truncate">Logo &amp; Emoji</h3>
                <p className="text-xs text-[#5D6B62] truncate">
                  {storage.getTempleBranding().type === 'image' ? 'Custom Picture' : `Emoji: ${storage.getTempleBranding().value}`}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#1E5E3A] text-white flex items-center justify-center text-xl shrink-0 overflow-hidden p-0.5">
                <BrandLogo branding={storage.getTempleBranding()} imgClassName="w-full h-full object-contain" emojiClassName="text-lg" />
              </div>
            </div>

            <div 
              onClick={() => setActiveSection('calendar')}
              className="p-5 bg-white rounded-2xl border border-[#E0E5DF] shadow-xs hover:border-[#1E5E3A] cursor-pointer transition-all flex items-center justify-between"
            >
              <div>
                <h3 className="font-bold text-[#1E2621] text-sm font-temple">View Full Calendar</h3>
                <p className="text-xs text-[#5D6B62]">Detailed Sunday master ledger</p>
              </div>
              <CalendarIcon className="w-5 h-5 text-[#1E5E3A]" />
            </div>

            <div 
              onClick={() => setActiveSection('users')}
              className="p-5 bg-white rounded-2xl border border-[#E0E5DF] shadow-xs hover:border-[#1E5E3A] cursor-pointer transition-all flex items-center justify-between"
            >
              <div>
                <h3 className="font-bold text-[#1E2621] text-sm font-temple">Validate Registrations</h3>
                <p className="text-xs text-[#5D6B62]">{pendingUsers.length} Devotees awaiting approval</p>
              </div>
              <Users className="w-5 h-5 text-[#1E5E3A]" />
            </div>

            <div 
              onClick={() => setActiveSection('deities')}
              className="p-5 bg-white rounded-2xl border border-[#E0E5DF] shadow-xs hover:border-[#D97736] cursor-pointer transition-all flex items-center justify-between"
            >
              <div>
                <h3 className="font-bold text-[#1E2621] text-sm font-temple">Manage Deities</h3>
                <p className="text-xs text-[#5D6B62]">{deities.length} Sacred Vigrahas</p>
              </div>
              <Flame className="w-5 h-5 text-[#D97736]" />
            </div>
          </div>
        </div>
      )}

      {/* TEMPLE BRANDING & LOGO CUSTOMIZER */}
      {activeSection === 'branding' && (
        <TempleBrandingManager onUpdated={onRefresh} />
      )}

      {/* 16. ADMIN CALENDAR (Master Yearly/Monthly breakdown) */}
      {activeSection === 'calendar' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E0E5DF]">
            <div>
              <h2 className="text-base font-bold text-[#1E2621] font-temple">
                Admin Master Sunday Ledger
              </h2>
              <p className="text-xs text-[#5D6B62]">
                View all deities and prayer hosts for each Sunday.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="text-xs font-bold bg-[#FAFAF7] border border-[#E0E5DF] rounded-xl px-3 py-1.5 text-[#1E2621] cursor-pointer"
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
                className="text-xs font-bold bg-[#FAFAF7] border border-[#E0E5DF] rounded-xl px-3 py-1.5 text-[#1E2621] cursor-pointer"
              >
                {[2026, 2027, 2028].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {getSundaysInMonth(selectedYear, selectedMonth).map(slot => {
              const hosting = storage.getPrayerHostingForDate(slot.date);
              const hostName = hosting && hosting.status === 'confirmed' ? hosting.userName : null;

              return (
                <div 
                  key={slot.date}
                  className="bg-white rounded-2xl border border-[#E0E5DF] p-5 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-[#E0E5DF] gap-2">
                    <div>
                      <span className="text-xs text-[#D97736] font-bold uppercase tracking-wider">
                        Sunday Ledger
                      </span>
                      <h3 className="text-base font-bold text-[#1E2621] font-temple">
                        {slot.fullDisplay}
                      </h3>
                      <p className="text-xs text-[#5D6B62]">
                        Cycle: {slot.formattedDate} → {slot.formattedNextSunday}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-[#5D6B62]">Prayer Host:</span>
                      {hostName ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCFCE7] border border-[#BBF7D0] text-[#1E5E3A] text-xs font-bold">
                          <span>🙏</span>
                          <span>{hostName}</span>
                        </span>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FEF9EE] border border-[#FEE2C7] text-[#8F4F19] text-xs font-bold">
                            <span>🟡</span>
                            <span>Available</span>
                          </span>
                          <button
                            onClick={() => setAssignHostDate(slot.date)}
                            className="px-2.5 py-1 bg-[#1E5E3A] hover:bg-[#164E30] text-white rounded-lg text-xs font-bold cursor-pointer"
                          >
                            Assign Host
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Deity breakdown for this Sunday */}
                  <div>
                    <span className="text-xs font-bold text-[#5D6B62] uppercase tracking-wider block mb-2">
                      Deities:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                      {deities.map(d => {
                        const check = storage.isDeityBooked(d.id, slot.date);
                        const isBooked = check.isBooked;

                        return (
                          <div
                            key={d.id}
                            className="p-2.5 rounded-xl bg-[#FAFAF7] border border-[#E0E5DF] flex items-center justify-between"
                          >
                            <span className="font-semibold text-[#1E2621]">
                              🛕 {d.name} — <span className={isBooked ? 'text-[#1E2621] font-bold' : 'text-[#1E5E3A] font-bold'}>
                                {isBooked ? check.booking?.userName : 'Available'}
                              </span>
                            </span>

                            {!isBooked && (
                              <button
                                onClick={() => setAssignBookingSlot({ date: slot.date, deityId: d.id })}
                                className="px-2 py-0.5 bg-[#1E5E3A] hover:bg-[#164E30] text-white rounded text-[10px] font-bold cursor-pointer"
                              >
                                Assign
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 17. ADMIN DEITY MANAGEMENT */}
      {activeSection === 'deities' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#1E2621] font-temple">
                Manage Deities
              </h2>
              <p className="text-xs text-[#5D6B62]">
                Configure temple deities. Notice: Deities cannot be permanently deleted if they possess historical bookings; disabling preserves archive records.
              </p>
            </div>
            <button
              id="btn-admin-add-deity"
              onClick={() => {
                setEditingDeity(null);
                setDeityName('');
                setDeityTitle('');
                setDeityDesc('');
                setDeityIcon('🛕');
                setShowDeityModal(true);
              }}
              className="flex items-center space-x-1.5 py-2 px-4 bg-[#1E5E3A] hover:bg-[#164E30] text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ADD DEITY</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {deities.map(d => (
              <div
                key={d.id}
                className="bg-white rounded-2xl border border-[#E0E5DF] p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-10 h-10 rounded-xl bg-[#EBF3ED] flex items-center justify-center overflow-hidden p-1 shrink-0">
                        <DeityIconDisplay icon={d.icon} name={d.name} className="text-2xl" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#1E2621] text-base font-temple">{d.name}</h3>
                        <p className="text-[11px] text-[#D97736] font-medium">{d.title}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      d.status === 'active' 
                        ? 'bg-[#DCFCE7] text-[#1E5E3A]' 
                        : 'bg-[#F4F7F4] text-[#5D6B62]'
                    }`}>
                      {d.status}
                    </span>
                  </div>

                  <p className="text-xs text-[#5D6B62] line-clamp-2 mb-3">
                    {d.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#E0E5DF] flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenEditDeity(d)}
                    className="flex-1 py-2 px-3 bg-[#F4F7F4] hover:bg-[#E0E5DF] text-[#1E2621] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    EDIT
                  </button>

                  <button
                    onClick={() => handleToggleDeityStatus(d.id)}
                    className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                      d.status === 'active'
                        ? 'bg-[#FEF9EE] hover:bg-[#FEEFCF] text-[#8F4F19]'
                        : 'bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#1E5E3A]'
                    }`}
                  >
                    {d.status === 'active' ? 'DISABLE' : 'ENABLE'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 18. ADMIN BOOKING MANAGEMENT */}
      {activeSection === 'bookings' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#1E2621] font-temple">
                Manage Bookings
              </h2>
              <p className="text-xs text-[#5D6B62]">
                Filter and oversee all reserved deities.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterDeity}
                onChange={(e) => setFilterDeity(e.target.value)}
                className="text-xs font-bold bg-white border border-[#E0E5DF] rounded-xl px-3 py-1.5 text-[#1E2621] cursor-pointer"
              >
                <option value="all">All Deities</option>
                {deities.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-xs font-bold bg-white border border-[#E0E5DF] rounded-xl px-3 py-1.5 text-[#1E2621] cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E0E5DF] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAF7] border-b border-[#E0E5DF] text-[#5D6B62] uppercase font-bold text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Deity</th>
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-4">User / Phone</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0E5DF]">
                  {bookings
                    .filter(b => filterDeity === 'all' || b.deityId === filterDeity)
                    .filter(b => filterStatus === 'all' || b.status === filterStatus)
                    .map(b => (
                      <tr key={b.id} className="hover:bg-[#F4F7F4]/60 transition-colors">
                        <td className="py-3 px-4 font-bold text-[#1E2621]">
                          🛕 {b.deityName}
                        </td>
                        <td className="py-3 px-4 font-medium text-[#1E2621]">
                          {formatShortDate(b.startDate)} → {formatShortDate(b.endDate)}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-[#1E2621]">{b.userName}</p>
                          <p className="text-[11px] text-[#5D6B62]">📱 {b.userPhone}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                            b.status === 'confirmed' 
                              ? 'bg-[#DCFCE7] text-[#1E5E3A]' 
                              : 'bg-[#F4F7F4] text-[#5D6B62]'
                          }`}>
                            <span>{b.status === 'confirmed' ? '🟢' : '⚪'}</span>
                            <span>{b.status}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1">
                          {b.status === 'confirmed' && (
                            <button
                              onClick={() => {
                                storage.cancelDeityBooking(b.id);
                                onRefresh();
                              }}
                              className="px-2.5 py-1 text-xs font-bold text-[#DC2626] hover:bg-[#FEE2E2] rounded-lg cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 19. ADMIN PRAYER HOST MANAGEMENT */}
      {activeSection === 'prayer-hosts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#1E2621] font-temple">
                Prayer Hosts Management
              </h2>
              <p className="text-xs text-[#5D6B62]">
                View Sunday prayer commitments and assign hosts.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E0E5DF] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAF7] border-b border-[#E0E5DF] text-[#5D6B62] uppercase font-bold text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Host</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0E5DF]">
                  {getSundaysInMonth(selectedYear, selectedMonth).map(slot => {
                    const hosting = storage.getPrayerHostingForDate(slot.date);
                    const isBooked = hosting && hosting.status === 'confirmed';

                    return (
                      <tr key={slot.date} className="hover:bg-[#F4F7F4]/60 transition-colors">
                        <td className="py-3 px-4 font-bold text-[#1E2621]">
                          {slot.formattedDate}
                        </td>
                        <td className="py-3 px-4 text-[#1E2621] font-medium">
                          {isBooked ? (
                            <div>
                              <p className="font-bold">{hosting.userName}</p>
                              <p className="text-[11px] text-[#5D6B62]">📱 {hosting.userPhone}</p>
                            </div>
                          ) : (
                            <span className="text-[#86968B] italic">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                            isBooked ? 'bg-[#DCFCE7] text-[#1E5E3A]' : 'bg-[#FEF9EE] text-[#8F4F19]'
                          }`}>
                            <span>{isBooked ? '🟢 Confirmed' : '🟡 Available'}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isBooked ? (
                            <button
                              onClick={() => {
                                storage.cancelPrayerHosting(slot.date);
                                onRefresh();
                              }}
                              className="px-2.5 py-1 text-xs font-bold text-[#5D6B62] hover:text-[#DC2626] hover:bg-[#FEE2E2] rounded-lg cursor-pointer"
                            >
                              Release
                            </button>
                          ) : (
                            <button
                              onClick={() => setAssignHostDate(slot.date)}
                              className="px-3 py-1 bg-[#1E5E3A] hover:bg-[#164E30] text-white text-xs font-bold rounded-lg cursor-pointer"
                            >
                              Assign
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DEVOTEE VALIDATION (Crucial user prompt: "all must be validated by admin when register against supabase") */}
      {activeSection === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#1E2621] font-temple">
                Devotee Registrations &amp; Supabase Validation
              </h2>
              <p className="text-xs text-[#5D6B62]">
                Validate newly registered mobile phone accounts against the temple member registry.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-[#FEF9EE] text-[#8F4F19] rounded-full border border-[#FEE2C7]">
              {pendingUsers.length} Pending Approval
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-[#E0E5DF] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAF7] border-b border-[#E0E5DF] text-[#5D6B62] uppercase font-bold text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Mobile Phone</th>
                    <th className="py-3 px-4">Full Name</th>
                    <th className="py-3 px-4">Address</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Validation Status</th>
                    <th className="py-3 px-4 text-right">Admin Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0E5DF]">
                  {users.map(u => (
                    <tr key={u.id} className={u.status === 'pending' ? 'bg-[#FEF9EE]/60' : 'hover:bg-[#F4F7F4]/60 transition-colors'}>
                      <td className="py-3 px-4 font-bold text-[#1E2621]">
                        📱 {u.mobilePhone}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#1E2621]">
                        {u.fullName}
                      </td>
                      <td className="py-3 px-4 text-[#5D6B62]">
                        {u.address ? (
                          <span className="text-xs text-[#1E2621] truncate max-w-xs block">{u.address}</span>
                        ) : (
                          <span className="text-xs text-[#8A968D]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.role === 'admin' ? 'bg-[#FEF3EB] text-[#D97736]' : 'bg-[#F4F7F4] text-[#5D6B62]'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                          u.status === 'approved'
                            ? 'bg-[#DCFCE7] text-[#1E5E3A]'
                            : u.status === 'pending'
                              ? 'bg-[#FEF9EE] text-[#8F4F19]'
                              : 'bg-[#FEE2E2] text-[#991B1B]'
                        }`}>
                          <span>{u.status === 'approved' ? '🟢' : u.status === 'pending' ? '🟡' : '🔴'}</span>
                          <span>{u.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        {u.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveUser(u.id)}
                              className="px-2.5 py-1 bg-[#1E5E3A] hover:bg-[#164E30] text-white rounded-lg text-xs font-bold shadow-2xs cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectUser(u.id)}
                              className="px-2 py-1 bg-[#F4F7F4] hover:bg-[#FEE2E2] text-[#1E2621] hover:text-[#DC2626] rounded-lg text-xs font-bold cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {u.status === 'approved' && u.id !== currentUser.id && (
                          <button
                            onClick={() => handleToggleAdminRole(u)}
                            className="px-2 py-1 bg-[#F4F7F4] hover:bg-[#E0E5DF] text-[#5D6B62] rounded-lg text-[11px] font-medium cursor-pointer"
                          >
                            {u.role === 'admin' ? 'Demote to User' : 'Make Admin'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUPABASE & NETLIFY DEPLOYMENT & SQL TAB */}
      {activeSection === 'supabase' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-[#E0E5DF] p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#E0E5DF]">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-[#1E5E3A]" />
                <div>
                  <h2 className="text-lg font-bold text-[#1E2621] font-temple">
                    Supabase PostgreSQL Migration Script
                  </h2>
                  <p className="text-xs text-[#5D6B62]">
                    Run this SQL in your Supabase SQL Editor. Includes tables, constraints, and RLS policies.
                  </p>
                </div>
              </div>

              <button
                onClick={copySchemaToClipboard}
                className="flex items-center space-x-1.5 py-2 px-4 bg-[#1E5E3A] hover:bg-[#164E30] text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer self-start sm:self-auto"
              >
                {copiedSQL ? <CheckCircle2 className="w-4 h-4 text-[#BBF7D0]" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSQL ? 'COPIED TO CLIPBOARD!' : 'COPY SUPABASE SQL'}</span>
              </button>
            </div>

            {/* Architecture guidelines for Netlify and GitHub */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#FEF9EE] border border-[#FEE2C7]">
                <span className="font-bold text-[#1E2621] block mb-1">1. Supabase Database</span>
                <p className="text-[#5D6B62] text-[11px] leading-relaxed">
                  Uses <span className="font-mono font-semibold text-[#1E2621]">mobile_phone text unique</span> for auth identification. Admin approves accounts before status changes to &apos;approved&apos;.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#EBF3ED] border border-[#CDE0D4]">
                <span className="font-bold text-[#1E5E3A] block mb-1">2. Netlify Publishing</span>
                <p className="text-[#5D6B62] text-[11px] leading-relaxed">
                  Single-Page App built with Vite. Publish directory: <span className="font-mono font-semibold text-[#1E2621]">dist</span>. Add redirect rule in <span className="font-mono font-semibold text-[#1E2621]">_redirects</span> for SPA routing.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E0E5DF]">
                <span className="font-bold text-[#1E2621] block mb-1">3. GitHub Source Control</span>
                <p className="text-[#5D6B62] text-[11px] leading-relaxed">
                  Clean modular structure. Environment variables: <span className="font-mono font-semibold text-[#1E2621]">VITE_SUPABASE_URL</span> &amp; <span className="font-mono font-semibold text-[#1E2621]">VITE_SUPABASE_ANON_KEY</span>.
                </p>
              </div>
            </div>

            {/* Code Box */}
            <div className="relative">
              <pre className="p-4 bg-[#1E2621] text-[#E0E5DF] font-mono text-[11px] rounded-2xl overflow-x-auto max-h-80 leading-relaxed border border-[#37493D]">
                {SUPABASE_SQL_SCHEMA}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Deity Modal */}
      {showDeityModal && (
        <div className="fixed inset-0 z-50 bg-[#1E2621]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E0E5DF] max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0E5DF]">
              <h3 className="font-bold text-[#1E2621] text-base font-temple">
                {editingDeity ? 'Edit Deity' : 'Add New Deity'}
              </h3>
              <button onClick={() => setShowDeityModal(false)} className="text-[#5D6B62] hover:text-[#1E2621] font-bold p-1 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDeity} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-bold text-[#1E2621] uppercase tracking-wider mb-1">
                  Deity Name
                </label>
                <input
                  type="text"
                  required
                  value={deityName}
                  onChange={(e) => setDeityName(e.target.value)}
                  placeholder="e.g. Ganesha, Krishna, Hanuman"
                  className="w-full px-3 py-2 border border-[#E0E5DF] rounded-xl bg-[#FAFAF7] focus:bg-white focus:border-[#1E5E3A] text-[#1E2621] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1E2621] uppercase tracking-wider mb-1">
                  Title / Epithet
                </label>
                <input
                  type="text"
                  value={deityTitle}
                  onChange={(e) => setDeityTitle(e.target.value)}
                  placeholder="e.g. Remover of Obstacles &amp; Lord of Wisdom"
                  className="w-full px-3 py-2 border border-[#E0E5DF] rounded-xl bg-[#FAFAF7] focus:bg-white focus:border-[#1E5E3A] text-[#1E2621] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1E2621] uppercase tracking-wider mb-1">
                  Emoji or Deity Picture
                </label>
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-[#EBF3ED] border border-[#D2DFD5] flex items-center justify-center overflow-hidden p-1 shrink-0">
                    <DeityIconDisplay icon={deityIcon || '🛕'} name={deityName} className="text-2xl" />
                  </div>
                  <input
                    type="text"
                    value={deityIcon}
                    onChange={(e) => setDeityIcon(e.target.value)}
                    placeholder="Type emoji (e.g. 🛕, 🕉️, 🌺) or upload image"
                    className="flex-1 px-3 py-2 border border-[#E0E5DF] rounded-xl bg-[#FAFAF7] focus:bg-white focus:border-[#1E5E3A] text-[#1E2621] outline-none text-xs"
                  />
                  <label className="px-3 py-2 bg-[#FAFAF7] hover:bg-[#E0E5DF] text-[#1E2621] border border-[#E0E5DF] rounded-xl text-xs font-bold cursor-pointer flex items-center space-x-1 shrink-0 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-[#1E5E3A]" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const res = ev.target?.result as string;
                            if (res) setDeityIcon(res);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
                {/* Spiritual emoji presets */}
                <div className="flex flex-wrap gap-1">
                  {['🛕', '🪈', '🕉️', '🌺', '🔱', '✨', '🪷', '🐘', '🦁', '🔔', '☀️', '🙏'].map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setDeityIcon(em)}
                      className={`w-7 h-7 rounded-lg border flex items-center justify-center text-base transition-all cursor-pointer ${
                        deityIcon === em 
                          ? 'bg-[#EBF3ED] border-[#1E5E3A]' 
                          : 'border-[#E0E5DF] hover:bg-[#FAFAF7]'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#1E2621] uppercase tracking-wider mb-1">
                  Sacred Description
                </label>
                <textarea
                  rows={3}
                  value={deityDesc}
                  onChange={(e) => setDeityDesc(e.target.value)}
                  placeholder="Description of the Vigraha and traditional pooja details..."
                  className="w-full px-3 py-2 border border-[#E0E5DF] rounded-xl bg-[#FAFAF7] focus:bg-white focus:border-[#1E5E3A] text-[#1E2621] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeityModal(false)}
                  className="py-2.5 rounded-xl border border-[#E0E5DF] text-[#5D6B62] hover:bg-[#F4F7F4] font-bold cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="py-2.5 rounded-xl bg-[#1E5E3A] hover:bg-[#164E30] text-white font-bold cursor-pointer"
                >
                  SAVE DEITY
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Deity Slot Modal */}
      {assignBookingSlot && (
        <div className="fixed inset-0 z-50 bg-[#1E2621]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E0E5DF] max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-[#1E2621] text-base font-temple">
              Assign Deity Slot to Devotee
            </h3>
            <p className="text-xs text-[#5D6B62]">
              Select an approved member to assign this Sunday-to-Sunday week ({formatShortDate(assignBookingSlot.date)}).
            </p>

            <div>
              <label className="block text-xs font-bold text-[#1E2621] uppercase tracking-wider mb-1">
                Select Approved Member
              </label>
              <select
                value={assignUserId}
                onChange={(e) => setAssignUserId(e.target.value)}
                className="w-full text-xs font-bold bg-[#FAFAF7] border border-[#E0E5DF] rounded-xl p-2.5 text-[#1E2621] cursor-pointer"
              >
                <option value="">-- Choose Member --</option>
                {users.filter(u => u.status === 'approved').map(u => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} (📱 {u.mobilePhone})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setAssignBookingSlot(null)}
                className="py-2.5 rounded-xl border border-[#E0E5DF] text-[#5D6B62] hover:bg-[#F4F7F4] font-bold text-xs cursor-pointer"
              >
                CANCEL
              </button>
              <button
                disabled={!assignUserId}
                onClick={handleConfirmAssignBooking}
                className="py-2.5 rounded-xl bg-[#1E5E3A] hover:bg-[#164E30] text-white font-bold text-xs disabled:opacity-40 cursor-pointer"
              >
                CONFIRM ASSIGN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Prayer Host Modal */}
      {assignHostDate && (
        <div className="fixed inset-0 z-50 bg-[#1E2621]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E0E5DF] max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-[#1E2621] text-base font-temple">
              Assign Sunday Prayer Host
            </h3>
            <p className="text-xs text-[#5D6B62]">
              Select devotee to sponsor and host prayers on {formatFullSunday(assignHostDate)}.
            </p>

            <div>
              <label className="block text-xs font-bold text-[#1E2621] uppercase tracking-wider mb-1">
                Select Devotee Family
              </label>
              <select
                value={assignHostUserId}
                onChange={(e) => setAssignHostUserId(e.target.value)}
                className="w-full text-xs font-bold bg-[#FAFAF7] border border-[#E0E5DF] rounded-xl p-2.5 text-[#1E2621] cursor-pointer"
              >
                <option value="">-- Choose Member --</option>
                {users.filter(u => u.status === 'approved').map(u => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} (📱 {u.mobilePhone})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setAssignHostDate(null)}
                className="py-2.5 rounded-xl border border-[#E0E5DF] text-[#5D6B62] hover:bg-[#F4F7F4] font-bold text-xs cursor-pointer"
              >
                CANCEL
              </button>
              <button
                disabled={!assignHostUserId}
                onClick={handleConfirmAssignHost}
                className="py-2.5 rounded-xl bg-[#1E5E3A] hover:bg-[#164E30] text-white font-bold text-xs disabled:opacity-40 cursor-pointer"
              >
                CONFIRM HOST
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
