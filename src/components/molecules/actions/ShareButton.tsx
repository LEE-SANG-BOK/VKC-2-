'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { useParams } from 'next/navigation';

interface ShareButtonProps {
  url?: string;
  title?: string;
  text?: string;
  label?: string;
  className?: string;
}

export default function ShareButton({
  url,
  title = 'Viet K-Connect',
  text,
  label,
  className = '',
}: ShareButtonProps) {
  const params = useParams();
  const locale = (params?.lang as string) || 'ko';
  const defaultText =
    locale === 'vi'
      ? 'Cộng đồng hỏi đáp cuộc sống Hàn Quốc cho người Việt'
      : locale === 'en'
        ? 'Korea life Q&A community for Vietnamese users'
        : '베트남인을 위한 한국 생활 Q&A 커뮤니티';
  const defaultLabel =
    locale === 'vi' ? 'Chia sẻ' : locale === 'en' ? 'Share' : '공유';
  const copiedLabel =
    locale === 'vi' ? 'Đã sao chép' : locale === 'en' ? 'Copied' : '복사됨';
  const copyTitle =
    locale === 'vi'
      ? 'Liên kết đã được sao chép!'
      : locale === 'en'
        ? 'Link copied!'
        : '링크가 복사되었습니다!';
  const shareTitleLabel =
    locale === 'vi'
      ? 'Sao chép hoặc chia sẻ liên kết'
      : locale === 'en'
        ? 'Copy or share link'
        : '링크 복사 또는 공유';

  const [copied, setCopied] = useState(false);
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareTitle = title || (typeof document !== 'undefined' ? document.title : 'Viet K-Connect');

  const handleShare = async () => {
    try {
      if (navigator.share && navigator.canShare) {
        const shareData = { title: shareTitle, text, url: shareUrl };
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return;
        }
      }

      await navigator.clipboard?.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('공유 실패:', error);
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
      <span className={copied ? 'text-green-600' : ''}>{copied ? copiedLabel : (label || defaultLabel)}</span>
    </button>
  );
}
