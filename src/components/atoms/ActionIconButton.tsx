'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ActionIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label: string;
  count?: number;
  variant?: 'pill' | 'icon';
}

export default function ActionIconButton({
  icon,
  label,
  count,
  variant,
  className,
  type,
  ...props
}: ActionIconButtonProps) {
  const resolvedVariant = variant || (typeof count === 'number' ? 'pill' : 'icon');
  const baseClasses = 'inline-flex items-center justify-center gap-1 rounded-full transition-colors';
  const sizeClasses = resolvedVariant === 'pill'
    ? 'gap-1 px-3 py-2 min-h-[44px] text-xs font-semibold sm:px-2 sm:py-1 sm:min-h-[32px]'
    : 'p-2.5 min-h-[44px] min-w-[44px] sm:p-1.5 sm:min-h-[32px] sm:min-w-[32px]';

  return (
    <button
      type={type || 'button'}
      aria-label={label}
      className={cn(baseClasses, sizeClasses, className)}
      {...props}
    >
      {icon}
      {typeof count === 'number' ? <span>{count}</span> : null}
    </button>
  );
}
