export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

export interface SearchExample {
  id: string;
  title: string;
}

export interface SearchExamplesResponse {
  examples: SearchExample[];
}

export type SearchKeywordSource = 'tag' | 'category' | 'subcategory';

export interface SearchKeyword {
  value: string;
  count: number;
  source: SearchKeywordSource;
}

export interface SearchKeywordsResponse {
  keywords: SearchKeyword[];
  query?: string;
}
