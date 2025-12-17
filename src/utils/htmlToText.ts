export function stripHtmlToText(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|blockquote)>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function stripHtml(html: string) {
  return stripHtmlToText(html).replace(/\s+/g, ' ').trim();
}
