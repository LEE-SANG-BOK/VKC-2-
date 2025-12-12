-- ============================================
-- Phase 1.3: 답변 데이터 (질문당 2개, 총 32개)
-- ============================================
-- 작성일: 2025-01-16
-- 목적: 대표 질문에 대한 초기 답변 데이터 입력
-- 전제 조건:
--  - scripts/2-seed-questions.sql 실행 완료 (질문 24개 입력)
--  - users 테이블에 13명 사용자 존재 (1-seed-users.sql)

-- 편의: 고정 저자 UUID 별칭
-- 베트남 Verified 전문가
-- ve1 ~ ve6
--   000...0001, ...0002, ...0003, ...0004, ...0005, ...0006
-- 한국 Verified 전문가
-- ke1 ~ ke3
--   000...0007, ...0008, ...0009
-- 일반 사용자
-- u1 ~ u3
--   000...0010, ...0011, ...0012

-- Helper: 최근 2시간 내 생성시간으로 소팅되므로 안전하게 title 기준 매핑
-- 주의: 동일 제목이 중복되지 않도록 2-seed-questions.sql에서 고유 타이틀만 사용

-- ============================================
-- 17: 비자/법률 - 각 2개 답변 (총 6)
-- ============================================
INSERT INTO answers (content, question_id, author_id, is_accepted, upvote_count, downvote_count, helpful_count, created_at, updated_at)
VALUES
(
  'E-9 비자 연장은 거주지 관할 출입국사무소에서 신청합니다. 회사 서류(고용확인서), 본인 서류(여권/외국인등록증), 건강보험 납부확인서 등을 준비하세요. 온라인 사전예약 후 방문하시면 빠릅니다.',
  (SELECT id FROM questions WHERE title = 'E-9 비자 연장 신청 방법이 궁금합니다' AND category_id = 17 LIMIT 1),
  '00000000-0000-0000-0000-000000000001',
  false, 18, 0, 7, NOW() - interval '6 day', NOW() - interval '6 day'
),
(
  '회사 인사팀이 도와주지 않는다면 본인 준비가 가능합니다. 추가로 건강보험 자격득실확인서, 근로계약서 사본을 챙기시면 심사에 유리합니다.',
  (SELECT id FROM questions WHERE title = 'E-9 비자 연장 신청 방법이 궁금합니다' AND category_id = 17 LIMIT 1),
  '00000000-0000-0000-0000-000000000007',
  false, 11, 0, 4, NOW() - interval '5 day', NOW() - interval '5 day'
),
(
  'F-5 영주권은 체류기간, 소득, 범죄경력, 한국어 능력(TOPIK 등) 요건을 종합 평가합니다. E-9 경력만으로는 까다로운 편이니, 장기체류(F-2) 경로를 고려해 보세요.',
  (SELECT id FROM questions WHERE title = 'F-5 영주권 신청 자격 조건이 어떻게 되나요?' AND category_id = 17 LIMIT 1),
  '00000000-0000-0000-0000-000000000002',
  false, 22, 1, 9, NOW() - interval '10 day', NOW() - interval '10 day'
),
(
  'TOPIK 2급은 기본 수준이라 가점에는 제한적입니다. 소득증빙(원천징수영수증)과 체류 안정성(주거, 보험) 자료를 꼼꼼히 준비하세요.',
  (SELECT id FROM questions WHERE title = 'F-5 영주권 신청 자격 조건이 어떻게 되나요?' AND category_id = 17 LIMIT 1),
  '00000000-0000-0000-0000-000000000009',
  false, 13, 0, 5, NOW() - interval '9 day', NOW() - interval '9 day'
),
(
  'E-7 전환은 직무 매칭과 경력/자격증 요건이 핵심입니다. 현재 직무와 E-7 직군 코드가 일치하는지 먼저 확인하세요.',
  (SELECT id FROM questions WHERE title = 'E-9에서 E-7 비자로 변경 가능한가요?' AND category_id = 17 LIMIT 1),
  '00000000-0000-0000-0000-000000000003',
  false, 20, 0, 8, NOW() - interval '8 day', NOW() - interval '8 day'
),
(
  '기술자격증이 있으시다면 경력증명서와 함께 제출하세요. 고용계약(또는 채용확약)서가 있으면 승인 가능성이 크게 올라갑니다.',
  (SELECT id FROM questions WHERE title = 'E-9에서 E-7 비자로 변경 가능한가요?' AND category_id = 17 LIMIT 1),
  '00000000-0000-0000-0000-000000000007',
  false, 10, 0, 3, NOW() - interval '7 day', NOW() - interval '7 day'
);

