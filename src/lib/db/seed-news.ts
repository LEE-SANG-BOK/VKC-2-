import 'dotenv/config';
import { db } from './index';
import { news } from './schema';

const newsData = [
  {
    title: '베트남 경제성장률 6.5% 전망, 아세안 최고 수준',
    category: '경제',
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop',
    linkUrl: 'https://example.com/news/1',
    order: 1,
  },
  {
    title: '호치민시 메트로 1호선 2024년 말 개통 예정',
    category: '교통',
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=300&fit=crop',
    linkUrl: 'https://example.com/news/2',
    order: 2,
  },
  {
    title: '한-베 수교 32주년 기념행사 성황리 개최',
    category: '문화',
    imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop',
    linkUrl: 'https://example.com/news/3',
    order: 3,
  },
  {
    title: '베트남 IT 인력 수요 급증, 한국 기업 진출 확대',
    category: 'IT',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=300&fit=crop',
    linkUrl: 'https://example.com/news/4',
    order: 4,
  },
  {
    title: '다낭-호이안 관광객 역대 최고 기록 경신',
    category: '관광',
    imageUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400&h=300&fit=crop',
    linkUrl: 'https://example.com/news/5',
    order: 5,
  },
  {
    title: '베트남 스타트업 투자 유치 2조원 돌파',
    category: '비즈니스',
    imageUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=300&fit=crop',
    linkUrl: 'https://example.com/news/6',
    order: 6,
  },
];

async function seedNews() {
  console.log('📰 Seeding news...');

  for (const item of newsData) {
    await db.insert(news).values({
      title: item.title,
      category: item.category,
      imageUrl: item.imageUrl,
      linkUrl: item.linkUrl,
      order: item.order,
      isActive: true,
    });
  }

  console.log(`✅ Created ${newsData.length} news items`);
}

seedNews()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
