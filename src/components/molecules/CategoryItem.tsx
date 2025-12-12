import { LucideIcon } from 'lucide-react';
import Tooltip from '../atoms/Tooltip';

interface CategoryItemProps {
  id: string;
  name: string;
  icon?: LucideIcon;
  count: number;
  isActive: boolean;
  onClick: (id: string) => void;
  className?: string;
  tooltip?: string;
  tooltipPosition?: 'top' | 'below' | 'right' | 'bottom-right';
}

export default function CategoryItem({
  id,
  name,
  icon: Icon,
  count,
  isActive,
  onClick,
  className = '',
  tooltip,
  tooltipPosition = 'right'
}: CategoryItemProps) {
  const hasIcon = typeof Icon === 'function';
  const baseClasses = `flex items-center ${hasIcon ? 'gap-3' : 'gap-1'} text-sm font-medium transition-all duration-200`;
  const defaultWidth = className.includes('w-') ? '' : 'w-full';
  const defaultPadding = className.includes('px-') || className.includes('!px-') ? '' : 'px-4';
  const defaultVerticalPadding = className.includes('py-') || className.includes('!py-') ? '' : 'py-3';

  // Check if custom colors are provided in className
  const hasCustomColors = className.includes('text-') || className.includes('border-l-');

  const button = (
    <button
      onClick={() => onClick(id)}
      className={`${baseClasses} ${defaultWidth} ${defaultPadding} ${defaultVerticalPadding} ${className}
        ${!hasCustomColors && isActive
          ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-l-3 border-blue-600 dark:border-blue-400'
          : !hasCustomColors
            ? 'text-gray-700 dark:text-gray-300 border-l-3 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400'
            : ''
        }`}
    >
      {hasIcon && <Icon className="w-5 h-5 flex-shrink-0" />}
      <span className="flex-1 text-left">{name}</span>
      {count > 0 && <span className="text-xs text-gray-500 dark:text-gray-400">{count}</span>}
    </button>
  );

  if (!tooltip) return button;

  return (
    <Tooltip content={tooltip} position={tooltipPosition}>
      {button}
    </Tooltip>
  );
}
