import React from 'react';
import { ActiveTab, User } from '../types';
import { storage } from '../services/storage';
import { BrandLogo } from './BrandLogo';
import { DevoteeAvatar } from './DevoteeAvatar';
import { 
  Home, 
  Calendar as CalendarIcon, 
  BookOpen, 
  User as UserIcon, 
  ShieldCheck, 
  Flame, 
  HeartHandshake,
  LogOut,
  Sparkles,
  Menu,
  X,
  AlertCircle,
  Bell
} from 'lucide-react';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentUser: User | null;
  onLogout: () => void;
  pendingUsersCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  pendingUsersCount
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const branding = storage.getTempleBranding();

  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: Home, emoji: '🏠' },
    { id: 'deity-booking' as ActiveTab, label: 'Deity Booking', icon: Flame, emoji: '🛕' },
    { id: 'prayer-hosting' as ActiveTab, label: 'Prayer Hosting', icon: HeartHandshake, emoji: '🙏' },
    { id: 'calendar' as ActiveTab, label: 'Calendar', icon: CalendarIcon, emoji: '📅' },
    { id: 'notice-board' as ActiveTab, label: 'Notice Board', icon: Bell, emoji: '📢' },
    { id: 'my-bookings' as ActiveTab, label: 'My Bookings', icon: BookOpen, emoji: '📋' },
    { id: 'profile' as ActiveTab, label: 'My Profile', icon: UserIcon, emoji: '👤' },
  ];

  const isAdmin = currentUser?.role === 'admin';

  return (
    <>
      {/* Top Navbar for Mobile & Tablet */}
      <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E0E5DF] px-4 py-3 flex items-center justify-between shadow-xs">
        <div 
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center space-x-2.5 cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-[#1E5E3A] text-white flex items-center justify-center shadow-xs text-lg font-bold overflow-hidden p-0.5 shrink-0">
            <BrandLogo branding={branding} imgClassName="w-full h-full object-contain" emojiClassName="text-xl" />
          </div>
          <div>
            <h1 className="text-base font-bold text-[#1E2621] tracking-tight leading-none font-temple">
              {branding.templeName || 'Temple Of Fine Arts Penang'}
            </h1>
           
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`relative p-2 rounded-xl text-[#5D6B62] hover:bg-[#F4F7F4] ${activeTab === 'admin' ? 'bg-[#EBF3ED] text-[#1E5E3A] font-bold' : ''}`}
              title="Admin Panel"
            >
              <ShieldCheck className="w-5 h-5 text-[#1E5E3A]" />
              {pendingUsersCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#D97736] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {pendingUsersCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-[#5D6B62] hover:bg-[#F4F7F4] focus:outline-none cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu (When Hamburger is tapped) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-[#1E2621]/50 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl p-5 border-t border-[#E0E5DF] shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0E5DF] mb-3">
              <div className="flex items-center space-x-2">
                <span className="w-7 h-7 rounded-lg bg-[#1E5E3A] text-white flex items-center justify-center overflow-hidden p-0.5 shrink-0">
                  <BrandLogo branding={branding} imgClassName="w-full h-full object-contain" emojiClassName="text-base" />
                </span>
                <div>
                  <h3 className="font-bold text-[#1E2621] font-temple leading-tight">{branding.templeName || 'Temple Of Fine Arts Penang'}</h3>
                  
                </div>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-full bg-[#F4F7F4] text-[#5D6B62] hover:text-[#1E2621]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current user card in mobile drawer */}
            {currentUser && (
              <div 
                onClick={() => {
                  setActiveTab('profile');
                  setMobileMenuOpen(false);
                }}
                className="mb-3 p-3 rounded-2xl bg-[#FAFAF7] border border-[#E0E5DF] flex items-center justify-between cursor-pointer hover:bg-[#EBF3ED] transition-colors"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <DevoteeAvatar
                    avatarUrl={currentUser.avatarUrl}
                    name={currentUser.fullName}
                    size="sm"
                    showRing
                  />
                  <div className="truncate">
                    <p className="text-xs font-bold text-[#1E2621] truncate">{currentUser.fullName}</p>
                    <p className="text-[10px] text-[#5D6B62]">📱 {currentUser.mobilePhone}</p>
                  </div>
                </div>
                <span className="text-[10px] text-[#1E5E3A] font-bold uppercase tracking-wider">
                  Profile
                </span>
              </div>
            )}

            <nav className="space-y-1">
              {navItems.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-sm font-semibold transition-colors ${
                      isActive 
                        ? 'bg-[#EBF3ED] text-[#1E5E3A] border border-[#D2DFD5]' 
                        : 'text-[#5D6B62] hover:bg-[#F4F7F4]'
                    }`}
                  >
                    <span className="text-lg">{item.emoji}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}

              {isAdmin && (
                <button
                  onClick={() => {
                    setActiveTab('admin');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left text-sm font-semibold transition-colors ${
                    activeTab === 'admin'
                      ? 'bg-[#1E5E3A] text-white'
                      : 'bg-[#EBF3ED] text-[#1E5E3A] border border-[#D2DFD5]'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">⚙️</span>
                    <span>Administration</span>
                  </div>
                  {pendingUsersCount > 0 && (
                    <span className="bg-[#D97736] text-white text-xs px-2 py-0.5 rounded-full font-bold">
                      {pendingUsersCount} Pending
                    </span>
                  )}
                </button>
              )}

              <div className="pt-3 mt-3 border-t border-[#E0E5DF] flex items-center justify-between">
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-2 text-[#5D6B62] hover:text-red-700 text-sm font-medium px-4 py-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white border-r border-[#E0E5DF] h-screen sticky top-0 shadow-xs z-30">
        {/* Brand Header */}
        <div className="p-6 border-b border-[#E0E5DF] bg-white">
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center space-x-3 cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#1E5E3A] text-white flex items-center justify-center text-2xl shadow-xs overflow-hidden p-1 shrink-0">
              <BrandLogo branding={branding} imgClassName="w-full h-full object-contain" emojiClassName="text-2xl" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-[#1E2621] tracking-tight font-temple leading-snug truncate">
                {branding.templeName || 'Temple Of Fine Arts Penang'}
              </h1>
              <p className="text-xs text-[#5D6B62] font-medium truncate">{branding.tagline || ''}</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2">
            
          </div>

          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-left text-sm font-semibold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#EBF3ED] text-[#1E5E3A] font-semibold border border-[#D2DFD5] shadow-2xs'
                    : 'text-[#5D6B62] hover:bg-[#F4F7F4] hover:text-[#1E2621]'
                }`}
              >
                <span className="text-base">{item.emoji}</span>
                <span className="flex-1">{item.label}</span>
              </button>
            );
          })}

          {/* Admin Section (Restricted strictly to administrators) */}
          {isAdmin && (
            <div className="pt-5 mt-4 border-t border-[#E0E5DF]">
              <div className="px-3 pb-2 flex items-center justify-between">
                <p className="text-[10px] font-bold text-[#8A968D] uppercase tracking-widest">
                  Temple Committee
                </p>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase bg-[#1E5E3A] text-white">
                  Admin Only
                </span>
              </div>
              <button
                id="nav-item-admin"
                onClick={() => setActiveTab('admin')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-sm font-semibold transition-all duration-150 cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-[#1E5E3A] text-white shadow-xs'
                    : 'text-[#5D6B62] hover:bg-[#F4F7F4] hover:text-[#1E2621]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-base">⚙️</span>
                  <span>Administration</span>
                </div>
                {pendingUsersCount > 0 && (
                  <span className="bg-[#D97736] text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    {pendingUsersCount}
                  </span>
                )}
              </button>
            </div>
          )}
        </nav>

        {/* Footer info & Logout */}
        <div className="p-4 border-t border-[#E0E5DF] bg-[#F4F7F4]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs text-[#8A968D]">
              <Sparkles className="w-3.5 h-3.5 text-[#1E5E3A]" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Penang Shiva Family</span>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center space-x-1 text-xs font-semibold text-[#5D6B62] hover:text-red-700 transition-colors p-1.5 rounded-lg hover:bg-stone-200/50 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (Mandatory high priority: Dashboard | Deity | Hosting | Bookings) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E0E5DF] px-2 py-1.5 shadow-lg flex justify-around items-center">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'dashboard' ? 'text-[#1E5E3A] font-bold' : 'text-[#5D6B62] hover:text-[#1E2621]'
          }`}
        >
          <span className="text-lg">🏠</span>
          <span className="text-[11px] mt-0.5">Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('deity-booking')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'deity-booking' ? 'text-[#1E5E3A] font-bold' : 'text-[#5D6B62] hover:text-[#1E2621]'
          }`}
        >
          <span className="text-lg">🛕</span>
          <span className="text-[11px] mt-0.5">Deity</span>
        </button>

        <button
          onClick={() => setActiveTab('prayer-hosting')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'prayer-hosting' ? 'text-[#1E5E3A] font-bold' : 'text-[#5D6B62] hover:text-[#1E2621]'
          }`}
        >
          <span className="text-lg">🙏</span>
          <span className="text-[11px] mt-0.5">Hosting</span>
        </button>

        <button
          onClick={() => setActiveTab('my-bookings')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'my-bookings' ? 'text-[#1E5E3A] font-bold' : 'text-[#5D6B62] hover:text-[#1E2621]'
          }`}
        >
          <span className="text-lg">📋</span>
          <span className="text-[11px] mt-0.5">Bookings</span>
        </button>

        <button
          onClick={() => setActiveTab(isAdmin ? 'admin' : 'calendar')}
          className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
            (isAdmin ? activeTab === 'admin' : activeTab === 'calendar')
              ? 'text-[#1E5E3A] font-bold'
              : 'text-[#5D6B62] hover:text-[#1E2621]'
          }`}
        >
          <span className="text-lg">{isAdmin ? '⚙️' : '📅'}</span>
          <span className="text-[11px] mt-0.5">{isAdmin ? 'Admin' : 'Calendar'}</span>
          {isAdmin && pendingUsersCount > 0 && (
            <span className="absolute top-0 right-1 bg-[#D97736] text-white text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
              {pendingUsersCount}
            </span>
          )}
        </button>
      </nav>
    </>
  );
};
