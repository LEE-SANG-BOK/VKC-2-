'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

interface ShareButtonProps {
  url?: string;
  title?: string;
  text?: string;
  label?: string;
  className?: string;
  copiedLabel?: string;
  translations?: Record<string, unknown>;
}

export default function ShareButton({
  url,
  title,
  text,
  label,
  className = '',
  copiedLabel,
  translations,
}: ShareButtonProps) {
  const tTooltips = (translations?.tooltips || {}) as Record<string, string>;
  const tPostDetail = (translations?.postDetail || {}) as Record<string, string>;

  const resolvedLabel = label || tTooltips.share || '';
  const resolvedCopiedLabel = copiedLabel || resolvedLabel;
  const copyTitle = tPostDetail.linkCopied || '';
  const shareTitleLabel = tTooltips.share || '';

  const [copied, setCopied] = useState(false);
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareTitle = title || (typeof document !== 'undefined' ? document.title : '');
  const shareText = text || '';

  const handleShare = async () => {
    try {
      if (navigator.share && navigator.canShare) {
        const shareData = { title: shareTitle, text: shareText, url: shareUrl };
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return;
        }
      }

      await navigator.clipboard?.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition ${className}`}
      title={copied ? copyTitle : shareTitleLabel}
    >
      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Share2 className="h-4 w-4" />}
      <span className={copied ? 'text-green-600' : ''}>{copied ? resolvedCopiedLabel : resolvedLabel}</span>
    </button>
  );
}
