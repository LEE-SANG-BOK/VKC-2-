-- ===========================================================
-- Viet K-Connect core data seed
-- 실행 위치: Supabase SQL Editor
-- 목적: 필수 카테고리 및 관리자 계정을 복원한다.
-- ===========================================================

begin;

-- 1. 필수 카테고리 복원
insert into public.categories (id, name, slug, description, icon, color, sort_order, is_active)
values
  (1, '한국 비자·체류', 'visa', '비자 신청, 변경, 연장 및 한국 체류 관련 질문', '🛂', '#3B82F6', 1, true),
  (2, '한국 직장생활', 'employment', '취업, 직장생활, 이직 관련 정보와 조언', '💼', '#059669', 2, true),
  (3, '한국 생활 정착', 'daily-life', '일상생활, 문화 적응, 커뮤니티 정보', '🌏', '#10B981', 3, true),
  (4, '한국에서 집 구하기', 'housing', '임대, 매매, 전세 등 부동산 관련 질문', '🏠', '#DC2626', 4, true),
  (5, '베트남 송금·금융', 'finance', '송금, 환전, 세금, 금융 서비스 안내', '💰', '#F59E0B', 5, true),
  (6, '한국어 배우기', 'education', '한국어 공부, 학원, 교육 과정 정보', '📚', '#7C3AED', 6, true)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon,
  color = excluded.color,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

-- 2. 관리자 계정 복원 (Supabase Auth에 동일 UUID가 존재해야 함)
insert into public.users (
  id,
  email,
  name,
  role,
  verification_status,
  verification_type,
  is_verified,
  trust_score,
  badges,
  created_at,
  updated_at
) values (
  '6988c3f1-82ad-4d68-abf4-cb0d8a758631',
  'sangbok3918@gmail.com',
  '이상복',
  'admin',
  'approved',
  'work',
  true,
  100,
  jsonb_build_object('roles', jsonb_build_array('admin')),
  now(),
  now()
)
on conflict (id) do update set
  email = excluded.email,
  name = excluded.name,
  role = excluded.role,
  verification_status = excluded.verification_status,
  verification_type = excluded.verification_type,
  is_verified = excluded.is_verified,
  trust_score = excluded.trust_score,
  badges = excluded.badges,
  updated_at = now();

commit;
