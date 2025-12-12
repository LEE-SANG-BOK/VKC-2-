interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export default function Badge({ children, variant = 'primary' }: BadgeProps) {
  const variantStyles = {
    primary: 'bg-gradient-to-r from-red-600 to-amber-600 text-yellow-100',
    secondary: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
  };

  return (
    <span className={`px-1.5 py-0.5 text-[9px] font-semibold rounded-full shadow-lg ${variantStyles[variant]}`}>
      {children}
    </span>
  );
}
