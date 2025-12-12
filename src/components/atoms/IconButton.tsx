import { ButtonHTMLAttributes, ReactNode } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  badge?: number;
}

export default function IconButton({ children, badge, className = '', ...props }: IconButtonProps) {
  return (
    <button
      className={`relative p-1.5 hover:bg-gradient-to-br hover:from-red-50 hover:to-amber-50 dark:hover:from-red-900/20 dark:hover:to-amber-900/20 rounded-lg transition-all duration-300 group ${className}`}
      {...props}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-0.5 right-0.5 h-3 w-3 bg-gradient-to-br from-red-600 to-amber-500 rounded-full text-[9px] text-yellow-100 flex items-center justify-center animate-pulse shadow-md">
          {badge}
        </span>
      )}
    </button>
  );
}
