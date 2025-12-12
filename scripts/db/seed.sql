-- =====================================================
-- Viet K-Connect Seed Data Script
-- Created by Agent 4 - Test Data for Development
-- Date: 2025-09-30
-- =====================================================

-- Note: This script creates sample data for development and testing
-- DO NOT run this in production environment

-- =====================================================
-- 1. SAMPLE USERS
-- =====================================================

INSERT INTO users (
  id, email, name, avatar_url, provider, visa_type, company,
  years_in_korea, region, is_verified, trust_score, badges,
  question_count, answer_count, helpful_answer_count
) VALUES
-- Vietnamese Users
('550e8400-e29b-41d4-a716-446655440001', 'nguyen.minh@example.com', '응우옌 민', 'https://i.pravatar.cc/150?u=1', 'kakao', 'E-7', '삼성전자', 3, '서울', true, 847, '{"senior": true, "expert": true, "verified": true}', 15, 42, 35),
('550e8400-e29b-41d4-a716-446655440002', 'tran.thu@example.com', '쩐 투', 'https://i.pravatar.cc/150?u=2', 'google', 'E-2', '현대자동차', 5, '울산', true, 632, '{"senior": true, "verified": true, "helper": true}', 8, 28, 20),
('550e8400-e29b-41d4-a716-446655440003', 'le.hoa@example.com', '레 호아', 'https://i.pravatar.cc/150?u=3', 'facebook', 'F-4', 'LG전자', 7, '서울', true, 945, '{"senior": true, "expert": true, "verified": true, "helper": true}', 22, 67, 58),
('550e8400-e29b-41d4-a716-446655440004', 'pham.duc@example.com', '팜 둑', 'https://i.pravatar.cc/150?u=4', 'kakao', 'E-1', '네이버', 2, '분당', false, 234, '{"verified": false}', 5, 12, 8),
('550e8400-e29b-41d4-a716-446655440005', 'vu.linh@example.com', '부 린', 'https://i.pravatar.cc/150?u=5', 'google', 'F-2', '카카오', 4, '판교', true, 578, '{"verified": true, "helper": true}', 12, 31, 24),

-- Korean Helper Users
('550e8400-e29b-41d4-a716-446655440006', 'kim.helper@example.com', '김도우미', 'https://i.pravatar.cc/150?u=6', 'kakao', null, '법무법인 광장', 0, '서울', true, 1200, '{"expert": true, "verified": true, "moderator": true}', 0, 89, 78),
('550e8400-e29b-41d4-a716-446655440007', 'park.visa@example.com', '박비자', 'https://i.pravatar.cc/150?u=7', 'google', null, '출입국사무소', 0, '서울', true, 980, '{"expert": true, "verified": true}', 2, 156, 134),
('550e8400-e29b-41d4-a716-446655440008', 'lee.job@example.com', '이취업', 'https://i.pravatar.cc/150?u=8', 'kakao', null, '잡코리아', 0, '서울', true, 756, '{"expert": true, "verified": true}', 1, 73, 65),

-- New Users
('550e8400-e29b-41d4-a716-446655440009', 'dao.newbie@example.com', '다오 뉴비', 'https://i.pravatar.cc/150?u=9', 'google', 'D-2', '연세대학교', 1, '신촌', false, 45, '{}', 3, 1, 0),
('550e8400-e29b-41d4-a716-446655440010', 'hoang.student@example.com', '황 스튜던트', 'https://i.pravatar.cc/150?u=10', 'kakao', 'D-4', '고려대학교', 2, '안암', false, 89, '{}', 7, 5, 2);

-- =====================================================
-- 2. SAMPLE QUESTIONS (Based on common Vietnamese issues in Korea)
-- =====================================================

INSERT INTO questions (
  id, title, content, author_id, category_id, tags, urgency,
  view_count, upvote_count, status, created_at
) VALUES
-- Visa/Legal Questions
('650e8400-e29b-41d4-a716-446655440001',
 'E-7 비자에서 F-2 비자로 변경 가능한가요?',
 '안녕하세요. 현재 E-7 비자로 3년째 한국에서 일하고 있는 베트남 사람입니다. F-2 거주비자로 변경하고 싶은데 조건이 어떻게 되는지 궁금합니다. 연봉이나 한국어 능력 등 필요한 조건들을 자세히 알려주세요.',
 '550e8400-e29b-41d4-a716-446655440001', 1, ARRAY['F2비자', 'E7비자', '체류자격변경'], 'normal', 156, 12, 'open', NOW() - INTERVAL '2 days'),

