'use client';

import { useState } from 'react';
import Image from 'next/image';
import { User as UserIcon } from 'lucide-react';

interface AvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  imageUrl?: string;
  showVerifiedOverlay?: boolean;
  hoverHighlight?: boolean;
}

export default function Avatar({ name, size = 'md', imageUrl, showVerifiedOverlay = false, hoverHighlight = false }: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  const sizeStyles = {
    xs: 'h-4 w-4 text-[10px]',
    sm: 'h-5 w-5 text-xs',
    md: 'h-6 w-6 text-xs',
    lg: 'h-10 w-10 text-base',
    xl: 'h-12 w-12 text-base',
  };

  const sizePixels = {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 40,
    xl: 48,
  };

  const displayName = name || '?';

  const hasValidImage = imageUrl && imageUrl.trim() !== '' && !imgError;

  const overlay = showVerifiedOverlay ? (
    <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center overflow-hidden">
      <Image src="/icon-verified.png" alt="verified" width={16} height={16} className="object-contain" />
    </span>
  ) : null;

  const interactiveRing = hoverHighlight
    ? 'hover:ring-2 hover:ring-blue-500 active:ring-4 ring-offset-2 ring-offset-white dark:ring-offset-gray-900'
    : '';
  const interactiveScale = hoverHighlight ? 'hover:scale-105 active:scale-95' : '';

  if (hasValidImage) {
    return (
      <div className={`${sizeStyles[size]} rounded-full ${interactiveScale} ${interactiveRing} transition-all duration-200 ease-out relative bg-gray-100 dark:bg-gray-800 overflow-hidden`}>
        <Image
          src={imageUrl}
          alt={name}
          width={sizePixels[size]}
          height={sizePixels[size]}
          className="w-full h-full object-cover"
          unoptimized={false}
          onError={() => setImgError(true)}
        />
        {overlay}
      </div>
    );
  }

  return (
    <div className={`${sizeStyles[size]} rounded-full bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-100 flex items-center justify-center ${interactiveScale} ${interactiveRing} transition-all duration-200 ease-out relative`}>
      <UserIcon className="w-[70%] h-[70%]" strokeWidth={2} />
      {overlay}
    </div>
  );
}
