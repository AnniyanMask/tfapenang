import React, { useState } from 'react';
import { TempleBranding } from '../types';

interface BrandLogoProps {
  branding?: TempleBranding | null;
  imgClassName?: string;
  emojiClassName?: string;
  fallbackEmoji?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  branding,
  imgClassName = 'w-full h-full object-contain',
  emojiClassName = '',
  fallbackEmoji = '🕉️'
}) => {
  const [imgError, setImgError] = useState(false);

  if (!branding) {
    return <span className={emojiClassName}>{fallbackEmoji}</span>;
  }

  if (branding.type === 'image' && branding.value && !imgError) {
    return (
      <img
        src={branding.value}
        alt={branding.templeName || 'Temple Logo'}
        className={imgClassName}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <span className={`leading-none select-none flex items-center justify-center ${emojiClassName}`}>
      {branding.value || fallbackEmoji}
    </span>
  );
};

export const DeityIconDisplay: React.FC<{
  icon: string;
  name?: string;
  className?: string;
  imgClassName?: string;
}> = ({ icon, name, className = 'text-3xl', imgClassName = 'w-full h-full object-contain' }) => {
  const [hasError, setHasError] = useState(false);
  const isImage = !hasError && (icon.startsWith('data:image') || icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('/'));

  if (isImage) {
    return (
      <img
        src={icon}
        alt={name || 'Deity'}
        className={imgClassName}
        onError={() => setHasError(true)}
      />
    );
  }

  return <span className={className}>{icon}</span>;
};