-- ============================================
-- 18: 취업/창업 - 각 2개 답변 (총 6)
-- ============================================
INSERT INTO answers (content, question_id, author_id, is_accepted, upvote_count, downvote_count, helpful_count, created_at, updated_at)
VALUES
(
  '공장 면접에서는 안전/근태/협업을 많이 묻습니다. 최근 생산성 경험과 안전수칙 준수 사례를 준비하세요.',
  (SELECT id FROM questions WHERE title = '공장 면접 때 어떤 질문을 하나요?' AND category_id = 18 LIMIT 1),
  '00000000-0000-0000-0000-000000000008',
  false, 16, 0, 6, NOW() - interval '6 day', NOW() - interval '6 day'
),
(
  '면접 마지막에 근무형태(주/야), 수습기간, 수당체계를 확인하세요. 서류상 근로조건과 동일한지 반드시 비교해 보시길 권합니다.',
  (SELECT id FROM questions WHERE title = '공장 면접 때 어떤 질문을 하나요?' AND category_id = 18 LIMIT 1),
  '00000000-0000-0000-0000-000000000010',
  false, 9, 0, 2, NOW() - interval '5 day', NOW() - interval '5 day'
),
(
  '급여 협상은 “직무/시장가치/성과” 기준으로 숫자를 제시하세요. 유사 포지션의 시세를 조사하고, 최저 원하는 금액과 목표 금액을 구분해 두세요.',
  (SELECT id FROM questions WHERE title = '급여 협상은 어떻게 하나요?' AND category_id = 18 LIMIT 1),
  '00000000-0000-0000-0000-000000000008',
  false, 21, 0, 8, NOW() - interval '9 day', NOW() - interval '9 day'
),
(
  '협상 시점은 오퍼 제시 직후가 가장 효과적입니다. 총보상(TC) 관점에서 연봉+수당+성과급+복지까지 모두 포함해 비교하세요.',
  (SELECT id FROM questions WHERE title = '급여 협상은 어떻게 하나요?' AND category_id = 18 LIMIT 1),
  '00000000-0000-0000-0000-000000000009',
  false, 12, 0, 4, NOW() - interval '8 day', NOW() - interval '8 day'
),
(
  '외국인 창업은 비자 유형에 따라 제한이 있습니다. F-2/F-5는 비교적 자유롭고, E-9는 불가합니다. 업종에 맞는 허가/신고 요건을 먼저 확인하세요.',
  (SELECT id FROM questions WHERE title = '외국인도 한국에서 사업자 등록 가능한가요?' AND category_id = 18 LIMIT 1),
  '00000000-0000-0000-0000-000000000007',
  false, 17, 0, 7, NOW() - interval '3 day', NOW() - interval '3 day'
),
(
  '간이과세/일반과세 구분, 4대보험/노무 이슈까지 고려하세요. 상권분석과 임대차계약 조건을 체크리스트로 관리하면 리스크가 줄어듭니다.',
  (SELECT id FROM questions WHERE title = '외국인도 한국에서 사업자 등록 가능한가요?' AND category_id = 18 LIMIT 1),
  '00000000-0000-0000-0000-000000000011',
  false, 8, 0, 2, NOW() - interval '2 day', NOW() - interval '2 day'
);

