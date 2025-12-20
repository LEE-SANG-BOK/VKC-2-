import { API_BASE } from '@/lib/apiBase';
import { SITE_URL } from '@/lib/siteUrl';

/**
 * UGC 링크 안전화 유틸리티
 * 사용자 생성 콘텐츠(댓글, 게시글 등)의 링크에 rel="ugc" 속성을 추가하여
 * 검색엔진에 UGC임을 알리고, 필요시 nofollow/sponsored 속성도 추가합니다.
 */

/**
 * HTML 문자열 내의 모든 외부 링크에 rel="ugc" 속성을 추가합니다.
 *
 * @param htmlContent - 원본 HTML 콘텐츠
 * @param options - 추가 옵션
 * @returns 안전화된 HTML 콘텐츠
 */
export function sanitizeUgcLinks(
  htmlContent: string,
  options: {
    addNofollow?: boolean;      // rel="nofollow" 추가 여부
    addSponsored?: boolean;      // rel="sponsored" 추가 여부 (광고성 링크)
    targetBlank?: boolean;       // target="_blank" 추가 여부
    internalDomains?: string[];  // 내부 도메인 목록 (rel=ugc 제외)
  } = {}
): string {
  const {
    addNofollow = false,
    addSponsored = false,
    targetBlank = true,
    internalDomains = []
  } = options;

  const toHostname = (value: string) => {
    try {
      return new URL(value).hostname;
    } catch {
      try {
        return new URL(`https://${value}`).hostname;
      } catch {
        return value;
      }
    }
  };

  const defaultInternalDomains = [
    ...[API_BASE, SITE_URL]
      .filter(Boolean)
      .map((value) => toHostname(String(value))),
    'example.com',
    'localhost',
    '127.0.0.1',
  ];

  const allInternalDomains = Array.from(
    new Set([
      ...defaultInternalDomains,
      ...internalDomains.map((domain) => toHostname(domain)),
    ])
  ).filter(Boolean);

  // 정규표현식으로 <a> 태그 찾기
  const linkRegex = /<a\s+([^>]*?)href=["']([^"']*)["']([^>]*?)>/gi;

  return htmlContent.replace(linkRegex, (match, beforeHref, href, afterHref) => {
    try {
      // 상대 경로나 앵커 링크는 그대로 유지
      if (href.startsWith('/') || href.startsWith('#') || href.startsWith('?')) {
        return match;
      }

      // 이미 rel 속성이 있는지 확인
      const existingRel = /rel=["']([^"']*)["']/i.exec(beforeHref + afterHref);

      // URL 파싱하여 내부/외부 도메인 확인
      const url = new URL(href, SITE_URL);
      const isInternal = allInternalDomains.some(domain =>
        url.hostname === domain || url.hostname.endsWith(`.${domain}`)
      );

      // 내부 링크는 그대로 유지
      if (isInternal) {
        return match;
      }

      // rel 속성값 구성
      const relValues: string[] = [];

      // 기존 rel 값 보존
      if (existingRel) {
        relValues.push(...existingRel[1].split(/\s+/));
      }

      // ugc 추가 (중복 제거)
      if (!relValues.includes('ugc')) {
        relValues.push('ugc');
      }

      // nofollow 추가 (옵션)
      if (addNofollow && !relValues.includes('nofollow')) {
        relValues.push('nofollow');
      }

      // sponsored 추가 (옵션)
      if (addSponsored && !relValues.includes('sponsored')) {
        relValues.push('sponsored');
      }

      // 기존 rel 속성 제거
      const cleanedBefore = beforeHref.replace(/rel=["'][^"']*["']\s*/gi, '');
      const cleanedAfter = afterHref.replace(/rel=["'][^"']*["']\s*/gi, '');

      const existingTarget = /target=["']([^"']*)["']/i.exec(beforeHref + afterHref);
      let targetAttr = '';
      if (targetBlank && !existingTarget) {
        targetAttr = ' target="_blank"';
      }

      const targetValue = (existingTarget?.[1] || (targetAttr ? '_blank' : '')).toLowerCase();
      if (targetValue === '_blank' && !relValues.includes('noopener')) {
        relValues.push('noopener');
      }

      // 새로운 a 태그 생성
      return `<a ${cleanedBefore}href="${href}"${cleanedAfter} rel="${relValues.join(' ')}"${targetAttr}>`;
    } catch (error) {
      // URL 파싱 실패 시 원본 반환
      console.warn('Failed to parse URL:', href, error);
      return match;
    }
  });
}

/**
 * React 컴포넌트에서 dangerouslySetInnerHTML 사용 시
 * UGC 콘텐츠를 안전하게 렌더링하기 위한 헬퍼 함수
 *
 * @param htmlContent - 원본 HTML 콘텐츠
 * @param options - sanitizeUgcLinks 옵션
 * @returns dangerouslySetInnerHTML용 객체
 */
export function createSafeUgcMarkup(
  htmlContent: string,
  options?: Parameters<typeof sanitizeUgcLinks>[1]
) {
  return {
    __html: sanitizeUgcLinks(htmlContent, options)
  };
}

/**
 * 광고성/스폰서 링크인지 자동 감지하는 유틸리티
 *
 * @param htmlContent - HTML 콘텐츠
 * @returns rel="sponsored" 적용된 HTML
 */
export function detectAndMarkSponsoredLinks(htmlContent: string): string {
  // 광고성 키워드 패턴
  const sponsoredPatterns = [
    /affiliate/i,
    /sponsor/i,
    /ad[_-]?click/i,
    /tracking/i,
    /referral/i,
    /promotion/i,
  ];

  const linkRegex = /<a\s+([^>]*?)href=["']([^"']*)["']([^>]*?)>/gi;

  return htmlContent.replace(linkRegex, (match, beforeHref, href, afterHref) => {
    // 링크에 광고성 키워드가 포함되어 있는지 확인
    const isSponsored = sponsoredPatterns.some(pattern => pattern.test(href));

    if (isSponsored) {
      // sponsored 링크로 처리
      return sanitizeUgcLinks(match, {
        addSponsored: true,
        addNofollow: true, // 광고 링크는 nofollow도 함께 적용
      });
    }

    return match;
  });
}
