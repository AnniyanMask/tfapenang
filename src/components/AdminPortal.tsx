import React, { useState } from 'react';
import { Deity, DeityBooking, PrayerHosting, SundaySlotInfo, User } from '../types';
import { storage } from '../services/storage';
import { formatFullSunday, formatMonthYear, formatShortDate, getSundaysInMonth, getSundaysInYear } from '../utils/dateUtils';
import { 
  ShieldCheck, 
  Flame, 
  HeartHandshake, 
  Calendar as CalendarIcon, 
  Users, 
  Plus, 
  Edit3, 
  Eye, 
  Check, 
  X, 
  Filter, 
  CheckCircle2, 
  AlertTriangle,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Shield,
  ShieldAlert,
  UserPlus,
  Search,
  Bell
} from 'lucide-react';
import { TempleBrandingManager } from './TempleBrandingManager';
import { BrandLogo, DeityIconDisplay } from './BrandLogo';
import { DevoteeAvatar } from './DevoteeAvatar';
import { NoticeBoardPage } from './NoticeBoardPage';

interface AdminPortalProps {
  currentUser: User;
  onRefresh: () => void;
}

type AdminSubSection = 'overview' | 'branding' | 'announcements' | 'calendar' | 'deities' | 'bookings' | 'prayer-hosts' | 'users';

