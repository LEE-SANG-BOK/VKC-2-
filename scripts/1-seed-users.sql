-- ============================================
-- Phase 1.1: 사용자 데이터 (13명)
-- ============================================
-- 작성일: 2025-01-16
-- 목적: 테스트용 대표 사용자 13명 DB 입력
--
-- 구성:
-- - 베트남인 전문가: 6명 (다양한 비자 타입 및 전문 분야)
-- - 한국인 전문가: 3명 (법률/노동/행정)
-- - 일반 사용자: 3명
-- - 관리자: 1명

-- ============================================
-- 🇻🇳 베트남인 전문가 (6명)
-- ============================================

-- 1. ve1 - Nguyễn Văn Hùng (E-9 비자 연장 전문, 7년)
INSERT INTO users (
  id, email, name, avatar_url, bio,
  role, verification_status, verification_type,
  visa_type, years_in_korea, region,
  specialty_areas, preferred_language,
  is_verified, verified_at, trust_score,
  question_count, answer_count, helpful_answer_count
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'nguyen.hung@vietkconnect.com',
  'Nguyễn Văn Hùng',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=nguyen-hung',
  '한국 생활 7년차 E-9 비자 전문가입니다. 비자 연장 관련 모든 질문에 답변해드립니다.',
  'verified',
  'approved',
  'work',
  'E-9',
  7,
  '경기',
  ARRAY['visa', 'employment'],
  'vi',
  true,
  '2023-01-15 10:00:00+00',
  95,
  3,
  42,
  38
);

-- 2. ve2 - Trần Minh Đức (F-5 영주권 전문, 9년)
INSERT INTO users (
  id, email, name, avatar_url, bio,
  role, verification_status, verification_type,
  visa_type, years_in_korea, region,
  specialty_areas, preferred_language,
  is_verified, verified_at, trust_score,
  question_count, answer_count, helpful_answer_count
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  'tran.duc@vietkconnect.com',
  'Trần Minh Đức',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=tran-duc',
  'F-5 영주권 취득 경험자입니다. 영주권 신청 과정을 상세히 안내해드립니다.',
  'verified',
  'approved',
  'resident',
  'F-5',
  9,
  '서울',
  ARRAY['visa', 'immigration'],
  'vi',
  true,
  '2022-03-20 10:00:00+00',
  98,
  5,
  56,
  52
);

-- 3. ve3 - Lê Văn Toàn (E-7 비자 전환 전문, 6년)
INSERT INTO users (
  id, email, name, avatar_url, bio,
  role, verification_status, verification_type,
  visa_type, years_in_korea, region,
  specialty_areas, preferred_language,
  is_verified, verified_at, trust_score,
  question_count, answer_count, helpful_answer_count
) VALUES (
  '00000000-0000-0000-0000-000000000003',
  'le.toan@vietkconnect.com',
  'Lê Văn Toàn',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=le-toan',
  'E-9에서 E-7로 비자 전환 성공! 전환 과정의 모든 노하우를 공유합니다.',
  'verified',
  'approved',
  'work',
  'E-7',
  6,
  '인천',
  ARRAY['visa', 'employment', 'career'],
  'vi',
  true,
  '2023-06-10 10:00:00+00',
  92,
  2,
  38,
  35
);

-- 4. ve6 - Võ Thị Mai (F-6 결혼이민 전문, 6년)
INSERT INTO users (
  id, email, name, avatar_url, bio,
  role, verification_status, verification_type,
  visa_type, years_in_korea, region,
  specialty_areas, preferred_language,
  is_verified, verified_at, trust_score,
  question_count, answer_count, helpful_answer_count
) VALUES (
  '00000000-0000-0000-0000-000000000004',
  'vo.mai@vietkconnect.com',
  'Võ Thị Mai',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=vo-mai',
  'F-6 결혼이민 비자 소지자입니다. 다문화 가정의 생활 조언을 드립니다.',
  'verified',
  'approved',
  'family',
  'F-6',
  6,
  '부산',
  ARRAY['visa', 'family', 'culture'],
  'vi',
  true,
  '2023-02-25 10:00:00+00',
  88,
  8,
  34,
  30
);

