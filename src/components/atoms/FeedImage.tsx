'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

const DEFAULT_BLUR_DATA_URL =
  'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

interface FeedImageProps {
  src?: string | null;
  alt: string;
  width: number;
  height: number;
  sizes?: string;
  className?: string;
  fallbackSrc?: string;
  priority?: boolean;
}

export default function FeedImage({
  src,
  alt,
  width,
  height,
  sizes = '180px',
  className,
  fallbackSrc = '/brand-logo.png',
  priority = false,
}: FeedImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState(src || fallbackSrc);

  useEffect(() => {
    setResolvedSrc(src || fallbackSrc);
  }, [src, fallbackSrc]);

  return (
    <Image
      src={resolvedSrc}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      className={className}
      placeholder="blur"
      blurDataURL={DEFAULT_BLUR_DATA_URL}
      priority={priority}
      onError={() => {
        if (resolvedSrc !== fallbackSrc) {
          setResolvedSrc(fallbackSrc);
        }
      }}
    />
  );
}
