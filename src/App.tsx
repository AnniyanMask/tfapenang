import React, { useState, useEffect } from 'react';
import { ActiveTab, DeityBooking, PrayerHosting, SundaySlotInfo, User } from './types';
import { storage } from './services/storage';
import { Navigation } from './components/Navigation';
import { LoginPage } from './components/LoginPage';
import { UserDashboard } from './components/UserDashboard';
import { DeityBookingPage } from './components/DeityBookingPage';
import { PrayerHostingPage } from './components/PrayerHostingPage';
import { CalendarPage } from './components/CalendarPage';
import { MyBookingsPage } from './components/MyBookingsPage';
import { AdminPortal } from './components/AdminPortal';
import { ProfilePage } from './components/ProfilePage';
import { BrandLogo } from './components/BrandLogo';
import { formatFullSunday, formatShortDate } from './utils/dateUtils';
import { RotateCcw, Sparkles, UserCheck, Shield } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => storage.getCurrentUser());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Modal inspection states for Dashboard View Details
  const [selectedDeityBookingDetail, setSelectedDeityBookingDetail] = useState<DeityBooking | null>(null);
  const [selectedPrayerHostingDetail, setSelectedPrayerHostingDetail] = useState<PrayerHosting | null>(null);

  // Subscribe to storage changes
  useEffect(() => {
    const unsubscribe = storage.subscribe(() => {
      setCurrentUser(storage.getCurrentUser());
      setRefreshTrigger(prev => prev + 1);
    });
    return unsubscribe;
  }, []);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    setCurrentUser(storage.getCurrentUser());
  };

  const handleLogout = () => {
    storage.setCurrentUser(null);
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  // If no user is logged in, show simple clean Login Page
  if (!currentUser) {
    return <LoginPage onLoginSuccess={(user) => {
      setCurrentUser(user);
      setActiveTab('dashboard');
    }} />;
  }

  // Get current user's bookings
  const allDeityBookings = storage.getDeityBookings();
  const allPrayerHostings = storage.getPrayerHostings();
  const myDeityBookings = allDeityBookings.filter(b => b.userId === currentUser.id);
  const myPrayerHostings = allPrayerHostings.filter(h => h.userId === currentUser.id);

  // Count pending users for admin badge
  const pendingUsersCount = storage.getUsers().filter(u => u.status === 'pending').length;

  const quickSwitchUser = (phone: string) => {
    const res = storage.loginWithPhone(phone);
    if (res.success && res.user) {
      setCurrentUser(res.user);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-[#1E2621] flex flex-col md:flex-row antialiased selection:bg-[#DCFCE7] selection:text-[#1E5E3A]">
      {/* Navigation (Sidebar on Desktop, Top & Bottom Nav on Mobile) */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        pendingUsersCount={pendingUsersCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top bar on desktop with Devotee switcher & Seva branding */}
        <header className="hidden md:flex items-center justify-between px-8 py-3.5 bg-white border-b border-[#E0E5DF] sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded-lg bg-[#1E5E3A] text-white flex items-center justify-center overflow-hidden p-0.5 shrink-0">
              <BrandLogo branding={storage.getTempleBranding()} imgClassName="w-full h-full object-contain" emojiClassName="text-sm" />
            </div>
            <span className="text-xs font-bold text-[#1E2621] uppercase tracking-wider font-temple">
              {storage.getTempleBranding().templeName || 'Temple Of Fine Arts'} • {storage.getTempleBranding().tagline || 'Deity & Sunday Prayer Seva'}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Quick Demo Switcher in desktop header */}
            <div className="flex items-center space-x-1 bg-[#F4F7F4] border border-[#E0E5DF] rounded-xl px-2.5 py-1 text-xs">
              <span className="text-[#1E5E3A] text-[11px] font-semibold mr-1">Switch Devotee:</span>
              <button
                onClick={() => quickSwitchUser('9876543211')}
                className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition-colors cursor-pointer ${
                  currentUser.mobilePhone === '9876543211' ? 'bg-[#1E5E3A] text-white font-bold' : 'hover:bg-[#E0E5DF] text-[#1E2621]'
                }`}
              >
                Ananth
              </button>
              <button
                onClick={() => quickSwitchUser('9876543212')}
                className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition-colors cursor-pointer ${
                  currentUser.mobilePhone === '9876543212' ? 'bg-[#1E5E3A] text-white font-bold' : 'hover:bg-[#E0E5DF] text-[#1E2621]'
                }`}
              >
                Kumar
              </button>
              <button
                onClick={() => quickSwitchUser('9876543213')}
                className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition-colors cursor-pointer ${
                  currentUser.mobilePhone === '9876543213' ? 'bg-[#D97736] text-white font-bold' : 'hover:bg-[#E0E5DF] text-[#D97736]'
                }`}
                title="Priya (Pending Admin Validation)"
              >
                Priya (Pending)
              </button>
              <button
                onClick={() => quickSwitchUser('9876543210')}
                className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition-colors cursor-pointer ${
                  currentUser.role === 'admin' ? 'bg-[#164E30] text-white font-bold' : 'hover:bg-[#E0E5DF] text-[#164E30] font-bold'
                }`}
              >
                Admin
              </button>
            </div>

            {/* Reset data button */}
            <button
              onClick={() => {
                if (window.confirm('Reset temple demo data back to clean defaults?')) {
                  storage.resetToDefault();
                  handleRefresh();
                }
              }}
              className="p-1.5 rounded-xl text-[#5D6B62] hover:text-[#1E2621] hover:bg-[#F4F7F4] transition-colors"
              title="Reset initial bookings & dates"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Page Views Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-12">
          {activeTab === 'dashboard' && (
            <UserDashboard
              currentUser={currentUser}
              onNavigate={setActiveTab}
              myDeityBookings={myDeityBookings}
              myPrayerHostings={myPrayerHostings}
              onViewBookingDetails={(b) => setSelectedDeityBookingDetail(b)}
              onViewHostingDetails={(h) => setSelectedPrayerHostingDetail(h)}
            />
          )}

          {activeTab === 'deity-booking' && (
            <DeityBookingPage
              currentUser={currentUser}
              onNavigateToMyBookings={() => setActiveTab('my-bookings')}
            />
          )}

          {activeTab === 'prayer-hosting' && (
            <PrayerHostingPage
              currentUser={currentUser}
              onNavigateToMyBookings={() => setActiveTab('my-bookings')}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarPage
              currentUser={currentUser}
              onBookDeityForSunday={(deityId, slot) => {
                setActiveTab('deity-booking');
              }}
              onHostPrayerForSunday={(slot) => {
                setActiveTab('prayer-hosting');
              }}
            />
          )}

          {activeTab === 'my-bookings' && (
            <MyBookingsPage
              currentUser={currentUser}
              onNavigate={setActiveTab}
              myDeityBookings={myDeityBookings}
              myPrayerHostings={myPrayerHostings}
              onRefresh={handleRefresh}
            />
          )}

          {activeTab === 'profile' && (
            <ProfilePage
              currentUser={currentUser}
              onLogout={handleLogout}
              onRefresh={handleRefresh}
            />
          )}

          {activeTab === 'admin' && (
            <AdminPortal
              currentUser={currentUser}
              onRefresh={handleRefresh}
            />
          )}
        </main>
      </div>

      {/* Dashboard View Deity Detail Modal */}
      {selectedDeityBookingDetail && (
        <div className="fixed inset-0 z-50 bg-[#1E2621]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E0E5DF] max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-[#E0E5DF]">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🛕</span>
                <h3 className="font-bold text-[#1E2621] text-base font-temple">
                  Deity Booking Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedDeityBookingDetail(null)}
                className="p-1 text-[#5D6B62] hover:text-[#1E2621] font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#F4F7F4] border border-[#E0E5DF] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#5D6B62]">Deity:</span>
                <span className="font-bold text-[#1E2621] text-sm font-temple">
                  {selectedDeityBookingDetail.deityName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5D6B62]">Period:</span>
                <span className="font-semibold text-[#1E2621]">
                  {formatShortDate(selectedDeityBookingDetail.startDate)} → {formatShortDate(selectedDeityBookingDetail.endDate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5D6B62]">Collection:</span>
                <span className="font-semibold text-[#1E5E3A]">
                  {selectedDeityBookingDetail.collectionTime}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5D6B62]">Status:</span>
                <span className="font-bold text-[#1E5E3A] bg-[#DCFCE7] px-2 py-0.5 rounded text-[11px] uppercase">
                  🟢 {selectedDeityBookingDetail.status}
                </span>
              </div>
              {selectedDeityBookingDetail.notes && (
                <div className="pt-2 border-t border-[#E0E5DF]">
                  <span className="text-[#5D6B62] block">Devotee Note:</span>
                  <p className="font-medium text-[#1E2621] mt-0.5">
                    {selectedDeityBookingDetail.notes}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedDeityBookingDetail(null)}
              className="w-full py-2.5 rounded-xl bg-[#1E5E3A] hover:bg-[#164E30] text-white font-bold text-xs transition-colors cursor-pointer"
            >
              DONE
            </button>
          </div>
        </div>
      )}

      {/* Dashboard View Prayer Hosting Detail Modal */}
      {selectedPrayerHostingDetail && (
        <div className="fixed inset-0 z-50 bg-[#1E2621]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E0E5DF] max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-[#E0E5DF]">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🙏</span>
                <h3 className="font-bold text-[#1E2621] text-base font-temple">
                  Prayer Hosting Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedPrayerHostingDetail(null)}
                className="p-1 text-[#5D6B62] hover:text-[#1E2621] font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#F4F7F4] border border-[#E0E5DF] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#5D6B62]">Date:</span>
                <span className="font-bold text-[#1E2621] text-sm font-temple">
                  {formatFullSunday(selectedPrayerHostingDetail.date)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5D6B62]">Host:</span>
                <span className="font-semibold text-[#1E2621]">
                  {selectedPrayerHostingDetail.userName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5D6B62]">Status:</span>
                <span className="font-bold text-[#1E5E3A] bg-[#DCFCE7] px-2 py-0.5 rounded text-[11px] uppercase">
                  🟢 {selectedPrayerHostingDetail.status}
                </span>
              </div>
              {selectedPrayerHostingDetail.notes && (
                <div className="pt-2 border-t border-[#E0E5DF]">
                  <span className="text-[#5D6B62] block">Prasadam / Seva Details:</span>
                  <p className="font-medium text-[#1E2621] mt-0.5">
                    {selectedPrayerHostingDetail.notes}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedPrayerHostingDetail(null)}
              className="w-full py-2.5 rounded-xl bg-[#1E5E3A] hover:bg-[#164E30] text-white font-bold text-xs transition-colors cursor-pointer"
            >
              DONE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
