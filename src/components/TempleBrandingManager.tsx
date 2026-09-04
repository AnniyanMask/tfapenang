import React, { useState, useRef } from 'react';
import { TempleBranding } from '../types';
import { storage, DEFAULT_TEMPLE_BRANDING } from '../services/storage';
import { BrandLogo } from './BrandLogo';
import { 
  Upload, 
  Smile, 
  Image as ImageIcon, 
  Check, 
  RotateCcw, 
  Sparkles, 
  Eye, 
  Layers, 
  HelpCircle,
  AlertCircle
} from 'lucide-react';

interface TempleBrandingManagerProps {
  onUpdated?: () => void;
}

const SPIRITUAL_EMOJIS = [
  { emoji: '🕉️', name: 'Om' },
  { emoji: '🛕', name: 'Temple' },
  { emoji: '🪔', name: 'Diya' },
  { emoji: '🌺', name: 'Hibiscus' },
  { emoji: '🔱', name: 'Trishula' },
  { emoji: '✨', name: 'Divine Light' },
  { emoji: '🪈', name: 'Krishna Flute' },
  { emoji: '🔔', name: 'Temple Bell' },
  { emoji: '🪷', name: 'Lotus' },
  { emoji: '☀️', name: 'Surya / Sun' },
  { emoji: '🙏', name: 'Namaste' },
  { emoji: '🥥', name: 'Coconut' },
  { emoji: '🌸', name: 'Blossom' },
  { emoji: '🐘', name: 'Ganesha' },
  { emoji: '🌿', name: 'Tulsi' },
  { emoji: '🚩', name: 'Dhwaja Flag' }
];

