import dayjs from 'dayjs';
import { PostDetail } from './PostDetailClient';

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface Comment {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  content: string;
  publishedAt: string;
  likes: number;
  isLiked: boolean;
  replies?: Comment[];
}

interface ApiAuthor {
  id?: string;
  name?: string;
  displayName?: string;
  image?: string;
  isVerified?: boolean;
}

interface ApiComment {
  id: string;
  content: string;
  likes: number;
  createdAt: string;
  author?: ApiAuthor;
  replies?: ApiComment[];
}

interface ApiAnswer {
  id: string;
  content: string;
  likes: number;
  isAdopted: boolean;
  createdAt: string;
  author?: ApiAuthor;
  comments?: ApiComment[];
}

const countComments = (comments?: Comment[]): number => {
  if (!comments || comments.length === 0) return 0;
  return comments.reduce((total, comment) => {
    return total + 1 + (comment.replies?.length || 0);
  }, 0);
};

// 카테고리별 게시글 데이터
export const mockPosts: { [key: string]: PostDetail } = {
  '1': {
    id: '1',
    category: 'tech',
    author: {
      id: 'user1',
      name: '김개발',
      avatar: '/avatar1.jpg',
      followers: 1200,
      isFollowing: false,
      isVerified: true,
    },
    title: 'Next.js 15 App Router 마이그레이션 중 에러가 발생합니다',
    content: `<p>Next.js 14에서 15로 업그레이드하면서 App Router로 마이그레이션을 진행하고 있습니다.</p>
<p>하지만 다음과 같은 에러가 계속 발생합니다:</p>
<pre><code>Error: Cannot find module 'next/navigation'
  at requireModule (internal/module.js:12:19)</code></pre>
<p><strong>시도한 방법:</strong></p>
<ul>
  <li>node_modules 삭제 후 재설치</li>
  <li>Next.js 버전 재설치</li>
  <li>캐시 삭제</li>
</ul>
<p>어떻게 해결할 수 있을까요? 도움 부탁드립니다!</p>`,
    tags: ['Next.js', 'React', '웹개발', '에러'],
    stats: { likes: 15, comments: 2, shares: 3 },
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&h=600&fit=crop',
    publishedAt: '2시간 전',
    isLiked: false,
    isBookmarked: false,
    isQuestion: true,
    isAdopted: true,
    comments: [],
    answers: [
      {
        id: 'a1',
        author: { id: 'user2', name: '이리액트', avatar: '/avatar2.jpg', isVerified: true },
        content: `<p>이 문제는 Next.js 15에서 <code>next/navigation</code> 모듈의 경로가 변경되어 발생하는 것 같습니다.</p>
<p><strong>해결 방법:</strong></p>
<ol>
  <li>먼저 <code>package.json</code>에서 Next.js 버전이 정확히 15.x.x인지 확인하세요.</li>
  <li><code>next.config.js</code> 파일에서 다음 설정을 추가하세요:
    <pre><code>module.exports = {
  experimental: {
    appDir: true,
  },
}</code></pre>
  </li>
  <li>터미널에서 다음 명령어를 실행하세요:
    <pre><code>rm -rf .next
npm install
npm run dev</code></pre>
  </li>
</ol>
<p>이렇게 하면 대부분의 경우 해결됩니다. 여전히 문제가 있다면 TypeScript 설정도 확인해보세요!</p>`,
        publishedAt: '1시간 전',
        helpful: 24,
        isHelpful: false,
        isAdopted: true,
      },
      {
        id: 'a2',
        author: { id: 'user3', name: '박프론트', avatar: '/avatar3.jpg' },
        content: `<p>저도 비슷한 문제를 겪었는데, <code>tsconfig.json</code> 설정 문제일 수도 있습니다.</p>
<p>다음 설정을 확인해보세요:</p>
<pre><code>{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}</code></pre>
<p>그리고 <strong>반드시 개발 서버를 재시작</strong>해야 합니다!</p>`,
        publishedAt: '30분 전',
        helpful: 8,
        isHelpful: false,
        isAdopted: false,
      },
    ],
  },
  '2': {
    id: '2',
    category: 'business',
    author: {
      name: '박경영',
      avatar: '/avatar2.jpg',
      followers: 850,
      isFollowing: false,
    },
    title: '스타트업 성공을 위한 비즈니스 전략',
    content: `초기 스타트업이 시장에서 살아남고 성장하기 위한 핵심 전략들을 실제 사례와 함께 소개합니다.

## 스타트업의 생존 전략

### 1. MVP 개발
최소 기능 제품(MVP)으로 빠르게 시장을 테스트하세요. 완벽함보다는 빠른 피드백이 중요합니다.

### 2. 고객 중심 사고
고객의 문제를 진정으로 해결하는 제품을 만들어야 합니다. 지속적인 고객 인터뷰와 피드백 수집이 필수입니다.

### 3. 린 스타트업 방법론
낭비를 최소화하고 빠른 실험과 학습을 반복하세요. 실패를 두려워하지 말고 빠르게 실패하고 배우세요.

### 4. 네트워크와 멘토링
경험 있는 선배 창업자들의 조언을 구하고 네트워크를 구축하세요. 혼자서는 알 수 없는 함정을 피할 수 있습니다.

스타트업의 성공은 운이 아닌 전략과 실행력의 결과입니다!`,
    tags: ['스타트업', '비즈니스', '전략'],
    stats: { likes: 189, comments: 0, shares: 45 },
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=600&fit=crop',
    publishedAt: '3시간 전',
    isLiked: false,
    isBookmarked: false,
    comments: [
      {
        id: '1',
        author: { name: '최창업', avatar: '/avatar3.jpg', isVerified: false },
        content: 'MVP 개발 전략 부분이 특히 도움이 되었습니다!',
        publishedAt: '1시간 전',
        likes: 8,
        isLiked: false,
        replies: [
          {
            id: '2',
            author: { name: '박경영', avatar: '/avatar2.jpg', isVerified: false },
            content: '감사합니다! 실제로 적용해보시고 피드백 주시면 좋겠습니다.',
            publishedAt: '30분 전',
            likes: 3,
            isLiked: false,
          },
        ],
      },
      {
        id: '3',
        author: { name: '정스타트', avatar: '/avatar4.jpg', isVerified: true },
        content: '린 스타트업 방법론 관련 추천 도서가 있을까요?',
        publishedAt: '2시간 전',
        likes: 5,
        isLiked: false,
      },
      {
        id: '4',
        author: { name: '윤사업', avatar: '/avatar5.jpg', isVerified: false },
        content: '네트워킹 부분이 정말 공감되네요. 혼자서는 한계가 있더라구요.',
        publishedAt: '2시간 전',
        likes: 7,
        isLiked: false,
      },
    ],
  },
  // Add more mock posts as needed
};

