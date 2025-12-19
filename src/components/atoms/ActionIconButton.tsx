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
  const baseClasses = 'inline-flex items-center justify-center rounded-full transition-colors';
  const sizeClasses = resolvedVariant === 'pill'
    ? 'gap-1 px-2 py-1 min-h-[30px] text-xs font-semibold'
    : 'p-1.5 min-h-[30px] min-w-[30px]';

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
