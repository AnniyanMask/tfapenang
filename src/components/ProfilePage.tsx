import React, { useState, useRef } from 'react';
import { User } from '../types';
import { storage } from '../services/storage';
import { uploadAvatar, isSupabaseConfigured } from '../services/supabase';
import { DevoteeAvatar } from './DevoteeAvatar';
import { 
  Phone, 
  MapPin, 
  Sparkles, 
  LogOut, 
  CheckCircle2, 
  Camera, 
  UploadCloud, 
  Trash2, 
  Loader2, 
  Info,
  User as UserIcon,
  Image as ImageIcon
} from 'lucide-react';

interface ProfilePageProps {
  currentUser: User;
  onLogout: () => void;
  onRefresh: () => void;
}

const PRESET_AVATARS = [
  { id: 'devotee_1', name: 'Devotee 1', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
  { id: 'devotee_2', name: 'Devotee 2', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' },
  { id: 'devotee_3', name: 'Devotee 3', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80' },
  { id: 'devotee_4', name: 'Devotee 4', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80' },
  { id: 'devotee_5', name: 'Devotee 5', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80' },
  { id: 'devotee_6', name: 'Devotee 6', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' }
];

export const ProfilePage: React.FC<ProfilePageProps> = ({
  currentUser,
  onLogout,
  onRefresh
}) => {
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [address, setAddress] = useState(currentUser.address || '');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(currentUser.avatarUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadMessage({ type: 'error', text: 'Please select a valid image file (JPG, PNG, WebP).' });
      return;
    }

    // Max 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      setUploadMessage({ type: 'error', text: 'Image is too large. Please select an image under 10MB.' });
      return;
    }

    setIsUploading(true);
    setUploadMessage(null);

    try {
      const result = await uploadAvatar(file, currentUser.id);
      if (result.success && result.url) {
        setAvatarUrl(result.url);
        // Persist immediately to user profile so picture syncs across the app
        storage.updateUserProfile(currentUser.id, {
          avatarUrl: result.url
        });
        setUploadMessage({
          type: 'success',
          text: 'Profile picture updated successfully!'
        });
        onRefresh();
      } else {
        setUploadMessage({ type: 'error', text: result.message || 'Could not upload image.' });
      }
    } catch (err: any) {
      setUploadMessage({ type: 'error', text: err?.message || 'Failed to process avatar.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleSelectPreset = (url: string) => {
    setAvatarUrl(url);
    storage.updateUserProfile(currentUser.id, {
      avatarUrl: url
    });
    setUploadMessage({ type: 'success', text: 'Preset devotee avatar applied!' });
    onRefresh();
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl('');
    storage.updateUserProfile(currentUser.id, {
      avatarUrl: ''
    });
    setUploadMessage({ type: 'success', text: 'Profile picture removed. Using initials.' });
    onRefresh();
  };

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    storage.updateUserProfile(currentUser.id, {
      fullName: fullName.trim(),
      address: address.trim(),
      avatarUrl: avatarUrl
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
    onRefresh();
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <span className="text-2xl">👤</span>
        <div>
          <h1 className="text-2xl font-bold text-[#1E2621] font-temple">
            My Profile
          </h1>
          <p className="text-xs text-[#5D6B62]">
            Devotee family details and identification for Prayer Host &amp; Deity bookings
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#E0E5DF] p-6 shadow-sm space-y-6">
        
        {/* Profile Header & Avatar Card */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-6 border-b border-[#E0E5DF]">
          {/* Avatar with edit overlay */}
          <div className="relative group shrink-0">
            <DevoteeAvatar
              avatarUrl={avatarUrl}
              name={fullName || currentUser.fullName}
              size="xl"
              showRing
              ringColor="ring-[#1E5E3A]/30"
              className="w-24 h-24 text-3xl shadow-sm"
            />

            {/* Quick camera upload trigger */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              aria-label="Upload profile picture"
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#1E5E3A] hover:bg-[#164E30] text-white flex items-center justify-center shadow-md transition-transform hover:scale-105 cursor-pointer disabled:opacity-50"
              title="Upload new picture"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="text-center sm:text-left flex-1 min-w-0">
            <h2 className="text-lg font-bold text-[#1E2621] font-temple truncate">
              {fullName || currentUser.fullName}
            </h2>
            <p className="text-xs text-[#5D6B62] font-medium flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
              <Phone className="w-3.5 h-3.5 text-[#1E5E3A]" />
              <span>📱 {currentUser.mobilePhone}</span>
            </p>

            <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
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
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#EBF3ED] text-[#1E5E3A] font-medium">
                Photo appears in Deity &amp; Prayer Hostings
              </span>
            </div>
          </div>
        </div>

        {/* PROFILE PICTURE MANAGEMENT SECTION */}
        <div className="space-y-3 p-4 rounded-2xl bg-[#FAF8F5] border border-[#E0E5DF]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ImageIcon className="w-4 h-4 text-[#1E5E3A]" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#1E2621]">
                Profile Picture
              </h3>
            </div>
            
          </div>

          <p className="text-[11px] text-[#5D6B62] leading-relaxed">
            Your photo helps other community members recognize you when you book a Deity or host Sunday prayers.
          </p>

          {/* Drag & Drop or Click Area */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
              isDragOver 
                ? 'border-[#1E5E3A] bg-[#EBF3ED]' 
                : 'border-[#D2DFD5] bg-white hover:border-[#1E5E3A] hover:bg-[#FAFAF7]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/jpg"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center space-y-1.5">
              <div className="w-9 h-9 rounded-full bg-[#EBF3ED] text-[#1E5E3A] flex items-center justify-center">
                {isUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <UploadCloud className="w-5 h-5" />
                )}
              </div>
              <p className="text-xs font-bold text-[#1E2621]">
                {isUploading ? 'Uploading picture...' : 'Click to upload or drag photo here'}
              </p>
              <p className="text-[10px] text-[#5D6B62]">
                Supports JPG, PNG, WebP up to 10MB (Auto-optimized)
              </p>
            </div>
          </div>

          {/* Preset Devotee Photos */}
          <div className="pt-2">
            <label className="block text-[11px] font-bold text-[#5D6B62] uppercase tracking-wider mb-2">
              Or Choose from Presets:
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {PRESET_AVATARS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset.url)}
                  className={`relative w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 transition-transform hover:scale-105 cursor-pointer ${
                    avatarUrl === preset.url ? 'border-[#1E5E3A] ring-2 ring-[#1E5E3A]/30' : 'border-transparent'
                  }`}
                  title={preset.name}
                >
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}

              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="w-10 h-10 rounded-full bg-white border border-[#E0E5DF] text-[#DC2626] hover:bg-[#FEE2E2] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                  title="Remove photo (revert to initials)"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Upload Status message */}
          {uploadMessage && (
            <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
              uploadMessage.type === 'success'
                ? 'bg-[#DCFCE7] text-[#1E5E3A] border border-[#BBF7D0]'
                : 'bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]'
            }`}>
              {uploadMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <Info className="w-4 h-4 shrink-0" />
              )}
              <span className="text-[11px] font-medium">{uploadMessage.text}</span>
            </div>
          )}
        </div>

        {saveSuccess && (
          <div className="p-3 bg-[#DCFCE7] border border-[#BBF7D0] text-[#1E5E3A] text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-[#1E5E3A]" />
            <span>Profile details updated successfully!</span>
          </div>
        )}

        {/* Update Form for Text Details */}
        <form onSubmit={handleSaveDetails} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-[#1E2621] uppercase tracking-wider mb-1">
              Full Name / Family
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FAFAF7] border border-[#E0E5DF] rounded-xl text-[#1E2621] focus:bg-white focus:ring-2 focus:ring-[#1E5E3A] outline-none font-medium"
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
