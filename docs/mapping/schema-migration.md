# 스키마/마이그레이션 초안 (구버전 우위 기능)

## 신규 테이블
- `topic_subscriptions` (user_id FK, topic_id FK, unique(user_id, topic_id), created_at)
- `faq_categories` / `faq_items` (category slug/name, item title/body/lang, published, sort_order)
- `site_banners` (title, description, image_url, link_url, locale, start_at, end_at, weight)
- `events` (slug, title, body, locale, start_at, end_at, status, og_image_url)
- `missions` (code, title, description, type=daily|weekly|one_time, goal, reward_xp, active)
- `mission_progress` (user_id FK, mission_code FK, progress, completed_at, period_key)
- `ranks` (code, name, min_xp, badge) / `user_ranks` (user_id FK, rank_code, xp, updated_at)
- `content_reports` (user_id FK, target_type, target_id, reason, status, handled_by, handled_at)
- `visa_jobs` (code, title, category, visa_type, min_salary, locale, description)
- `visa_requirements` (visa_type, requirement, locale, weight) and mapping tables for job↔requirement if needed.

## 기존 테이블 확장
- `users`: add `badge_type` (verified_student|verified_worker|expert_visa|expert_employment|trusted_answerer), `visa_status`, `interests` (text[]), `korean_level`, `trust_score` (numeric), `helpful_answers` (int), `adoption_rate` (numeric)
- `posts`: add `topic_slug` (nullable), `tags` (text[]), `is_featured` (bool), `type` (question|share|news)
- `answers`: add `is_adopted` (bool default false), `helpful_count` (int)
- `notifications`: ensure types for mission/rank/badge/verification events

## API/권한 고려
- RLS/ACL 대체: NextAuth 세션 기반 권한 체크, 관리자 역할 필드 필요(`users.role` or `roles` join).
- 레이트리밋/스팸 방어: 신고/미션/팔로우/구독/투표 엔드포인트에 요청 제한 적용.

## 마이그레이션 단계
1) 지표/뱃지 필드: users trust_score/helpful/adoption_rate, badge_type 추가 → 프로필/카드 노출.
2) 토픽/FAQ/배너/이벤트 테이블 추가 → 빈 데이터 허용 후 관리자 UI 붙이기.
3) 미션/랭크 테이블 추가 → 기본 미션 seed, XP 합산 로직.
4) 비자 매칭 메타데이터 테이블 추가 → 매칭 위저드/템플릿에 활용.
5) content_reports 추가 → 관리자 처리 뷰와 연결.

## 데이터 백필 가이드
- 초기 trust_score/helpful/adoption_rate는 0으로 seed, 과거 활동 집계 시 배치 스크립트로 역산.
- missions/ranks: 모든 유저에 기본 rank_code(Bronze)와 xp=0 부여.
- 토픽/FAQ/배너: 최소 슬러그/제목/언어로 기본 seed 작성 후 관리자에서 수정.
