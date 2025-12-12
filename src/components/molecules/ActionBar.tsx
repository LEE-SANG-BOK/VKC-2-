'use client';

interface ActionBarProps {
  likes?: number;
  saves?: number;
  shares?: number;
  onLike?: () => void;
  onSave?: () => void;
  onShare?: () => void;
  showLabels?: boolean;
  align?: 'left' | 'between';
  isLiked?: boolean;
  isSaved?: boolean;
  isShared?: boolean;
}

export default function ActionBar({
  likes = 0,
  saves = 0,
  shares = 0,
  onLike,
  onSave,
  onShare,
  showLabels = true,
  align = 'between',
  isLiked = false,
  isSaved = false,
  isShared = false,
}: ActionBarProps) {
  const base =
    'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 min-h-[44px] text-sm font-medium transition-colors';

  return (
    <div
      className={`flex items-center gap-2 text-gray-600 dark:text-gray-300 ${
        align === 'between' ? 'justify-between' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onLike}
          className={`${base} ${
            isLiked
              ? 'text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40 ring-1 ring-blue-100/80 dark:ring-blue-800/60'
              : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30'
          }`}
        >
          {showLabels ? '추천' : null} {likes > 0 ? <span className="tabular-nums">{likes}</span> : null}
        </button>
        <button
          type="button"
          onClick={onSave}
          className={`${base} ${
            isSaved
              ? 'text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/40 ring-1 ring-emerald-100/80 dark:ring-emerald-800/60'
              : 'text-gray-700 dark:text-gray-200 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
          }`}
        >
          {showLabels ? '저장' : null} {saves > 0 ? <span className="tabular-nums">{saves}</span> : null}
        </button>
        <button
          type="button"
          onClick={onShare}
          className={`${base} ${
            isShared
              ? 'text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700'
              : 'text-gray-700 dark:text-gray-200 hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/70'
          }`}
        >
          {showLabels ? '공유' : null} {shares > 0 ? <span className="tabular-nums">{shares}</span> : null}
        </button>
      </div>
    </div>
  );
}
