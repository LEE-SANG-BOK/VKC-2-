# Viet K-Connect 실행 플랜/체크리스트 (P0→P1)

> 역할: Viet K‑Connect 프로젝트 시니어 풀스택 개발자 관점  
> 목표: “신뢰 기반 Q&A 커뮤니티” 웹 MVP를 **출시 가능한 품질**로 마무리  
> 범위: 기능/SEO/성능/모바일/디자인/리팩토링/운영 최소 기능  
> 제외: 외부 마케팅 채널 운영/광고 집행/픽셀·SDK/외부 콘텐츠 배포 전략

---

## 0. 작업 운영 원칙

### 0.1 스택/아키텍처 고정(변경 금지)
- Next.js(App Router) + Supabase(Postgres/Storage/Auth) + Drizzle ORM + TanStack Query
- NextAuth(Google) 구조 유지
- Tailwind/shadcn-ui/Magic UI 기반 스타일 유지
- 서버 액션 금지, `/api/**` API Routes만 사용

### 0.2 PR 산출물 규칙
- 각 작업은 **PR 단위로 커밋 분리**
- PR 설명에 아래 3개 항목 필수 포함
  - **why**: 어떤 문제를 해결하는가
  - **what**: 무엇을 변경했는가(파일/기능 단위)
  - **test**: 어떻게 검증했는가(수동/테스트/로그)
- 주요 화면은 **모바일/데스크톱 반응형 스크린샷 첨부**

---

## 1. 작업 진행 “공식”(팀 공통 포맷)

모든 기능/리팩토링 작업은 아래 구조로 진행한다.

1) **플랜(체크리스트)**
- 해야 할 서브태스크를 `[ ]`로 나열
- 선행 PR/의존성 명시

2) **현황 분석(코드 기준)**
- 현재 구현 위치/동작을 파일 단위로 정리
- 구현/부분 구현/미구현 구분

3) **개선 포인트(why/what)**
- 문제의 원인(why)과 변경 범위(what)
- API/DB/UI/SEO/모바일 관점 포함

4) **판정**
- **OK**(현 상태 유지) / **개선 필요**(P0/P1 포함)로 결론

5) **다음 액션**
- 다른 플랜으로 이동 or 해당 작업 PR 착수
- PR 이름(스코프) + 담당 에이전트 지정

---

## 2. P0 — 출시 전 필수 우선순위

### P0-0) 보안/개인정보(PII)

**플랜(체크리스트)**
- [x] 공개 user payload에서 `email` 기본 노출 제거
- [x] `GET /api/users/[id]`에서 본인 요청일 때만 `email/phone/notify*` 반환
- [x] 사용자 검색(`GET /api/search`, `GET /api/search/users`)에서 email 기반 검색 제거

**현황 분석**
- 공개 유저 컬럼에서 `email` 제외: `src/lib/db/columns.ts`.
- 프로필 API는 본인/타인 응답을 분리해 PII를 제한: `src/app/api/users/[id]/route.ts`.
- 검색 API는 이름/닉네임/소개만 검색(이메일 검색 제거): `src/app/api/search/route.ts`, `src/app/api/search/users/route.ts`.

**판정**: OK(P0-0 완료)

### P0‑1) 실데이터 정합성/SEO

**플랜(체크리스트)**
- [x] posts 상세 mock/샘플 의존 제거
- [x] `generateMetadata` 실데이터 기반 title/desc/OG/Twitter/canonical 정합화
- [x] JSON‑LD(QAPage/DiscussionForumPosting) 답변/통계 동기화
- [x] sitemap: posts + categories + profiles 동적 포함
- [x] robots sitemap 경로 유지/검증
- [x] 게시글 리스트/상세 썸네일 src 정규화(깨짐 방지)
- [x] 홈 피드 페이지네이션 링크 제공(무한 스크롤만 의존 X)

