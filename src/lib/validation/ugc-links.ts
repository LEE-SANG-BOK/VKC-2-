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

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://example.com';

const buildAllowlist = () => {
  const envDomains = (process.env.UGC_ALLOWED_DOMAINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const defaults = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    'gov.kr',
    'go.kr',
    'korea.kr',
    'hikorea.go.kr',
    'immigration.go.kr',
    'moel.go.kr',
    'mofa.go.kr',
  ]
    .filter(Boolean)
    .map((value) => toHostname(String(value)));

  return new Set([...defaults, ...envDomains.map((value) => toHostname(value))].filter(Boolean));
};

const allowlist = buildAllowlist();

const extractUrls = (content: string) => {
  const urls = new Set<string>();
  const attrRegex = /(?:href|src)=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = attrRegex.exec(content))) {
    if (match[1]) urls.add(match[1]);
  }
  const plainRegex = /https?:\/\/[^\s"'<>]+/gi;
  const plainMatches = content.match(plainRegex) || [];
  plainMatches.forEach((url) => urls.add(url));
  return Array.from(urls);
};

const isAllowedHost = (hostname: string) =>
  Array.from(allowlist).some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));

export const validateUgcExternalLinks = (content: string) => {
  if (!content) return { ok: true } as const;
  const urls = extractUrls(content);
  for (const url of urls) {
    const trimmed = url.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('?')) continue;
    if (trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) continue;
    const parsed = new URL(trimmed, baseUrl);
    if (!isAllowedHost(parsed.hostname)) {
      return { ok: false, domain: parsed.hostname } as const;
    }
  }
  return { ok: true } as const;
};
