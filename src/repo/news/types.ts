export interface NewsItem {
  id: string;
  title: string;
  category: string;
  language: string;
  type: 'post' | 'cardnews' | 'shorts';
  content: string;
  imageUrl: string | null;
  linkUrl: string | null;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface NewsResponse {
  data: NewsItem[];
}
