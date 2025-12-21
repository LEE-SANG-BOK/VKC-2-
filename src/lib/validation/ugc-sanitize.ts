import sanitizeHtml from 'sanitize-html';

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'blockquote',
  'ul',
  'ol',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'pre',
  'code',
  'a',
  'img',
] as const;

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions['allowedAttributes'] = {
  a: ['href', 'target', 'rel'],
  img: ['src', 'alt', 'title', 'width', 'height', 'data-thumbnail'],
};

export const sanitizeUgcHtml = (input: string): string => {
  const trimmed = input.trim();
  if (!trimmed) return '';

  return sanitizeHtml(trimmed, {
    allowedTags: [...ALLOWED_TAGS],
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ['http', 'https'],
    allowProtocolRelative: false,
    disallowedTagsMode: 'discard',
  }).trim();
};