-- ============================================
-- 19: 주거/부동산 - 각 2개 답변 (총 6)
-- ============================================
INSERT INTO answers (content, question_id, author_id, is_accepted, upvote_count, downvote_count, helpful_count, created_at, updated_at)
VALUES
(
  '월세 계약 시 등기부등본(소유자 확인), 확정일자, 전입신고 3가지를 꼭 확인하세요. 특약에 수리/관리비 항목을 명확히 적어두면 분쟁을 줄일 수 있습니다.',
  (SELECT id FROM questions WHERE title = '월세 계약할 때 주의사항' AND category_id = 19 LIMIT 1),
  '00000000-0000-0000-0000-000000000009',
  false, 24, 0, 10, NOW() - interval '11 day', NOW() - interval '11 day'
),
(
  '사기 예방을 위해 선금/보증금은 소유자 계좌로만 이체하세요. 중개사무소 등록 여부와 중개대상물 확인설명서도 필수입니다.',
  (SELECT id FROM questions WHERE title = '월세 계약할 때 주의사항' AND category_id = 19 LIMIT 1),
  '00000000-0000-0000-0000-000000000004',
  false, 13, 0, 5, NOW() - interval '10 day', NOW() - interval '10 day'
),
(
  '전세는 보증금 규모가 커서 보증보험 가입을 강력히 권장합니다. 전세권 설정 여부와 말소사항을 반드시 확인하세요.',
  (SELECT id FROM questions WHERE title = '외국인도 전세 계약 가능한가요? 보증금 안전하게 지키는 방법' AND category_id = 19 LIMIT 1),
  '00000000-0000-0000-0000-000000000009',
  false, 19, 0, 7, NOW() - interval '12 day', NOW() - interval '12 day'
),
(
  '보증보험(주택도시보증공사 등)을 활용하면 보증금 회수 리스크를 크게 줄일 수 있습니다. 계약 전 등기부 권리분석이 선행돼야 합니다.',
  (SELECT id FROM questions WHERE title = '외국인도 전세 계약 가능한가요? 보증금 안전하게 지키는 방법' AND category_id = 19 LIMIT 1),
  '00000000-0000-0000-0000-000000000007',
  false, 10, 0, 3, NOW() - interval '11 day', NOW() - interval '11 day'
),
(
  '원룸/오피스텔/고시원은 보증금·월세·관리비·보안/소음이 핵심 비교 포인트입니다. 첫 계약이면 관리비 구성(전기/수도/난방)부터 명확히 하세요.',
  (SELECT id FROM questions WHERE title = '원룸 vs 오피스텔 vs 고시원 - 외국인에게 맞는 주거 형태는?' AND category_id = 19 LIMIT 1),
  '00000000-0000-0000-0000-000000000011',
  false, 14, 0, 5, NOW() - interval '7 day', NOW() - interval '7 day'
),
(
  '이사 전 체크리스트(누수/곰팡이/결로/방음/채광)를 작성해 점검하세요. 주거형태별 장단점을 예산과 출퇴근 동선 기준으로 비교하면 좋습니다.',
  (SELECT id FROM questions WHERE title = '원룸 vs 오피스텔 vs 고시원 - 외국인에게 맞는 주거 형태는?' AND category_id = 19 LIMIT 1),
  '00000000-0000-0000-0000-000000000004',
  false, 9, 0, 3, NOW() - interval '6 day', NOW() - interval '6 day'
);