**현황 분석**
- 상세 SSR/메타/JSON‑LD는 실데이터 기반: `src/app/[lang]/(main)/posts/[id]/page.tsx`.
- posts 상세 API에서 `answersCount/commentsCount` 및 `thumbnail/thumbnails/imageCount` 정합화: `src/app/api/posts/[id]/route.ts`.
- 리스트/상세 썸네일은 공통 src 정규화 유틸로 런타임 크래시를 방지: `src/utils/normalizePostImageSrc.ts`.
- sitemap은 정적 페이지 + 카테고리 그룹 + posts + profiles(최대 2000)로 동적 생성: `src/app/sitemap.ts`.
- 홈 피드는 `page` 쿼리스트링 기반 페이지네이션 링크 제공: `src/components/organisms/PostList.tsx`.

**개선 포인트**
- (완료) mock 제거, JSON‑LD/메타 정합, sitemap 확장.

**판정**: OK(P0-1 완료)

**다음 액션**
- P0-2: 사용자 wizard UX(B2), 관리자 큐 확장(B3)
- P0-3: 모바일 CTA/폼 micro‑UX 개선

---

### P0‑2) 인증(Verification) End‑to‑End

**플랜(체크리스트)**
- [ ] `/verify` 3‑step wizard UX(타입 선택 → 업로드 가이드 → 상태/이력)
- [x] private storage 업로드 + **public URL 저장 금지**, path 기반 관리
- [x] `/api/verification/request` documents 입력 path 정규화 + 본인(userId prefix) 검증
- [x] 관리자 승인/반려 시 문서 즉시 삭제(or TTL)
- [x] 승인 라벨을 프로필/답변 카드에 표시(badgeType 기반 TrustBadge)
- [ ] 관리자 pending 큐 UI에 사유/배지타입/만료 입력 포함

**현황 분석**
- 사용자 페이지는 단일 폼 + 이력 토글: `src/app/[lang]/(main)/verification/request/*`.
- documents 버킷은 private 사용이며 업로드는 path 기반: `src/lib/supabase/storage.ts`, `src/app/api/upload/document/route.ts`.
- 요청 생성 API는 documents를 path로 정규화하고 본인 path만 저장: `src/app/api/verification/request/route.ts`.
- 관리자 상세는 pending 상태에서만 signed URL 미리보기를 제공하고, 승인/반려 시 문서를 삭제 + DB에서 제거: `src/app/api/admin/verifications/[id]/route.ts`.
- 프로필/답변 카드에 badgeType 기반 TrustBadge 라벨을 노출: `src/app/[lang]/(main)/profile/[id]/ProfileClient.tsx`, `src/components/molecules/AnswerCard.tsx`.

**개선 포인트**
- (완료) documentUrls는 storage path만 저장, 관리자 미리보기는 signed URL, 승인/반려 시 삭제.
- 사용자 요청 UI를 wizard로 재설계.
- (완료) 승인 라벨은 users.badgeType 기반으로 저장/노출.

**판정**: 부분 OK(UI wizard/라벨/관리자 큐 확장 필요)

**다음 액션(PR)**
- (완료) PR‑B1: `verification-storage-path-signedurl-delete`
- PR‑B2: `verification-wizard-user-ui`
- PR‑B3: `verification-admin-queue-extended`

---

### P0‑3) 모바일 UX 필수 개선

**플랜(체크리스트)**
- [ ] 질문/답변 폼 모바일 키보드 안전영역 + autosize 입력 + skeleton
- [ ] 리스트는 infinite scroll로 통일

**현황 분석**
- 하단 탭 5개는 구현 완료: `src/components/organisms/BottomNavigation.tsx`.
- 글 작성 폼 skeleton은 있으나 autosize/키보드 safe‑area 대응은 불충분.
- 리스트 infinite scroll은 홈/검색/카테고리 모두 통일됨(PostList 기반).

**개선 포인트**
- BottomNav 중앙 탭을 primary FAB 스타일로 강조.
- NewPost/Answer 입력의 autosize + 하단 고정 submit bar + 키보드 safe‑bottom 보장.

**판정**: 부분 OK, 개선 필요(CTA 강조 + 폼 micro‑UX)