-- 5. ve10 - Ngô Thị Linh (D-4 어학연수 전문, 3년)
INSERT INTO users (
  id, email, name, avatar_url, bio,
  role, verification_status, verification_type,
  visa_type, years_in_korea, region,
  specialty_areas, preferred_language,
  is_verified, verified_at, trust_score,
  question_count, answer_count, helpful_answer_count
) VALUES (
  '00000000-0000-0000-0000-000000000005',
  'ngo.linh@vietkconnect.com',
  'Ngô Thị Linh',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=ngo-linh',
  'D-4 어학연수 비자로 한국어를 공부하고 있습니다. 어학당 생활 정보 공유합니다.',
  'verified',
  'approved',
  'student',
  'D-4',
  3,
  '서울',
  ARRAY['education', 'language', 'student_life'],
  'vi',
  true,
  '2024-01-10 10:00:00+00',
  75,
  12,
  25,
  20
);

-- 6. ve12 - Nguyễn Thị Lan (E-7 통역·번역 전문, 6년)
INSERT INTO users (
  id, email, name, avatar_url, bio,
  role, verification_status, verification_type,
  visa_type, company, years_in_korea, region,
  specialty_areas, preferred_language,
  is_verified, verified_at, trust_score,
  question_count, answer_count, helpful_answer_count
) VALUES (
  '00000000-0000-0000-0000-000000000006',
  'nguyen.lan@vietkconnect.com',
  'Nguyễn Thị Lan',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=nguyen-lan',
  'E-7 통역·번역사로 일하고 있습니다. 한국 취업과 경력 관리 조언 가능합니다.',
  'verified',
  'approved',
  'work',
  'E-7',
  '글로벌통역센터',
  6,
  '서울',
  ARRAY['employment', 'translation', 'career'],
  'ko',
  true,
  '2023-04-15 10:00:00+00',
  94,
  4,
  48,
  45
);

-- ============================================
-- 🇰🇷 한국인 전문가 (3명)
-- ============================================

-- 7. ke1 - 이민수 변호사 (이민법 전문)
INSERT INTO users (
  id, email, name, avatar_url, bio,
  role, verification_status, verification_type,
  specialty_areas, preferred_language,
  is_verified, verified_at, trust_score,
  question_count, answer_count, helpful_answer_count
) VALUES (
  '00000000-0000-0000-0000-000000000007',
  'lee.minsu@vietkconnect.com',
  '이민수 변호사',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=lee-minsu',
  '법무법인 대표 변호사입니다. 이민법, 체류 자격, 법률 상담을 전문으로 합니다.',
  'verified',
  'approved',
  'other',
  ARRAY['visa', 'law', 'immigration', 'legal_advice'],
  'ko',
  true,
  '2022-01-01 10:00:00+00',
  99,
  0,
  120,
  115
);

-- 8. ke2 - 김태희 노무사 (노동법 전문)
INSERT INTO users (
  id, email, name, avatar_url, bio,
  role, verification_status, verification_type,
  specialty_areas, preferred_language,
  is_verified, verified_at, trust_score,
  question_count, answer_count, helpful_answer_count
) VALUES (
  '00000000-0000-0000-0000-000000000008',
  'kim.taehee@vietkconnect.com',
  '김태희 노무사',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=kim-taehee',
  '노무법인 대표 노무사입니다. 외국인 근로자의 노동 권리와 근로 조건 상담합니다.',
  'verified',
  'approved',
  'other',
  ARRAY['employment', 'labor_law', 'workplace_rights'],
  'ko',
  true,
  '2022-06-15 10:00:00+00',
  97,
  1,
  85,
  80
);