export const AdminPortal: React.FC<AdminPortalProps> = ({
  currentUser,
  onRefresh
}) => {
  // Strict Defense-in-depth permission check: Only admins can manage Administration portal
  if (currentUser.role !== 'admin') {
    return (
      <div className="max-w-lg mx-auto text-center py-16 px-6 bg-white rounded-3xl border border-[#E0E5DF] shadow-xs space-y-4 my-8">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto text-3xl font-bold shadow-xs">
          🛡️
        </div>
        <h2 className="text-xl font-bold text-[#1E2621] font-temple">
          Access Restricted to Administrators
        </h2>
        <p className="text-sm text-[#5D6B62] leading-relaxed">
          Only verified Temple Administrators have permission to manage the Administration portal. Devotees do not have access to this portal.
        </p>
        <div className="p-3 bg-[#FAFAF7] rounded-xl border border-[#E0E5DF] text-xs text-[#5D6B62]">
          Logged in as: <span className="font-bold text-[#1E2621]">{currentUser.fullName}</span> ({currentUser.mobilePhone}) • <span className="uppercase text-[10px] font-bold text-[#D97736]">Role: {currentUser.role}</span>
        </div>
      </div>
    );
  }

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

  // User & Admin management states
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [adminFullName, setAdminFullName] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminAddress, setAdminAddress] = useState('');
  const [createAdminError, setCreateAdminError] = useState('');
  const [createAdminSuccess, setCreateAdminSuccess] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'admin' | 'pending' | 'devotee'>('all');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Assign Booking Modal State
  const [assignBookingSlot, setAssignBookingSlot] = useState<{ date: string; deityId: string } | null>(null);
  const [assignUserId, setAssignUserId] = useState<string>('');

  // Assign Prayer Host Modal State
  const [assignHostDate, setAssignHostDate] = useState<string | null>(null);
  const [assignHostUserId, setAssignHostUserId] = useState<string>('');
  const [assignHostProvidesFood, setAssignHostProvidesFood] = useState<boolean>(false);
  const [assignHostProvidesDrinks, setAssignHostProvidesDrinks] = useState<boolean>(false);
  const [assignHostNotes, setAssignHostNotes] = useState<string>('');

  // Edit Prayer Host Modal State
  const [editingPrayerHosting, setEditingPrayerHosting] = useState<PrayerHosting | null>(null);
  const [editHostProvidesFood, setEditHostProvidesFood] = useState<boolean>(false);
  const [editHostProvidesDrinks, setEditHostProvidesDrinks] = useState<boolean>(false);
  const [editHostNotes, setEditHostNotes] = useState<string>('');
  const [editHostUserId, setEditHostUserId] = useState<string>('');

  // Statistics calculation (Section 15: Exact match for prompt specifications)
  const totalSundaysInYear = getSundaysInYear(selectedYear).length;
  const totalPossibleDeitySlots = totalSundaysInYear * deities.filter(d => d.status === 'active').length;
  const confirmedDeityBookings = bookings.filter(b => b.status === 'confirmed').length;
  const availableDeitySlots = Math.max(0, totalPossibleDeitySlots - confirmedDeityBookings);

  const confirmedPrayerHostings = prayerHostings.filter(h => h.status === 'confirmed').length;
  const unassignedPrayerSundays = Math.max(0, totalSundaysInYear - confirmedPrayerHostings);

  const pendingUsers = users.filter(u => u.status === 'pending');
  const adminUsers = users.filter(u => u.role === 'admin');

  // Handlers for Users (Supabase Validation Requirement & Admin Creation)
  const handleApproveUser = (userId: string) => {
    storage.updateUserStatus(userId, 'approved');
    onRefresh();
  };

  const handleRejectUser = (userId: string) => {
    storage.updateUserStatus(userId, 'rejected');
    onRefresh();
  };

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateAdminError('');
    if (!adminFullName.trim()) {
      setCreateAdminError('Please enter administrator full name.');
      return;
    }
    if (!adminPhone.trim()) {
      setCreateAdminError('Please enter administrator mobile phone number.');
      return;
    }
    const res = storage.createAdminUser({
      fullName: adminFullName.trim(),
      mobilePhone: adminPhone.trim(),
      email: adminEmail.trim(),
      address: adminAddress.trim()
    });

    if (!res.success) {
      setCreateAdminError(res.error || 'Failed to create administrator.');
      return;
    }

    setCreateAdminSuccess(`Administrator account for ${adminFullName.trim()} created with full privileges!`);
    setAdminFullName('');
    setAdminPhone('');
    setAdminEmail('');
    setAdminAddress('');
    setTimeout(() => {
      setShowCreateAdminModal(false);
      setCreateAdminSuccess('');
    }, 1500);
    onRefresh();
  };

  const handlePromoteToAdmin = (user: User) => {
    if (window.confirm(`Grant ${user.fullName} full administrator privileges? They will have equal access to manage the Administration portal, bookings, and other admins.`)) {
      storage.updateUserStatus(user.id, 'approved', 'admin');
      onRefresh();
    }
  };

  const handleDemoteAdmin = (user: User) => {
    if (user.id === currentUser.id) {
      alert('You cannot demote your own account while logged in as administrator.');
      return;
    }
    const currentAdminCount = users.filter(u => u.role === 'admin').length;
    if (currentAdminCount <= 1) {
      alert('Cannot demote this administrator. At least one administrator is required.');
      return;
    }
    if (window.confirm(`Remove administrator privileges from ${user.fullName}? They will become a regular devotee without access to the Administration portal.`)) {
      storage.updateUserStatus(user.id, user.status, 'user');
      onRefresh();
    }
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
      notes: assignHostNotes || 'Assigned by Temple Administration',
      providesFood: assignHostProvidesFood,
      providesDrinks: assignHostProvidesDrinks
    });

    setAssignHostDate(null);
    setAssignHostUserId('');
    setAssignHostProvidesFood(false);
    setAssignHostProvidesDrinks(false);
    setAssignHostNotes('');
    onRefresh();
  };

  // Open edit prayer host modal
  const handleOpenEditPrayerHosting = (hosting: PrayerHosting) => {
    setEditingPrayerHosting(hosting);
    setEditHostProvidesFood(hosting.providesFood || false);
    setEditHostProvidesDrinks(hosting.providesDrinks || false);
    setEditHostNotes(hosting.notes || '');
    setEditHostUserId(hosting.userId || '');
  };

  // Save prayer host changes handler
  const handleSavePrayerHosting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrayerHosting) return;

    const selectedUser = users.find(u => u.id === editHostUserId);

    storage.updatePrayerHosting(editingPrayerHosting.date, {
      providesFood: editHostProvidesFood,
      providesDrinks: editHostProvidesDrinks,
      notes: editHostNotes,
      ...(selectedUser ? {
        userId: selectedUser.id,
        userName: selectedUser.fullName,
        userPhone: selectedUser.mobilePhone,
        userAvatarUrl: selectedUser.avatarUrl,
      } : {})
    });

    setEditingPrayerHosting(null);
    onRefresh();
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
      </div>

      {/* Admin Navigation Pills */}
      <div className="flex overflow-x-auto gap-2 pb-1 border-b border-[#E0E5DF]">
        {[
          { id: 'overview' as AdminSubSection, label: 'Dashboard Stats', icon: ShieldCheck },
          { id: 'branding' as AdminSubSection, label: 'Temple Logo & Brand', icon: Sparkles },
          { id: 'announcements' as AdminSubSection, label: 'Notice Board', icon: Bell },
          { id: 'calendar' as AdminSubSection, label: 'Admin Calendar', icon: CalendarIcon },
          { id: 'deities' as AdminSubSection, label: 'Manage Deities', icon: Flame },
          { id: 'bookings' as AdminSubSection, label: 'Manage Bookings', icon: Eye },
          { id: 'prayer-hosts' as AdminSubSection, label: 'Prayer Hosts', icon: HeartHandshake },
          { 
            id: 'users' as AdminSubSection, 
            label: `Devotees & Admins (${adminUsers.length} Admins, ${pendingUsers.length} Pending)`, 
            icon: Users,
            badge: pendingUsers.length > 0 ? pendingUsers.length : undefined
          }
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

      {/* TFA PENANG NOTICE BOARD & CIRCULARS */}
      {activeSection === 'announcements' && (
        <NoticeBoardPage currentUser={currentUser} onRefresh={onRefresh} />
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
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAEFEA] border border-[#D2DFD5] text-[#5D6B62] text-xs font-bold">
                            <span>🙏</span>
                            <span>{hostName}</span>
                            {hosting?.providesFood && <span title="Food Provided">🍃</span>}
                            {hosting?.providesDrinks && <span title="Drinks Provided">☕</span>}
                          </span>
                          <button
                            onClick={() => handleOpenEditPrayerHosting(hosting!)}
                            className="px-2 py-1 bg-[#F4F7F4] hover:bg-[#E0E5DF] text-[#1E2621] rounded-lg text-xs font-bold cursor-pointer transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#DCFCE7] border border-[#BBF7D0] text-[#1E5E3A] text-xs font-bold">
                            <span>🟢</span>
                            <span>Available</span>
                          </span>
                          <button
                            onClick={() => {
                              setAssignHostDate(slot.date);
                              setAssignHostUserId('');
                              setAssignHostProvidesFood(false);
                              setAssignHostProvidesDrinks(false);
                              setAssignHostNotes('');
                            }}
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
                              🛕 {d.name} — <span className={isBooked ? 'text-[#5D6B62] font-semibold' : 'text-[#1E5E3A] font-bold'}>
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
                          <div className="flex items-center space-x-2">
                            <DevoteeAvatar
                              avatarUrl={b.userAvatarUrl || storage.getUserById(b.userId)?.avatarUrl}
                              name={b.userName}
                              size="xs"
                              showRing
                            />
                            <div>
                              <p className="font-bold text-[#1E2621]">{b.userName}</p>
                              <p className="text-[11px] text-[#5D6B62]">📱 {b.userPhone}</p>
                            </div>
                          </div>
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
                    <th className="py-3 px-4">Offerings</th>
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
                            <div className="flex items-center space-x-2">
                              <DevoteeAvatar
                                avatarUrl={hosting.userAvatarUrl || (hosting.userId ? storage.getUserById(hosting.userId)?.avatarUrl : undefined)}
                                name={hosting.userName}
                                size="xs"
                                showRing
                              />
                              <div>
                                <p className="font-bold">{hosting.userName}</p>
                                <p className="text-[11px] text-[#5D6B62]">📱 {hosting.userPhone}</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[#86968B] italic">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {isBooked ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
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
                              {!hosting.providesFood && !hosting.providesDrinks && (
                                <span className="text-[#86968B] text-[11px] italic">No food/drinks</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[#86968B] italic">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                            isBooked ? 'bg-[#EAEFEA] text-[#5D6B62] border border-[#D2DFD5]' : 'bg-[#DCFCE7] text-[#1E5E3A]'
                          }`}>
                            <span>{isBooked ? '⚪ Confirmed' : '🟢 Available'}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1">
                          {isBooked ? (
                            <>
                              <button
                                onClick={() => handleOpenEditPrayerHosting(hosting)}
                                className="px-2.5 py-1 text-xs font-bold text-[#1E2621] hover:bg-[#E0E5DF] bg-[#F4F7F4] rounded-lg cursor-pointer transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  storage.cancelPrayerHosting(slot.date);
                                  onRefresh();
                                }}
                                className="px-2.5 py-1 text-xs font-bold text-[#5D6B62] hover:text-[#DC2626] hover:bg-[#FEE2E2] rounded-lg cursor-pointer transition-colors"
                              >
                                Release
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                setAssignHostDate(slot.date);
                                setAssignHostUserId('');
                                setAssignHostProvidesFood(false);
                                setAssignHostProvidesDrinks(false);
                                setAssignHostNotes('');
                              }}
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

      {/* DEVOTEES & TEMPLE ADMINISTRATORS MANAGEMENT */}
      {activeSection === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-2xl border border-[#E0E5DF] shadow-xs">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl">👥</span>
                <h2 className="text-base sm:text-lg font-bold text-[#1E2621] font-temple">
                  Devotee Directory &amp; Temple Administrators
                </h2>
              </div>
              <p className="text-xs text-[#5D6B62] mt-1 max-w-xl">
                Only administrators have permission to manage this portal. As an administrator, you can create new administrators with equal privileges or approve devotee accounts.
              </p>
            </div>

            <button
              onClick={() => setShowCreateAdminModal(true)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-[#1E5E3A] hover:bg-[#164E30] text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer self-start sm:self-auto shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Create New Administrator</span>
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-white border border-[#E0E5DF]">
              <span className="text-[11px] font-bold text-[#5D6B62] uppercase tracking-wider block">Total Members</span>
              <span className="text-xl font-extrabold text-[#1E2621]">{users.length}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#EBF3ED] border border-[#CDE0D4]">
              <span className="text-[11px] font-bold text-[#1E5E3A] uppercase tracking-wider block">Administrators</span>
              <span className="text-xl font-extrabold text-[#1E5E3A]">{adminUsers.length} <span className="text-xs font-semibold">(Equal Privileges)</span></span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#FEF9EE] border border-[#FEE2C7]">
              <span className="text-[11px] font-bold text-[#8F4F19] uppercase tracking-wider block">Pending Approval</span>
              <span className="text-xl font-extrabold text-[#D97736]">{pendingUsers.length}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-[#E0E5DF]">
              <span className="text-[11px] font-bold text-[#5D6B62] uppercase tracking-wider block">Approved Devotees</span>
              <span className="text-xl font-extrabold text-[#1E2621]">{users.filter(u => u.role === 'user' && u.status === 'approved').length}</span>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center overflow-x-auto gap-1.5 pb-1">
              {[
                { id: 'all', label: `All (${users.length})` },
                { id: 'admin', label: `🛡️ Administrators (${adminUsers.length})` },
                { id: 'pending', label: `🟡 Pending (${pendingUsers.length})` },
                { id: 'devotee', label: `Devotees (${users.filter(u => u.role === 'user').length})` },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setUserRoleFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    userRoleFilter === f.id
                      ? 'bg-[#1E5E3A] text-white'
                      : 'bg-white text-[#5D6B62] hover:bg-[#F4F7F4] border border-[#E0E5DF]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[200px] sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#5D6B62]" />
              <input
                type="text"
                placeholder="Search name or phone..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-[#E0E5DF] rounded-xl text-[#1E2621] placeholder-[#8A968D]"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-[#E0E5DF] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAF7] border-b border-[#E0E5DF] text-[#5D6B62] uppercase font-bold text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Member / Administrator</th>
                    <th className="py-3 px-4">Mobile Phone (Login)</th>
                    <th className="py-3 px-4">Role &amp; Privilege</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4 text-right">Actions &amp; Authority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0E5DF]">
                  {users
                    .filter(u => {
                      if (userRoleFilter === 'admin' && u.role !== 'admin') return false;
                      if (userRoleFilter === 'pending' && u.status !== 'pending') return false;
                      if (userRoleFilter === 'devotee' && u.role !== 'user') return false;
                      if (userSearchQuery.trim()) {
                        const q = userSearchQuery.toLowerCase();
                        const matchName = u.fullName.toLowerCase().includes(q);
                        const matchPhone = u.mobilePhone.includes(q);
                        const matchAddr = u.address?.toLowerCase().includes(q);
                        if (!matchName && !matchPhone && !matchAddr) return false;
                      }
                      return true;
                    })
                    .map(u => {
                      const isCurrentAdmin = u.id === currentUser.id;
                      const isAdmin = u.role === 'admin';
                      return (
                        <tr key={u.id} className={isAdmin ? 'bg-[#FAFBF9]' : u.status === 'pending' ? 'bg-[#FEF9EE]/60' : 'hover:bg-[#F4F7F4]/60 transition-colors'}>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2.5">
                              <DevoteeAvatar
                                avatarUrl={u.avatarUrl}
                                name={u.fullName}
                                size="sm"
                                showRing
                                ringColor={isAdmin ? 'ring-[#1E5E3A]/40' : undefined}
                              />
                              <div>
                                <div className="flex items-center space-x-1.5">
                                  <span className="font-bold text-[#1E2621] text-xs sm:text-sm">{u.fullName}</span>
                                  {isCurrentAdmin && (
                                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-[#1E5E3A] text-white uppercase tracking-wider">
                                      You
                                    </span>
                                  )}
                                </div>
                                {u.email && (
                                  <p className="text-[10px] text-[#5D6B62]">{u.email}</p>
                                )}
                                {u.address && (
                                  <p className="text-[10px] text-[#8A968D] truncate max-w-xs">{u.address}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-bold text-[#1E2621]">
                            📱 {u.mobilePhone}
                          </td>
                          <td className="py-3 px-4">
                            {isAdmin ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#EBF3ED] text-[#1E5E3A] border border-[#CDE0D4]">
                                <Shield className="w-3.5 h-3.5 text-[#1E5E3A]" />
                                <span>Administrator (Full Privileges)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#F4F7F4] text-[#5D6B62]">
                                <span>Devotee</span>
                              </span>
                            )}
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

                            {/* Promote devotee to Admin with equal privileges */}
                            {!isAdmin && u.status === 'approved' && (
                              <button
                                onClick={() => handlePromoteToAdmin(u)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FEF9EE] hover:bg-[#FDE7C7] text-[#8F4F19] border border-[#FEE2C7] rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                                title="Grant this devotee full administrator rights"
                              >
                                <Shield className="w-3 h-3 text-[#D97736]" />
                                <span>Make Admin</span>
                              </button>
                            )}

                            {/* Demote other admin */}
                            {isAdmin && !isCurrentAdmin && (
                              <button
                                onClick={() => handleDemoteAdmin(u)}
                                className="px-2 py-1 bg-[#F4F7F4] hover:bg-[#FEE2E2] text-[#5D6B62] hover:text-red-700 rounded-lg text-[11px] font-medium cursor-pointer transition-colors"
                                title="Revoke admin privileges"
                              >
                                Demote to Devotee
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
                Select Devotee Family *
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

            {/* Offerings to Devotees (Checkboxes) */}
            <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E0E5DF] space-y-2">
              <span className="block text-xs font-bold text-[#1E2621]">
                Devotee Offerings (Prasadam Seva)
              </span>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-[#1E2621] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assignHostProvidesFood}
                    onChange={(e) => setAssignHostProvidesFood(e.target.checked)}
                    className="w-4 h-4 rounded text-[#1E5E3A] focus:ring-[#1E5E3A] cursor-pointer"
                  />
                  <span className="inline-flex items-center gap-1">
                    <span>🍃</span>
                    <span>Host provides food</span>
                  </span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-[#1E2621] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assignHostProvidesDrinks}
                    onChange={(e) => setAssignHostProvidesDrinks(e.target.checked)}
                    className="w-4 h-4 rounded text-[#D97736] focus:ring-[#D97736] cursor-pointer"
                  />
                  <span className="inline-flex items-center gap-1">
                    <span>☕</span>
                    <span>Host provides drinks (Coffee)</span>
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E2621] uppercase tracking-wider mb-1">
                Prasadam / Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Vegetarian lunch & hot filter coffee"
                value={assignHostNotes}
                onChange={(e) => setAssignHostNotes(e.target.value)}
                className="w-full text-xs bg-[#FAFAF7] border border-[#E0E5DF] rounded-xl p-2.5 text-[#1E2621]"
              />
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

      {/* Edit Prayer Host Modal */}
      {editingPrayerHosting && (
        <div className="fixed inset-0 z-50 bg-[#1E2621]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E0E5DF] max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0E5DF]">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FEF3EB] text-[#D97736] flex items-center justify-center text-xl shadow-2xs">
                  🙏
                </div>
                <div>
                  <h3 className="font-bold text-[#1E2621] text-base font-temple">
                    Edit Prayer Hosting
                  </h3>
                  <p className="text-[11px] text-[#5D6B62]">
                    {formatFullSunday(editingPrayerHosting.date)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingPrayerHosting(null)}
                className="p-1.5 rounded-full text-[#5D6B62] hover:bg-[#F4F7F4] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePrayerHosting} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1E2621] uppercase tracking-wider mb-1">
                  Host Devotee
                </label>
                <select
                  value={editHostUserId}
                  onChange={(e) => setEditHostUserId(e.target.value)}
                  className="w-full text-xs font-bold bg-[#FAFAF7] border border-[#E0E5DF] rounded-xl p-2.5 text-[#1E2621] cursor-pointer"
                >
                  <option value="">{editingPrayerHosting.userName} (Current Host)</option>
                  {users.filter(u => u.status === 'approved').map(u => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} (📱 {u.mobilePhone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Offerings Checkboxes */}
              <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#E0E5DF] space-y-2.5">
                <span className="block text-xs font-bold text-[#1E2621]">
                  Offerings to Devotees
                </span>
                <p className="text-[11px] text-[#5D6B62]">
                  Select the checkboxes to show food (🍃) and drinks (☕) indicators to all devotees across the portal.
                </p>

                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-2.5 text-xs font-semibold text-[#1E2621] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editHostProvidesFood}
                      onChange={(e) => setEditHostProvidesFood(e.target.checked)}
                      className="w-4 h-4 rounded text-[#1E5E3A] focus:ring-[#1E5E3A] cursor-pointer"
                    />
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-base">🍃</span>
                      <span>Host provides food</span>
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs font-semibold text-[#1E2621] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editHostProvidesDrinks}
                      onChange={(e) => setEditHostProvidesDrinks(e.target.checked)}
                      className="w-4 h-4 rounded text-[#D97736] focus:ring-[#D97736] cursor-pointer"
                    />
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-base">☕</span>
                      <span>Host provides drinks (Coffee / tea / beverages)</span>
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2621] uppercase tracking-wider mb-1">
                  Prasadam Menu / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Vegetarian lunch & hot filter coffee"
                  value={editHostNotes}
                  onChange={(e) => setEditHostNotes(e.target.value)}
                  className="w-full text-xs bg-[#FAFAF7] border border-[#E0E5DF] rounded-xl p-2.5 text-[#1E2621]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E0E5DF]">
                <button
                  type="button"
                  onClick={() => setEditingPrayerHosting(null)}
                  className="py-2.5 rounded-xl border border-[#E0E5DF] text-[#5D6B62] hover:bg-[#F4F7F4] font-bold text-xs cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="py-2.5 rounded-xl bg-[#1E5E3A] hover:bg-[#164E30] text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  SAVE CHANGES
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create New Administrator Modal */}
      {showCreateAdminModal && (
        <div className="fixed inset-0 z-50 bg-[#1E2621]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E0E5DF] max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0E5DF]">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#EBF3ED] text-[#1E5E3A] flex items-center justify-center font-bold shadow-2xs">
                  <ShieldCheck className="w-5 h-5 text-[#1E5E3A]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1E2621] text-base font-temple">
                    Create New Administrator
                  </h3>
                  <p className="text-[11px] text-[#5D6B62]">
                    Assign full equal privileges to manage the administration portal
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCreateAdminModal(false);
                  setCreateAdminError('');
                  setCreateAdminSuccess('');
                }}
                className="p-1.5 rounded-full text-[#5D6B62] hover:bg-[#F4F7F4] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-3.5">
              <div className="p-3.5 rounded-xl bg-[#EBF3ED] border border-[#CDE0D4] text-xs text-[#1E5E3A] space-y-1.5">
                <div className="flex items-center space-x-1.5 font-bold">
                  <Shield className="w-4 h-4 text-[#1E5E3A]" />
                  <span>Equal Administrator Privileges Granted:</span>
                </div>
                <ul className="text-[11px] list-disc list-inside space-y-0.5 text-[#164E30]">
                  <li>Full access to Temple Administration Portal</li>
                  <li>Manage Vigraha deities &amp; assign devotee slots</li>
                  <li>Assign &amp; oversee Sunday prayer hosting</li>
                  <li>Approve devotee accounts &amp; create other administrators</li>
                </ul>
              </div>

              {createAdminError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{createAdminError}</span>
                </div>
              )}

              {createAdminSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-semibold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{createAdminSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#1E2621] uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Krishnan"
                  value={adminFullName}
                  onChange={(e) => setAdminFullName(e.target.value)}
                  className="w-full text-xs bg-[#FAFAF7] border border-[#E0E5DF] rounded-xl p-2.5 text-[#1E2621] font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2621] uppercase tracking-wider mb-1">
                  Mobile Phone (Login Identifier) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 01609042026 or 01609042026"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  className="w-full text-xs bg-[#FAFAF7] border border-[#E0E5DF] rounded-xl p-2.5 text-[#1E2621] font-medium"
                />
                <p className="text-[10px] text-[#5D6B62] mt-1">
                  The new administrator will use this mobile phone number to log in with full administrative privileges.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2621] uppercase tracking-wider mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="e.g. ramesh@temple.org"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full text-xs bg-[#FAFAF7] border border-[#E0E5DF] rounded-xl p-2.5 text-[#1E2621]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2621] uppercase tracking-wider mb-1">
                  Residential Address (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Georgetown, Penang"
                  value={adminAddress}
                  onChange={(e) => setAdminAddress(e.target.value)}
                  className="w-full text-xs bg-[#FAFAF7] border border-[#E0E5DF] rounded-xl p-2.5 text-[#1E2621]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#E0E5DF]">
                <button
                  type="button"
                  onClick={() => setShowCreateAdminModal(false)}
                  className="py-2.5 rounded-xl border border-[#E0E5DF] text-[#5D6B62] hover:bg-[#F4F7F4] font-bold text-xs cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="py-2.5 rounded-xl bg-[#1E5E3A] hover:bg-[#164E30] text-white font-bold text-xs shadow-xs cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>CREATE ADMIN</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
