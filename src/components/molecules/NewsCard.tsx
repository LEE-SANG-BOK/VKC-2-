import Image from 'next/image';
import Link from 'next/link';
import Badge from '@/components/atoms/Badge';

interface NewsCardProps {
  id: string;
  title: string;
  category: string;
  imageUrl: string | null;
  linkUrl: string | null;
  onSelect?: () => void;
}

export default function NewsCard({ title, category, imageUrl, linkUrl, onSelect }: NewsCardProps) {
  const content = (
    <article className="group cursor-pointer flex-shrink-0 w-[200px] sm:w-[172px] rounded-xl overflow-hidden
      bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800
      shadow-sm hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-blue-500/5
      hover:border-transparent transition-all duration-500 hover:-translate-y-1
      active:scale-[0.98] touch-manipulation">

      <div className="relative h-[110px] sm:h-[94px] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 200px, 172px"
            className="object-cover group-hover:scale-110 transition-transform duration-700"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span className="text-xs">No Image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="absolute top-1.5 left-1.5 z-10">
          <Badge>{category}</Badge>
        </div>
      </div>

      <div className="p-2.5 sm:p-2">
        <h3 className="text-sm sm:text-xs font-bold mb-1.5 line-clamp-2 transition-colors leading-tight
          text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
          {title}
        </h3>
      </div>
    </article>
  );

  if (onSelect) {
    return (
      <button type="button" onClick={onSelect} className="text-left">
        {content}
      </button>
    );
  }

  if (linkUrl) {
    return (
      <Link href={linkUrl} target="_blank" rel="noopener noreferrer">
        {content}
      </Link>
    );
  }

  return content;
}