-- ============================================
-- 20: 교육/학업 - 각 2개 답변 (총 6)
-- ============================================
INSERT INTO answers (content, question_id, author_id, is_accepted, upvote_count, downvote_count, helpful_count, created_at, updated_at)
VALUES
(
  'TOPIK 2급은 어휘/문법 기초 반복이 중요합니다. 기출 풀면서 오답노트 작성, 듣기는 스크립트 병행 학습을 추천합니다.',
  (SELECT id FROM questions WHERE title = 'TOPIK 2급 준비 어떻게 하셨나요?' AND category_id = 20 LIMIT 1),
  '00000000-0000-0000-0000-000000000005',
  false, 28, 0, 12, NOW() - interval '4 day', NOW() - interval '4 day'
),
(
  '교재는 토픽2 기본서 + 기출5회분이면 충분합니다. 매일 30분이라도 꾸준히 하시면 한 달 내 가시적 성과가 납니다.',
  (SELECT id FROM questions WHERE title = 'TOPIK 2급 준비 어떻게 하셨나요?' AND category_id = 20 LIMIT 1),
  '00000000-0000-0000-0000-000000000012',
  false, 15, 0, 6, NOW() - interval '3 day', NOW() - interval '3 day'
),
(
  '대학 입학은 학교마다 자격요건이 조금 다릅니다. 보통 TOPIK 3~4급을 요구하며, 서류(자기소개서/학업계획서) 완성도가 중요합니다.',
  (SELECT id FROM questions WHERE title = '한국 대학 입학 조건이 궁금합니다' AND category_id = 20 LIMIT 1),
  '00000000-0000-0000-0000-000000000006',
  false, 18, 0, 8, NOW() - interval '13 day', NOW() - interval '13 day'
),
(
  '학교 국제처에 메일로 지원요건을 직접 확인하세요. 합격생 포트폴리오를 참고하면 준비 방향을 잡는 데 도움이 됩니다.',
  (SELECT id FROM questions WHERE title = '한국 대학 입학 조건이 궁금합니다' AND category_id = 20 LIMIT 1),
  '00000000-0000-0000-0000-000000000011',
  false, 9, 0, 3, NOW() - interval '12 day', NOW() - interval '12 day'
),
(
  '무료 한국어 과정은 지자체/다문화가족지원센터에서 자주 운영합니다. 대기자 명단이 있으니 미리 신청하세요.',
  (SELECT id FROM questions WHERE title = '무료 한국어 학원 추천해주세요' AND category_id = 20 LIMIT 1),
  '00000000-0000-0000-0000-000000000005',
  false, 13, 0, 5, NOW() - interval '15 day', NOW() - interval '15 day'
),
(
  '온라인 강의(유튜브 TOPIK 강의 등)와 병행하면 비용을 줄일 수 있습니다. 주3회 규칙적으로 수업을 듣는 것을 추천합니다.',
  (SELECT id FROM questions WHERE title = '무료 한국어 학원 추천해주세요' AND category_id = 20 LIMIT 1),
  '00000000-0000-0000-0000-000000000012',
  false, 7, 0, 2, NOW() - interval '14 day', NOW() - interval '14 day'
);

-- ============================================
-- 21: 의료/건강, 22: 금융/세금, 23: 문화/생활, 24: 교통/통신
-- 각 2문항에 2개 답변씩 → 총 14
-- ============================================

-- 21: 의료/건강
INSERT INTO answers (content, question_id, author_id, is_accepted, upvote_count, downvote_count, helpful_count, created_at, updated_at)
VALUES
(
  '건강보험 가입확인서는 국민건강보험공단 홈페이지/모바일 앱에서 즉시 발급 가능합니다. 공동인증서나 간편인증이 필요합니다.',
  (SELECT id FROM questions WHERE title = '건강보험 서류 온라인 발급 방법' AND category_id = 21 LIMIT 1),
  '00000000-0000-0000-0000-000000000007',
  false, 12, 0, 4, NOW() - interval '6 day', NOW() - interval '6 day'
),
(
  '출입국 심사 시 최신 발급본을 요구할 수 있어 발급일자를 가까이 맞추는 것이 좋습니다.',
  (SELECT id FROM questions WHERE title = '건강보험 서류 온라인 발급 방법' AND category_id = 21 LIMIT 1),
  '00000000-0000-0000-0000-000000000011',
  false, 6, 0, 2, NOW() - interval '5 day', NOW() - interval '5 day'
);

