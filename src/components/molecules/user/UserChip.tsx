'use client';

import Avatar from '@/components/atoms/Avatar';
import type { TrustBadgePresentation } from '@/lib/utils/trustBadges';
import UserTrustBadge from '@/components/molecules/user/UserTrustBadge';

interface UserChipProps {
  name: string;
  avatar?: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
  trustBadgePresentation?: TrustBadgePresentation;
  learnMoreLabel?: string;
  onBadgeClick?: () => void;
  badgeLabelVariant?: 'badge' | 'text' | 'none';
  badgeClassName?: string;
  badgeLabelClassName?: string;
}

export default function UserChip({
  name,
  avatar,
  size = 'md',
  onClick,
  className = '',
  trustBadgePresentation,
  learnMoreLabel,
  onBadgeClick,
  badgeLabelVariant = 'text',
  badgeClassName = '',
  badgeLabelClassName,
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
        {trustBadgePresentation ? (
          <UserTrustBadge
            presentation={trustBadgePresentation}
            learnMoreLabel={learnMoreLabel}
            onClick={onBadgeClick}
            labelVariant={badgeLabelVariant}
            badgeClassName={badgeClassName}
            labelClassName={badgeLabelClassName}
          />
        ) : null}
      </div>
    </div>
  );
}