**다음 액션(PR)**
- PR‑C1: `mobile-bottomnav-cta-emphasis`
- PR‑C2: `mobile-post-answer-form-ux`
  (두 PR 모두 posts 상세 파일은 건드리지 않도록 범위 제한)

---

### P0‑4) 운영/관리 최소 기능

**플랜(체크리스트)**
- [ ] 신고 UI/흐름 점검 및 누락 보완
- [ ] 관리자 신고 큐 액션 정합화(숨김/삭제/경고/차단)
- [ ] 상단 공지/배너 관리자 설정형 CRUD + 홈 노출

**현황 분석**
- 신고 기능(사용자/관리자) 기본 흐름 구현됨: `src/repo/reports/*`, `src/app/admin/(dashboard)/reports/*`.
- 공지/배너는 미구현. VietnamBanner는 정적 CTA 배너로만 존재.

**개선 포인트**
- reports admin 액션이 요구 스펙을 모두 커버하는지 점검 후 부족분만 보완.
- banners/notices 도메인 신설(테이블+API+admin UI+홈 캐러셀 SSR).

**판정**: reports는 OK에 가까움(점검 필요), 배너는 개선 필요(P0)

**다음 액션(PR)**
- PR‑D1: `reports-admin-audit-fix`
- PR‑D2: `admin-banners-crud-home-slot`

---

### P0‑5) 페이지 내 체류시간/게이팅/튜토리얼(내부 전환)

**플랜(체크리스트)**
- [ ] 질문 상세 하단 “유사 질문/같은 카테고리 인기글/다음 글 추천” 배치
- [x] SimilarQuestionPrompt locale 링크 오류 수정
- [ ] 비회원 참여 액션 로그인 게이팅 재확인
- [ ] 신규 유저 1회성 규칙/기능 툴팁 제공

**현황 분석**
- SimilarQuestionPrompt는 작성 페이지에서만 사용, 링크 locale prefix 누락.
- 상세 하단 추천 섹션 없음.
- 게이팅은 대부분 구현.
- 1회성 튜토리얼 없음.

**개선 포인트**
- PostDetail에서 related posts prefetch + 하단 섹션 추가(SSR 포함).
- SimilarQuestionPrompt 링크를 `/${lang}` prefix 적용.
- 신규 세션 1회 툴팁/규칙 안내 추가.

**판정**: 개선 필요(P0)

**다음 액션(PR)**
- PR‑A3: `postdetail-related-content-section`
- (완료) PR‑A4: `similarprompt-locale-fix`

---

## 3. P1 — 차순위(베타 직후) 작업

### P1‑5) 온보딩(개인화)

**플랜**
- [ ] 첫 로그인 최소 질문 wizard화
- [ ] 저장값으로 홈 피드 관심 토픽 우선 노출

**현황**
- 온보딩 설문과 저장 구현됨: `src/app/[lang]/(main)/onboarding/*`.
- 홈에서 interests 기반 초기 카테고리 우선 선택 구현됨.

**판정**: OK(추가 UX polish만 필요)

**다음 액션**
- P0 완료 후 작은 UX polish PR로 진행

---

### P1‑6) 구독/알림

**현황**
- 카테고리/토픽 구독 API·필터는 존재.
- 구독 기반 in‑app 알림/설정 UI는 없음.

**판정**: 개선 필요(P1)

**다음 액션**
- P0 이후 Stream‑E로 진행

---

### P1‑7) 포인트/레벨/뱃지 + 관리자 포인트

**현황**
- users 소셜/신뢰 지표 컬럼은 존재.
- 산정 로직/노출 UI/관리자 패널 미구현.

**판정**: 개선 필요(P1)

**다음 액션**
- P1 Stream‑F로 별도 진행

---

## Search API 개선 & SimilarQuestion 메타 도입