// 각 게시글의 댓글 수 계산 및 업데이트
Object.values(mockPosts).forEach(post => {
  post.stats.comments = countComments(post.comments);
});

export async function getPostById(id: string, cookieHeader?: string): Promise<PostDetail | null> {
  try {
    const res = await fetch(`${API_BASE}/api/posts/${id}`, {
      cache: 'no-store',
      headers: cookieHeader ? { Cookie: cookieHeader } : {},
    });

    if (!res.ok) {
      if (mockPosts[id]) {
        return mockPosts[id];
      }
      return null;
    }

    const response = await res.json();

    if (!response.success || !response.data) {
      if (mockPosts[id]) {
        return mockPosts[id];
      }
      return null;
    }

    const post = response.data;

    const likesArray = Array.isArray(post.likes) ? post.likes : [];
    const likesCount = typeof post.likes === 'number' ? post.likes : likesArray.length;

    const postDetail: PostDetail = {
      id: post.id,
      author: {
        id: post.author?.id,
        name: post.author?.displayName || post.author?.name || '알 수 없음',
        avatar: post.author?.image || '/avatar-default.jpg',
        followers: 0,
        isFollowing: post.author?.isFollowing || false,
        isVerified: post.author?.isVerified || false,
      },
      title: post.title,
      content: post.content,
      tags: post.tags || [],
      category: post.category,
      stats: {
        likes: likesCount,
        comments: (post.answers?.length || 0) + (post.comments?.length || 0),
        shares: 0,
      },
      publishedAt: dayjs(post.createdAt).format('YYYY.MM.DD HH:mm'),
      isLiked: post.isLiked || false,
      isBookmarked: post.isBookmarked || false,
      comments: post.comments?.map((c: ApiComment & { parentId?: string; isLiked?: boolean; likesCount?: number; replies?: ApiComment[] }) => ({
        id: c.id,
        author: {
          id: c.author?.id,
          name: c.author?.displayName || c.author?.name || '알 수 없음',
          avatar: c.author?.image || '/avatar-default.jpg',
          isVerified: c.author?.isVerified || false,
        },
        content: c.content,
        publishedAt: dayjs(c.createdAt).format('YYYY.MM.DD HH:mm'),
        likes: c.likesCount ?? c.likes ?? 0,
        isLiked: c.isLiked || false,
        replies: c.replies?.map((r: ApiComment & { isLiked?: boolean; likesCount?: number }) => ({
          id: r.id,
          author: {
            id: r.author?.id,
            name: r.author?.displayName || r.author?.name || '알 수 없음',
            avatar: r.author?.image || '/avatar-default.jpg',
            isVerified: r.author?.isVerified || false,
          },
          content: r.content,
          publishedAt: dayjs(r.createdAt).format('YYYY.MM.DD HH:mm'),
          likes: r.likesCount ?? r.likes ?? 0,
          isLiked: r.isLiked || false,
        })) || [],
      })) || [],
      answers: post.answers?.map((a: ApiAnswer & { isHelpful?: boolean; likesCount?: number }) => ({
        id: a.id,
        author: {
          id: a.author?.id,
          name: a.author?.displayName || a.author?.name || '알 수 없음',
          avatar: a.author?.image || '/avatar-default.jpg',
          isVerified: a.author?.isVerified || false,
        },
        content: a.content,
        publishedAt: dayjs(a.createdAt).format('YYYY.MM.DD HH:mm'),
        helpful: a.likesCount ?? a.likes ?? 0,
        isHelpful: a.isHelpful || false,
        isAdopted: a.isAdopted || false,
        replies: a.comments?.map((c: ApiComment & { isLiked?: boolean; likesCount?: number }) => ({
          id: c.id,
          author: {
            id: c.author?.id,
            name: c.author?.displayName || c.author?.name || '알 수 없음',
            avatar: c.author?.image || '/avatar-default.jpg',
            isVerified: c.author?.isVerified || false,
          },
          content: c.content,
          publishedAt: dayjs(c.createdAt).format('YYYY.MM.DD HH:mm'),
          likes: c.likesCount ?? c.likes ?? 0,
          isLiked: c.isLiked || false,
        })) || [],
      })) || [],
      isQuestion: post.type === 'question',
      isAdopted: post.isResolved || false,
    };

    return postDetail;
  } catch (error) {
    console.error('Failed to fetch post:', error);
    if (mockPosts[id]) {
      return mockPosts[id];
    }
    return null;
  }
}
