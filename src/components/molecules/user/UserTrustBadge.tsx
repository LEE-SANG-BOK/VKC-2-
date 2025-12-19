'use client';

import type { MouseEvent } from 'react';
import TrustBadge from '@/components/atoms/TrustBadge';
import Tooltip from '@/components/atoms/Tooltip';
import type { TrustBadgePresentation } from '@/lib/utils/trustBadges';

interface UserTrustBadgeProps {
  presentation: TrustBadgePresentation;
  learnMoreLabel?: string;
  onClick?: () => void;
  labelVariant?: 'badge' | 'text' | 'none';
  className?: string;
  labelClassName?: string;
  badgeClassName?: string;
  tooltipPosition?: 'top' | 'below' | 'right' | 'left' | 'bottom-right' | 'top-left';
  touchBehavior?: 'tap' | 'longPress';
}

export default function UserTrustBadge({
  presentation,
  learnMoreLabel,
  onClick,
  labelVariant = 'text',
  className = '',
  labelClassName = 'text-[11px] text-gray-500 dark:text-gray-400',
  badgeClassName = '',
  tooltipPosition = 'top',
  touchBehavior = 'longPress',
}: UserTrustBadgeProps) {
  if (!presentation.show) return null;

  const showBadgeLabel = labelVariant === 'badge';
  const showTextLabel = labelVariant === 'text';

  const handleClick = (event: MouseEvent) => {
    event.stopPropagation();
    onClick?.();
  };

  const badgeContent = (
    <span className={`inline-flex items-center gap-1 ${className}`.trim()}>
      <TrustBadge
        level={presentation.level}
        label={presentation.label}
        showLabel={showBadgeLabel}
        className={badgeClassName}
      />
      {showTextLabel ? <span className={labelClassName}>{presentation.label}</span> : null}
    </span>
  );

  const tooltipContent = (
    <div className="space-y-1">
      <div>{presentation.tooltip}</div>
      {onClick && learnMoreLabel ? (
        <button
          type="button"
          onClick={handleClick}
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          {learnMoreLabel}
        </button>
      ) : null}
    </div>
  );

  return (
    <Tooltip content={tooltipContent} position={tooltipPosition} touchBehavior={touchBehavior} interactive>
      {onClick ? (
        <button type="button" onClick={handleClick} className="inline-flex items-center">
          {badgeContent}
        </button>
      ) : (
        <span className="inline-flex items-center">
          {badgeContent}
        </span>
      )}
    </Tooltip>
  );
}