-- 9. ke3 - 박성준 행정사 (비자 행정 전문)
INSERT INTO users (
  id, email, name, avatar_url, bio,
  role, verification_status, verification_type,
  specialty_areas, preferred_language,
  is_verified, verified_at, trust_score,
  question_count, answer_count, helpful_answer_count
) VALUES (
  '00000000-0000-0000-0000-000000000009',
  'park.sungjun@vietkconnect.com',
  '박성준 행정사',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=park-sungjun',
  '행정사 자격증 보유. 비자 신청, 체류 자격 변경 등 행정 업무를 도와드립니다.',
  'verified',
  'approved',
  'other',
  ARRAY['visa', 'administration', 'government_procedures'],
  'ko',
  true,
  '2023-03-10 10:00:00+00',
  93,
  2,
  67,
  62
);

-- ============================================
-- 👤 일반 사용자 (3명)
-- ============================================

-- 10. u1 - 베트남노동자
INSERT INTO users (
  id, email, name, avatar_url, bio,
  role, verification_status,
  visa_type, years_in_korea, region,
  preferred_language,
  is_verified, trust_score,
  question_count, answer_count, helpful_answer_count
) VALUES (
  '00000000-0000-0000-0000-000000000010',
  'vietnam.worker1@vietkconnect.com',
  '베트남노동자',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=vietnam-worker',
  '한국에서 일하는 베트남 노동자입니다.',
  'user',
  'none',
  'E-9',
  2,
  '경기',
  'vi',
  false,
  35,
  15,
  8,
  3
);

-- 11. u5 - 장기체류자
INSERT INTO users (
  id, email, name, avatar_url, bio,
  role, verification_status,
  visa_type, years_in_korea, region,
  preferred_language,
  is_verified, trust_score,
  question_count, answer_count, helpful_answer_count
) VALUES (
  '00000000-0000-0000-0000-000000000011',
  'longterm.resident@vietkconnect.com',
  '장기체류자',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=longterm',
  '한국 생활 5년차 장기 체류자입니다.',
  'user',
  'none',
  'F-2',
  5,
  '서울',
  'ko',
  false,
  45,
  10,
  12,
  5
);

-- 12. u8 - 베트남유학생
INSERT INTO users (
  id, email, name, avatar_url, bio,
  role, verification_status,
  visa_type, years_in_korea, region,
  preferred_language,
  is_verified, trust_score,
  question_count, answer_count, helpful_answer_count
) VALUES (
  '00000000-0000-0000-0000-000000000012',
  'vietnam.student@vietkconnect.com',
  '베트남유학생',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=student',
  '한국 대학교에 다니는 베트남 유학생입니다.',
  'user',
  'none',
  'D-2',
  1,
  '서울',
  'vi',
  false,
  20,
  8,
  3,
  1
);

-- ============================================
-- 👑 관리자 (1명)
-- ============================================

-- 13. admin1 - Viet K-Connect 관리자
INSERT INTO users (
  id, email, name, avatar_url, bio,
  role, verification_status,
  specialty_areas, preferred_language,
  is_verified, trust_score,
  question_count, answer_count, helpful_answer_count
) VALUES (
  '00000000-0000-0000-0000-000000000099',
  'admin@vietkconnect.com',
  'Viet K-Connect 관리자',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  'Viet K-Connect 플랫폼 공식 관리자입니다.',
  'admin',
  'approved',
  ARRAY['platform', 'moderation', 'support'],
  'ko',
  true,
  100,
  0,
  0,
  0
);

-- ============================================
-- 검증 쿼리
-- ============================================

-- 전체 사용자 수 확인 (13명)
SELECT COUNT(*) as total_users FROM users;

-- 역할별 사용자 수
SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY role;

-- 비자 타입별 사용자 수
SELECT visa_type, COUNT(*) as count FROM users WHERE visa_type IS NOT NULL GROUP BY visa_type ORDER BY visa_type;

-- 검증 상태별 사용자 수
SELECT verification_status, COUNT(*) as count FROM users GROUP BY verification_status ORDER BY verification_status;

-- 전체 사용자 목록 (이름, 역할, 비자 타입)
SELECT name, role, visa_type, verification_status, years_in_korea
FROM users
ORDER BY role DESC, name;
