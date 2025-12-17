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
- 운영 방식: **단일 작업 브랜치(공유) + 지속 PR 1개**로 진행(같은 브랜치에서 커밋을 누적 push)
- 각 작업은 **커밋 단위로 분리** (에이전트/스코프 prefix 포함)
- PR 설명에 아래 3개 항목 필수 포함
  - **why**: 어떤 문제를 해결하는가
  - **what**: 무엇을 변경했는가(파일/기능 단위)
  - **test**: 어떻게 검증했는가(수동/테스트/로그)
- 주요 화면은 **모바일/데스크톱 반응형 스크린샷 첨부**
- PR 본문에 `@codex` 멘션(자동 코드리뷰 트리거) + 새 커밋 push마다 리뷰 갱신

### 0.3 커밋/브랜치 규칙(충돌 최소화)
- 브랜치: **1개 고정(공유)**, PR도 **1개 고정(지속)**
- 커밋 메시지 prefix 권장: `[LEAD]`, `[WEB]`, `[FE]`, `[BE]`
- `git push`/PR 갱신은 **[LEAD]가 수행**(작업 단위로 push)

### 0.4 역할/분업(필수, 충돌 최소화)
- **[LEAD/Codex] (고정)**: 우선순위/플랜 수립 → 분업/소유권 관리 → 품질 게이트(`lint/build`) → 커밋/푸시/PR 관리 → `HANDOVER.md` + `docs/EXECUTION_PLAN.md` 갱신
- **[FE] Design Front Agent**: UI/UX/반응형/Tailwind/컴포넌트 일관성(i18n 포함) (주 소유: `src/components/**`, `src/app/**(UI)`, `src/app/globals.css`)
- **[WEB] Web Feature Agent**: 사용자 플로우/게이팅/모달/Query 키·훅/클라 상태/SSR Hydration(SEO 포함) (주 소유: `src/repo/**`, `src/providers/**`, `src/app/[lang]/**(기능)`)
- **[BE] Backend Agent**: API Routes/DB(Drizzle)/마이그레이션/캐시·레이트리밋/관리자 API (주 소유: `src/app/api/**`, `src/lib/db/**`, `src/lib/**(auth/supabase)`)
- **공통 규칙**: 에이전트는 작업 시작 전 `docs/EXECUTION_PLAN.md`에서 담당/범위 확인 → 작업 완료 후 “체크/변경 요청”을 Lead에 전달 → Lead가 검증 후 체크리스트/문서 반영 및 커밋/푸시

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
- [ ] `/verification/history` 실데이터 연동(현재 demo empty array)
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
- [x] (2025-12-18) POST `/api/reports` → `reports` 테이블로 통합 (운영 데이터 분산 방지)
- [x] (2025-12-18) `content_reports` 정리 방향 확정 (쓰기 중단 + 백필 `/api/admin/reports/backfill-content-reports`, 테이블 drop은 후속)
- [x] (2025-12-18) 관리자 신고 `reviewed` 상태 지원(API+UI 액션) + 신고 상세 XSS 방어
- [ ] (2025-12-18) 관리자 신고 큐 액션 정합화(숨김/삭제/경고/차단) (운영 최소 기능)
- [ ] (2025-12-18) 상단 공지/배너 관리자 설정형 CRUD + 홈 노출(SSR)

**현황 분석**
- 사용자 신고 엔드포인트 `POST /api/reports`는 `reports` 기반이며, legacy `content_reports`는 백필 전용: `src/app/api/reports/route.ts`, `src/app/api/admin/reports/backfill-content-reports/route.ts`.
- 관리자 신고 화면/API는 `reports` 기반: `src/app/admin/(dashboard)/reports/*`, `src/app/api/admin/reports/*`.
- 관리자 UI/상세는 `reviewed` 액션을 포함하며, 신고된 HTML 콘텐츠는 텍스트로 렌더링해 XSS를 방어: `src/app/api/admin/reports/[id]/route.ts`, `src/app/admin/(dashboard)/reports/[id]/page.tsx`.
- 공지/배너는 미구현. VietnamBanner는 정적 CTA 배너로만 존재.