('650e8400-e29b-41d4-a716-446655440002',
 'F-4 비자 발급 조건과 필요 서류가 궁금해요',
 'F-4 재외동포 비자를 받고 싶은데 어떤 조건을 만족해야 하나요? 베트남에서 준비해야 할 서류들과 한국 영사관에서의 절차를 알려주세요.',
 '550e8400-e29b-41d4-a716-446655440004', 1, ARRAY['F4비자', '재외동포', '서류준비'], 'high', 89, 8, 'open', NOW() - INTERVAL '1 day'),

-- Job/Career Questions
('650e8400-e29b-41d4-a716-446655440003',
 '한국 IT 회사 취업 시 필요한 한국어 수준은?',
 '베트남에서 소프트웨어 개발자로 3년 경력이 있습니다. 한국 IT 회사에 취업하려면 한국어를 어느 정도까지 해야 할까요? TOPIK 몇 급 정도가 필요한지, 실제 업무에서는 어떤 수준의 한국어가 요구되는지 궁금합니다.',
 '550e8400-e29b-41d4-a716-446655440005', 2, ARRAY['IT취업', '한국어수준', 'TOPIK'], 'normal', 234, 18, 'open', NOW() - INTERVAL '3 hours'),

('650e8400-e29b-41d4-a716-446655440004',
 '한국에서 카페 창업하려면 어떤 절차가 필요한가요?',
 '베트남 음식과 커피를 판매하는 카페를 열고 싶습니다. 외국인 창업 절차, 필요한 허가증, 자본금 등에 대해 알려주세요.',
 '550e8400-e29b-41d4-a716-446655440002', 2, ARRAY['창업', '카페', '사업자등록'], 'normal', 178, 15, 'open', NOW() - INTERVAL '5 hours'),

-- Life Information
('650e8400-e29b-41d4-a716-446655440005',
 '서울에서 베트남 식재료 구입할 수 있는 곳 추천해주세요',
 '한국 생활한 지 얼마 안 되어서 베트남 음식이 그리워요. 서울에서 베트남 식재료(쌀국수, 피시소스, 베트남 쌀 등)를 살 수 있는 마트나 온라인 쇼핑몰을 추천해주세요.',
 '550e8400-e29b-41d4-a716-446655440009', 3, ARRAY['베트남음식', '식재료', '서울'], 'low', 67, 5, 'open', NOW() - INTERVAL '6 hours'),

-- Healthcare
('650e8400-e29b-41d4-a716-446655440006',
 '국민건강보험 가입과 병원 이용 방법',
 'E-7 비자로 한국에 온 지 1개월 됐습니다. 국민건강보험 가입은 어떻게 하나요? 병원 갈 때 필요한 것들과 진료비는 얼마나 나오는지 알려주세요.',
 '550e8400-e29b-41d4-a716-446655440010', 5, ARRAY['건강보험', '병원', '의료비'], 'high', 145, 11, 'open', NOW() - INTERVAL '1 hour'),

-- Education/Language
('650e8400-e29b-41d4-a716-446655440007',
 'TOPIK 6급 준비 효과적인 공부 방법 추천',
 '현재 TOPIK 4급인데 6급까지 올리고 싶어요. 독학으로 공부 중인데 효과적인 학습 방법이나 추천 교재가 있나요? 특히 쓰기 영역이 어려워서 도움이 필요합니다.',
 '550e8400-e29b-41d4-a716-446655440004', 4, ARRAY['TOPIK', '한국어공부', '쓰기'], 'normal', 92, 7, 'open', NOW() - INTERVAL '4 hours'),

-- Finance/Banking
('650e8400-e29b-41d4-a716-446655440008',
 '외국인도 한국에서 주택담보대출 받을 수 있나요?',
 'F-2 비자 소지자입니다. 한국에서 아파트를 사고 싶은데 외국인도 주택담보대출을 받을 수 있는지 궁금합니다. 은행별로 조건이 다른가요?',
 '550e8400-e29b-41d4-a716-446655440003', 6, ARRAY['주택담보대출', '아파트구매', '외국인대출'], 'normal', 203, 14, 'open', NOW() - INTERVAL '2 hours'),

-- Urgent Questions
('650e8400-e29b-41d4-a716-446655440009',
 '회사에서 갑자기 해고 통보받았어요. 어떻게 해야 하나요?',
 'E-7 비자로 일하던 회사에서 갑자기 해고 통보를 받았습니다. 노동법상 권리와 비자 문제는 어떻게 되는지 급하게 알아야 합니다. 도움 부탁드려요.',
 '550e8400-e29b-41d4-a716-446655440005', 2, ARRAY['해고', '노동법', '비자문제'], 'urgent', 45, 3, 'open', NOW() - INTERVAL '30 minutes'),

