import React, { useState } from 'react';
import { User } from '../types';
import { storage } from '../services/storage';
import { User as UserIcon, Phone, MapPin, Sparkles, LogOut, CheckCircle2, ShieldAlert } from 'lucide-react';

interface ProfilePageProps {
  currentUser: User;
  onLogout: () => void;
  onRefresh: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  currentUser,
  onLogout,
  onRefresh
}) => {
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [address, setAddress] = useState(currentUser.address || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const users = storage.getUsers().map(u => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          fullName: fullName.trim(),
          address: address.trim()
        };
      }
      return u;
    });

    localStorage.setItem('temple_users_v1', JSON.stringify(users));
    storage.setCurrentUser({
      ...currentUser,
      fullName: fullName.trim(),
      address: address.trim()
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
    onRefresh();
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-12">
      <div className="flex items-center space-x-2">
        <span className="text-2xl">👤</span>
        <div>
          <h1 className="text-2xl font-bold text-[#1E2621] font-temple">
            My Profile
          </h1>
          <p className="text-xs text-[#5D6B62]">
            Registered devotee family details for temple records
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#E0E5DF] p-6 shadow-sm space-y-6">
        {/* User Card */}
        <div className="flex items-center space-x-4 pb-5 border-b border-[#E0E5DF]">
          <div className="w-14 h-14 rounded-2xl bg-[#1E5E3A] text-white flex items-center justify-center text-xl font-bold shadow-xs">
            {currentUser.fullName.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1E2621] font-temple">
              {currentUser.fullName}
            </h2>
            <p className="text-xs text-[#5D6B62] font-medium flex items-center gap-1.5 mt-0.5">
              <Phone className="w-3.5 h-3.5 text-[#1E5E3A]" />
              <span>📱 {currentUser.mobilePhone}</span>
            </p>
            <div className="mt-2 flex items-center gap-2">
              {currentUser.status !== 'approved' && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase inline-flex items-center gap-1 bg-[#FEF9EE] text-[#8F4F19]">
                  <span>🟡</span>
                  <span>Pending Verification</span>
                </span>
              )}
              {currentUser.role === 'admin' && (
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#F4F7F4] text-[#5D6B62] font-bold uppercase">
                  Admin
                </span>
              )}
            </div>
          </div>
        </div>

        {saveSuccess && (
          <div className="p-3 bg-[#DCFCE7] border border-[#BBF7D0] text-[#1E5E3A] text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#1E5E3A]" />
            <span>Profile details updated successfully!</span>
          </div>
        )}

        {/* Update Form */}
        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-[#1E2621] uppercase tracking-wider mb-1">
              Full Name / Family
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FAFAF7] border border-[#E0E5DF] rounded-xl text-[#1E2621] focus:bg-white focus:ring-2 focus:ring-[#1E5E3A] outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-[#1E2621] uppercase tracking-wider mb-1">
              Registered Mobile Phone (Immutable Identity)
            </label>
            <input
              type="text"
              disabled
              value={currentUser.mobilePhone}
              className="w-full px-3.5 py-2.5 bg-[#F4F7F4] border border-[#E0E5DF] rounded-xl text-[#5D6B62] cursor-not-allowed font-medium"
            />
            <p className="text-[10px] text-[#5D6B62] mt-1">
              Used for database authentication and booking SMS confirmations. Contact Temple Office to change.
            </p>
          </div>

          <div>
            <label className="block font-bold text-[#1E2621] uppercase tracking-wider mb-1">
              Home Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Residential address for deity delivery/pickup records"
              className="w-full px-3.5 py-2.5 bg-[#FAFAF7] border border-[#E0E5DF] rounded-xl text-[#1E2621] focus:bg-white focus:ring-2 focus:ring-[#1E5E3A] outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#1E5E3A] hover:bg-[#164E30] text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            SAVE PROFILE CHANGES
          </button>
        </form>

        <div className="pt-4 border-t border-[#E0E5DF]">
          <button
            onClick={onLogout}
            className="w-full py-2.5 border border-[#E0E5DF] text-[#5D6B62] hover:text-[#DC2626] hover:bg-[#FEE2E2]/50 text-xs font-bold rounded-xl flex items-center justify-center space-x-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Portal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