**개선 포인트**
- 운영 데이터가 `reports`로 단일화되도록 신고 파이프라인 통합(사용자→관리자 일관).
- 관리자 `reviewed`(검토됨) 상태/액션을 최소치로 추가해 “대기→검토→처리” 흐름을 닫기.
- banners/notices 도메인 신설(테이블+API+admin UI+홈 캐러셀 SSR).

**판정**: reports는 OK에 가까움(점검 필요), 배너는 개선 필요(P0)

**다음 액션(PR)**
- PR‑D0: `reports-pipeline-unify`
- PR‑D1: `reports-admin-actions-reviewed`
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

### P0‑6) 리포지토리 구조/중복 정리(Foundation)

**플랜(체크리스트)**
- [x] (2025-12-18) `src/components/*` ATOMIC 경계 정리 (루트 파일 정리/이동 + import 정리)
- [x] (2025-12-18) `src/scripts` 정리 (미사용 스크립트 삭제, 중복 폴더 제거)
- [x] (2025-12-18) UI 컴포넌트 중복 가이드 확정 (문서화: `docs/REPO_STRUCTURE_GUIDE.md`)
- [x] (2025-12-18) 불필요/임시 파일 정리(recovery/tmp 등) (gitignore 포함)
- [x] (2025-12-17) import 규칙 정리: `src/components|providers|utils`의 `../` 상대경로 제거 + ESLint로 재발 방지
- [x] (2025-12-17) 상수 중복 제거: category group slugs 단일 소스(`category-groups.ts` → `categories.ts` 참조)
- [x] (2025-12-17) 미사용 컴포넌트 제거(구현/라우트에서 참조 없는 컴포넌트 정리) + lint/build 재검증
- [x] (2025-12-17) 인라인 style 최소화: 공통 CSS(util)로 이동(스크롤바 숨김/하단 safe-area offset 등)
- [x] (2025-12-18) 리팩토링 심화: `dateTime/safeText` 유틸로 중복 제거 + `ALLOWED_CATEGORY_SLUGS` 단일화 + `components/ui` 미사용 파일 정리

**현황 분석**
- 컴포넌트는 ATOMIC 폴더가 있으나, 일부 전역 컴포넌트가 `src/components/*` 루트에 존재.
- `scripts/`(root)와 `src/scripts/`가 공존(스크립트 위치/역할이 혼재).
- Admin은 `src/components/ui/*`(shadcn/Magic UI), User는 `src/components/atoms/*`를 주로 사용(중복 Button/Badge 등 존재).

**개선 포인트**
- “어디에 어떤 성격의 컴포넌트를 두는지” 규칙이 없으면 신규 개발마다 중복이 증가 → 리팩토링 비용 급증.
- 최소 리스크(파일 이동/정리)부터 시작하고, UI kit 통합은 Phase-2로 분리.

**판정**: 개선 필요(P0)

**다음 액션(PR)**
- PR‑S1: `repo-structure-cleanup-phase1`
- PR‑S2: `repo-structure-cleanup-phase2`

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

### 4.2 병렬 스트림(3분류, 동일 브랜치)

#### 4.2.1 통합 리더(고정)

**Agent Lead (총괄/감독) — Codex**
- (역할) 플랜/우선순위 통합, 업무 배분/조정, 충돌 조정, 최종 QA(`npm run lint`, `npm run build`), 인수인계/HANDOVER 반영
- (문서 운영) 체크리스트 표기 규칙: `- [ ] (YYYY-MM-DD) 작업명 (메모)` / 완료 시 `[x]`로 변경
- (단일 소유 파일) `docs/EXECUTION_PLAN.md`, `HANDOVER.md`, `messages/*.json` (다른 에이전트는 변경 요청/키 목록만 전달)
- (추가 고정 업무) 폴더/컴포넌트 정리(S*)는 Lead가 직접 진행

#### 4.2.2 3분류 에이전트(업무 배분)