- [x] `paginatedResponse`에 `meta` 필드를 추가해서 응답에 fallback/OCR 상태 비트와 토큰 정보를 붙일 수 있도록 함 (`src/lib/api/response.ts`).
- [x] `/api/search/posts`에서 토큰 기반 스코어링과 type/category 필터를 함께 적용하고, 일치 결과가 없으면 조회수/좋아요 순서로 fallback 결과를 제공하도록 개선 (`src/app/api/search/posts/route.ts`).
- [ ] SimilarQuestionPrompt/검색 UI에서 `meta.isFallback`·`meta.reason`·`meta.tokens`를 활용해 사용자에게 fallback 상황을 명확히 안내하고 로그를 쌓는 부분 검토.

## PostCard 신뢰/팔로우 UX 정비

- [x] 프로필 사진 영역 아래에 신뢰 배지를 정렬하고 hover 툴팁을 유지하면서 닉네임과 시간 사이로 배치해 “Verified/Expert/Outdated” 신호를 강조 (`src/components/molecules/PostCard.tsx`).
- [x] 팔로우 버튼을 제목 바로 오른편으로 이동하고 `size="xs"`/최소 너비를 설정해 크기를 축소한 뒤 기존 하단 액션선에서 제거.
- [x] 메인페이지 카드 상단에 “답변 {n}개” 안내를 추가하고 댓글 버튼과 별도로 `animate-pulse`/클릭 이동을 부여해 답변이 없는 경우에도 사용자 주의를 유도.


## 4. 병렬 진행을 위한 에이전트/PR 분리 기준

### 4.1 분리 원칙
1) **도메인/파일 경계로 수평 분리**: 한 PR이 한 도메인(API+repo+UI)을 “세로로” 완결.
2) **핵심 파일 소유권 고정**: 동시 PR이 같은 핵심 파일을 수정하지 않도록 담당 고정.
3) **DB 마이그레이션 PR 단일 소유**: 동일 테이블 수정 PR 병렬 금지.
4) **홈/상세/공통 레이아웃 통합은 마지막에**: 충돌 지점 최소화.

### 4.2 P0 병렬 스트림(충돌 최소화)

#### 4.2.1 통합 에이전트(고정)

**Agent Lead (통합/QA) — Codex(본 대화)**
- (역할) 플랜/우선순위 통합, 중복 제거, 충돌 조정, 최종 QA(`npm run lint`, `npm run build`), 인수인계/HANDOVER 반영
- (문서 운영) 체크리스트 표기 규칙: `- [ ] (YYYY-MM-DD) 작업명 (메모)` / 완료 시 `[x]`로 변경
- (단일 소유 파일) `docs/EXECUTION_PLAN.md`, `HANDOVER.md`, `messages/*.json` (다른 에이전트는 변경 요청/키 목록만 전달)

#### 4.2.2 병렬 에이전트 역할(3분류)

| 분류 | 스트림/에이전트 | PR 목록 | 담당 업무(요약) | 소유 파일 범위(충돌 방지) |
|---|---|---|---|---|
| **백엔드 기반** | **Agent P (Performance/Scaling)** | P0‑P*, P1‑P* | 피드/프로필/검색 성능(쿼리·payload·캐시), 인덱스/마이그레이션 단일 소유, 알림 과호출/레이트리밋, 보안(관리자 UGC/XSS) | `src/lib/db/schema.ts`, `src/lib/db/migrations/**`, `src/app/api/posts/**`, `src/app/api/notifications/**`, `src/app/api/search/**`, `src/repo/posts/**`, `src/repo/users/**` |
| **웹 기능 구현** | **Agent A (SEO/상세/체류시간)** | A1–A4 | PostDetail 관련 콘텐츠(SSR+HydrationBoundary), generateMetadata/JSON‑LD 정합, sitemap/robots 개선 | `src/app/[lang]/(main)/posts/[id]/**`, `src/app/sitemap.ts`, `src/app/robots.ts` |
| **웹 기능 구현** | **Agent B (Verification E2E)** | B1–B3 | Verification 사용자 플로우 마감 + 관리자 큐 확장(사유/배지/만료/상태), 스토리지/문서 미리보기 정합 | `src/app/[lang]/(main)/verification/**`, `src/app/api/verification/**`, `src/app/api/upload/document/**`, `src/app/api/admin/verifications/**`, `src/app/admin/(dashboard)/verifications/**`, `src/lib/supabase/storage.ts` |
| **디자인 프론트** | **Agent C (Mobile UX/Forms)** | C1–C2 | 모바일 폼 UX(키보드/safe‑area/제출바), 공통 액션 버튼/툴팁/게이팅 UX 일원화(인라인 지양), i18n 누락 탐지(키 목록 전달) | `src/components/**`(단, `PostCard.tsx`는 제외), `src/app/[lang]/(main)/posts/new/**`, `src/app/[lang]/(main)/profile/**` |
| **웹 기능 구현** | **Agent D (Ops/Banners/Moderation)** | D1–D2 | 신고/모더레이션 운영 정리(`reports` vs `content_reports` 단일화 결정/정리), 배너/공지 CRUD + 홈 노출, 관리자 UX/권한 점검 | `src/app/admin/(dashboard)/reports/**`, `src/app/api/admin/reports/**`, `src/app/api/admin/content-reports/**`, `src/app/api/banners/**`(신규), `src/app/admin/(dashboard)/banners/**`(신규) |

