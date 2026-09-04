import React, { useState } from 'react';

interface DevoteeAvatarProps {
  avatarUrl?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showRing?: boolean;
  ringColor?: string;
}

const SIZE_MAP = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-20 h-20 text-2xl'
};

export const DevoteeAvatar: React.FC<DevoteeAvatarProps> = ({
  avatarUrl,
  name,
  size = 'md',
  className = '',
  showRing = false,
  ringColor = 'ring-[#86EFAC]'
}) => {
  const [imageError, setImageError] = useState(false);

  const initial = name?.trim() ? name.trim().charAt(0).toUpperCase() : '👤';
  const sizeClasses = SIZE_MAP[size] || SIZE_MAP.md;
  const ringClass = showRing ? `ring-2 ${ringColor}` : '';

  if (avatarUrl && !imageError) {
    return (
      <div 
        className={`relative inline-flex shrink-0 rounded-full overflow-hidden bg-[#EBF3ED] border border-[#D2DFD5] shadow-2xs ${sizeClasses} ${ringClass} ${className}`}
        title={name || 'Devotee'}
      >
        <img
          src={avatarUrl}
          alt={name || 'Devotee profile picture'}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Fallback initial
  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold uppercase bg-[#EBF3ED] text-[#1E5E3A] border border-[#D2DFD5] shadow-2xs ${sizeClasses} ${ringClass} ${className}`}
      title={name || 'Devotee'}
    >
      <span>{initial}</span>
    </div>
  );
};
