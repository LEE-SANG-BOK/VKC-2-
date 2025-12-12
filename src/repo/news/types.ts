export interface NewsItem {
  id: string;
  title: string;
  category: string;
  language: string;
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
