import { NewsItem } from './types';
import { apiUrl } from '@/repo/apiBase';

export async function fetchNews(lang?: string): Promise<NewsItem[]> {
  const locale = lang || 'vi';
  const url = apiUrl(`/api/news?lang=${locale}`);
  
  const res = await fetch(url, {
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch news');
  }
  const json = await res.json();
  return json.data;
}