('650e8400-e29b-41d4-a716-446655440010',
 '교통사고 났는데 외국인은 어떤 절차를 따라야 하나요?',
 '오늘 아침에 교통사고가 났습니다. 다행히 크게 다치지는 않았는데 외국인이라 어떤 절차를 따라야 할지 모르겠어요. 보험 처리나 경찰서 신고 등 급하게 알려주세요.',
 '550e8400-e29b-41d4-a716-446655440010', 3, ARRAY['교통사고', '보험처리', '응급'], 'urgent', 23, 1, 'open', NOW() - INTERVAL '15 minutes');

-- =====================================================
-- 3. SAMPLE ANSWERS
-- =====================================================

INSERT INTO answers (
  id, content, question_id, author_id, is_accepted, upvote_count, helpful_count
) VALUES
-- Answer to E-7 to F-2 visa question
('750e8400-e29b-41d4-a716-446655440001',
 'F-2 비자 변경 조건은 다음과 같습니다:

1. **기본 요건**
   - 국내 체류기간 3년 이상 (E-7으로)
   - 연평균 소득 GNI 80% 이상 (약 3,500만원)
   - 한국어능력시험(TOPIK) 3급 이상 또는 사회통합프로그램 이수

2. **필요 서류**
   - 체류자격변경허가신청서
   - 소득증명서류 (3년치)
   - 한국어능력증명서
   - 건강보험 가입증명서
   - 범죄경력증명서

3. **심사 기간**: 약 2-4주

출입국사무소에서 정확한 상담받으시기를 추천드립니다.',
 '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440006', true, 15, 12),

-- Answer to IT job Korean level question
('750e8400-e29b-41d4-a716-446655440002',
 'IT 회사 취업 시 한국어 요구사항은 회사와 직무에 따라 다릅니다:

**글로벌 회사 (삼성, LG 등)**
- TOPIK 4급 이상 권장
- 영어 업무가 많아 한국어 부담 적음
- 기술면접은 영어로도 가능

**국내 회사**
- TOPIK 5급 이상 필요
- 동료와의 소통, 문서작업 한국어 필수
- 업무 회의 참여 위해 회화 실력 중요

**실제 경험상 조언**
- 코딩 실력이 뛰어나면 한국어 부족해도 채용
- 입사 후 한국어 향상 지원하는 회사 많음
- GitHub 포트폴리오 잘 준비하시길!',
 '650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440008', true, 22, 18),

-- Answer to health insurance question
('750e8400-e29b-41d4-a716-446655440003',
 '국민건강보험 가입과 병원 이용 절차를 안내드립니다:

**건강보험 가입**
1. 회사에서 자동 가입 (직장가입자)
2. 개인 가입시 국민건강보험공단 방문
3. 가입 후 약 1주일 내 건강보험증 발급

**병원 이용방법**
1. 건강보험증 또는 외국인등록증 지참
2. 동네 병원(의원) → 종합병원 순서로 이용
3. 응급실은 24시간 이용 가능

**진료비 (본인부담금)**
- 동네 의원: 약 3,000-5,000원
- 종합병원: 약 7,000-15,000원
- 약값 별도 (보험적용시 30% 본인부담)

**주의사항**: 의료진과 소통 위해 번역앱 준비하세요!',
 '650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440007', false, 8, 6),

-- Answer to urgent layoff question
('750e8400-e29b-41d4-a716-446655440004',
 '갑작스러운 해고에 대한 즉시 대응방법입니다:

**즉시 해야 할 일**
1. 해고 사유서 요구 (서면으로)
2. 근로계약서, 급여명세서 등 서류 확보
3. 고용노동부 고객상담센터 1350 신고

**비자 관련 대응**
- E-7 비자: 해고 후 다른 회사 취업까지 체류 가능 (조건부)
- 출입국사무소에 즉시 상황 신고 필요
- 새 직장 구할 때까지 최대 6개월 가능

**법적 권리**
- 30일 전 해고예고 또는 30일분 급여
- 정당한 사유 없는 해고는 부당해고
- 노동위원회 구제신청 가능

**긴급 상담처**
- 고용노동부: 1350
- 외국인종합안내센터: 1345

지금 즉시 1350에 전화해서 상담받으세요!',
 '650e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440006', false, 5, 4);

-- =====================================================
-- 4. SAMPLE VOTES
-- =====================================================

INSERT INTO votes (user_id, target_id, target_type, vote_type) VALUES
-- Upvotes on questions
('550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440001', 'question', 'up'),
('550e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440001', 'question', 'up'),
('550e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440001', 'question', 'up'),
('550e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440003', 'question', 'up'),
('550e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440003', 'question', 'up'),

