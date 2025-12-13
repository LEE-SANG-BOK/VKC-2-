const bannedPatterns = [
  /씨발/i,
  /시발/i,
  /\bsex\b/i,
  /fuck/i,
  /shit/i,
  /đụ\s?m[aá]/i,
  /duma/i,
  /\bđm\b/i,
  /dm\s/gi,
  /đụm/i,
  /địt/i,
];

const spamPatterns = [
  /https?:\/\//i,
  /www\./i,
  /\S+@\S+\.\S+/i,
  /\b\d{2,3}-\d{3,4}-\d{4}\b/,
  /\b\d{9,}\b/,
  /(무료\s?상담|할인|대행|브로커|알선|유학원|visa\s?agency)/i,
];

export function hasProhibitedContent(text: string | undefined | null): boolean {
  if (!text) return false;
  // 허용할 내부/자체 호스트 URL (이미지 업로드 등)
  const allowedUrlPatterns = [
    /https?:\/\/[^"'\s]*supabase\.co\/storage\/v1\/object\//i,
    /https?:\/\/[^"'\s]*viet[-]?kconnect/i,
  ];

  // 텍스트 내 URL을 추출해 허용 URL은 임시 제거 후 검사
  const urlRegex = /https?:\/\/[^\s"']+/gi;
  let sanitized = text;
  const urls = text.match(urlRegex) || [];
  urls.forEach((url) => {
    const isAllowed = allowedUrlPatterns.some((p) => p.test(url));
    if (isAllowed) {
      sanitized = sanitized.replace(url, '');
    }
  });

  return bannedPatterns.some((p) => p.test(sanitized)) || spamPatterns.some((p) => p.test(sanitized));
}
