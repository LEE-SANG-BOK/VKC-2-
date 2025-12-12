import { Search } from 'lucide-react';
import { InputHTMLAttributes } from 'react';

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  placeholder?: string;
}

export default function SearchInput({ placeholder, ...props }: SearchInputProps) {
  return (
    <div className="relative group">
      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5 group-focus-within:text-red-600 transition-colors" />
      <input
        type="text"
        placeholder={placeholder}
        className="w-full pl-8 pr-3 py-1.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 focus:bg-white dark:focus:bg-gray-800 transition-all duration-300"
        {...props}
      />
    </div>
  );
}
