-- ===========================================================
-- Viet K-Connect mock data cleanup helper
-- 실행 위치: Supabase SQL Editor
-- 목적: 개발용 시드/목업 데이터를 모두 제거하고 ID 시퀀스를 초기화한다.
-- ===========================================================

begin;

-- 데이터 정리: 의존성이 높은 순서로 TRUNCATE
truncate table if exists public.audit_logs restart identity cascade;
truncate table if exists public.notifications restart identity cascade;
truncate table if exists public.bookmarks restart identity cascade;
truncate table if exists public.comments restart identity cascade;
truncate table if exists public.votes restart identity cascade;
truncate table if exists public.answers restart identity cascade;
truncate table if exists public.questions restart identity cascade;
truncate table if exists public.posts restart identity cascade;
truncate table if exists public.content_reports restart identity cascade;
truncate table if exists public.user_follows restart identity cascade;
truncate table if exists public.topic_subscriptions restart identity cascade;
truncate table if exists public.users restart identity cascade;
truncate table if exists public.categories restart identity cascade;

-- PostgREST 캐시 갱신
notify pgrst, 'reload schema';

commit;
