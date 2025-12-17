import { NewsItem } from './types';
const API_BASE =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');

export async function fetchNews(lang?: string): Promise<NewsItem[]> {
  const locale = lang || 'vi';
  const query = `?lang=${locale}`;
  const url =
    typeof window === 'undefined'
      ? `${API_BASE || 'http://localhost:3000'}/api/news${query}`
      : `/api/news${query}`;
  
  const res = await fetch(url, {
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch news');
  }
  const json = await res.json();
  return json.data;
}
