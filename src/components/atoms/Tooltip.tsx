'use client';

import React from 'react';
import useTouchTooltip from '@/lib/hooks/useTouchTooltip';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'below' | 'right' | 'bottom-right' | 'top-left';
  className?: string;
}

export default function Tooltip({
  content,
  children,
  position = 'top',
  className = ''
}: TooltipProps) {
  // Initialize touch tooltip behavior for mobile
  useTouchTooltip();

  return (
    <div className={`vk-tooltip-container inline-flex items-center ${className}`}>
      <div className="vk-tooltip-target inline-flex" data-tooltip="true">
        {children}
      </div>
      <div className="vk-tooltip max-w-[220px] whitespace-normal break-words text-center" data-position={position}>
        {content}
      </div>
    </div>
  );
}