-- 22: 금융/세금
INSERT INTO answers (content, question_id, author_id, is_accepted, upvote_count, downvote_count, helpful_count, created_at, updated_at)
VALUES
(
  '한국→베트남 송금은 수수료/환율/도착시간을 비교하세요. 해외송금 특화 핀테크가 보통 은행보다 유리합니다.',
  (SELECT id FROM questions WHERE title = '한국→베트남 송금, 가장 저렴하고 빠른 방법은?' AND category_id = 22 LIMIT 1),
  '00000000-0000-0000-0000-000000000010',
  false, 17, 0, 6, NOW() - interval '7 day', NOW() - interval '7 day'
),
(
  '정기적으로 보내신다면 환율우대 프로모션을 활용하세요. 수수료+환율 스프레드 총비용을 기준으로 비교해야 합니다.',
  (SELECT id FROM questions WHERE title = '한국→베트남 송금, 가장 저렴하고 빠른 방법은?' AND category_id = 22 LIMIT 1),
  '00000000-0000-0000-0000-000000000005',
  false, 8, 0, 3, NOW() - interval '6 day', NOW() - interval '6 day'
);

-- 23: 문화/생활
INSERT INTO answers (content, question_id, author_id, is_accepted, upvote_count, downvote_count, helpful_count, created_at, updated_at)
VALUES
(
  '서울 베트남 식료품은 안산 다문화거리, 대림역 일대 상가, 일부 대형마트 해외식품 코너에서도 구매 가능합니다.',
  (SELECT id FROM questions WHERE title = '서울에서 저렴한 베트남 식료품 가게 추천' AND category_id = 23 LIMIT 1),
  '00000000-0000-0000-0000-000000000012',
  false, 9, 0, 3, NOW() - interval '2 day', NOW() - interval '2 day'
),
(
  '온라인은 쿠팡/네이버에서도 구매 가능하며, 배송비를 고려해 묶음 구매가 유리합니다.',
  (SELECT id FROM questions WHERE title = '서울에서 저렴한 베트남 식료품 가게 추천' AND category_id = 23 LIMIT 1),
  '00000000-0000-0000-0000-000000000011',
  false, 6, 0, 2, NOW() - interval '2 day', NOW() - interval '2 day'
);

-- 24: 교통/통신
INSERT INTO answers (content, question_id, author_id, is_accepted, upvote_count, downvote_count, helpful_count, created_at, updated_at)
VALUES
(
  'T-money는 편의점/지하철역에서 충전 가능하고, 모바일 교통카드 앱으로도 충전할 수 있습니다.',
  (SELECT id FROM questions WHERE title = '교통카드는 어디서 충전하나요?' AND category_id = 24 LIMIT 1),
  '00000000-0000-0000-0000-000000000010',
  false, 12, 0, 4, NOW() - interval '6 day', NOW() - interval '6 day'
),
(
  '충전 영수증을 보관해 두면 분실 시 카드 잔액 이전에 도움이 됩니다.',
  (SELECT id FROM questions WHERE title = '교통카드는 어디서 충전하나요?' AND category_id = 24 LIMIT 1),
  '00000000-0000-0000-0000-000000000012',
  false, 5, 0, 1, NOW() - interval '5 day', NOW() - interval '5 day'
);

-- ============================================
-- 검증 쿼리
-- ============================================
-- 최근 입력된 답변 10개
SELECT a.id, left(a.content, 40) AS snippet, u.name AS author, c.name AS category, a.created_at
FROM answers a
JOIN questions q ON a.question_id = q.id
JOIN categories c ON q.category_id = c.id
JOIN users u ON a.author_id = u.id
ORDER BY a.created_at DESC
LIMIT 10;

-- 질문별 답변 수 확인 (최근 24개 질문 중)
SELECT q.title, c.name AS category, COUNT(a.id) AS answers
FROM questions q
LEFT JOIN answers a ON a.question_id = q.id
JOIN categories c ON q.category_id = c.id
WHERE q.created_at > NOW() - interval '2 hour'
GROUP BY q.id, q.title, c.name
ORDER BY answers DESC, q.title ASC;

