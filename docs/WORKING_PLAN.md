# Working Plan (Condensed)

## Launch Focus (P0)

- 실데이터/SEO 정합
- 모바일 UX
- 신뢰(인증/배지)
- 운영도구(계측/방어)
- 필수 자동화(Playwright/Rate limit)

## Policy Decisions (확정)

- Language UI: ko/vi만 노출, SEO 로케일은 ko/en/vi 유지
- en 번역 추가/검수는 중단, 미번역 키는 ko fallback으로 렌더
- Playwright는 릴리즈 게이트에 포함
- Rate limit은 주요 쓰기 API에 필수 적용

## Operating Rules

- Single worktree: `/Users/bk/Desktop/VKC-2-`
- Single branch: `codex-integration` (Lead only commits/pushes)
- Hot Files (Lead only): `src/components/organisms/Header.tsx`, `src/components/templates/MainLayout.tsx`, `src/components/organisms/PostList.tsx`, `src/app/globals.css`
- i18n keys: Lead edits `messages/*.json`; agents send key lists

## Requirements / Constraints

- Next.js 16 (App Router), React 19, TS strict, Tailwind 4
- API routes only (`src/app/api/**`), no server actions
- SSR + `HydrationBoundary` for lists/posts/profiles
- SEO: `generateMetadata`, JSON-LD, sitemap/robots 유지

## Ownership / Boundaries

- Design Front: `src/components/**`, responsive UI, A11y, media rendering
- Web Feature: `src/repo/**`, SSR/Hydration, page flows (non-hot files)
- BE: `src/app/api/**`, `src/lib/db/**`, auth/rate-limit
- Lead: hot files, docs, quality gate, release QA

## Key Entry Points

- i18n: `messages/ko.json`, `messages/vi.json` (en kept)
- Mobile input/editor: `src/components/molecules/editor/RichTextEditor.tsx`
- Feed card: `src/components/molecules/cards/PostCard.tsx`
- Events: `src/app/api/events/route.ts`, `src/repo/events/*`
- Docs: `docs/EXECUTION_PLAN.md`, `HANDOVER.md`, `AGENTS.md`

## Scope

- In (P0): i18n cleanup, mobile keyboard UX, performance 1st pass, trust UX, event logging v1, cross-browser QA, Playwright, rate limit
- Out (P0): AI translation/chatbot, CMS, Redis/read replica, large-scale ML, full visual regression

## Data / API Changes

- P0: `event_logs` + `/api/events` (eventName, userId/anonId, lang, path, referrer, metadata, createdAt)
- P0: rate limit for write APIs (IP + session)
- P1+: monitoring dashboard, spam defense, cache/replica (P2)

## Action Items

### P0 (Launch Blocking)

- P0-0 병렬 규칙 고정(Hot File 잠금/번역키 담당/게이트)
- P0-1 en UI 숨김 + SEO 유지 + ko fallback 병합
- P0-2 i18n 전수 점검(ko/vi) + 텍스트 클립 제거
- P0-3 모바일 키보드/스크롤 UX 하드닝
- P0-4 퍼포먼스 1차(이미지/코드 스플리팅)
- P0-5 A11y 최소 기준(아이콘 aria-label 등)
- P0-6 Rate limit 필수 적용(쓰기 API 우선)
- P0-7 Playwright 스모크 도입(릴리즈 게이트)
- P0-8 핵심 지표 이벤트 정의 + 수집 v1
- P0-9 크로스브라우징/반응형 QA 라운드

### P1 (Stabilization)

- P1-1 Playwright 커버리지 확장(로그인/작성)
- P1-2 Rate limit 고도화 + CAPTCHA 옵션
- P1-3 Admin 모듈 경계 정리
- P1-4 운영 모니터링/Runbook 강화
- P1-5 디자인/컴포넌트 가이드 확장

### P2 (Scale / Growth)

- P2-1 캐시/스케일(Redis/KV, read replica 기준)
- P2-2 Feature flags
- P2-3 CMS 도입 판단
- P2-4 추천/분석 고도화
- P2-5 AI 번역/챗봇 PoC

## Gate (Testing)

- `npm run lint` → `npm run type-check` → `SKIP_SITEMAP_DB=true npm run build`
- Playwright 스모크 통과
- Rate limit 429 + UX 처리 확인
- P0-9 수동 QA 체크리스트 완료

## Risks

- Hot File 충돌(잠금 필수)
- ko/vi 길이 차이로 레이아웃 깨짐
- 모바일 키보드 이슈는 실기기 기준으로만 판단
- 이벤트 로그는 PII 최소화 필요