| 분류 | 에이전트 | 담당 업무(요약) | 소유 파일 범위(충돌 방지) |
|---|---|---|---|
| **웹 기능 구현** | **Agent WEB** | 사용자/관리자 기능 구현(verification/follow/추천 섹션 등), SSR/SEO/메타/JSON‑LD, 페이지 단위 통합 | `src/app/[lang]/**`, `src/app/admin/**`(페이지), `src/components/organisms/**` |
| **디자인 프론트** | **Agent FE** | 모바일 UX/반응형, 레이아웃/컴포넌트 일관성, 무한스크롤/step-by-step 로딩 UI, 카피(i18n 키 요청) | `src/components/**`, `src/app/[lang]/**`(UI 조정 범위) |
| **백엔드 기반** | **Agent BE** | DB/마이그레이션, API, 캐시/성능, 레이트리밋/보안(관리자 포함), 데이터 규칙(인기글/추천/자동 태그) | `src/lib/db/**`, `src/app/api/**`, `src/repo/**` |

**공통 제출 포맷(모든 병렬 에이전트 PR)**
- (필수) PR 본문에 `why / what / test` 포함
- (필수) “사용자 UX(화면) + API + (해당 시) 관리자 화면”까지 end‑to‑end로 닫기
- (필수) 번역 키가 필요하면 PR 본문에 `i18n keys request:`로 `key = ko/en/vi 초안` 목록 제공(리드가 `messages/*.json`에 반영)
- (필수) 문서 반영이 필요하면 PR 본문에 `docs request:`로 `HANDOVER.md`, `docs/EXECUTION_PLAN.md` 반영할 bullet 목록 제공(리드가 반영)

**에이전트별 상세 책임**
- **Agent WEB**: 사용자/관리자 기능을 end-to-end로 닫되, API/DB 변경은 BE와 합의 후 진행(페이지 단위로 완결)
- **Agent FE**: 모바일 체감 품질(키보드/safe-area/스크롤/터치), UI 일관성, step-by-step 로딩/무한스크롤 UX를 공통 컴포넌트로 재사용 가능하게 정리
- **Agent BE**: 데이터/성능/캐시/보안의 기준선을 올리고(대량 유저/대량 게시글 대비), 추천/인기/태그 등 “규칙”을 API/DB 레벨에서 결정

#### 4.2.3 충돌 방지 규칙(필수)

1) `docs/EXECUTION_PLAN.md`, `HANDOVER.md`, `messages/*.json`는 **Agent Lead만 수정** (다른 에이전트는 “변경 요청 리스트”로 전달)  
2) DB 마이그레이션/스키마(`src/lib/db/**`)은 **Agent BE 단일 소유** (동일 테이블 변경 병렬 금지)  
3) PostDetail 영역(`src/app/[lang]/(main)/posts/[id]/**`)은 **Agent WEB 단일 소유** (UI 조정은 FE와 사전 합의)  
4) UI 컴포넌트 운영 모드(B 고정): **User는 `components/atoms|molecules|organisms` 중심**, **Admin은 `components/ui` 중심**(중복 Button/Badge를 혼용하지 않기)  
5) 작업 시작 전: `docs/EXECUTION_PLAN.md` 체크리스트/담당 확인 → 작업 범위 확정 → 커밋/푸시 → 다시 체크리스트 갱신(Lead)

이 구조로 가면 P0는 서로 거의 파일 충돌 없이 병렬 진행 가능하고, P1은 P0 이후 동일 원칙으로 새 스트림을 추가하면 됩니다.

---

## 5. 실행 순서 제안

1) **P0 스트림 병렬 착수** (WEB/FE/BE 동시, Lead 조정)
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
- [x] (2025-12-18) PR‑S1 `repo-structure-cleanup-phase1` (컴포넌트/스크립트/임시파일 정리로 중복 증가 방지)
- [x] (2025-12-17) PR‑S2 `repo-structure-cleanup-phase2` (import alias 통일 + ESLint `../` 금지 + 상수 중복 제거)
- [x] (2025-12-18) PR‑D0 `reports-pipeline-unify` (POST `/api/reports` → `reports` 단일화 + legacy backfill 엔드포인트 추가)
- [x] (2025-12-18) PR‑D1 `reports-admin-actions-reviewed` (관리자 `reviewed` 액션 + 신고 상세 XSS 방어)
- [x] (2025-12-17) 비로그인 입력 게이팅 UX 통일 (NewPost/Answer/Comment/Upload: 클릭 시 로그인 모달, 에러 대신 안내)
- [ ] (2025-12-18) i18n 누락/혼용 전수 점검(툴팁/배지/카테고리 라벨) + PostDetail 잔여 하드코딩 텍스트 정리
- [x] (2025-12-18) Tooltip 잔상/전환 이슈 방지 (라우트 이동 시 강제 close)