**공통 제출 포맷(모든 병렬 에이전트 PR)**
- (필수) PR 본문에 `why / what / test` 포함
- (필수) “사용자 UX(화면) + API + (해당 시) 관리자 화면”까지 end‑to‑end로 닫기
- (필수) 번역 키가 필요하면 PR 본문에 `i18n keys request:`로 `key = ko/en/vi 초안` 목록 제공(리드가 `messages/*.json`에 반영)
- (필수) 문서 반영이 필요하면 PR 본문에 `docs request:`로 `HANDOVER.md`, `docs/EXECUTION_PLAN.md` 반영할 bullet 목록 제공(리드가 반영)

**에이전트별 상세 책임**
- **Agent P (백엔드 기반)**: 피드/프로필/검색/알림의 “응답 크기↓ + DB 부하↓ + 캐시 안전성↑”; 인덱스/마이그레이션 단일 소유; 레이트리밋/봇 방어; 공개/개인화 캐시 정책 충돌 방지
- **Agent A (웹 기능/SEO)**: posts 상세 SSR/메타/JSON‑LD 정합(ko/en/vi alternates 포함); 체류시간 섹션(관련글/유사글/카테고리 인기글) SSR+HydrationBoundary로 추가; UGC 링크 안전화(`rel="ugc"`) 점검
- **Agent B (웹 기능/Verification)**: 사용자 wizard → API request → 관리자 승인/반려 → 사용자/프로필 라벨 반영까지 E2E; 문서 보관/삭제 정책 일관화(signed URL/TTL)
- **Agent C (디자인 프론트)**: 모바일 전환율에 직접 영향 있는 폼/탭/CTA micro‑UX 개선; 공통 컴포넌트화로 디자인 일관성 확보(인라인 스타일 지양); 비로그인 게이팅 UX 통일(에러 대신 로그인 유도)
- **Agent D (웹 기능/Ops)**: 신고/모더레이션 운영 데이터 단일화(reports로 통합 여부 결정); 관리자 UGC 렌더링 XSS 방어; 배너/공지 CRUD(관리자) + 홈 노출(SSR)

#### 4.2.3 충돌 방지 규칙(필수)

1) `docs/EXECUTION_PLAN.md`, `HANDOVER.md`, `messages/*.json`는 **Agent Lead만 수정** (다른 에이전트는 “변경 요청 리스트”로 전달)  
2) DB 마이그레이션(`src/lib/db/schema.ts`, `src/lib/db/migrations/**`)은 **Agent P 단일 소유** (동일 테이블 변경 PR 병렬 금지)  
3) PostDetail 영역(`src/app/[lang]/(main)/posts/[id]/**`)은 **Agent A 단일 소유** (성능 관련 수정도 A와 협의 후 진행)  
4) 각 PR은 “백엔드/API + (필요 시) 관리자 + 사용자 UX + i18n 키 요청 + 검증 명령 결과”를 한 패키지로 제출