export const TempleBrandingManager: React.FC<TempleBrandingManagerProps> = ({ onUpdated }) => {
  const current = storage.getTempleBranding();

  const [mode, setMode] = useState<'image' | 'emoji'>(current.type || 'image');
  const [imageUrl, setImageUrl] = useState<string>(current.type === 'image' ? current.value : '/images/temple-logo.png');
  const [emojiVal, setEmojiVal] = useState<string>(current.type === 'emoji' ? current.value : '🕉️');
  const [templeName, setTempleName] = useState<string>(current.templeName || 'Temple Of Fine Arts Penang');
  const [tagline, setTagline] = useState<string>(current.tagline || 'Deity & Sunday Prayer Seva');

  const [isDragging, setIsDragging] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active preview object
  const previewBranding: TempleBranding = {
    type: mode,
    value: mode === 'image' ? imageUrl : (emojiVal.trim() || '🕉️'),
    templeName: templeName.trim() || 'Temple Of Fine Arts Penang',
    tagline: tagline.trim() || 'Deity & Sunday Prayer Seva'
  };

  // Resize and optimize image to avoid localStorage quota issues
  const processImageFile = (file: File) => {
    setErrorMessage(null);
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) return;

      // For SVGs, use directly
      if (file.type === 'image/svg+xml') {
        setImageUrl(result);
        setMode('image');
        return;
      }

      // Optimize raster images using Canvas (max 512x512)
      const img = new Image();
      img.onload = () => {
        const maxDim = 512;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/png');
          setImageUrl(compressedDataUrl);
          setMode('image');
        } else {
          setImageUrl(result);
          setMode('image');
        }
      };
      img.onerror = () => {
        setErrorMessage('Unable to load image file.');
      };
      img.src = result;
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read file from disk.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleSave = () => {
    setErrorMessage(null);
    const newBranding: TempleBranding = {
      type: mode,
      value: mode === 'image' ? (imageUrl || '/images/temple-logo.png') : (emojiVal.trim() || '🕉️'),
      templeName: templeName.trim() || 'Temple Of Fine Arts Penang',
      tagline: tagline.trim() || 'Deity & Sunday Prayer Seva'
    };

    storage.setTempleBranding(newBranding);
    setSaveSuccess(true);
    if (onUpdated) onUpdated();
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  const handleResetDefault = () => {
    setMode('image');
    setImageUrl(DEFAULT_TEMPLE_BRANDING.value);
    setEmojiVal('🕉️');
    setTempleName(DEFAULT_TEMPLE_BRANDING.templeName || 'Temple Of Fine Arts Penang');
    setTagline(DEFAULT_TEMPLE_BRANDING.tagline || 'Deity & Sunday Prayer Seva');

    storage.setTempleBranding(DEFAULT_TEMPLE_BRANDING);
    setSaveSuccess(true);
    if (onUpdated) onUpdated();
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  return (
    <div className="bg-white rounded-3xl border border-[#E0E5DF] p-6 sm:p-8 shadow-xs space-y-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E0E5DF]">
        <div>
          <div className="flex items-center space-x-2 text-[#1E5E3A] text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Brand Identity &amp; Aesthetics</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1E2621] font-temple">
            Temple Logo &amp; Icon Customizer
          </h2>
          <p className="text-xs sm:text-sm text-[#5D6B62] mt-1">
            Upload an image logo or select an emoji to replace hardcoded icons across the navigation, headers, and login portal.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetDefault}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-[#E0E5DF] hover:bg-[#F4F7F4] text-[#5D6B62] text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Official Crest</span>
        </button>
      </div>

      {/* Success Banner */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-[#DCFCE7] border border-[#BBF7D0] text-[#14532D] flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded-full bg-[#1E5E3A] text-white flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold">Temple Branding Updated Successfully!</p>
              <p className="text-[11px] text-[#166534]">
                The new {mode === 'image' ? 'picture logo' : 'emoji icon'} has been applied across all headers, mobile menus, and login screens.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] flex items-center space-x-2.5">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-xs font-medium">{errorMessage}</p>
        </div>
      )}

      {/* Grid: Configurator (Left) & Real-time Context Previews (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Mode Switcher: Picture vs Emoji */}
          <div>
            <label className="block text-xs font-bold text-[#1E2621] uppercase tracking-wider mb-2">
              Choose Icon Source
            </label>
            <div className="grid grid-cols-2 gap-3 p-1.5 bg-[#F4F7F4] rounded-2xl border border-[#E0E5DF]">
              <button
                type="button"
                onClick={() => setMode('image')}
                className={`flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mode === 'image'
                    ? 'bg-[#1E5E3A] text-white shadow-xs'
                    : 'text-[#5D6B62] hover:text-[#1E2621]'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Upload Picture / Logo</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('emoji')}
                className={`flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mode === 'emoji'
                    ? 'bg-[#1E5E3A] text-white shadow-xs'
                    : 'text-[#5D6B62] hover:text-[#1E2621]'
                }`}
              >
                <Smile className="w-4 h-4" />
                <span>Choose / Type Emoji</span>
              </button>
            </div>
          </div>

          {/* MODE 1: Upload Picture */}
          {mode === 'image' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-[#1E5E3A] bg-[#EBF3ED]'
                    : 'border-[#D2DFD5] hover:border-[#1E5E3A] bg-[#FAFAF7] hover:bg-[#F4F7F4]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#EBF3ED] text-[#1E5E3A] flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-[#1E2621]">
                      Click to browse or drag &amp; drop temple logo
                    </p>
                    <p className="text-[11px] text-[#5D6B62] mt-0.5">
                      Supports PNG, JPG, SVG, WebP (Optimized automatically)
                    </p>
                  </div>
                </div>
              </div>

              {/* Preset Quick Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-[#5D6B62] font-semibold mr-1">Quick Presets:</span>
                <button
                  type="button"
                  onClick={() => setImageUrl('/images/temple-logo.png')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    imageUrl === '/images/temple-logo.png'
                      ? 'bg-[#1E5E3A] text-white border-[#1E5E3A]'
                      : 'bg-[#FAFAF7] hover:bg-[#E0E5DF] text-[#1E2621] border-[#E0E5DF]'
                  }`}
                >
                  Official TFA Crest (Uploaded PNG)
                </button>
              </div>
            </div>
          )}

          {/* MODE 2: Choose / Enter Emoji */}
          {mode === 'emoji' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1E2621] uppercase tracking-wider mb-1.5">
                  Custom Emoji Input
                </label>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#EBF3ED] border border-[#D2DFD5] flex items-center justify-center text-2xl select-none shrink-0">
                    {emojiVal || '🕉️'}
                  </div>
                  <input
                    type="text"
                    value={emojiVal}
                    onChange={(e) => setEmojiVal(e.target.value)}
                    placeholder="Enter an emoji or symbol (e.g. 🕉️, 🛕, 🪔)"
                    className="flex-1 px-4 py-2.5 border border-[#E0E5DF] rounded-xl bg-[#FAFAF7] focus:bg-white focus:border-[#1E5E3A] text-base outline-none text-[#1E2621]"
                  />
                </div>
              </div>

              {/* One-Click Spiritual & Cultural Emoji Presets */}
              <div>
                <span className="block text-xs font-bold text-[#5D6B62] uppercase tracking-wider mb-2">
                  Select a Sacred Emoji Preset
                </span>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {SPIRITUAL_EMOJIS.map((item) => (
                    <button
                      key={item.emoji}
                      type="button"
                      onClick={() => setEmojiVal(item.emoji)}
                      title={item.name}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                        emojiVal === item.emoji
                          ? 'bg-[#EBF3ED] border-[#1E5E3A] scale-105 shadow-xs ring-2 ring-[#1E5E3A]/20'
                          : 'bg-[#FAFAF7] border-[#E0E5DF] hover:bg-[#F4F7F4] hover:border-[#1E5E3A]'
                      }`}
                    >
                      <span className="text-2xl leading-none">{item.emoji}</span>
                      <span className="text-[9px] text-[#5D6B62] font-semibold mt-1 truncate w-full text-center">
                        {item.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Temple Text Branding */}
          <div className="pt-4 border-t border-[#E0E5DF] space-y-4">
            <h4 className="text-xs font-bold text-[#1E2621] uppercase tracking-wider">
              Temple Name &amp; Seva Subtitle
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#5D6B62] uppercase tracking-wider mb-1">
                  Temple Name
                </label>
                <input
                  type="text"
                  value={templeName}
                  onChange={(e) => setTempleName(e.target.value)}
                  placeholder="e.g. Temple Of Fine Arts Penang"
                  className="w-full px-3.5 py-2 border border-[#E0E5DF] rounded-xl bg-[#FAFAF7] focus:bg-white focus:border-[#1E5E3A] text-sm text-[#1E2621] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5D6B62] uppercase tracking-wider mb-1">
                  Tagline / Subtitle
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Deity & Sunday Prayer Seva"
                  className="w-full px-3.5 py-2 border border-[#E0E5DF] rounded-xl bg-[#FAFAF7] focus:bg-white focus:border-[#1E5E3A] text-sm text-[#1E2621] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSave}
              className="w-full py-3 px-6 rounded-2xl bg-[#1E5E3A] hover:bg-[#164E30] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>SAVE &amp; APPLY BRANDING APP-WIDE</span>
            </button>
          </div>
        </div>

        {/* Right Column: Live In-Context Previews (5 cols) */}
        <div className="lg:col-span-5 bg-[#FAFAF7] rounded-2xl border border-[#E0E5DF] p-5 space-y-6">
          <div className="flex items-center space-x-2 pb-3 border-b border-[#E0E5DF]">
            <Eye className="w-4 h-4 text-[#1E5E3A]" />
            <h3 className="text-xs font-bold text-[#1E2621] uppercase tracking-wider font-temple">
              Live App-Wide Previews
            </h3>
          </div>

          {/* Preview 1: Desktop Sidebar Brand Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#5D6B62] uppercase tracking-wider">
              <span>1. Desktop Sidebar Header</span>
              <span className="text-[10px] text-[#1E5E3A] bg-[#DCFCE7] px-2 py-0.5 rounded-full font-bold">
                {mode === 'image' ? 'Image Mode' : 'Emoji Mode'}
              </span>
            </div>
            <div className="bg-white rounded-2xl border border-[#E0E5DF] p-4 shadow-xs">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-[#1E5E3A] text-white flex items-center justify-center text-2xl shadow-xs overflow-hidden p-1 shrink-0">
                  <BrandLogo 
                    branding={previewBranding} 
                    imgClassName="w-full h-full object-contain" 
                    emojiClassName="text-2xl" 
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-[#1E2621] tracking-tight font-temple truncate">
                    {previewBranding.templeName}
                  </h4>
                  <p className="text-[11px] text-[#5D6B62] font-medium truncate">
                    {previewBranding.tagline}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Preview 2: Mobile Navbar Header */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-[#5D6B62] uppercase tracking-wider">
              2. Mobile Navigation Top Bar
            </span>
            <div className="bg-white rounded-2xl border border-[#E0E5DF] px-4 py-2.5 shadow-xs flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#1E5E3A] text-white flex items-center justify-center shadow-xs text-lg font-bold overflow-hidden p-0.5 shrink-0">
                  <BrandLogo 
                    branding={previewBranding} 
                    imgClassName="w-full h-full object-contain" 
                    emojiClassName="text-lg" 
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1E2621] leading-none font-temple">
                    {previewBranding.templeName}
                  </h4>
                  <p className="text-[10px] text-[#5D6B62] mt-0.5">{previewBranding.tagline}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-[#1E5E3A]"></span>
                <span className="text-[10px] text-[#5D6B62] font-medium">Devotee</span>
              </div>
            </div>
          </div>

          {/* Preview 3: Login Screen Brand Showcase */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-[#5D6B62] uppercase tracking-wider">
              3. Login Portal Presentation
            </span>
            <div className="bg-white rounded-2xl border border-[#E0E5DF] p-5 shadow-xs text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1E5E3A] text-white shadow-md mb-2 ring-4 ring-[#EBF3ED] overflow-hidden p-1.5">
                <BrandLogo 
                  branding={previewBranding} 
                  imgClassName="w-full h-full object-contain" 
                  emojiClassName="text-2xl" 
                />
              </div>
              <h4 className="text-sm font-bold text-[#1E2621] font-temple">
                {previewBranding.templeName}
              </h4>
              <p className="text-[10px] text-[#D97736] font-semibold uppercase tracking-wider mt-0.5">
                {previewBranding.tagline}
              </p>
            </div>
          </div>

          {/* Quick Informational Note */}
          <div className="p-3.5 rounded-xl bg-[#EBF3ED] border border-[#CDE0D4] text-[#1E5E3A] text-[11px] flex items-start space-x-2">
            <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              When you click <strong>Save &amp; Apply Branding</strong>, changes update in real-time across all devotee tabs, mobile menus, and guest login screens without page refresh.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