### 6.3 신규 요청 백로그(Owner/우선순위)

**운영/프로세스(Lead)**
- [x] (2025-12-18) [LEAD] 단일 브랜치/지속 PR 세팅 + `@codex` 멘션(자동 코드리뷰) (PR: https://github.com/LEE-SANG-BOK/VKC-2-/pull/1)
- [x] (2025-12-18) [LEAD] 컴포넌트 운영 모드(B) 문서 고정 + 혼용 방지 가드(ESLint import rule) (User=atoms, Admin=ui)

**UI/UX(Design Front)**
- [x] (2025-12-17) [FE] Home 버튼 클릭 시 “초기 상태”로 복귀(메인 스크롤/사이드바 스크롤 Top + 모바일 메뉴 닫기) (메모: 선택/필터 reset 기준은 별도 정의)
- [ ] (2025-12-18) [FE] 모바일 헤더: 사이드바 버튼 테두리 강조 + 사이드바 아이콘 툴팁 제거(홈 헤더 툴팁 1개만 유지)
- [ ] (2025-12-18) [FE] 페이지 여백(Desktop) 배경을 회색으로 구분(스크린샷 참고: “바깥 여백만” 회색, 콘텐츠 영역 UI는 변경하지 않음) (메모: 메인/상세/프로필/인증/로그인/관리자 공통 토큰화)
- [ ] (2025-12-18) [FE] 사이드바 가로폭을 우측 추천 콘텐츠 레일 폭과 동일하게 정렬
- [x] (2025-12-17) [FE] 모바일 PostCard 하단 액션/해시태그 잘림 방지(vi 텍스트 길이 대응)
- [ ] (2025-12-18) [FE] 피드/카드 작성자 라인에 `· Following` 상태 표시 + 미팔로우 시 `Follow` CTA(스크린샷의 “Following” 표현만 참고) (메모: `common.follow/following` 사용, 클릭 시 토글)
- [ ] (2025-12-18) [FE] PostCard: “인증 사용자 N명…” 라벨 좌측에 “답변 N개” CTA 추가(클릭 시 답변/댓글 영역 이동)
- [ ] (2025-12-18) [FE] 팔로잉 추천 카드 UI: `#(1): 값, #(2): 값, #(3): 값` 3개 고정 표기(실데이터 매핑) + step-by-step 로딩 UI
- [ ] (2025-12-18) [FE] 프로필 모달(북마크/팔로잉/내게시글)도 step-by-step 로딩(과부하 방지)
- [x] (2025-12-18) [FE] 홈 로고 근처 툴팁 카피 개선(브랜드 포지셔닝/가치 명확, ko/en/vi)
- [x] (2025-12-18) [FE] 로고 이미지 교체(`public/brand-logo.png`) + `Logo` 컴포넌트 이미지 기반 전환
- [ ] (2025-12-18) [FE] CTA 텍스트/카피 개선: “질문하기/공유하기/인증하기” 네이밍 + 상세 설명(ko/en/vi)
- [ ] (2025-12-18) [FE] 모바일 프로필 정보(가입일/성별/연령대/상태/메일 등) 콤팩트 레이아웃(가로 배치 우선)
- [ ] (2025-12-18) [FE] 관리자 페이지(웹/모바일) 긴 콘텐츠 스크롤 처리(특히 인증/신고 상세)
- [ ] (2025-12-18) [FE] 신뢰 배지(verified/expert/trusted/outdated) 툴팁/탭 UX 점검(모바일 long-press 포함) + “자세히” 링크/동선 적용 범위 합의 (메모: WEB의 배지 안내 페이지와 연결)

**웹 기능(사용자/관리자 기능)**
- [ ] (2025-12-18) [WEB] 팔로잉 “추천 팔로잉” 현황 분석 + 개선안 제시(추천 기준/제외 규칙/노출 우선순위)
- [ ] (2025-12-18) [WEB] 추천 팔로잉: 1회 전체 노출 금지 → 페이지네이션/무한스크롤 도입(서버/클라 키 정리)
- [ ] (2025-12-18) [WEB] 헤더 검색 예시 질문: 실제 인기 질문 데이터 기반으로 동적 반영(API/캐시/locale 처리)
- [ ] (2025-12-18) [WEB] 게시글 작성: 대표 이미지 선택 UI(다중 이미지 중 thumbnail 지정) + 저장/표시 연동
- [ ] (2025-12-18) [WEB] 인증 신청: 기존 신청 후 “추가 신청/수정하기” 플로우 지원(상태/권한/히스토리 포함)
- [ ] (2025-12-18) [WEB] 관리자 인증 심사 UI: 입력 항목/검증/기본값 적절성 현황 분석 + 개선안
- [ ] (2025-12-18) [WEB] 관리자 페이지 기능/정보구조 적절성 현황 분석 + 개선 플랜(성능/UX 포함)
- [ ] (2025-12-18) [WEB] 프로필 설정: 온보딩 값 자동 반영 여부 점검 + 닉네임 자동 부여 규칙 적절성 점검/개선
- [ ] (2025-12-18) [WEB] 배지 안내(가이드) 페이지 추가: 뱃지 타입/의미/획득 방법/신뢰 신호 설명(ko/en/vi) + PostCard/프로필에서 진입 동선 연결 (메모: SEO/SSR 여부 결정)
- [ ] (2025-12-18) [WEB] 랭킹/칭호(리더보드) UI/IA 설계(프로필 “신뢰/레벨/온도” 시각화 포함) (메모: BE 점수 규칙/API 선행)
- [ ] (2025-12-18) [WEB] 구독/알림 설정 UX 확장: 구독 관리 화면(카테고리/토픽) + 알림 수신/빈도 UI (메모: P1‑6 Stream‑E 연결)

**백엔드 기반(성능/규칙/데이터)**
- [ ] (2025-12-18) [BE] 인기글(trending) 규칙 현황 분석 + 개선안(점수/기간/캐시/부하) 제시
- [ ] (2025-12-18) [BE] 추천 팔로잉용 사용자 메타 3개 산출 규칙 정의(예: 인증/채택률/관심사 일치율) + API 응답 확장
- [ ] (2025-12-18) [BE] 헤더 검색 예시 질문 API 지원(실데이터 기반, 캐시 전략 포함)
- [ ] (2025-12-18) [BE] 자동 해시태그 3개 생성 규칙 정의/구현(키워드+대/소분류 기반, 고정 3개)
- [x] (2025-12-17) [BE] UGC 최소 글자수 완화: 댓글/답변 10→5, 글 제목/본문 최소치 재조정 + ko/en/vi 메시지 동기화
- [ ] (2025-12-18) [BE] “한국생활정보” 카테고리 폐기(노출 제거/비활성화/마이그레이션 방안) + 미지정/레거시 카테고리 글 숨김 정책
- [ ] (2025-12-18) [BE] 관리자 페이지 성능 점검(응답 payload/쿼리/페이지네이션) + step-by-step 로딩에 맞는 API 최적화
- [ ] (2025-12-18) [BE] 관리자 페이지 “추천 게시글 작성” 기능 제공 여부/홈 적용 여부 현황 파악
- [ ] (2025-12-18) [BE] 포인트/레벨/신뢰점수(온도) 산정 규칙 정의 + 조회 API 설계(프로필/리더보드 공용) (메모: DB 컬럼/집계 방식 검증 필요)
- [ ] (2025-12-18) [BE] 구독/알림(P1‑6) 설정 저장 모델 확정(빈도/채널/토픽) + API 추가 (메모: 마이그레이션 가능성)
- [ ] (2025-12-18) [BE] 모더레이션 고도화 로드맵: 룰 기반(금칙어/연락처/저품질) → “신뢰 낮음” 라벨링 → (선택) AI 자동 분류/큐잉 (메모: 외부 AI 연동은 P2로)
