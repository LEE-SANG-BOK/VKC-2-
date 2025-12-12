'use client';

import Avatar from '@/components/atoms/Avatar';

interface UserChipProps {
  name: string;
  avatar?: string;
  isVerified?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

export default function UserChip({
  name,
  avatar,
  isVerified = false,
  size = 'md',
  onClick,
  className = '',
}: UserChipProps) {
  const textSize = size === 'sm' ? 'text-sm' : 'text-base';
  const gap = size === 'sm' ? 'gap-2' : 'gap-2.5';

  return (
    <div
      className={`group inline-flex items-center ${gap} cursor-pointer hover:opacity-90 transition-all ${className}`}
      onClick={onClick}
    >
      <Avatar name={name} imageUrl={avatar} size={size === 'lg' ? 'lg' : 'md'} hoverHighlight />
      <div className="flex items-center gap-1 min-w-0">
        <span className={`font-semibold text-gray-900 dark:text-gray-100 ${textSize} truncate`}>
          {name}
        </span>
      </div>
    </div>
  );
}
