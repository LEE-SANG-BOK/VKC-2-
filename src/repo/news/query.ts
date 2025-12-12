import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../keys';
import { fetchNews } from './fetch';

export function useNews(lang?: string) {
  return useQuery({
    queryKey: queryKeys.news.byLang(lang),
    queryFn: () => fetchNews(lang),
    staleTime: 1000 * 60 * 5,
  });
}
