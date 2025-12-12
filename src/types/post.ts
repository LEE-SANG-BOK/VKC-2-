export interface User {
  id: string;
  nickname: string;
  profileImage: string;
  isFollowing: boolean;
}

export interface Category {
  main: string;
  sub: string;
}

export interface Post {
  id: string;
  author: User;
  title: string;
  content: string;
  category: Category;
  createdAt: Date;
  helpful: number;
  isHelpful: boolean;
  isBookmarked: boolean;
  commentCount: number;
  imageUrl?: string;
}

export type ViewMode = 'latest' | 'category' | 'following';
