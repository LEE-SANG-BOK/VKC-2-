-- 테스트 질문 데이터 추가 스크립트
-- Supabase SQL Editor에서 실행

-- 1. 테스트 사용자 생성 (질문 작성자)
INSERT INTO users (
  id,
  email,
  name,
  role,
  verification_status,
  visa_type,
  region,
  is_verified,
  trust_score
) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  'test1@vietkconnect.com',
  '응우옌 반 하',
  'user',
  'none',
  'E-9',
  '경기',
  false,
  25
),
(
  '00000000-0000-0000-0000-000000000002',
  'test2@vietkconnect.com',
  '레 티 민',
  'verified',
  'approved',
  'D-2',
  '서울',
  true,
  75
)
ON CONFLICT (id) DO NOTHING;

-- 2. 테스트 질문 2개 추가
INSERT INTO questions (
  id,
  title,
  content,
  author_id,
  category_id,
  tags,
  urgency,
  view_count,
  status,
  is_approved
) VALUES
-- 질문 1: 비자 관련
(
  '10000000-0000-0000-0000-000000000001',
  'E-9 비자 연장 신청은 어디서 하나요?',
  '안녕하세요. 저는 현재 E-9 비자로 일하고 있는데 곧 만료됩니다. 비자 연장 신청을 어디서 해야 하는지, 어떤 서류가 필요한지 궁금합니다. 경험 있으신 분들의 조언 부탁드립니다.',
  '00000000-0000-0000-0000-000000000001',
  17,  -- 비자/법률 카테고리 (실제 DB ID)
  ARRAY['E-9', '비자연장', '외국인등록증'],
  'high',
  15,
  'open',
  true
),
-- 질문 2: 교육 관련
(
  '10000000-0000-0000-0000-000000000002',
  'TOPIK 5급 공부 방법 추천해주세요',
  '현재 TOPIK 3급인데 5급까지 따려고 합니다. 회사에서 한국어 능력이 필요해서요. 효과적인 공부 방법이나 추천 교재가 있을까요? 특히 읽기와 쓰기 영역이 약한데 어떻게 준비하면 좋을지 조언 부탁드립니다.',
  '00000000-0000-0000-0000-000000000002',
  20,  -- 교육/학업 카테고리 (실제 DB ID)
  ARRAY['TOPIK', '한국어', '5급', '공부방법'],
  'normal',
  42,
  'open',
  true
);

-- 확인 쿼리
SELECT
  q.id,
  q.title,
  u.name as author_name,
  c.name as category_name,
  q.tags,
  q.view_count,
  q.status,
  q.created_at
FROM questions q
JOIN users u ON q.author_id = u.id
JOIN categories c ON q.category_id = c.id
ORDER BY q.created_at DESC
LIMIT 2;
