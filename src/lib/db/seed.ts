import { config } from 'dotenv';
config({ path: '.env.local' });
import { db } from './index';
import { users, posts, categories as categoriesTable } from './schema';
import { eq } from 'drizzle-orm';

const categoryData = [
  { name: '한국 취업', slug: 'jobs', icon: '💼', description: '베트남 한국 기업 취업 정보 및 노하우', sortOrder: 1 },
  { name: '한국 비자', slug: 'visa', icon: '✈️', description: '비자 발급, 연장, 변경 관련 최신 정보', sortOrder: 2 },
  { name: '한국 생활', slug: 'life', icon: '🏠', description: '주거, 교통, 생활 꿀팁 공유', sortOrder: 3 },
  { name: '한국 법률', slug: 'legal', icon: '⚖️', description: '생활 법률, 노무, 행정 상담', sortOrder: 4 },
  { name: '한국어 공부', slug: 'language', icon: '📚', description: 'TOPIK 준비 및 한국어 학습 자료', sortOrder: 5 },
  { name: '자유게시판', slug: 'free', icon: '🗣️', description: '자유롭게 이야기 나누는 공간', sortOrder: 6 },
];

async function seed() {
  console.log('🌱 Starting Real Data seed...');

  // 1. Create Categories (Fixed & Official)
  console.log('📂 Creating official categories...');
  const createdCategories = [];
  for (const cat of categoryData) {
    const [created] = await db.insert(categoriesTable).values({
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon,
      description: cat.description,
      sortOrder: cat.sortOrder,
      isActive: true,
    }).onConflictDoUpdate({
      target: categoriesTable.slug,
      set: {
        name: cat.name,
        icon: cat.icon,
        description: cat.description,
        sortOrder: cat.sortOrder
      }
    }).returning();
    createdCategories.push(created);
  }
  console.log(`✅ Created/Updated ${createdCategories.length} official categories`);

  // 2. Create Admin User (Single Official Account)
  console.log('👤 Creating Admin user...');
  // Note: In a real scenario, we might want to upsert based on a specific admin email.
  // For now, we'll create a standard admin placeholder if it doesn't exist.
  const adminEmail = 'admin@vietkconnect.com';

  const [adminUser] = await db.insert(users).values({
    name: 'Viet-K Connect',
    email: adminEmail,
    displayName: '관리자',
    bio: 'Viet-K Connect 공식 관리자 계정입니다.',
    isVerified: true,
    onboardingCompleted: true,
    isProfileComplete: true,
    image: 'https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff&format=png', // Simple placeholder
  }).onConflictDoUpdate({
    target: users.email,
    set: {
      displayName: '관리자',
      isVerified: true,
    }
  }).returning();

  console.log(`✅ Admin user ready: ${adminUser.email}`);

  // 3. Create Welcome Post (Single Official Content)
  console.log('📝 Creating Welcome post...');

  // Check if welcome post already exists to avoid duplicates
  const existingPosts = await db.query.posts.findMany({
    where: eq(posts.authorId, adminUser.id),
    limit: 1,
  });

  if (existingPosts.length === 0) {
    const freeCategory = createdCategories.find(c => c.slug === 'free');
    if (freeCategory) {
      await db.insert(posts).values({
        authorId: adminUser.id,
        type: 'share', // 'share' type for announcements
        title: 'Viet-K Connect에 오신 것을 환영합니다! 👋',
        content: `
          <p>안녕하세요, <strong>Viet-K Connect</strong>입니다.</p>
          <p>이곳은 베트남 거주 한인들을 위한 정보 교류 및 소통의 공간입니다.</p>
          <p>여러분의 소중한 경험과 지식을 나누어주세요.</p>
          <ul>
            <li><strong>한국 취업</strong>: 채용 정보와 취업 팁</li>
            <li><strong>한국 비자</strong>: 비자 관련 최신 뉴스</li>
            <li><strong>한국 생활</strong>: 맛집, 주거, 교통 정보</li>
            <li><strong>한국 법률</strong>: 생활 법률, 노무, 행정 상담</li>
            <li><strong>한국어 공부</strong>: TOPIK 준비 및 한국어 학습 자료</li>
          </ul>
          <p>서로 돕고 성장하는 커뮤니티가 되기를 바랍니다.</p>
          <p>감사합니다.</p>
        `,
        category: freeCategory.slug,
        tags: ['공지', '환영합니다', '필독'],
        views: 0,
        createdAt: new Date(),
      });
      console.log(`✅ Created Welcome post`);
    }
  } else {
    console.log(`ℹ️ Welcome post already exists, skipping.`);
  }

  console.log('🎉 Real Data Seed completed!');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
