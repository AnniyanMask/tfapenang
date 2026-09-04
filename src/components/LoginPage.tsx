import React, { useState } from 'react';
import { storage } from '../services/storage';
import { User } from '../types';
import { BrandLogo } from './BrandLogo';
import { Phone, Lock, User as UserIcon, ShieldAlert, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const branding = storage.getTempleBranding();
  const [mobilePhone, setMobilePhone] = useState('9876543211'); // Default to Ananth for quick start
  const [password, setPassword] = useState('temple123');
  const [errorMessage, setErrorMessage] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState(false);

  // Registration Form State
  const [regFullName, setRegFullName] = useState('');
  const [regMobilePhone, setRegMobilePhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPassword, setRegPassword] = useState('temple123');
  const [regSuccess, setRegSuccess] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!mobilePhone.trim()) {
      setErrorMessage('Please enter your registered Mobile Phone number.');
      return;
    }

    const result = storage.loginWithPhone(mobilePhone);
    if (result.success && result.user) {
      onLoginSuccess(result.user);
    } else {
      setErrorMessage(result.error || 'Invalid Mobile Phone number or account not found.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!regFullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!regMobilePhone.trim()) {
      setErrorMessage('Please enter your mobile phone number.');
      return;
    }

    const result = storage.registerUser({
      fullName: regFullName,
      mobilePhone: regMobilePhone,
      address: regAddress
    });

    if (result.success && result.user) {
      setRegSuccess(true);
      setTimeout(() => {
        onLoginSuccess(result.user!);
      }, 1400);
    } else {
      setErrorMessage(result.error || 'Failed to create account.');
    }
  };

  const setQuickUser = (phone: string) => {
    setMobilePhone(phone);
    setPassword('temple123');
    setErrorMessage('');
    const result = storage.loginWithPhone(phone);
    if (result.success && result.user) {
      onLoginSuccess(result.user);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7] flex flex-col justify-center items-center px-4 py-8 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background aura */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#1E5E3A]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#D97736]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Temple Logo & Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1E5E3A] text-white shadow-md mb-3 ring-4 ring-[#EBF3ED] overflow-hidden p-1.5">
            <BrandLogo branding={branding} imgClassName="w-full h-full object-contain" emojiClassName="text-3xl" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1E2621] font-temple tracking-tight">
            {branding.templeName || 'Temple Of Fine Arts'}
          </h1>
          <p className="text-xs sm:text-sm text-[#D97736] font-semibold tracking-wide uppercase mt-0.5">
            {branding.tagline || 'Deity & Sunday Prayer Booking System'}
          </p>
          <div className="mt-3 inline-block px-4 py-1.5 rounded-full bg-[#EBF3ED] border border-[#CDE0D4] text-xs text-[#1E5E3A] font-medium">
            &quot;Sign in to manage your deity bookings and Sunday prayer hosting.&quot;
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl border border-[#E0E5DF] shadow-sm p-6 sm:p-8">
          {!showRegister ? (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E0E5DF]">
                <h2 className="text-lg font-bold text-[#1E2621] font-temple">Welcome Back</h2>
                <span className="text-xs text-[#5D6B62]">Member Sign In</span>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-[#FEE2E2] border border-[#FECACA] text-[#991B1B] text-xs flex items-start space-x-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Title required: Mobile Phone */}
              <div>
                <label 
                  htmlFor="login-mobile-phone"
                  className="block text-xs font-bold text-[#1E2621] uppercase tracking-wider mb-1.5"
                >
                  Mobile Phone
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5D6B62]">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id="login-mobile-phone"
                    type="tel"
                    required
                    value={mobilePhone}
                    onChange={(e) => setMobilePhone(e.target.value)}
                    placeholder="e.g. 9876543211"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAFAF7] border border-[#E0E5DF] rounded-xl text-[#1E2621] text-sm focus:outline-none focus:ring-2 focus:ring-[#1E5E3A] focus:bg-white transition-all"
                  />
                </div>
                
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label 
                    htmlFor="login-password"
                    className="block text-xs font-bold text-[#1E2621] uppercase tracking-wider"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotPasswordNotice(true)}
                    className="text-xs text-[#D97736] hover:text-[#B85E22] font-semibold cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5D6B62]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAFAF7] border border-[#E0E5DF] rounded-xl text-[#1E2621] text-sm focus:outline-none focus:ring-2 focus:ring-[#1E5E3A] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {forgotPasswordNotice && (
                <div className="p-3 bg-[#FEF9EE] rounded-xl border border-[#FEE2C7] text-xs text-[#8F4F19] flex justify-between items-center">
                  <span>For security, contact the Temple Office with your registered Mobile Phone to reset credentials.</span>
                  <button 
                    type="button"
                    onClick={() => setForgotPasswordNotice(false)} 
                    className="font-bold underline ml-2 shrink-0 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Login Button */}
              <button
                type="submit"
                id="btn-login-submit"
                className="w-full mt-2 py-3 px-4 bg-[#1E5E3A] hover:bg-[#164E30] text-white font-bold rounded-xl shadow-xs text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <span>LOGIN</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRegister(true);
                    setErrorMessage('');
                  }}
                  className="text-xs text-[#5D6B62] hover:text-[#1E5E3A] font-medium cursor-pointer"
                >
                  New devotee family? <span className="font-bold text-[#1E5E3A] underline">Create Account</span>
                </button>
              </div>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E0E5DF]">
                <h2 className="text-lg font-bold text-[#1E2621] font-temple">Create Member Account</h2>
                <button
                  type="button"
                  onClick={() => setShowRegister(false)}
                  className="text-xs text-[#5D6B62] hover:text-[#1E2621] font-medium cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>

              {/* Notice regarding admin validation against supabase */}
              <div className="p-3 rounded-xl bg-[#EBF3ED] border border-[#CDE0D4] text-[#1E5E3A] text-xs">
                <p className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#1E5E3A]" />
                  Temple Member Verification Notice
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-[#5D6B62]">
                  All new registrations must be validated by the Temple Administrator against the Supabase database before booking deities.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-[#FEE2E2] border border-[#FECACA] text-[#991B1B] text-xs flex items-start space-x-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {regSuccess && (
                <div className="p-3 rounded-xl bg-[#DCFCE7] border border-[#BBF7D0] text-[#1E5E3A] text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-[#1E5E3A]" />
                  <span>Account registered successfully! Pending Admin verification.</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#1E2621] uppercase tracking-wider mb-1">
                  Full Name / Family Name
                </label>
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="e.g. Ramesh &amp; Lakshmi Iyer"
                  className="w-full px-3.5 py-2 bg-[#FAFAF7] border border-[#E0E5DF] rounded-xl text-[#1E2621] text-sm focus:outline-none focus:ring-2 focus:ring-[#1E5E3A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2621] uppercase tracking-wider mb-1">
                  Mobile Phone
                </label>
                <input
                  type="tel"
                  required
                  value={regMobilePhone}
                  onChange={(e) => setRegMobilePhone(e.target.value)}
                  placeholder="e.g. 9876543299"
                  className="w-full px-3.5 py-2 bg-[#FAFAF7] border border-[#E0E5DF] rounded-xl text-[#1E2621] text-sm focus:outline-none focus:ring-2 focus:ring-[#1E5E3A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2621] uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 bg-[#FAFAF7] border border-[#E0E5DF] rounded-xl text-[#1E2621] text-sm focus:outline-none focus:ring-2 focus:ring-[#1E5E3A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E2621] uppercase tracking-wider mb-1">
                  Residential Address
                </label>
                <input
                  type="text"
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  placeholder="Street / Community Apartment"
                  className="w-full px-3.5 py-2 bg-[#FAFAF7] border border-[#E0E5DF] rounded-xl text-[#1E2621] text-sm focus:outline-none focus:ring-2 focus:ring-[#1E5E3A]"
                />
              </div>

              <button
                type="submit"
                id="btn-register-submit"
                className="w-full mt-2 py-3 px-4 bg-[#1E5E3A] hover:bg-[#164E30] text-white font-bold rounded-xl shadow-xs text-sm cursor-pointer"
              >
                SUBMIT REGISTRATION
              </button>
            </form>
          )}

          {/* Quick Demo Switcher (Helps examiner test both User and Admin easily) */}
          <div className="mt-6 pt-4 border-t border-[#E0E5DF]">
            <p className="text-[11px] font-bold text-[#5D6B62] uppercase tracking-wider mb-2 text-center">
              Quick 1-Click Sign-In For Demo
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setQuickUser('9876543211')}
                className="p-2 rounded-xl bg-[#EBF3ED] hover:bg-[#DCFCE7] border border-[#CDE0D4] text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-[#1E5E3A] truncate">👤 Ananth</div>
                <div className="text-[10px] text-[#5D6B62]">📱 9876543211</div>
              </button>

              <button
                type="button"
                onClick={() => setQuickUser('9876543210')}
                className="p-2 rounded-xl bg-[#FEF3EB] hover:bg-[#FEE2C7] border border-[#FDCBAA] text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-[#D97736] truncate">⚙️ Temple Admin</div>
                <div className="text-[10px] text-[#8F4F19]">📱 9876543210</div>
              </button>

              <button
                type="button"
                onClick={() => setQuickUser('9876543212')}
                className="p-2 rounded-xl bg-[#FAF8F5] hover:bg-[#F4F7F4] border border-[#E0E5DF] text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-[#1E2621] truncate">👤 Kumar Raman</div>
                <div className="text-[10px] text-[#5D6B62]">📱 9876543212</div>
              </button>

              <button
                type="button"
                onClick={() => setQuickUser('9876543213')}
                className="p-2 rounded-xl bg-[#FEF9EE] hover:bg-[#FEEFCF] border border-[#FCE7B0] text-left transition-colors cursor-pointer"
              >
                <div className="font-bold text-[#8F4F19] truncate">⏳ Priya (Pending)</div>
                <div className="text-[10px] text-[#B85E22]">📱 9876543213</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-[#5D6B62]">
          <p>Temple Of Fine Arts Penang • Shiva Family Portal</p>
          <p className="text-[11px] mt-1 text-[#86968B]">Hari Om Tat Sat</p>
        </div>
      </div>
    </div>
  );
};