이 구조로 가면 P0는 서로 거의 파일 충돌 없이 병렬 진행 가능하고, P1은 P0 이후 동일 원칙으로 새 스트림을 추가하면 됩니다.

---

## 5. 실행 순서 제안

1) **P0 스트림 병렬 착수** (A/B/C/D 동시)
2) P0 완료 후 **P1‑6 → P1‑7 순서로 스트림 확장**
3) 모든 PR 통합 후 Lighthouse/수동 QA로 베타 출시

---

## 6. 현재 진행/예정 작업 체크리스트 (Codex)

### 6.1 완료
- [x] (2025-12-17) 홈 피드 `?page=` 고유 URL + Prev/Next 링크 병행 (SEO: 정상 URL 구조 + 무한스크롤 병행)
- [x] (2025-12-17) TanStack infinite queryKey에 `page` 포함 (페이지 이동 시 캐시 충돌 방지)
- [x] (2025-12-17) `GET /api/posts` 응답 payload 축소: 기본 `content` 제외 + `excerpt` 제공 (무한스크롤 응답 크기↓)
- [x] (2025-12-17) 무한스크롤 cursor(keyset) 페이지네이션 적용(SEO용 `?page=` 유지) (API 성능/안정성)
- [x] (2025-12-17) `GET /api/posts` DB부하 추가 절감 (preview 8000→4000, fallback full-content 제거, 이미지 파싱 경량화)
- [x] (2025-12-17) Post 상세 댓글 카운트 정합: `commentsCount = answersCount + postCommentsCount` (정확도)
- [x] (2025-12-17) 게시글 상세 answers/comments keyset 인덱스 추가(마이그레이션) (상세 로딩 성능): `src/lib/db/migrations/0028_long_ben_grimm.sql`
- [x] (2025-12-17) 공개 GET API 캐시 헤더 추가 (익명 트래픽 비용↓): `src/app/api/categories/route.ts`, `src/app/api/posts/trending/route.ts`, `src/app/api/posts/route.ts`
- [x] (2025-12-17) SimilarQuestionPrompt용 `GET /api/search/posts` payload 최소화(id/title) + `Cache-Control: no-store` (응답 크기↓)
- [x] (2025-12-17) 홈 SSR Hydration에서 미사용 `posts.trending` prefetch 제거 (HTML payload↓)
- [x] (2025-12-17) i18n: `messages/*`에 `common.anonymous`, `common.uncategorized` 추가 (표기 일관성)
- [x] (2025-12-17) PostDetail UI 정리(썸네일/상단 칩 제거, 칩 하단 통합, 북마크 하단 액션바 이동) (중복/산만 제거)
- [x] (2025-12-17) UGC 글자수 상한 조정: 제목 100 / 본문 5000 / 답변 3000 / 댓글 400 + ko/en/vi 오류 메시지 동기화 (모바일/성능)
- [x] (2025-12-17) `docs/EXECUTION_PLAN.md`에 에이전트 역할/소유권/충돌 방지 규칙 확정 (병렬 작업 준비)
- [x] (2025-12-17) 알림 API 과호출 방지 (unread-count 전용 API 추가 + polling 완화 + Notifications 페이지 enabled 게이팅)
- [x] (2025-12-17) 검증: `npm run lint`, `npm run build` 통과 (릴리즈 품질)

### 6.2 다음
- [ ] (2025-12-17) 비로그인 입력 게이팅 UX 통일 (NewPost/Answer/Comment/Upload: 클릭 시 로그인 모달, 에러 대신 안내)
- [ ] (2025-12-17) Tooltip 잔상/전환 이슈 방지 (라우트 이동 시 강제 close)
- [ ] (2025-12-17) 관리자 신고 상세 XSS 방어 (UGC 렌더링 sanitize 또는 텍스트 렌더로 전환)
- [ ] (2025-12-17) `content_reports` 정리 방향 결정 및 단일화 작업 (reports 기준으로 운영 데이터 분산 방지)