-- Upvotes on answers
('550e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', 'answer', 'up'),
('550e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440001', 'answer', 'up'),
('550e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440001', 'answer', 'up'),
('550e8400-e29b-41d4-a716-446655440004', '750e8400-e29b-41d4-a716-446655440002', 'answer', 'up'),
('550e8400-e29b-41d4-a716-446655440005', '750e8400-e29b-41d4-a716-446655440002', 'answer', 'up'),

-- Helpful votes
('550e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', 'answer', 'helpful'),
('550e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440001', 'answer', 'helpful'),
('550e8400-e29b-41d4-a716-446655440009', '750e8400-e29b-41d4-a716-446655440004', 'answer', 'helpful');

-- =====================================================
-- 5. SAMPLE COMMENTS
-- =====================================================

INSERT INTO comments (id, content, target_id, target_type, author_id) VALUES
('850e8400-e29b-41d4-a716-446655440001',
 '정말 유용한 정보네요! 저도 F-2 준비 중이라 도움이 많이 됐습니다.',
 '750e8400-e29b-41d4-a716-446655440001', 'answer', '550e8400-e29b-41d4-a716-446655440002'),

('850e8400-e29b-41d4-a716-446655440002',
 'TOPIK 3급이면 충분한가요? 4급은 꼭 필요한 건 아닌가요?',
 '750e8400-e29b-41d4-a716-446655440001', 'answer', '550e8400-e29b-41d4-a716-446655440004'),

('850e8400-e29b-41d4-a716-446655440003',
 '감사합니다! 한국어 공부 더 열심히 해야겠어요 ㅠㅠ',
 '750e8400-e29b-41d4-a716-446655440002', 'answer', '550e8400-e29b-41d4-a716-446655440005');

-- =====================================================
-- 6. SAMPLE NOTIFICATIONS
-- =====================================================

INSERT INTO notifications (id, user_id, type, title, message, related_id, related_type) VALUES
('950e8400-e29b-41d4-a716-446655440001',
 '550e8400-e29b-41d4-a716-446655440001', 'new_answer',
 '새로운 답변이 등록되었습니다',
 'E-7 비자에서 F-2 비자로 변경 가능한가요? 질문에 새로운 답변이 등록되었습니다.',
 '750e8400-e29b-41d4-a716-446655440001', 'answer'),

('950e8400-e29b-41d4-a716-446655440002',
 '550e8400-e29b-41d4-a716-446655440005', 'answer_accepted',
 '답변이 채택되었습니다!',
 '한국 IT 회사 취업 시 필요한 한국어 수준은? 질문에 대한 답변이 채택되었습니다.',
 '750e8400-e29b-41d4-a716-446655440002', 'answer'),

('950e8400-e29b-41d4-a716-446655440003',
 '550e8400-e29b-41d4-a716-446655440006', 'question_upvoted',
 '질문이 추천되었습니다',
 '회사에서 갑자기 해고 통보받았어요. 어떻게 해야 하나요? 질문이 추천을 받았습니다.',
 '650e8400-e29b-41d4-a716-446655440009', 'question');

-- =====================================================
-- 7. UPDATE COUNTERS (Trigger simulation)
-- =====================================================

-- Update question answer counts
UPDATE questions SET answer_count = (
  SELECT COUNT(*) FROM answers WHERE question_id = questions.id
);

-- Update question upvote counts
UPDATE questions SET upvote_count = (
  SELECT COUNT(*) FROM votes
  WHERE target_id = questions.id
  AND target_type = 'question'
  AND vote_type = 'up'
);

-- Update answer upvote counts
UPDATE answers SET upvote_count = (
  SELECT COUNT(*) FROM votes
  WHERE target_id = answers.id
  AND target_type = 'answer'
  AND vote_type = 'up'
);

-- Update answer helpful counts
UPDATE answers SET helpful_count = (
  SELECT COUNT(*) FROM votes
  WHERE target_id = answers.id
  AND target_type = 'answer'
  AND vote_type = 'helpful'
);

-- Update user activity counts
UPDATE users SET
  question_count = (SELECT COUNT(*) FROM questions WHERE author_id = users.id),
  answer_count = (SELECT COUNT(*) FROM answers WHERE author_id = users.id);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check data integrity
SELECT 'Data verification completed' as status;
SELECT 'Users created: ' || COUNT(*) as user_count FROM users;
SELECT 'Questions created: ' || COUNT(*) as question_count FROM questions;
SELECT 'Answers created: ' || COUNT(*) as answer_count FROM answers;
SELECT 'Categories available: ' || COUNT(*) as category_count FROM categories;
SELECT 'Votes recorded: ' || COUNT(*) as vote_count FROM votes;
SELECT 'Comments created: ' || COUNT(*) as comment_count FROM comments;