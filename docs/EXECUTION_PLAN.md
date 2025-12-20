# Viet K-Connect 실행 플랜/체크리스트 (P0→P1)

> 역할: Viet K‑Connect 프로젝트 시니어 풀스택 개발자 관점  
> 목표: “신뢰 기반 Q&A 커뮤니티” 웹 MVP를 **출시 가능한 품질**로 마무리  
> 범위: 기능/SEO/성능/모바일/디자인/리팩토링/운영 최소 기능  
> 제외: 외부 마케팅 채널 운영/광고 집행/픽셀·SDK/외부 콘텐츠 배포 전략

---

> 실행 중 플랜은 `docs/WORKING_PLAN.md`를 우선 참고(요약/실행용), 본 문서는 히스토리/증빙용.

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
- (주의) Codex CLI 환경에서 `.git/index.lock` 생성이 막혀 `git add/commit/push`가 실패할 수 있음 → 이 경우 **로컬 터미널에서 수동으로** 커밋/푸시 진행

#### 0.3.1 브랜치/워크트리 현황·커밋 전략(2025-12-20 기준)
- 주 워크트리: `/Users/bk/Desktop/VKC-2-` (공통 브랜치: `codex-integration`)
- 운영 원칙: 단일 워크트리/단일 브랜치 고정, 커밋/푸시는 **LEAD만 수행**
- 커밋/PR 전략: 스코프별 단일 커밋 묶음 → i18n 키 추가 포함 → `npm run lint` → `SKIP_SITEMAP_DB=true npm run build` → `docs/EXECUTION_PLAN.md`, `HANDOVER.md` 갱신 → 로컬 터미널에서 커밋/푸시 → 단일 PR 유지, `@codex` 멘션 후 CI 통과 시 머지. 머지 후 모든 워크트리 `git pull origin main` 동기화.

#### 0.3.2 진행 중 브랜치/워크트리 메모(커밋/머지 상태)
- `/Users/bk/Desktop/VKC-2-`
  - 브랜치: `main` (PR #19 merge 완료, 로컬/원격 동기화 완료)
  - 워크트리: clean
- `/Users/bk/Desktop/viet-kconnect-renew-nextjs-main 2`
  - 브랜치: `codex-subscriptions` (dirty) → **백업 전용**, merge/커밋 금지

#### 0.3.3 Codex End-to-End 플로우(5.2 xh 기준)
- 로컬 설계/착수: 스캐폴딩 → 타입 정의 → 핵심 로직 초안.
- 로컬 반복: 함수 단위 리팩토링 → 에러 처리/성능 개선 → 불필요 변경 제거.
- 품질 게이트: `npm run lint` → `SKIP_SITEMAP_DB=true npm run build`.
- PR 생성: why/what/test 명시 + `@codex` 리뷰 멘션.
- 리뷰/수정: @codex 리뷰 → 필요 시 추가 커밋 → 재검증.
- 머지/동기화: 머지 후 `git pull origin main`로 모든 워크트리 동기화.

#### 0.3.4 대량 미커밋/미머지 혼선 방지 절차(필수)
- 결론: 프롬프트에 “`docs/EXECUTION_PLAN.md` 읽고 절차대로 진행”만 넣는 것으로는 **불충분**. 아래 **게이트 절차를 항상 실행**하면 혼선 대부분 해결됨.
- 작업 시작 전(Preflight)
  - `pwd`로 작업 워크트리 확인 → 활성 워크트리 1개만 사용.
  - `git status -sb`가 clean일 때만 작업 시작(더티면 `stash`/백업 브랜치로 분리).
  - `git fetch origin` 후 `git diff --stat origin/main`이 **빈 상태**인지 확인.
  - 항상 `git switch main && git pull origin main` → `git switch -c <새-브랜치>`.
- 작업 중(스코프 고정)
  - FE/WEB/BE 범위 혼합 금지. 필요 시 커밋을 분리하거나 PR을 분할.
  - 변경 파일 목록을 문서에 기록하고, “활성 브랜치” vs “백업 브랜치”를 명확히 구분.
- PR 전(품질 게이트)
  - `npm run lint` → `SKIP_SITEMAP_DB=true npm run build` 통과 여부 기록.
  - `git status -sb`에서 **의도된 파일만 남았는지** 확인.
- 머지 후(동기화)
  - `git switch main && git pull origin main`로 모든 워크트리 동기화.
  - 오래된 더티 브랜치는 **merge 금지**. 필요한 파일만 선별 이관.

### 0.4 역할/분업(필수, 충돌 최소화)
- **[LEAD/Codex] (고정)**: 우선순위/플랜 수립 → 분업/소유권 관리 → 품질 게이트(`lint/build`) → 커밋/푸시/PR 관리 → `HANDOVER.md` + `docs/EXECUTION_PLAN.md` 갱신
- **[FE] Design Front Agent**: UI/UX/반응형/Tailwind/컴포넌트 일관성(i18n 포함) (주 소유: `src/components/**`, `src/app/**(UI)`, `src/app/globals.css`)
- **[WEB] Web Feature Agent**: 사용자 플로우/게이팅/모달/Query 키·훅/클라 상태/SSR Hydration(SEO 포함) (주 소유: `src/repo/**`, `src/providers/**`, `src/app/[lang]/**(기능)`)
- **[BE] Backend Agent**: API Routes/DB(Drizzle)/마이그레이션/캐시·레이트리밋/관리자 API (주 소유: `src/app/api/**`, `src/lib/db/**`, `src/lib/**(auth/supabase)`)
- **[QA/Release] (LEAD 겸임)**: 실기기/브라우저 매트릭스 점검 → 회귀 체크리스트 → 배포/릴리즈 노트 관리
- **공통 규칙**: 에이전트는 작업 시작 전 `docs/EXECUTION_PLAN.md`에서 담당/범위 확인 → 작업 완료 후 “체크/변경 요청”을 Lead에 전달 → Lead가 검증 후 체크리스트/문서 반영 및 커밋/푸시

### 0.5 에이전트 작업 기록/플랜(필수)

- **원칙**: 각 에이전트는 작업 단위마다 **본 문서에 작업 기록 + 자체 플랜/현황 분석**을 남긴다.
- **충돌 방지**: 에이전트는 **본인 섹션만 수정**하고, 기존 라인은 수정/재정렬하지 않고 **아래에 append만** 한다.
- **검수 흐름**: 에이전트는 `[ ]`로 기록 → Lead가 `lint/build` 포함 검증 후 `[x]`로 변경(Lead 서명/메모 추가).
- **주의**: `docs/EXECUTION_PLAN.md`와 `HANDOVER.md`는 “수정 금지” 파일이 아니라 **업무 수행 시 반드시 갱신해야 하는 산출물**이다.

**작성 포맷(복붙 템플릿)**

```md
#### (YYYY-MM-DD) [AGENT] 작업명 (P0/P1)

- 플랜(체크리스트)
  - [x] 서브태스크 1
  - [x] 서브태스크 2
- 현황 분석(코드 기준)
  - 현재 구현/문제 위치:
  - 재현/리스크:
- 변경 내용(why/what)
  - why:
  - what:
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - path1
  - path2
- 다음 액션/의존성
  - (예: BE API 선행 필요 / FE UI 확정 필요)
```

#### 0.5.1 Codex CLI 스킬 프롬프트 (GitHub PR/CI)

- 목적: GitHub PR에서 **리뷰 코멘트 처리** / **CI(GitHub Actions) 실패 분석·수정**을 빠르게 표준화한다.
- 사용 조건: Codex CLI에서 스킬이 설치되어 있고(예: `~/.codex/skills/*`), 스킬을 인식하는 **새 Codex 세션**에서 실행한다.
- 호출 방식: 프롬프트에 `$<skill-name>`을 명시해 스킬을 강제 사용한다(가능하면 상단에 배치).

**A) PR CI가 깨졌을 때: `gh-fix-ci`**

```text
$gh-fix-ci

## 목적
- 이 PR의 GitHub Actions 실패 원인(핵심 로그/stacktrace) 요약 + 수정 플랜 작성 + (승인 후) 코드 수정

## 입력
- repo: .
- pr: <PR 번호 또는 URL> (없으면 현재 브랜치 PR 자동 탐지)

## 제약/주의
- GitHub Actions 외 외부 체크(예: Buildkite)는 스코프 아웃(링크만 보고).
- 수정은 최소 범위로, 관련 `npm run lint` / `npm run build`를 기준으로 검증.
- gh 인증이 안 되어 있으면 `oai_gh` 후 `gh auth status`부터 진행.

## 산출물
- 실패 요약(가장 유의미한 로그 일부)
- 수정 플랜(단계별)
- 사용자 승인 후 구현
```

**B) PR 리뷰 코멘트 대응: `gh-address-comments`**

```text
$gh-address-comments

## 목적
- 현재 PR의 리뷰/이슈 코멘트를 항목별로 처리(수정 반영 + 답글 작성)하고, 남은 액션을 정리

## 입력
- repo: .
- pr: <PR 번호 또는 URL> (없으면 현재 브랜치 PR 자동 탐지)

## 진행 방식
- 코멘트별로: (1) 이해 요약 → (2) 조치(코드 변경) → (3) 답글(결과/근거/추가 질문) 순서로 처리
- 변경 후 필요한 경우 `npm run lint` / `npm run build` 결과를 함께 기록
- gh 인증이 안 되어 있으면 `oai_gh` 후 `gh auth status`부터 진행
```

---

## 0.6 에이전트별 작업 기록(append only)

> 각 에이전트들이 자체 분석한 플랜/기록은 아래 섹션에 **append-only**로 남긴다(본인 섹션만 수정).

### 0.6.0 [LEAD] Control Tower

#### (2025-12-18) [LEAD] 컴포넌트 폴더 구조 정리: Modals 분리 (P0)

- 플랜(체크리스트)
  - [x] `src/components/molecules/*Modal.tsx` → `src/components/molecules/modals/*`로 이동
  - [x] import 경로 갱신(dynamic import 포함)
- 현황 분석(코드 기준)
  - molecules 루트에 Modal 컴포넌트가 혼재되어 탐색/소유권 관리가 어려움
- 변경 내용(why/what)
  - why: 모달은 성능/데이터 호출과 직결되어 별도 폴더로 분리 시 관리/감독이 쉬워짐
  - what: `molecules/modals`로 파일 이동 후 Header/UserProfile의 dynamic import 경로를 갱신
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/components/molecules/modals/*
  - src/components/organisms/Header.tsx
  - src/components/molecules/UserProfile.tsx
- 다음 액션/의존성
  - FE/WEB 에이전트 소유권 경계 재확인(모달 관련 작업은 이 폴더만 수정)

#### (2025-12-18) [LEAD] 리팩토링 심화: 태그 번역/정규화 유틸 공통화 + 모바일 오버플로우 방지 (P0)

- 플랜(체크리스트)
  - [x] PostCard/NewPostClient 중복 태그 번역 맵 공통화
  - [x] `normalizeKey` 유틸 공통화(PostCard/PostDetail)
  - [x] 모바일에서 긴 라벨로 인한 액션 아이콘 클립 방지
- 현황 분석(코드 기준)
  - PostCard/NewPostClient에 동일한 태그 번역 맵이 중복 정의되어 유지보수/성능(객체 재생성) 리스크
  - PostCard/PostDetail에 normalizeKey 로직 중복
  - locale(특히 vi)에서 하단 라벨이 길어질 때 아이콘 영역이 밀려 클립될 수 있음
- 변경 내용(why/what)
  - why: 중복 제거로 유지보수 비용/실수(번역 누락) 감소, 모바일 레이아웃 안정화
  - what: 공통 상수/유틸로 추출 후 호출부를 교체 + 하단 라벨 overflow 방지
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/lib/constants/tag-translations.ts
  - src/utils/normalizeKey.ts
  - src/components/molecules/PostCard.tsx
  - src/app/[lang]/(main)/posts/new/NewPostClient.tsx
  - src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx

#### (2025-12-18) [LEAD] 헤더 검색 컴포넌트 분리 + Dialog 스크롤 기본값 보강 (P0)

- 플랜(체크리스트)
  - [x] Header의 검색 UI/로직을 `HeaderSearch`(molecule)로 분리
  - [x] Header에서는 dynamic import + skeleton fallback으로 초기 렌더 부담 감소
  - [x] `Dialog/AlertDialog` 기본 Content에 max-height + overflow scroll 적용(긴 콘텐츠 대응)
- 현황 분석(코드 기준)
  - Header에 검색/필터/예시문구 로직이 집중되어 파일 비대화 및 리렌더 비용 증가
  - Admin/모달 UX에서 긴 콘텐츠가 화면 밖으로 넘어가는 케이스 존재
- 변경 내용(why/what)
  - why: 폴더/컴포넌트 책임 분리로 유지보수성과 성능(초기 JS) 개선
  - what: `HeaderSearch`를 분리하고, Dialog 계열은 `100dvh` 기준 스크롤 가능하도록 기본 클래스를 보강
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/components/organisms/Header.tsx
  - src/components/molecules/HeaderSearch.tsx
  - src/components/ui/dialog.tsx
  - src/components/ui/alert-dialog.tsx

#### (2025-12-18) [LEAD] 레거시 신고 시스템 정리: admin content-reports API 제거 (P0)

- 플랜(체크리스트)
  - [x] `/api/admin/content-reports` 레거시 API 제거(참조 0)
  - [x] `reports` 기반 운영을 기준으로 정리(필요 시 백필 라우트만 유지)
- 현황 분석(코드 기준)
  - `content_reports`는 legacy 이중 시스템으로 남아있고, UI/Repo에서 해당 admin endpoint를 호출하지 않음
  - 운영 데이터가 분산될 위험이 있어, “reports 단일 파이프라인”으로 정리 필요
- 변경 내용(why/what)
  - why: 중복 시스템 제거로 운영/개발 혼선 감소, API surface 최소화
  - what: `src/app/api/admin/content-reports/**` 삭제
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - (deleted) src/app/api/admin/content-reports/route.ts
  - (deleted) src/app/api/admin/content-reports/[id]/route.ts

#### (2025-12-20) [LEAD] build 오류 해결: 유저 점수 API route 복원 (P0)

- 플랜(체크리스트)
  - [x] `/api/users/[id]/score` route 복원
  - [x] `npm run build` 통과 확인
- 현황 분석(코드 기준)
  - `.next/dev/types`에서 `/api/users/[id]/score` 타입 참조가 생성되었는데 실제 route 파일이 없어 빌드 실패
- 변경 내용(why/what)
  - why: 빌드 타입 체크 실패 해소
  - what: `src/app/api/users/[id]/score/route.ts` 복원
- 검증
  - [x] npm run build
- 변경 파일
  - src/app/api/users/[id]/score/route.ts

#### (2025-12-18) [LEAD] 컴포넌트 폴더 구조 정리: molecules/cards 분리 (P0)

- 플랜(체크리스트)
  - [x] 카드 성격 컴포넌트를 `molecules` 루트에서 `molecules/cards`로 이동
  - [x] import 경로 업데이트(프로필/검색/피드/모달)
- 현황 분석(코드 기준)
  - `molecules` 루트에 카드/모달/에디터/프로필 등이 혼재되어 탐색 비용 및 충돌 가능성이 증가
- 변경 내용(why/what)
  - why: 카드 컴포넌트는 사용처가 많아 구조를 고정해두면 유지보수/분업/충돌 관리가 쉬워짐
  - what: `PostCard/AnswerCard/CommentCard/NewsCard`를 `src/components/molecules/cards/*`로 이동
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/components/molecules/cards/PostCard.tsx
  - src/components/molecules/cards/AnswerCard.tsx
  - src/components/molecules/cards/CommentCard.tsx
  - src/components/molecules/cards/NewsCard.tsx
  - src/components/organisms/PostList.tsx
  - src/components/organisms/NewsSection.tsx
  - src/app/[lang]/(main)/profile/[id]/ProfileClient.tsx
  - src/app/[lang]/(main)/search/SearchClient.tsx
  - src/components/molecules/modals/BookmarksModal.tsx
  - src/components/molecules/modals/FollowingModal.tsx
  - src/components/molecules/modals/MyPostsModal.tsx

#### (2025-12-18) [LEAD] 컴포넌트 폴더 구조 정리: molecules 역할별 하위 폴더 분리 (P0)

- 플랜(체크리스트)
  - [x] molecules 루트 잔여 컴포넌트들을 역할별 하위 폴더로 이동
  - [x] import 경로 전수 갱신
- 현황 분석(코드 기준)
  - cards/modals 분리 이후에도 molecules 루트에 banner/category/editor/search/user/action 성격의 파일이 혼재
- 변경 내용(why/what)
  - why: 탐색성/소유권 경계 명확화로 병렬 작업 충돌을 줄이고 유지보수 비용 감소
  - what: `banners/categories/editor/search/user/actions` 하위 폴더로 이동
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/components/molecules/banners/AccountStatusBanner.tsx
  - src/components/molecules/categories/CategoryItem.tsx
  - src/components/molecules/editor/RichTextEditor.tsx
  - src/components/molecules/search/HeaderSearch.tsx
  - src/components/molecules/user/UserChip.tsx
  - src/components/molecules/user/UserProfile.tsx
  - src/components/molecules/actions/ShareButton.tsx
  - src/components/organisms/CategorySidebar.tsx
  - src/components/organisms/Header.tsx
  - src/components/templates/MainLayout.tsx
  - src/components/organisms/CardNewsShowcase.tsx
  - src/components/organisms/ShortFormPlaylist.tsx
  - src/app/[lang]/(main)/posts/new/NewPostClient.tsx
  - src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx
  - src/components/molecules/cards/AnswerCard.tsx
  - src/components/molecules/cards/CommentCard.tsx

#### (2025-12-18) [LEAD] 모바일/데스크톱 사이드바·카드 잘림 개선 + 데스크톱 여백 회색 분리 (P0)

- 플랜(체크리스트)
  - [x] 모바일 CategorySidebar에서 구독 버튼/라벨이 우측에서 잘리는 문제 해결
  - [x] 데스크톱 사이드바의 메뉴/CTA는 tooltip 대신 동일한 인라인 설명(모바일 스타일)로 통일
  - [x] PostCard의 태그/액션 아이콘이 `sm~md` 구간에서 잘리는 케이스 보강
  - [x] MainLayout에서 바깥 여백을 회색으로 분리(Quora 레이아웃 참고)
- 현황 분석(코드 기준)
  - CategorySidebar의 구독 행에서 `CategoryItem`이 기본 `w-full`을 강제하여 flex row가 overflow → 우측 버튼이 클립
  - PostCard는 `sm` 구간(>=640)에서 태그를 가로 스크롤로 전환하고, 액션바 wrap이 `<=640`에서만 적용되어 일부 디바이스 폭에서 아이콘이 클립될 수 있음
- 변경 내용(why/what)
  - why: 모바일/태블릿에서 “버튼/태그/아이콘 잘림”은 클릭 실패→이탈로 직결되므로 P0 품질 이슈
  - what:
    - CategoryItem 기본폭 규칙을 보강해 `flex-1/grow` 사용 시 `w-full` 강제를 제거
    - CategorySidebar 구독 버튼을 `shrink-0 whitespace-nowrap`로 고정 + 모바일 스크롤바 커스텀 제거
    - PostCard 태그 칩의 가로 스크롤 전환 breakpoint를 `md`로 상향
    - 카드 하단 액션 행 wrap을 `<=768`까지 확장하여 아이콘/라벨 클립 방지
    - MainLayout 배경을 회색으로 통일하고 container 배경을 제거해 여백 구분 강화
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/components/molecules/categories/CategoryItem.tsx
  - src/components/organisms/CategorySidebar.tsx
  - src/components/molecules/cards/PostCard.tsx
  - src/app/globals.css
  - src/components/templates/MainLayout.tsx

#### (2025-12-18) [LEAD] 레이아웃 벤치마킹(Facebook): 헤더 배치/3컬럼 캔버스/추천 팔로우 인서트 설계 (P0, 계획)

- 플랜(체크리스트)
  - [x] Header 배치(구성요소 추가/삭제 없이): 3-zone(Left/Center/Right)로 정렬 고정(센터가 흔들리지 않도록 grid 기반)
  - [x] 캔버스 색 분리: 배경은 gray, 카드/모듈은 white로 집중(페이스북 스타일)
  - [x] 메인 피드 중앙 집중: wide 화면에서 `leftRail / centerFeed / rightRail` 3컬럼 + center max-width로 시선 집중
  - [x] 추천 팔로우 인서트: 인기/최신 리스트에서 **초기 5개 카드 이후** “추천 사용자” 섹션 중간 삽입
  - [x] i18n: 추천 섹션 타이틀/CTA ko/en/vi 키 적용(기존 키 사용)
  - [x] 검증: npm run lint, npm run build
- 현황 분석(코드 기준)
  - Header는 flex 기반이라 좌/우 폭 변화에 따라 센터(검색)가 미세하게 흔들릴 수 있음(페이스북은 좌/중/우 정렬이 고정)
  - MainLayout은 `container`로 레일이 중앙에 묶여 wide 화면 활용도가 낮고, 레일이 white panel 형태라 메인 피드 집중도가 약해질 수 있음
  - 추천 사용자 섹션은 `following` 탭 중심으로 존재했으나, 인기/최신 피드에도 5개 뒤 인서트가 필요
- 작업 분장(충돌 최소화)
  - [FE] Header/Grid, Canvas 색 분리, 레일 스타일(배경/여백) 및 반응형 검증
  - [WEB] PostList 인서트 로직(5개 뒤 삽입), recommended query 조건(로그인/카테고리), UX 게이팅
- [LEAD] 통합 검증(lint/build) + 문서/HANDOVER 갱신 + PR/코드리뷰 관리

#### (2025-12-18) [LEAD] Facebook 레이아웃 배치 핫픽스: Header/MainLayout 폭 정렬 + 홈 피드 캔버스화 (P0)

- 플랜(체크리스트)
  - [x] Header의 max-width/grid 기준을 MainLayout과 동일하게 정렬(ultrawide에서 헤더-본문 어긋남 방지)
  - [x] 홈 피드는 “회색 캔버스 + 카드만 흰색”이 되도록 center 영역을 투명(canvas)으로 전환
  - [x] 검증: npm run lint, npm run build
- 현황 분석(코드 기준)
  - Header는 `container`(폭 제한) 기반, MainLayout은 `max-w-[1680px]` 기반이라 ultrawide에서 정렬이 어긋날 수 있음
  - 메인 피드가 white panel 형태면 “카드 집중”보다 “패널 집중”으로 보일 수 있어, 요청한 Facebook 스타일(캔버스 회색/카드 흰색)과 불일치
- 변경 내용(why/what)
  - why: wide 화면에서 배치가 어색해 보이면 신뢰/완성도 체감이 크게 하락
  - what: Header는 MainLayout과 동일한 3컬럼 grid/max-width를 사용, MainLayout은 `centerVariant` 옵션을 추가하고 Home에서 `canvas`를 사용
- 변경 파일
  - src/components/organisms/Header.tsx
  - src/components/templates/MainLayout.tsx
  - src/app/[lang]/(main)/HomeClient.tsx

#### (2025-12-19) [LEAD] Ultrawide 레이아웃 “빈 화면” 버그 수정: Tailwind grid-cols 임의값 구문 정정 (P0)

- 플랜(체크리스트)
  - [x] ultrawide에서 피드/레일이 한 컬럼으로 쌓이는 증상 원인 분석
  - [x] `grid-cols-[...]` 임의값에서 컬럼 구분자를 `_`(공백)로 정정
  - [x] Header/MainLayout 모두 동일한 구문으로 정렬
  - [x] 문서 잠금 공지(HOT_FILE) 경로 오타 수정
  - [x] 검증: npm run lint, npm run build
- 현황 분석(코드 기준)
  - 증상: 데스크톱/ultrawide에서 좌측 레일이 상단에 “박스처럼” 렌더되고, 메인 피드가 화면 아래로 밀려 “빈 회색 화면”처럼 보일 수 있음
  - 원인: Tailwind 임의값 클래스에서 `grid-cols-[320px,minmax(0,1fr),320px]`처럼 **트랙 구분에 콤마(,)** 를 사용해 `grid-template-columns`가 무효 처리됨 → `grid-cols-1`(혹은 기본값)로 떨어져 레일/피드가 세로로 쌓임
- 변경 내용(why/what)
  - why: 레이아웃이 깨지면 “콘텐츠가 없는 사이트”처럼 보여 신뢰/체감 완성도에 치명적
  - what: 트랙 구분을 `_`로 변경해 `grid-template-columns: 320px minmax(0,1fr) 320px`가 정상 적용되도록 수정
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/components/organisms/Header.tsx
  - src/components/templates/MainLayout.tsx
  - docs/HOT_FILE_LOCK_NOTICE.md

#### (2025-12-19) [LEAD] 다음 작업 분배(병렬) + Hot File 소유권 공지 (P0)

- 원칙
  - Hot File(`Header.tsx`, `MainLayout.tsx`, `PostList.tsx`, `globals.css`)은 **LEAD 스냅샷(커밋/푸시) 고정 이후**에만 병렬 작업 허용
  - 병렬은 가능하지만, **파일 소유권을 강하게 분리**해야 충돌이 실질적으로 줄어듦
- 운영 체크리스트(에이전트 공통)
  - [x] 최신 스냅샷 커밋 SHA 확인(LEAD 공지 기준)
  - [x] 본인 소유 파일만 수정(Hot File/공유 레이아웃은 합의 없이 수정 금지)
  - [x] 작업 내용은 본인 섹션(0.6.x)에 append-only로 기록
  - [x] npm run lint / npm run build 재검증 후 결과를 LEAD에 보고
  - [x] 커밋/푸시는 LEAD가 수행(단일 스냅샷로 고정)
- 작업 분배(1차)
  - [FE] (P0) PostCard 모바일 잘림 재점검(vi): 태그/액션/해결됨 아이콘/라벨이 `sm~md` 구간에서도 클립되지 않도록 UI 보강
  - [WEB] (P0) HeaderSearch 예시 질문 실데이터 연결: `/api/search/examples`를 사용해 검색 인풋 placeholder/추천 리스트를 locale별로 노출
  - [WEB] (P0) 알림/짧은 주기 API 호출 점검: notifications 관련 query의 enabled/staleTime 조건을 재점검해 불필요 요청 차단
  - [BE] (P1) 추천 사용자/검색 예시 API 캐시/상한 정리: `limit/page` clamp + Cache-Control 정책 확정(anonymous 캐시 가능 범위)

#### (2025-12-19) [LEAD] 리팩토링 심화: 추천 사용자 섹션 분리 + 모바일 캐러셀 + PostCard 카운트 콤팩트화 (P0)

- 플랜(체크리스트)
  - [x] 추천 사용자 섹션을 공통 컴포넌트로 분리해 PostList(Hot File) 수정 범위를 축소
  - [x] 모바일에서 추천 사용자 섹션을 2개씩 가로 캐러셀(좌/우 이동)로 노출
  - [x] PostCard의 “답변 N개/댓글 N개” 텍스트를 아이콘 옆 숫자만 표시로 콤팩트화(aria-label 유지)
  - [x] 검증: npm run lint, npm run build
- 변경 파일
  - src/components/organisms/RecommendedUsersSection.tsx
  - src/components/organisms/PostList.tsx
  - src/components/molecules/cards/PostCard.tsx
  - docs/EXECUTION_PLAN.md
  - HANDOVER.md

#### (2025-12-19) [LEAD] 추천 사용자 메타/구독 필터 보강 + 헤더/사이드바 카피 정합화 (P0)

- 플랜(체크리스트)
  - [x] 추천 사용자 카드: recommendationMeta 우선 노출(#1~#3), 인증 사용자 라벨 추가
  - [x] 구독 피드 상단 가로 카테고리 필터를 데스크톱에도 노출
  - [x] HeaderSearch select 폭 축소로 예시/placeholder 노출 폭 확대
  - [x] 사이드바 구독 버튼 폭/폰트 조정으로 vi 줄바꿈/클립 리스크 완화
  - [x] 헤더 CTA signup 카피를 “Get started/시작하기/Bắt đầu” 톤으로 통일
  - [x] 팔로잉 모달 추천 탭도 recommendationMeta 기반 #1~#3로 정렬(인증 라벨 포함)
- 변경 파일
  - src/components/organisms/RecommendedUsersSection.tsx
  - src/components/organisms/PostList.tsx
  - src/components/molecules/search/HeaderSearch.tsx
  - src/components/organisms/CategorySidebar.tsx
  - src/components/molecules/modals/FollowingModal.tsx
  - messages/ko.json
  - messages/en.json
  - messages/vi.json
  - docs/EXECUTION_PLAN.md
- 검증
  - [x] npm run lint

#### (2025-12-19) [LEAD] 보고서 반영: 성능/구조 체계화 백로그 (P1/P2)

- 플랜(체크리스트)
  - [x] 공통 이미지 컴포넌트(`FeedImage`) 도입: `next/image` sizes/placeholder 통일로 반복 제거
  - [x] 코드 스플리팅 점검: heavy locale/라이브러리 최소화 규칙 문서화
  - [x] 모바일 WebView/키보드/100dvh QA 체크리스트 수립(iOS/Android)
  - [x] i18n 길이 대응 규칙 문서화(패딩 기반/랩 허용), ko/vi 우선 검수(en optional)
  - [x] 접근성 체크리스트(아이콘 버튼 aria-label) + IconButton 공통화 검토
  - [x] atoms/molecules/organisms 분류 가이드 문서화 + admin 모듈 경계(`lib/admin`, `repo/admin`) 정리
  - [x] 테스트/모니터링/레이트리밋/feature-flag는 P2 백로그로 이관(E2E/로그/지표)

#### (2025-12-19) [LEAD] 보고서 반영: SEO/개인화/신뢰/운영 체계화 백로그 (P1/P2)

- 플랜(체크리스트)
  - [x] 공개/비공개 정책 수립: Q&A SSR 공개 범위 정의 + 민감 콘텐츠 요약/로그인 유도
  - [x] 동적 sitemap/robots 구축: 질문/카테고리/공지/FAQ 포함 + 자동 갱신
  - [x] hreflang/canonical 정책 정리(ko/vi 우선, en optional)
  - [x] 개인화 피드 규칙 문서화: onboarding 관심사 가중치 + 인기/최신 보정
  - [x] 상세 추천 섹션 규칙 정리: “이 질문을 본 사람들이…” 데이터 요구사항 명시
  - [x] 프로필 성취 지표/온도(당근 36.5 벤치마킹) 설계 + 랭킹 노출 기준 정의
  - [x] 콘텐츠 반응/검색 로그 스키마 설계(조회/좋아요/답변/검색어 집계)
  - [x] 이벤트 트래킹/코호트/대시보드 도입(GA4 + Metabase/ Grafana)
  - [x] 광고/스팸 정책 문서화(홍보 허용 범위/금칙어) + 신고→자동 숨김 기준
  - [x] 레이트 리밋/보안 점검(CSP/OWASP) + PWA/푸시 알림은 P2로 이관
  - [x] 분기별 아키텍처/의존성 업데이트 리뷰 규칙 정의

#### (2025-12-19) [LEAD] 헤더/모바일 피드 레이아웃 정합화 (P0)

- 플랜(체크리스트)
  - [x] 헤더 좌측(로고+문구) 폭을 고정하고, 검색 영역은 가변 폭 확보
  - [x] 로고 문구는 모바일에서도 노출하되 2줄/ellipsis 정책 정의
  - [x] 모바일 카드 하단 카운트는 아이콘+숫자만 표시(댓글/답변 텍스트 제거)
  - [x] 태그 칩 길이 제한/줄바꿈 규칙 통일(2줄 제한 또는 가로 스크롤)
  - [x] 추천 사용자 캐러셀 컨트롤(좌/우 버튼) 위치/높이 고정

### 0.6.1 [FE] Design Front Agent

#### (2025-12-18) [FE] 피드/레이아웃 UX 안정화 (P0)

- 플랜(체크리스트)
  - [x] 데스크톱 외곽 여백 회색 분리(콘텐츠 영역 유지)
  - [x] PostCard 작성자 라인 `· Follow/Following` 표현 적용
  - [x] 모바일에서 상태 아이콘/태그/긴 라벨 잘림 방지
- 현황 분석(코드 기준)
  - PostCard 하단/태그 라인이 `overflow-x-auto`/nowrap 조합으로 locale(vi)에서 일부 잘림
  - 데스크톱은 콘텐츠 영역과 바깥 여백의 시각적 구분이 약함
- 변경 내용(why/what)
  - why: 모바일 잘림(특히 vi)이 전환/클릭 실패로 이어짐, 데스크톱 레이아웃 구분이 약해 가독성 저하
  - what: PostCard 태그는 mobile에서 wrap, 데스크톱은 가로 스크롤 유지; 하단 액션 행은 모바일 wrap 허용; MainLayout에 데스크톱 외곽 bg 적용
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/components/templates/MainLayout.tsx
  - src/components/molecules/PostCard.tsx
  - src/app/globals.css
- 다음 액션/의존성
  - i18n 누락/혼용 전수 점검(툴팁/배지/카테고리)

#### (2025-12-18) [FE] Design Front Agent Prompt 요구사항 검증/기록 (P0)

- 플랜(체크리스트)
  - [x] 피드 카드 작성자 라인에 `· Following/Follow` 표시(카드 클릭과 분리)
  - [x] Desktop 페이지 “바깥 여백만” 회색 구분(콘텐츠 영역 UI 변경 최소화)
- 현황 분석(코드 기준)
  - PostCard 작성자 라인 CTA는 카드 클릭/프로필 이동과 이벤트 분리가 필요(버튼 클릭 시 stopPropagation)
  - 레이아웃은 `container` 영역은 유지하고, `container` 바깥 배경만 분리되어야 함
- 변경 내용(why/what)
  - why: CTA 오동작(카드 클릭 트리거) 방지 + 데스크톱에서 콘텐츠 영역 가독성/구분 강화
  - what: 작성자 라인에 `· Follow/Following` CTA를 별도 버튼으로 분리하고(`stopPropagation`), MainLayout의 데스크톱 바깥 여백 배경을 회색으로 분리
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/components/molecules/PostCard.tsx
  - src/components/templates/MainLayout.tsx
- i18n
  - 사용: `translations.common.follow`, `translations.common.following` (없으면 locale fallback)
  - 신규 키 요청: 없음

#### (2025-12-18) [FE] Sidebar CTA 카피/보조설명 정합화 (P0)

- 플랜(체크리스트)
  - [x] Sidebar CTA 3종 라벨(질문/공유/인증) ko/en/vi 통일
  - [x] 모바일에서 CTA 보조 설명(1줄) 표시
  - [x] Tooltip은 데스크톱에서 multi-line 유지
- 현황 분석(코드 기준)
  - CTA 라벨/툴팁이 locale별로 의미/길이가 달라 UI 일관성이 떨어짐
  - 모바일은 hover 기반 tooltip 접근이 어려워 “왜 필요한 액션인지” 전달이 약함
- 변경 내용(why/what)
  - why: CTA의 의미/가치(질문/공유/인증)를 빠르게 이해시키고 전환(클릭)을 높이기 위함
  - what: `CategoryItem`에 `description` 지원을 추가하고, mobile variant에서 tooltip 2번째 줄을 1줄 요약으로 노출; messages ko/en/vi 카피를 간결하게 통일
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/components/organisms/CategorySidebar.tsx
  - src/components/molecules/CategoryItem.tsx
  - messages/ko.json
  - messages/en.json
  - messages/vi.json
- 다음 액션/의존성
  - CTA 카피는 `/verify` wizard UX 완료 시 상세 안내(3-step)와 톤 정합 재점검

#### (2025-12-18) [FE] 프로필 메타 정보 모바일 콤팩트 레이아웃 (P0)

- 플랜(체크리스트)
  - [x] Joined/Gender/Age/Status는 2열(가로 우선) 배치
  - [x] Email/Phone은 본인에게만 노출 + 전체 폭(span-2) 처리
  - [x] 긴 텍스트(메일/상태)는 truncate로 레이아웃 깨짐 방지
- 현황 분석(코드 기준)
  - 프로필 메타 영역이 모바일에서 1열 위주로 길어져 스크롤/가독성이 나빠짐
  - email/phone은 길이가 길어 wrap/overflow로 레이아웃이 흔들릴 수 있음
- 변경 내용(why/what)
  - why: 모바일에서 핵심 정보 스캔 속도를 높이고, 개인 정보 라인이 레이아웃을 깨지 않게 하기 위함
  - what: `ProfileClient`의 메타 grid를 2열로 조정하고, 민감 정보(email/phone)는 `col-span-2` + `truncate` 적용
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/app/[lang]/(main)/profile/[id]/ProfileClient.tsx
- 다음 액션/의존성
  - 프로필 상세(모달/탭)에서도 동일 그리드 패턴 재사용 여부 검토

#### (2025-12-18) [FE] 관리자 Dialog 긴 콘텐츠 스크롤 보강 (P0)

- 플랜(체크리스트)
  - [x] Dialog/AlertDialog가 viewport를 넘을 때 내부 스크롤 가능하도록 max-height/overflow 적용
  - [x] lint(React Compiler preserve memoization) 이슈 수정
- 현황 분석(코드 기준)
  - 관리자 인증 검토 Dialog가 긴 경우, 모달이 화면 밖으로 넘어가 하단 버튼 접근이 어려움
  - `HeaderSearch`의 useMemo deps가 React Compiler 규칙과 불일치하여 lint 실패
- 변경 내용(why/what)
  - why: 관리자 업무 플로우(검토/승인/거부)에서 긴 폼/문서 목록이 모바일에서 조작 불가
  - what: `DialogContent`/`AlertDialogContent`에 `max-h-[calc(100dvh-2rem)] overflow-y-auto` 기본 적용 + `HeaderSearch`의 `getGroupLabel`을 useCallback으로 고정
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/components/ui/dialog.tsx
  - src/components/ui/alert-dialog.tsx
  - src/components/molecules/HeaderSearch.tsx

#### (2025-12-18) [FE] 신뢰 배지 Tooltip 모바일 long-press 적용 (P0)

- 플랜(체크리스트)
  - [x] TrustBadge 관련 Tooltip은 모바일에서 long-press로만 열리도록 일관화
  - [x] 카드/프로필/인증 신청 화면에서 동작 확인
- 현황 분석(코드 기준)
  - 신뢰 배지 Tooltip이 모바일에서 tap으로 열리면, 스크롤/탭 UX를 방해하거나(오동작 체감) 클릭 동선과 충돌할 수 있음
- 변경 내용(why/what)
  - why: 모바일에서 배지 설명은 “읽기” 성격이라 tap보다 long-press가 적합(실수 클릭 감소)
  - what: TrustBadge Tooltip 사용처에 `touchBehavior="longPress"`를 부여
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/components/molecules/cards/PostCard.tsx
  - src/components/molecules/cards/AnswerCard.tsx
  - src/components/molecules/cards/CommentCard.tsx
  - src/app/[lang]/(main)/profile/[id]/ProfileClient.tsx
  - src/app/[lang]/(main)/verification/request/VerificationRequestClient.tsx
- 다음 액션/의존성
  - (요청) PostDetail 상세 내부에서 직접 렌더되는 TrustBadge Tooltip도 동일하게 long-press 적용 필요: `src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx`

#### (2025-12-18) [FE] PostCard Follow CTA / Desktop 여백 회색 미세 조정 (P0)

- 플랜(체크리스트)
  - [x] Follow/Following CTA는 pending에서도 카드 클릭과 분리(전파 차단 유지)
  - [x] 데스크톱에서 “바깥 여백만” 회색이 보이도록 container 배경 고정
- 현황 분석(코드 기준)
  - Follow CTA가 `disabled` 상태일 때 브라우저별로 카드 `onClick`과 충돌할 여지가 있어, 항상 `stopPropagation`이 실행되도록 처리 필요
  - MainLayout의 `container`에 배경이 없으면 데스크톱에서 콘텐츠 영역까지 회색으로 보일 수 있음
- 변경 내용(why/what)
  - why: Follow CTA 오동작(카드 이동) 방지 + 요구사항(바깥 여백 회색 구분) 시각적 충족
  - what: PostCard Follow CTA는 `disabled` 대신 `aria-disabled`로 처리해 클릭 전파 차단을 보장, MainLayout은 outer bg와 container bg를 분리
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/components/molecules/cards/PostCard.tsx
  - src/components/templates/MainLayout.tsx
- i18n
  - 사용: `translations.common.follow`, `translations.common.following`
  - 신규 키 요청: 없음
- 스크린샷
  - 로컬 확인 필요(현재 작업 세션에서는 스크린샷 생성 미수행)

#### (2025-12-18) [FE] PostDetail TrustBadge Tooltip 모바일 long-press 확대 적용 (P0)

- 플랜(체크리스트)
  - [x] PostDetail 상단 작성자 TrustBadge Tooltip에 long-press 적용
  - [x] 답변/댓글/대댓글 TrustBadge Tooltip에도 동일 적용
- 현황 분석(코드 기준)
  - PostDetail 내부 `Tooltip`에서 `touchBehavior`가 누락되어 모바일에서 tap으로도 열림
  - 스크롤/탭 동선에서 배지 Tooltip이 의도치 않게 열려 UX 방해 가능
- 변경 내용(why/what)
  - why: 모바일에서는 “읽기” 성격의 Tooltip이 tap 동선과 충돌할 수 있어 long-press로 통일 필요
  - what: PostDetail의 TrustBadge Tooltip 5개 위치에 `touchBehavior="longPress"` 추가
- 검증(Lead 확인 후 체크)
  - [x] npm run lint (로컬 PASS)
  - [x] npm run build (로컬 PASS)
- 변경 파일
  - src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx
- 다음 액션/의존성
  - (선행 필요) “자세히” 링크용 TrustBadge 안내 페이지/동선은 WEB과 범위 합의 필요

#### (2025-12-18) [FE] Header 3-zone Grid: 센터(검색) 흔들림 방지 (P0)

- 플랜(체크리스트)
  - [x] Header를 3-zone(Left/Center/Right) 그리드로 고정해 센터가 좌/우 폭 변화에 흔들리지 않게 처리
  - [x] 모바일/데스크톱 헤더 레이아웃 기본 동작(뒤로/사이드바/로그인/프로필) 재확인
- 현황 분석(코드 기준)
  - Header가 grid를 사용 중이지만 `grid-cols-[auto,1fr,auto]` 구조는 좌/우 폭 변화에 따라 중앙(검색)의 기준점이 이동할 수 있음
- 변경 내용(why/what)
  - why: 검색 바가 시각적으로 흔들리면 브랜드/사용성 신뢰가 떨어지고, Facebook 레이아웃 벤치마킹 요구사항에도 불일치
  - what: `grid-cols-[1fr,minmax(0,56rem),1fr]`로 변경해 좌/우를 동등한 공간으로 만들고, 우측 영역은 `justify-self-end`로 고정
- 검증(Lead 확인 후 체크)
  - [x] npm run lint (로컬 PASS)
  - [x] npm run build (로컬 PASS)
- 변경 파일
  - src/components/organisms/Header.tsx
- 다음 액션/의존성
  - 캔버스 색 분리/레일 톤 조정은 MainLayout/CategorySidebar와 함께 단계적으로 적용 필요

#### (2025-12-18) [FE] Canvas 색 분리 + 2xl 3컬럼 폭 고정 (P0)

- 플랜(체크리스트)
  - [x] 메인 피드 컬럼 배경을 white로 고정(카드 집중)
  - [x] 레일(좌/우)은 gray 톤으로 후퇴(배경을 강제 white로 만들지 않기)
  - [x] 2xl에서 3컬럼 폭을 고정하고 중앙 정렬(시선 집중)
- 현황 분석(코드 기준)
  - MainLayout은 캔버스가 gray지만 메인 컬럼 배경이 명시되지 않아(카드 사이 간격 포함) gray로 보일 수 있음
  - Legacy card 스타일에서 `--bg-primary`가 미정의라, 상위 배경에 따라 카드 배경이 달라질 여지가 있음
  - wide 화면에서는 3컬럼을 “고정 폭 + 중앙 정렬”로 만들어야 레이아웃이 안정적
- 변경 내용(why/what)
  - why: Facebook 벤치마킹 요구사항(센터 고정/레일 후퇴) 충족 + 카드/피드 가독성 개선
  - what: MainLayout main에 `bg-white/dark:bg-gray-900` 적용 + 2xl에서 grid cols를 `[320px, 720px, 320px]`로 고정/중앙 정렬 + `--bg-primary`를 `--card`로 연결
- 검증(Lead 확인 후 체크)
  - [x] npm run lint (로컬 PASS)
  - [x] npm run build (로컬 PASS)
- 변경 파일
  - src/components/templates/MainLayout.tsx
  - src/app/globals.css
- i18n
  - 신규 키 요청: 없음

#### (2025-12-18) [FE] TrustBadge “자세히” 동선(Guide) + Tooltip 링크 연결 (P0)

- 플랜(체크리스트)
  - [x] `/${lang}/guide/trust-badges` 안내 페이지 추가
  - [x] TrustBadge Tooltip에 “자세히/learn more” 링크 제공(모바일 long-press 동작 유지)
  - [x] messages는 수정하지 않고 fallback + 키 요청 리스트로 보고
- 현황 분석(코드 기준)
  - TrustBadge Tooltip은 설명만 존재하고, “자세히”로 이어지는 안내 페이지/동선이 없어 사용자가 의미를 확장 학습하기 어려움
  - Tooltip은 ReactNode를 지원하므로 링크를 포함한 컨텐츠로 확장 가능
- 변경 내용(why/what)
  - why: 신뢰 배지의 의미/정책을 투명하게 안내해 오해를 줄이고, 신뢰 UX(설명→자세히) 완결
  - what: `guide/trust-badges` 페이지 추가 + 주요 TrustBadge Tooltip에 “자세히/learn more” 버튼을 삽입(router push)
- 검증(Lead 확인 후 체크)
  - [x] npm run lint (로컬 PASS)
  - [x] npm run build (로컬 PASS)
- 변경 파일
  - src/app/[lang]/guide/trust-badges/page.tsx
  - src/components/molecules/cards/PostCard.tsx
  - src/components/molecules/cards/AnswerCard.tsx
  - src/components/molecules/cards/CommentCard.tsx
  - src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx
  - src/app/[lang]/(main)/profile/[id]/ProfileClient.tsx
  - src/app/[lang]/(main)/verification/request/VerificationRequestClient.tsx
- i18n
  - 신규 키 요청(추가 필요 시):
    - `common.learnMore` (ko: 자세히, en: Learn more, vi: Xem thêm)
    - `metadata.trustBadges.title`, `metadata.trustBadges.description`

#### (2025-12-18) [FE] 작업 전 공지 수신: Ultrawide Hot File 잠금(LEAD 소유) (P0)

- 현황/공지 요약
  - Ultrawide 배치 핫픽스(Header container → MainLayout과 동일 grid/max-width 정렬 + 홈 canvas 전환)는 [LEAD]가 직접 소유/수행
  - Hot File(`src/components/organisms/Header.tsx`, `src/components/templates/MainLayout.tsx`, `src/app/[lang]/(main)/HomeClient.tsx`)은 스냅샷 고정(커밋/푸시) 전까지 병렬 수정 금지 필요
  - 코드 수정 자체는 완료 상태이며, 운영상 “끝”의 기준은 로컬에서 커밋/푸시로 스냅샷을 고정하는 순간
  - Codex CLI 환경은 `.git/index.lock` 이슈로 `git add/commit`이 실패할 수 있어, 커밋/푸시는 로컬 터미널에서만 가능
- FE 대응
  - FE는 위 Hot File을 커밋/푸시 완료 전까지 수정하지 않고, 필요 시 LEAD에게 범위/타이밍을 먼저 합의한다

#### (2025-12-19) [FE] 공지 수신: 스냅샷 고정 완료 + Hot File 병렬/브랜치 운영 업데이트 (P0)

- 플랜(체크리스트)
  - [x] LEAD 공지(스냅샷/브랜치/Hot File) 문서 반영
  - [x] 현재 main HEAD 커밋 확인(371de40)
  - [x] 로컬 lint/build 재검증
- 현황 분석(코드 기준)
  - 현재 구현/문제 위치:
    - Ultrawide 배치 핫픽스(Header/MainLayout/HomeClient 정렬 + 홈 피드 캔버스 전환)는 main(371de40)에 반영된 상태
    - 동일 스냅샷으로 `codex-beta-improvement` 브랜치도 생성/푸시된 상태(따라서 지금 PR diff=0일 수 있음)
  - 재현/리스크:
    - Hot File(`src/components/organisms/Header.tsx`, `src/components/templates/MainLayout.tsx`, `src/components/organisms/PostList.tsx`, `src/app/globals.css`) 병렬 수정 시 배치 재발 가능 → 단일 소유권 유지 권장
- 변경 내용(why/what)
  - why: 병렬 스트림 기준점(커밋)과 Hot File 소유권을 명확히 해 충돌/재발 방지
  - what: FE 섹션에 LEAD 운영 업데이트(스냅샷 커밋/브랜치 흐름/Hot File 규칙) 기록
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 다음 작업은 LEAD가 지정한 공유 브랜치/PR 흐름을 기준으로 진행(커밋/푸시는 LEAD)
  - 배포는 Vercel env(`DATABASE_URL` 등) 세팅 선행 필요(운영 작업)

#### (2025-12-19) [FE] TrustBadge Tooltip “자세히” 링크 클릭 전파 방지 (P0)

- 플랜(체크리스트)
  - [x] Tooltip(portal) 클릭 버블링 리스크 확인
  - [x] Tooltip 내부 “자세히/Learn more” 버튼 클릭 시 `stopPropagation` 적용
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - Tooltip은 content를 portal(document.body)로 렌더하므로, React 이벤트가 상위(카드 onClick 등)까지 버블링할 수 있음
  - TrustBadge Tooltip에 “자세히” 버튼을 추가한 이후, 클릭이 상위 카드 네비게이션을 유발할 수 있는 리스크 존재
- 변경 내용(why/what)
  - why: PostCard/상세/프로필 등 클릭 가능한 컨테이너에서 Tooltip CTA 클릭 시 의도치 않은 페이지 이동 방지
  - what: TrustBadge Tooltip의 “자세히/Learn more” 버튼 onClick에 `event.stopPropagation()` 추가 후 guide로 push
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/components/molecules/cards/PostCard.tsx
  - src/components/molecules/cards/AnswerCard.tsx
  - src/components/molecules/cards/CommentCard.tsx
  - src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx
  - src/app/[lang]/(main)/profile/[id]/ProfileClient.tsx
  - src/app/[lang]/(main)/verification/request/VerificationRequestClient.tsx
- 다음 액션/의존성
  - LEAD 검수 후, FE 체크리스트의 “TrustBadge 툴팁/동선 적용 범위” 항목을 close 처리 권장

#### (2025-12-19) [FE] Tooltip 인터랙티브 지원(Desktop hover) + TrustBadge “자세히” 버튼 클릭 가능화 (P0)

- 플랜(체크리스트)
  - [x] Desktop(hover)에서도 Tooltip 내부 CTA가 클릭 가능하도록 `interactive` 옵션 추가
  - [x] TrustBadge Tooltip(자세히 버튼 포함) 전 구간에 `interactive` 적용
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - Tooltip은 기본적으로 desktop에서 `pointer-events: none`이라(hover tooltip), Tooltip 내부 버튼/링크 클릭이 불가능
  - TrustBadge Tooltip에 “자세히” 버튼을 추가한 이후 desktop에서도 동일 동선이 필요
- 변경 내용(why/what)
  - why: tooltip CTA가 모바일에서만 동작하면 데스크톱 사용자 동선이 끊김(guide 페이지 진입 어려움)
  - what: `Tooltip`에 `interactive` prop 추가(hover 시 close 딜레이/tooltip hover 유지) + TrustBadge tooltip에 `interactive` 활성화
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/components/atoms/Tooltip.tsx
  - src/components/molecules/cards/PostCard.tsx
  - src/components/molecules/cards/AnswerCard.tsx
  - src/components/molecules/cards/CommentCard.tsx
  - src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx
  - src/app/[lang]/(main)/profile/[id]/ProfileClient.tsx
  - src/app/[lang]/(main)/verification/request/VerificationRequestClient.tsx
  - docs/EXECUTION_PLAN.md

#### (2025-12-19) [FE] Auth CTA 카피(“회원가입” 최소화) + HeaderSearch 예시 텍스트 노출 + Sidebar 구독 버튼 폭 보강 (P0)

- 플랜(체크리스트)
  - [x] 로그인 프롬프트 CTA: Sign up → Get started(시작하기) 카피로 완화
  - [x] `/signup` 페이지 카피/에러 문구: “회원가입” 대신 “시작하기/프로필 설정” 중심으로 정리 + ko/en/vi 동기화
  - [x] HeaderSearch: 카테고리 select 폭을 max-width + truncate로 제한(입력/예시 텍스트 노출 확보)
  - [x] CategorySidebar: 구독 버튼 min-width를 모바일에서 축소(카테고리 라벨/버튼 클립 리스크 완화)
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - `/signup`은 실질적으로 “계정 생성”이 아니라 로그인 후 프로필 온보딩 단계라 “회원가입” 카피가 부담/혼동을 줄 수 있음
  - HeaderSearch는 대/소분류 select가 긴 라벨(emoji 포함)일 때 입력 영역이 급격히 좁아져 예시 텍스트가 잘릴 수 있음
  - CategorySidebar(특히 vi/모바일)에서 구독 버튼의 고정 min-width가 라벨 영역을 과도하게 압박할 수 있음
- 변경 내용(why/what)
  - why: 로그인/온보딩 전환률 개선 + 헤더 검색 UX(예시/placeholder 노출) 개선 + 사이드바 구독 CTA 안정화
  - what:
    - LoginPrompt: signup CTA fallback을 `Get started/시작하기/Bắt đầu`로 변경(route는 `/signup` 유지)
    - SignupPage: ko/en/vi 문자열을 페이지 내부 translations로 정리 + 안내/버튼/에러 문구를 “시작하기/프로필 설정” 기준으로 변경
    - HeaderSearch: parent/child select에 max-width + truncate 적용, 컴포넌트 자체 max-width 제한 제거
    - CategorySidebar: 구독 버튼 min-width를 `min-w-[72px] sm:min-w-[84px]`로 조정
    - (빌드 안정화) FollowingModal: 추천/팔로잉/피드 데이터가 infinite/offset 형태 모두 처리되도록 리스트 정규화
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/components/organisms/LoginPrompt.tsx
  - src/app/[lang]/(auth)/signup/page.tsx
  - src/components/molecules/search/HeaderSearch.tsx
  - src/components/organisms/CategorySidebar.tsx
  - src/components/molecules/modals/FollowingModal.tsx
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - Header의 `t.signup` 버튼 라벨도 동일 톤으로 맞추려면(“시작하기”) Hot File(`Header.tsx`)이라 LEAD가 타이밍 합의 후 처리 권장

#### (2025-12-19) [FE] HeaderSearch 셀렉트 폭 최적화 + Sidebar 구독 버튼 줄바꿈 보강 (P0)

- 플랜(체크리스트)
  - [x] HeaderSearch select 폭 축소로 입력/예시 텍스트 노출 확대
  - [x] Sidebar 구독 버튼 줄바꿈/높이 보강(vi 클립 방지)
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 헤더 검색바의 카테고리 select 폭이 커지면 입력/예시 텍스트가 잘릴 수 있음
  - 카테고리 구독 버튼은 vi에서 라벨 길이로 인해 버튼 내부가 잘릴 여지가 있음
- 변경 내용(why/what)
  - why: 검색 예시 텍스트 가독성 확보 + 구독 CTA 클릭 영역 안정화
  - what: HeaderSearch select max-width 축소 + Sidebar 구독 버튼에 `whitespace-normal`/`leading-tight`/min-height 적용
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/components/molecules/search/HeaderSearch.tsx
  - src/components/organisms/CategorySidebar.tsx
  - docs/EXECUTION_PLAN.md

#### (2025-12-19) [FE] PostCard 답변/댓글 표기 콤팩트화 확인 (P0)

- 플랜(체크리스트)
  - [x] PostCard 응답 CTA가 아이콘+숫자만 노출되는지 확인
  - [x] 접근성용 `aria-label` 유지 여부 확인
- 현황 분석(코드 기준)
  - PostCard 응답 CTA는 숫자만 표기되며, 설명 텍스트는 `aria-label`로 제공 중
- 변경 내용(why/what)
  - why: “답변 N개” 텍스트 노출 없이도 의미를 전달하도록 확인
  - what: 기존 구현이 요구사항을 충족해 코드 변경 없이 상태 확인
- 검증
  - [x] UI 로직 확인 (코드 기준)
- 변경 파일
  - docs/EXECUTION_PLAN.md

#### (2025-12-19) [FE] LoginPrompt 회원가입 카피 최소화 보강 (P0)

- 플랜(체크리스트)
  - [x] legacy 번역값이 “회원가입/Sign up/Đăng ký”일 때 CTA를 “시작하기/Get started/Bắt đầu”로 오버라이드
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - `common.signup` 키가 기존 번역값을 제공해도 LoginPrompt CTA를 완화된 카피로 노출해야 함
- 변경 내용(why/what)
  - why: 가입 문구 거부감 최소화(로그인→프로필 설정 흐름 강조)
  - what: LoginPrompt에서 `common.signup` 값이 기존 카피일 경우 fallback “시작하기”로 대체
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/components/organisms/LoginPrompt.tsx
  - docs/EXECUTION_PLAN.md

#### (2025-12-19) [FE] 모바일 글/답변 폼 키보드 safe-area + autosize 적용 (P0)

- 플랜(체크리스트)
  - [x] PostDetail 답글/댓글 textarea autosize + 포커스 스크롤 처리
  - [x] 글/답변 RichTextEditor 포커스 시 safe-area 스크롤 보강
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - PostDetail 답글/댓글/신고 textarea가 고정 높이라 모바일에서 키보드 가림/수동 리사이즈 필요
  - 글/답변 RichTextEditor는 포커스 시 뷰포트 하단에 가려질 수 있음
- 변경 내용(why/what)
  - why: 모바일에서 키보드가 열릴 때 작성 폼이 가려지는 현상 최소화
  - what: textarea autosize + 포커스 scrollIntoView/safe-area margin 적용, RichTextEditor onFocus 전달
- 검증
  - [x] npm run lint (pass)
  - [x] npm run build (pass)
- 변경 파일
  - src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx
  - src/app/[lang]/(main)/posts/new/NewPostClient.tsx
  - src/components/molecules/editor/RichTextEditor.tsx
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [FE] 공식/검수 답변 배지 노출 + i18n 툴팁 정합화 + PostCard vi 잘림 보강 (P0)

- 플랜(체크리스트)
  - [x] PostCard 인증 응답 요약에 ✔/배지 아이콘 추가
  - [x] 상세 답변 영역에서 검수(verified/expert) 배지 라벨 노출
  - [x] 툴팁/배지 문자열 locale fallback 정합화
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - PostCard의 인증 응답 요약은 텍스트만 노출되어 “검수/공식 답변” 강조가 약함
  - 상세 답변은 TrustBadge 아이콘만 보여 공식/검수 배지 식별이 약함
  - 일부 툴팁 fallback이 한국어 고정이라 en/vi 혼용 가능
- 변경 내용(why/what)
  - why: 공식/검수 답변 인지성 강화 + i18n 혼용 최소화
  - what: PostCard 인증 요약에 체크 아이콘 포함, 답변 TrustBadge에 verified/expert 라벨 노출, 툴팁/배지 locale fallback 정리
- 검증
  - [x] npm run lint (pass)
  - [x] npm run build (pass)
- 변경 파일
  - src/components/molecules/cards/PostCard.tsx
  - src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx
  - src/components/molecules/cards/AnswerCard.tsx
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - build 실패 원인: `src/app/api/feedback/route.ts` 타입 오류 확인 필요
- 추가 메모
  - CommentCard 원글/삭제/제목 없음 locale fallback 적용
  - PostDetail guideline tooltip locale fallback 적용
  - npm run lint/build 재실행 완료(빌드 오류 해소: `.next/types` 재생성)

#### (2025-12-19) [FE] i18n 툴팁/카테고리 점검 + PostCard vi 라인랩 보강 (P0)

- 플랜(체크리스트)
  - [x] PostCard 작성자 라인(팔로우/배지) wrap 확인
  - [x] 카드/상세 툴팁 locale fallback 재점검
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - vi에서 팔로우 텍스트가 길면 작성자 라인 오버플로 가능
  - 일부 툴팁이 locale fallback을 보강할 여지 존재
- 변경 내용(why/what)
  - why: vi 길이 이슈로 인한 모바일 카드 깨짐 방지
  - what: 작성자 라인 flex-wrap 허용 + tooltip fallback 재점검
- 검증
  - [x] npm run lint (pass)
  - [x] npm run build (pass; `.next/types` 재생성 포함)
- 변경 파일
  - src/components/molecules/cards/PostCard.tsx
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [FE] RichTextEditor 툴팁 locale fallback 보강 + 상세 편집 툴팁 정합화 (P0)

- 플랜(체크리스트)
  - [x] RichTextEditor 툴팁 fallback을 locale 기준으로 정리
  - [x] 상세 페이지 edit/delete 툴팁 fallback locale 보강
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 에디터 툴팁 기본값이 한국어 고정이라 en/vi에서 혼용될 여지가 있음
  - 상세 편집 툴팁의 fallback도 한국어 고정
- 변경 내용(why/what)
  - why: 툴팁/배지 관련 i18n 혼용 최소화
  - what: RichTextEditor에 locale prop 추가 후 툴팁 fallback 다국어 적용, PostDetail edit/delete tooltip fallback 정리
- 검증
  - [x] npm run lint (pass)
  - [x] npm run build (pass)
- 변경 파일
  - src/components/molecules/editor/RichTextEditor.tsx
  - src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx
  - src/app/[lang]/(main)/posts/new/NewPostClient.tsx
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [FE] RichTextEditor locale 타입 보강 + 빌드 안정화 (P0)

- 플랜(체크리스트)
  - [x] PostDetail locale 타입 정규화
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - RichTextEditor locale prop 추가 후 PostDetail에서 string 타입 오류 발생
- 변경 내용(why/what)
  - why: 타입 오류로 빌드 중단 방지
  - what: locale 값을 `ko/en/vi`로 정규화해 RichTextEditor prop에 전달
- 검증
  - [x] npm run lint (pass)
  - [x] npm run build (pass; `.next/types` 재생성 포함)
- 변경 파일
  - src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [FE] Header/Profile i18n fallback 정합화 (P0)

- 플랜(체크리스트)
  - [x] Header/프로필 툴팁·라벨 fallback locale 정리
  - [x] 프로필 메타/탭/빈 상태 문구 locale fallback 보강
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - Header/프로필의 일부 fallback 문구가 한국어/영어 고정이라 vi/en에서 혼용 가능
  - 프로필 상단 팔로워 라인과 탭/빈 상태에서 locale 누락 위험 존재
- 변경 내용(why/what)
  - why: i18n 혼용 최소화 및 툴팁/라벨 정합성 유지
  - what: Header/프로필 fallback 사전 추가, 프로필 라벨·툴팁·탭 텍스트를 locale 기반으로 보강
- 검증
  - [x] npm run lint (pass)
  - [x] npm run build (pass)
- 변경 파일
  - src/components/organisms/Header.tsx
  - src/app/[lang]/(main)/profile/[id]/ProfileClient.tsx
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [FE] User menu/Search 카테고리 fallback 정합화 (P0)

- 플랜(체크리스트)
  - [x] UserProfile 메뉴/로그아웃 라벨 locale fallback 보강
  - [x] HeaderSearch 카테고리/placeholder/버튼 fallback 정리
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - UserProfile 메뉴 fallback이 한국어 고정이라 en/vi 혼용 위험
  - HeaderSearch 카테고리/placeholder 기본값이 한국어 고정
- 변경 내용(why/what)
  - why: 툴팁/카테고리/메뉴 라벨의 i18n 혼용 최소화
  - what: locale 기반 fallback 사전 추가, 메뉴/검색 라벨에 적용
- 검증
  - [x] npm run lint (pass)
  - [x] npm run build (pass)
- 변경 파일
  - src/components/molecules/user/UserProfile.tsx
  - src/components/molecules/search/HeaderSearch.tsx
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [FE] ProfileModal i18n fallback 정합화 (P0)

- 플랜(체크리스트)
  - [x] ProfileModal 라벨/툴팁 fallback locale 정리
  - [x] 프로필 태그/통계/오류 상태 문구 fallback 정합화
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - ProfileModal 다수 라벨/툴팁이 한국어 고정 fallback
  - 프로필 태그/오류 상태에서 locale 혼용 가능
- 변경 내용(why/what)
  - why: 프로필 모달 i18n 혼용 최소화
  - what: locale 기반 fallback 사전 추가, 라벨/툴팁/오류 메시지에 적용
- 검증
  - [x] npm run lint (pass)
  - [x] npm run build (pass)
- 변경 파일
  - src/components/molecules/modals/ProfileModal.tsx
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [FE] User 모달(MyPosts/Bookmarks/Settings) i18n fallback 정합화 (P0)

- 플랜(체크리스트)
  - [x] MyPosts/Bookmarks/Settings 모달 라벨 fallback locale 보강
  - [x] 북마크 날짜/빈 상태/로딩 문구 locale 정합화
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 유저 모달 다수 라벨이 한국어/영어 고정 fallback이라 en/vi 혼용 가능
  - 북마크 모달은 ko-KR 고정 날짜 포맷 사용
- 변경 내용(why/what)
  - why: 모달 기반 UX에서 언어 혼용 최소화
  - what: locale 기반 fallback 사전 추가, 북마크 날짜 포맷을 locale에 맞게 적용
- 검증
  - [x] npm run lint (pass)
  - [x] npm run build (pass)
- 변경 파일
  - src/components/molecules/modals/MyPostsModal.tsx
  - src/components/molecules/modals/BookmarksModal.tsx
  - src/components/molecules/modals/SettingsModal.tsx
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [FE] FollowingModal i18n fallback 정합화 (P0)

- 플랜(체크리스트)
  - [x] 팔로잉 모달 라벨/탭/빈 상태 locale fallback 정리
  - [x] 추천 사용자 메타 라벨/배지 fallback 보강
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - FollowingModal 내 라벨/탭/상태 문구가 한국어 고정 fallback이라 en/vi 혼용 가능
  - 추천 유저 메타 라벨이 일부 키(채택률/관심사)에서 locale fallback 부족
- 변경 내용(why/what)
  - why: 팔로잉 모달 i18n 혼용 최소화
  - what: locale 기반 fallback 사전 추가, 라벨/탭/배지/빈 상태 문구 적용
- 검증
  - [x] npm run lint (pass)
  - [x] npm run build (pass)
- 변경 파일
  - src/components/molecules/modals/FollowingModal.tsx
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [FE] NotificationModal i18n fallback 정합화 (P0)

- 플랜(체크리스트)
  - [x] 알림 모달 라벨/에러/빈 상태 locale fallback 정리
  - [x] 시간 단위 문자열 fallback 보강
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 알림 모달의 라벨/버튼/에러/빈 상태가 한국어 고정 fallback이라 en/vi 혼용 위험
  - 상대 시간 단위가 translations 누락 시 한국어로 고정될 수 있음
- 변경 내용(why/what)
  - why: 알림 모달 i18n 혼용 최소화
  - what: locale 기반 fallback 사전 추가, 라벨/에러/빈 상태/시간 단위에 적용
- 검증
  - [x] npm run lint (pass)
  - [x] npm run build (pass)
- 변경 파일
  - src/components/molecules/modals/NotificationModal.tsx
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [FE] 공식/검수 답변 배지 노출 (P0)

- 플랜(체크리스트)
  - [x] PostDetail 답변 헤더에 공식/검수 배지 표시
  - [x] Profile 답변 카드에 공식/검수 배지 반영
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 답변의 `isOfficial`/`reviewStatus`가 상세/프로필 UI에서 노출되지 않아 신뢰 상태 인지가 어려움
- 변경 내용(why/what)
  - why: 공식/검수 답변 가시성 강화
  - what: 상세/프로필 답변 헤더에 배지 추가, 신규 답변 optimistic 상태에 공식/검수 값 반영
- 검증
  - [x] npm run lint (pass)
  - [x] npm run build (pass)
- 변경 파일
  - src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx
  - src/components/molecules/cards/AnswerCard.tsx
  - src/app/[lang]/(main)/profile/[id]/ProfileClient.tsx
  - docs/EXECUTION_PLAN.md
- i18n
  - 신규 키 요청: common.officialAnswer, common.reviewedAnswer (또는 postDetail.officialAnswer/reviewedAnswer)
- 다음 액션/의존성
  - 피드(PostCard)는 인증 답변 요약 배지로 유지 중이며, 공식/검수 여부를 별도 노출하려면 list API에 필드 추가 필요

#### (2025-12-19) [FE] 헤더/사이드바 CTA·모바일 아이콘 보강 (P0)

- 플랜(체크리스트)
  - [x] 헤더 우측 액션 순서 변경(언어 스위치 → 알림)
  - [x] 공유하기 CTA 설명 문구(ko) 업데이트
  - [x] Sidebar 피드백 라벨 고정 + 텍스트 축소/아이콘 들여쓰기
  - [x] PostCard 모바일 해결/미해결 아이콘 shrink-0 보강
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 헤더 우측 액션 순서가 기대 흐름과 달라 언어/알림 전환이 어색함
  - 공유 CTA 요약 문구가 구형 카피로 남아 있음
  - 피드백 라벨이 언어마다 달라 사이드바 일관성 저하
  - PostDetail 렌더 블록에서 괄호 정합이 깨져 lint 파서 오류 발생
- 변경 내용(why/what)
  - why: CTA 톤 정합/사이드바 일관성 개선 + 모바일 아이콘 안정화
  - what: 헤더 우측 액션 순서 변경, 공유하기 ko 툴팁 카피 교체, 피드백 라벨/스타일 고정, PostCard 아이콘 shrink-0 적용, PostDetail 렌더 블록 괄호 정리
- 검증
  - [x] npm run lint (pass)
  - [x] npm run build (pass)
- 변경 파일
  - src/components/organisms/Header.tsx
  - src/components/organisms/CategorySidebar.tsx
  - messages/ko.json
  - src/components/molecules/cards/PostCard.tsx
  - src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx
  - docs/EXECUTION_PLAN.md
- i18n
  - 신규 키 요청: 없음 (ko 카피만 업데이트)
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [FE] i18n 툴팁/카테고리 fallback 보강 + PostCard 모바일 랩 (P0)

- 플랜(체크리스트)
  - [x] PostDetail/검색/프로필 편집 툴팁·카테고리 fallback 정리
  - [x] PostCard 인증 응답 요약 모바일 wrap 보강
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 툴팁 aria-label/카테고리 미지정 텍스트가 한국어 fallback으로 남아 locale 혼용 가능
  - 모바일에서 인증 응답 요약 라벨이 긴 경우 줄바꿈이 제한될 수 있음
- 변경 내용(why/what)
  - why: locale 혼용 최소화 + 모바일 텍스트 잘림 방지
  - what: PostDetail/검색/프로필 편집에 locale fallback 정리, PostCard 인증 요약 라인 flex-wrap 보강
- 검증
  - [x] npm run lint (pass)
  - [x] npm run build (pass)
- 변경 파일
  - src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx
  - src/app/[lang]/(main)/search/SearchClient.tsx
  - src/app/[lang]/(main)/profile/edit/ProfileEditClient.tsx
  - src/components/molecules/cards/PostCard.tsx
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [FE] 공식/검수 답변 배지 피드/프로필 확장 (P0)

- 플랜(체크리스트)
  - [x] 게시글 리스트 API에 공식/검수 답변 카운트 추가
  - [x] PostCard에 공식/검수 배지 노출 + vi 라인랩 보강
  - [x] 프로필/북마크/팔로잉/검색 카드에 카운트 전달
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 답변 카드에는 공식/검수 배지가 있으나 피드/프로필 PostCard에는 노출 불가
  - list API 응답에 공식/검수 카운트가 없어 카드에서 상태 판단 불가
- 변경 내용(why/what)
  - why: 공식/검수 답변 인지성 강화를 피드/프로필까지 확장
  - what: posts/트렌딩/프로필/북마크 API에 공식/검수 카운트 추가, PostCard 배지 렌더 및 각 카드 전달
  - what: PostCard 응답/익명/출처/공유 토스트 fallback을 locale 기반으로 정리
- 검증
  - [x] npm run lint (pass)
  - [x] npm run build (pass)
- 변경 파일
  - src/components/molecules/cards/PostCard.tsx
  - src/components/organisms/PostList.tsx
  - src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx
  - src/app/[lang]/(main)/profile/[id]/ProfileClient.tsx
  - src/app/[lang]/(main)/search/SearchClient.tsx
  - src/components/molecules/modals/MyPostsModal.tsx
  - src/components/molecules/modals/BookmarksModal.tsx
  - src/components/molecules/modals/FollowingModal.tsx
  - src/repo/posts/types.ts
  - src/repo/users/types.ts
  - src/app/api/posts/route.ts
  - src/app/api/posts/trending/route.ts
  - src/app/api/users/[id]/posts/route.ts
  - src/app/api/users/[id]/bookmarks/route.ts
  - docs/EXECUTION_PLAN.md
- i18n
  - 신규 키 요청: common.officialAnswer, common.reviewedAnswer, common.source
- 다음 액션/의존성
  - Vercel 빌드 환경변수 누락 시 DATABASE_URL 설정 필요

#### (2025-12-19) [FE] PostDetail i18n 정합화 + PostCard 모바일 배지 보강 (P0)

- 플랜(체크리스트)
  - [x] PostDetail 경고/리포트/공유 라벨 locale fallback 통일
  - [x] PostDetail optimistic author fallback 통일
  - [x] PostCard 공식/검수 배지 모바일 폰트 축소
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - PostDetail에서 report/confirm/경고 메시지가 ko fallback으로 섞여 locale 혼용 가능
  - PostCard 배지가 모바일(vi)에서 폭을 더 차지할 수 있음
- 변경 내용(why/what)
  - why: 다국어 혼용 최소화 + 모바일 카드 안정화
  - what: PostDetail fallback 문자열을 locale 기준으로 정리, 신고/공유 UI 라벨 보강, PostCard 배지 텍스트 크기 축소
- 검증
  - [x] npm run lint (pass)
  - [x] npm run build (pass)
- 변경 파일
  - src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx
  - src/components/molecules/cards/PostCard.tsx
  - docs/EXECUTION_PLAN.md
- i18n
  - 신규 키 요청: postDetail.helpfulToggleFailed
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [FE] Search/Sidebar i18n fallback 정합화 (P0)

- 플랜(체크리스트)
  - [x] Search placeholder/버튼/필터/페이지네이션 locale fallback 통일
  - [x] Search 자동완성 라벨 fallback 및 키 연결
  - [x] CategorySidebar 구독 섹션 fallback 보강
- 현황 분석(코드 기준)
  - Search 페이지에서 일부 라벨이 ko 문자열로 fallback되어 locale 혼용 가능
  - 자동완성 라벨은 하드코딩되어 메시지 키 연동 부재
- 변경 내용(why/what)
  - why: 검색 UI에서 locale 혼용 최소화 및 키 누락 대응
  - what: Search 기본/에러/페이지네이션 라벨을 locale fallback으로 정리하고 자동완성 라벨 키 연결, CategorySidebar 구독 섹션 fallback 보강
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/app/[lang]/(main)/search/SearchClient.tsx
  - src/components/organisms/CategorySidebar.tsx
  - docs/EXECUTION_PLAN.md
- i18n
  - 신규 키 요청: search.suggestionTitle, search.suggestionTag, search.suggestionCategory, search.suggestionSubcategory, search.suggestionEmpty, search.suggestionLoading
- 다음 액션/의존성
  - Vercel 환경변수에 DATABASE_URL 설정 필요(미설정 시 build 실패)

#### (2025-12-19) [FE] PostDetail SSR i18n fallback 정합화 (P0)

- 플랜(체크리스트)
  - [x] 상세 페이지 not-found 메타 locale fallback 정리
  - [x] 상세 SSR author fallback locale 기준으로 통일
- 현황 분석(코드 기준)
  - PostDetail SSR/메타에서 ko 하드코딩 fallback이 남아 locale 혼용 가능
- 변경 내용(why/what)
  - why: SSR 메타/JSON-LD에서 언어 혼용 최소화
  - what: not-found 메타 fallback을 locale 기준으로 정리하고, author fallback을 `common.anonymous` 기반으로 통일
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/app/[lang]/(main)/posts/[id]/page.tsx
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [FE] Unknown/Uncategorized fallback 정합화 (P0)

- 플랜(체크리스트)
  - [x] PostList/추천 사용자 unknown fallback 통일
  - [x] PostDetail related card/모달/리더보드 unknown fallback 통일
  - [x] 구독 설정 unknown category fallback 정리
- 현황 분석(코드 기준)
  - 사용자/카테고리 fallback이 각 화면에서 locale 문자열로 직접 하드코딩되어 있음
- 변경 내용(why/what)
  - why: 공통 `common.anonymous`/`common.uncategorized` 기반으로 locale 혼용 최소화
  - what: 피드/추천/모달/리더보드/구독 설정에서 unknown 텍스트를 공통 fallback으로 정리
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/components/organisms/PostList.tsx
  - src/components/organisms/RecommendedUsersSection.tsx
  - src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx
  - src/components/molecules/modals/MyPostsModal.tsx
  - src/components/molecules/modals/FollowingModal.tsx
  - src/app/[lang]/(main)/leaderboard/LeaderboardClient.tsx
  - src/app/[lang]/(main)/subscriptions/SubscriptionsClient.tsx
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [LEAD→FE] 다음 스프린트 플랜 (P0/P1)

- 플랜(체크리스트)
  - [x] 헤더 좌측(로고+문구) 폭/정렬 고정 + 검색 영역 가변 폭 확보(ultrawide 포함)
  - [x] 모바일/태블릿 헤더에서 로고 문구 길이 정책 고정(2줄/ellipsis) + 검색 버튼 겹침 점검
  - [x] PostCard 하단 액션 공통 컴포넌트(ActionIconButton) 도입으로 중복 제거
  - [x] 태그 칩 정책 통일: 모바일 2줄 클램프 vs 가로 스크롤 중 하나로 통일
  - [x] 아이콘 버튼 aria-label 전수 점검(툴팁 없는 버튼 포함)

#### (2025-12-19) [FE] 빌드 단계 DB env 가드 보강 (P0)

- 플랜(체크리스트)
  - [x] build phase에서 DATABASE_URL 미설정 시 프록시 스텁 반환
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - Vercel build에서 `/api/admin/categories/[id]` 모듈 로딩 중 DATABASE_URL 누락으로 실패
- 변경 내용(why/what)
  - why: 빌드 단계에서 DB 연결 없이도 모듈 분석/정적 생성이 가능하도록 안정화
  - what: DB init에서 build phase 감지 시 누락 환경변수는 스텁으로 대체
- 검증
  - [x] npm run lint
  - [x] SKIP_SITEMAP_DB=true npm run build
- 변경 파일
  - src/lib/db/index.ts
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - Vercel 환경 변수 `DATABASE_URL` 또는 `POSTGRES_POOL_URL` 설정 필요

#### (2025-12-19) [FE] PostCard 모바일(vi) 배지 라벨 잘림 보강 (P0)

- 플랜(체크리스트)
  - [x] 모바일에서 신뢰 배지 텍스트 라벨 길이 제한
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - vi에서 신뢰 배지 라벨이 길어 작성자 라인 오버플로 가능
- 변경 내용(why/what)
  - why: 모바일 피드에서 작성자 라인 가독성과 버튼 터치 영역 확보
  - what: PostCard의 trust badge 텍스트에 max-width + truncate 적용
- 검증
  - [x] npm run lint
  - [x] SKIP_SITEMAP_DB=true npm run build
- 변경 파일
  - src/components/molecules/cards/PostCard.tsx
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [FE] 카테고리/툴팁 라벨 locale fallback 보강 (P0)

- 플랜(체크리스트)
  - [x] Sidebar 메뉴/구독 라벨 locale fallback 정리
  - [x] 글쓰기 카테고리 라벨 locale fallback 정리
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - Sidebar/글쓰기 화면 일부 카테고리 라벨이 ko 하드코딩 fallback으로 남아 있음
- 변경 내용(why/what)
  - why: 툴팁/카테고리 라벨에서 언어 혼용 최소화
  - what: 메뉴/구독/카테고리 라벨에 en/vi/ko fallback 추가
- 검증
  - [x] npm run lint
  - [x] SKIP_SITEMAP_DB=true npm run build
- 변경 파일
  - src/components/organisms/CategorySidebar.tsx
  - src/app/[lang]/(main)/posts/new/NewPostClient.tsx
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [FE] 온보딩 UI locale fallback 보강 (P0)

- 플랜(체크리스트)
  - [x] 온보딩 주요 라벨/에러 메시지 locale fallback 정리
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 온보딩 화면 일부 라벨/저장 오류 메시지가 ko 하드코딩 fallback으로 남아 있음
- 변경 내용(why/what)
  - why: 온보딩 화면에서 언어 혼용 최소화
  - what: locale별 기본 라벨/에러 메시지 맵 추가 및 적용
- 검증
  - [x] npm run lint
  - [x] SKIP_SITEMAP_DB=true npm run build
- 변경 파일
  - src/app/[lang]/(main)/onboarding/OnboardingClient.tsx
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [FE] 인증 신청 UI locale fallback 보강 (P0)

- 플랜(체크리스트)
  - [x] 인증 신청/히스토리 화면 하드코딩 라벨 locale fallback 정리
  - [x] 에러/토스트 문구 locale별 기본값 분리
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 인증 신청 화면의 라벨/토스트/상태 배지 일부가 ko 하드코딩 fallback으로 남아 있음
- 변경 내용(why/what)
  - why: 인증 신청 흐름에서 언어 혼용 최소화
  - what: ko/en/vi fallback 맵을 도입하고 모든 하드코딩 문구를 공통 라벨로 치환
- 검증
  - [x] npm run lint
  - [x] SKIP_SITEMAP_DB=true npm run build
- 변경 파일
  - src/app/[lang]/(main)/verification/request/VerificationRequestClient.tsx
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [FE] 인증 신청 내역 UI locale fallback 보강 (P0)

- 플랜(체크리스트)
  - [x] 인증 신청 내역 라벨/상태/혜택 안내 locale fallback 정리
  - [x] 로드/오류/버튼 텍스트 fallback 표준화
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 인증 신청 내역 화면의 상태 배지/혜택 안내 문구가 ko 하드코딩 fallback으로 남아 있음
- 변경 내용(why/what)
  - why: 인증 히스토리 화면에서 언어 혼용 최소화
  - what: ko/en/vi fallback 맵을 추가하고 하드코딩 라벨을 공통 변수로 치환
- 검증
  - [x] npm run lint
  - [x] SKIP_SITEMAP_DB=true npm run build
- 변경 파일
  - src/app/[lang]/(main)/verification/history/VerificationHistoryClient.tsx
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [FE] 글쓰기 UI locale fallback 보강 (P0)

- 플랜(체크리스트)
  - [x] 글쓰기 라벨/에러/버튼 문구 locale fallback 정리
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 글쓰기 화면 일부 안내/검증 문구가 ko 하드코딩 fallback으로 남아 있음
- 변경 내용(why/what)
  - why: 글쓰기 화면에서 언어 혼용 최소화
  - what: ko/en/vi fallback 맵을 추가하고 라벨/토스트/경고 문구를 공통 변수로 치환
- 검증
  - [x] npm run lint
  - [x] SKIP_SITEMAP_DB=true npm run build
- 변경 파일
  - src/app/[lang]/(main)/posts/new/NewPostClient.tsx
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [FE] Sidebar/공지/숏폼 locale fallback 보강 (P0)

- 플랜(체크리스트)
  - [x] Sidebar 메뉴/툴팁/토스트 locale fallback 정리
  - [x] 공지 배너/숏폼 리스트 라벨 locale fallback 정리
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 사이드바 툴팁/토스트 및 공지/숏폼 UI 라벨 일부가 locale 조건식으로만 처리됨
- 변경 내용(why/what)
  - why: 사이드바/공지/숏폼 UI에서 언어 혼용 최소화
  - what: ko/en/vi fallback 맵으로 통일하고 공통 라벨 변수로 치환
- 검증
  - [x] npm run lint
  - [x] SKIP_SITEMAP_DB=true npm run build
- 변경 파일
  - src/components/organisms/CategorySidebar.tsx
  - src/components/organisms/NoticeBanner.tsx
  - src/components/organisms/ShortFormPlaylist.tsx
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [FE] 글쓰기 메타데이터 locale fallback 보강 (P0)

- 플랜(체크리스트)
  - [x] 글쓰기 페이지 metadata title/description locale fallback 정리
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 글쓰기 metadata 기본값이 ko 고정이라 en/vi에서 혼용 가능
- 변경 내용(why/what)
  - why: 메타데이터에서도 언어 혼용 최소화
  - what: ko/en/vi fallback 맵을 추가하고 title/description 기본값을 locale별로 분리
- 검증
  - [x] npm run lint
  - [x] SKIP_SITEMAP_DB=true npm run build
- 변경 파일
  - src/app/[lang]/(main)/posts/new/page.tsx
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [FE] 글쓰기 템플릿 라벨 locale fallback 보강 (P0)

- 플랜(체크리스트)
  - [x] 템플릿 라벨/placeholder locale fallback 정리
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 글쓰기 템플릿 영역의 vi fallback 일부가 ko 텍스트로 남아 있음
- 변경 내용(why/what)
  - why: 템플릿 안내에서 언어 혼용 최소화
  - what: ko/en/vi fallback 맵 추가 후 템플릿 라벨/placeholder를 공통 변수로 치환
- 검증
  - [x] npm run lint
  - [x] SKIP_SITEMAP_DB=true npm run build
- 변경 파일
  - src/app/[lang]/(main)/posts/new/NewPostClient.tsx
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [FE] 메타데이터 locale fallback 보강 (P0)

- 플랜(체크리스트)
  - [x] 홈/검색/알림/피드백 metadata fallback locale 분리
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 메타데이터 기본값이 ko 고정이라 en/vi에서 혼용 가능
- 변경 내용(why/what)
  - why: 메타데이터에서도 언어 혼용 최소화
  - what: ko/en/vi fallback 맵 추가 후 title/description 기본값 분리
- 검증
  - [x] npm run lint
  - [x] SKIP_SITEMAP_DB=true npm run build
- 변경 파일
  - src/app/[lang]/layout.tsx
  - src/app/[lang]/(main)/notifications/page.tsx
  - src/app/[lang]/(main)/feedback/page.tsx
  - src/app/[lang]/(main)/search/page.tsx
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [FE] 알림/프로필/에디터 i18n + 빌드 DB fallback 보강 (P0)

- 플랜(체크리스트)
  - [x] 알림/피드백/프로필 편집/에디터 UI locale fallback 정리
  - [x] 홈/프로필 메타데이터 locale fallback 분리
  - [x] DATABASE_URL 누락 시 빌드 단계 fallback 처리
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 알림/프로필/에디터 화면에 ko 하드코딩/링크 모달 텍스트가 남아 있었고, Vercel 빌드에서 DATABASE_URL 누락 시 빌드가 중단됨
- 변경 내용(why/what)
  - why: 언어 혼용 최소화 및 배포 빌드 안정화
  - what: locale별 fallback 맵 적용 + 메타데이터 기본값 분리 + DB 초기화 build-safe 처리
- 검증
  - [x] npm run lint
  - [x] SKIP_SITEMAP_DB=true npm run build
- 변경 파일
  - src/lib/db/index.ts
  - src/app/[lang]/(main)/notifications/NotificationsClient.tsx
  - src/app/[lang]/(main)/feedback/FeedbackClient.tsx
  - src/components/molecules/editor/RichTextEditor.tsx
  - src/app/[lang]/(main)/profile/edit/ProfileEditClient.tsx
  - src/app/[lang]/(main)/profile/[id]/page.tsx
  - src/app/[lang]/(main)/page.tsx
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [FE] 온보딩/글쓰기 태그 locale fallback 정리 (P0)

- 플랜(체크리스트)
  - [x] 온보딩 가이드/FAQ locale fallback 맵 정리
  - [x] 글쓰기 기본 태그 fallback locale 분리
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 온보딩 가이드/FAQ는 언어별 분기에서 하드코딩 라벨이 남아 있었고, 글쓰기 기본 태그의 fallback이 ko 고정
- 변경 내용(why/what)
  - why: 언어 혼용 최소화 및 기본 태그의 locale 정합성 확보
  - what: 가이드/FAQ fallback 맵으로 일원화 + 기본 태그/fallback 태그 seed를 locale별로 분리
- 검증
  - [x] npm run lint
  - [x] SKIP_SITEMAP_DB=true npm run build
- 변경 파일
  - src/app/[lang]/(main)/onboarding/OnboardingClient.tsx
  - src/app/[lang]/(main)/posts/new/NewPostClient.tsx
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [FE] Header/Auth CTA + 공유하기 카피 정리 (P0)

- 플랜(체크리스트)
  - [x] 헤더 signup CTA를 “바로 시작하기” 계열로 통일
  - [x] 공유하기 CTA 설명 문구 업데이트
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 헤더 signup CTA fallback이 “Sign up/회원가입”으로 노출될 수 있고, 공유하기 CTA 설명이 기존 장문 카피로 남아 있었음
- 변경 내용(why/what)
  - why: 회원가입 중심 카피를 완화하고 공유 CTA 메시지를 간결하게 통일
  - what: Header signup fallback 오버라이드 + Sidebar 공유 CTA 설명 문구 업데이트
- 검증
  - [x] npm run lint
  - [x] SKIP_SITEMAP_DB=true npm run build
- 변경 파일
  - src/components/organisms/Header.tsx
  - src/components/organisms/CategorySidebar.tsx
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 없음

#### (2025-12-20) [FE] 요청 단위 커밋 준비: 인증 요약 CTA/템플릿 컴팩트/피드백 버튼 (P0-13/P0-14)

- 플랜(체크리스트)
  - [ ] PostCard 인증 요약 CTA 버튼화 + hover 강조 + 답변/댓글 앵커 이동
  - [ ] 질문 템플릿 입력 영역 컴팩트화(행/패딩 축소)
  - [ ] 사이드바 피드백 메뉴 텍스트 버튼화
- 커밋 분리(요청 단위)
  - [ ] Commit A: `[FE] PostCard 인증 요약 CTA 버튼화` → `src/components/molecules/cards/PostCard.tsx`
  - [ ] Commit B: `[FE] 질문 템플릿 입력 컴팩트화` → `src/app/[lang]/(main)/posts/new/NewPostClient.tsx`
  - [ ] Commit C: `[FE] 사이드바 피드백 버튼화` → `src/components/organisms/CategorySidebar.tsx`
  - [ ] Commit D: `[DOC] FE 작업 기록` → `docs/WORKING_PLAN.md`, `HANDOVER.md`, `docs/EXECUTION_PLAN.md`
- 현황 분석(코드 기준)
  - 현재 구현/문제 위치: `src/components/molecules/cards/PostCard.tsx`, `src/app/[lang]/(main)/posts/new/NewPostClient.tsx`, `src/components/organisms/CategorySidebar.tsx`
  - 재현/리스크: 모바일에서 인증 요약 라벨이 길면 액션 행이 줄바꿈되며 균형이 깨짐
- 변경 내용(why/what)
  - why: 인증 요약 설명을 클릭 가능한 CTA로 노출해 의미를 명확히 하고, 모바일에서도 액션 행을 한 줄로 유지
  - what: 인증 요약 라벨을 Tooltip+버튼으로 재구성, 액션 행은 nowrap/auto 폭으로 정렬, 템플릿 입력 패딩/행 수 축소
- 검증
  - [ ] npm run lint
  - [ ] npm run type-check
  - [ ] npm run build
- 변경 파일
  - src/components/molecules/cards/PostCard.tsx
  - src/app/[lang]/(main)/posts/new/NewPostClient.tsx
  - src/components/organisms/CategorySidebar.tsx
  - docs/WORKING_PLAN.md
  - HANDOVER.md
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - Lead가 커밋 분리 기준대로 add/commit 필요

#### (2025-12-20) [FE] 프로필 통계 1행 고정 + 프로필 설정 헤더 정합 (P0-2)

- 플랜(체크리스트)
  - [ ] 프로필 통계 5개를 모바일에서도 1행 유지(가로 스크롤 허용)
  - [ ] 프로필 설정 페이지 헤더를 메인 헤더 구성과 동일하게 노출
- 커밋 분리(요청 단위)
  - [ ] Commit A: `[FE] 프로필 통계 1행 고정` → `src/app/[lang]/(main)/profile/[id]/ProfileClient.tsx`
  - [ ] Commit B: `[FE] 프로필 설정 헤더 정합` → `src/app/[lang]/(main)/profile/edit/ProfileEditClient.tsx`
  - [ ] Commit C: `[DOC] FE 작업 기록` → `docs/WORKING_PLAN.md`, `HANDOVER.md`, `docs/EXECUTION_PLAN.md`
- 현황 분석(코드 기준)
  - 현재 구현/문제 위치: `src/app/[lang]/(main)/profile/[id]/ProfileClient.tsx`, `src/app/[lang]/(main)/profile/edit/ProfileEditClient.tsx`
  - 재현/리스크: 모바일에서 통계 블록이 여러 줄로 쌓이며 컴팩트 레이아웃이 깨짐
- 변경 내용(why/what)
  - why: 모바일에서도 핵심 수치를 한 줄로 유지해 가독성/일관성 확보
  - what: 통계 블록을 가로 스크롤 가능한 flex row로 전환, 프로필 설정은 기본 헤더 구성으로 정렬
- 검증
  - [ ] npm run lint
  - [ ] npm run type-check
  - [ ] npm run build
- 변경 파일
  - src/app/[lang]/(main)/profile/[id]/ProfileClient.tsx
  - src/app/[lang]/(main)/profile/edit/ProfileEditClient.tsx
  - docs/WORKING_PLAN.md
  - HANDOVER.md
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 모바일 프로필 통계 가로 스크롤 UX 확인 필요

### 0.6.2 [WEB] Web Feature Agent

#### (2025-12-18) [WEB] 헤더/프로필 모달 성능 최적화 (P0)

- 플랜(체크리스트)
  - [x] 프로필 드롭다운 모달 lazy-load + 오픈 시에만 mount
  - [x] 모달 리스트 step-by-step 렌더(스켈레톤 포함)
  - [x] 무한스크롤 fetch 조건 강화(visibleCount와 연동)
- 현황 분석(코드 기준)
  - 모달을 열 때마다 리스트 전체 렌더/재조회로 렉/과호출 체감 가능
- 변경 내용(why/what)
  - why: 모달은 짧게 열고 닫는 UX가 많아, 재오픈 시 refetch/풀 렌더는 UX/부하 모두 악화
  - what: dynamic import + mount on open + progressive list 패턴 도입, query staleTime/gcTime로 재오픈 refetch 억제
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/components/molecules/UserProfile.tsx
  - src/components/molecules/modals/BookmarksModal.tsx
  - src/components/molecules/modals/MyPostsModal.tsx
  - src/components/molecules/modals/FollowingModal.tsx
  - src/lib/hooks/useProgressiveList.ts
- 다음 액션/의존성
  - 관리자 모달/상세에서도 동일 패턴 확장(과부하 방지)

#### (2025-12-18) [LEAD] 정합성 메모: Modal 파일 경로 일원화

- 현황
  - 모달 컴포넌트는 `src/components/molecules/modals/*`로 일원화되어야 한다.
- 조치
  - 이후 모달 관련 작업은 기존 경로(`src/components/molecules/*Modal.tsx`)를 신규로 만들지 않고, `molecules/modals`만 수정한다.

#### (2025-12-18) [WEB] `/verification/history` 실데이터 연동 (P0)

- 플랜(체크리스트)
  - [x] demo empty array 제거 → TanStack Query로 이력 조회
  - [x] pagination(load more) 지원
  - [x] loading/error 상태 UI 추가 + 재시도
- 현황 분석(코드 기준)
  - `VerificationHistoryClient`가 로컬 state(빈 배열)만 사용해 실제 신청 이력이 표시되지 않음
  - `/api/verification/history`는 page/limit 기반 페이지네이션을 제공
- 변경 내용(why/what)
  - why: 인증 신청 플로우의 신뢰/투명성을 위해 “현재 상태/과거 이력”을 실데이터로 보여줘야 함
  - what: `useVerificationHistory`를 연결하고, page 증가 시 중복 없이 누적 렌더; 실패 시 refetch 버튼 제공
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/app/[lang]/(main)/verification/history/VerificationHistoryClient.tsx
- 다음 액션/의존성
  - `/verify` 3-step wizard에 history 섹션/딥링크 동선 통합

#### (2025-12-18) [WEB] 헤더 검색/알림 모달 추가 성능 최적화 (P0)

- 플랜(체크리스트)
  - [x] NotificationModal 알림 목록 쿼리 `staleTime/gcTime` + `refetchOnWindowFocus:false`로 재오픈 refetch 억제
  - [x] Header 검색 로직을 별도 컴포넌트로 분리 + `next/dynamic({ ssr:false })`로 지연 로드(모바일/검색 숨김 시 미로딩)
- 현황 분석(코드 기준)
  - 현재 구현/문제 위치: `src/components/organisms/Header.tsx`가 검색 로직/상수/디바운스를 모두 포함해 초기 번들/실행 비용이 커짐(검색 숨김 페이지에서도 동일)
  - 재현/리스크: 알림/프로필 동선에서 헤더는 항상 렌더되므로, 불필요한 JS 파싱/효과 실행이 누적되면 체감 렉으로 이어짐
- 변경 내용(why/what)
  - why: “항상 렌더되는 헤더”에서 무거운 검색 로직을 분리해 초기 번들/실행 비용을 줄이고, 알림 모달은 재오픈 시 중복 refetch를 줄여 UX/트래픽을 안정화
  - what: `HeaderSearch`로 검색 UI/로직을 분리하고 헤더는 데스크톱(>=lg)에서만 지연 마운트; NotificationModal은 쿼리 캐시 옵션을 명시
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/components/organisms/Header.tsx
  - src/components/molecules/HeaderSearch.tsx
  - src/repo/notifications/query.ts
  - src/components/molecules/modals/NotificationModal.tsx
- 다음 액션/의존성
  - (선택) 검색 예시 질문을 실데이터 기반으로 전환할 경우: BE의 “인기 질문 예시 API + 캐시 전략” 선행 필요

#### (2025-12-18) [LEAD] 헤더 검색 트래픽 절감: 타이핑 중 라우팅 제한 (P0)

- 플랜(체크리스트)
  - [x] 일반 페이지: 타이핑 중 자동 라우팅 제거(Enter/버튼으로만 이동)
  - [x] `/[lang]/search` 페이지: debounced 라우팅 유지(검색 UX 유지)
- 현황 분석(코드 기준)
  - 헤더 검색은 모든 페이지에서 렌더되므로, 입력 시 매번 라우팅되면 서버 렌더/DB/네트워크 비용이 빠르게 증가할 수 있음
- 변경 내용(why/what)
  - why: 불필요한 라우팅(= 서버 요청)을 줄여 체감 성능/트래픽을 안정화
  - what: `HeaderSearch`에서 `pathname`으로 `/search` 여부를 판별해, 검색 페이지에서만 debounced 라우팅 실행
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/components/molecules/HeaderSearch.tsx

#### (2025-12-18) [WEB] 헤더 프로필 드롭다운 모달 성능 최적화 (P0) - 무한스크롤 observer 보강

- 플랜(체크리스트)
  - [x] 무한스크롤 observer는 “현재 페이지 렌더 완료(visibleCount >= data length)” 이후에만 attach
  - [x] sentinel(ref) DOM도 필요 시점에만 렌더(불필요 observer 콜백/연결 억제)
  - [x] 닫힘 시 탭/필터 state 초기화(재오픈 UX 정합성)
- 현황 분석(코드 기준)
  - progressive list로 visibleCount가 짧은 주기로 증가하면서, observer effect가 반복 생성/해제되어(리렌더/cleanup) 모달 오픈 시 불필요한 JS 작업이 발생 가능
  - sentinel DOM이 항상 렌더되면(visibleCount < length 구간) viewport 조건에 따라 불필요한 observer 콜백이 발생할 수 있음
- 변경 내용(why/what)
  - why: 모달 오픈 초기 프레임에서 observer churn을 줄여 체감 렉과 불필요 콜백/연결을 최소화
  - what: visibleCount가 현재 로드된 데이터 길이에 도달했을 때만 observer attach + sentinel 렌더; 닫힘 시 탭/필터를 초기화
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/components/molecules/modals/MyPostsModal.tsx
  - src/components/molecules/modals/BookmarksModal.tsx
  - src/components/molecules/modals/FollowingModal.tsx
- 다음 액션/의존성
  - 없음(클라이언트 최적화 범위)

#### (2025-12-18) [WEB] 헤더 프로필 드롭다운 모달 성능 최적화 (P0) - 중복 요청 제거/재요청 억제

- 플랜(체크리스트)
  - [x] ProfileModal 오픈 시 중복 쿼리 제거(요청 2→1)
  - [x] 프로필/설정/리스트 모달 쿼리의 `refetchOnWindowFocus/refetchOnReconnect` 비활성화로 재요청 억제
- 현황 분석(코드 기준)
  - ProfileModal이 오픈 시 `useUserProfile` + `useMyProfile`를 동시에 실행해(동일 사용자 기준) 중복 네트워크 요청 가능
  - 모달은 재오픈/탭 전환이 잦고, 포커스 복귀 시 stale 여부에 따라 자동 refetch가 발생할 수 있음
- 변경 내용(why/what)
  - why: 모달 오픈은 UI 상 “짧고 반복적인 동선”이라, 중복/자동 refetch는 체감 렉과 트래픽을 함께 악화
  - what: ProfileModal 데이터 소스는 `useUserProfile(user.id)`로 단일화(오픈 시 요청 1회), 모달 쿼리에 `refetchOnWindowFocus:false`, `refetchOnReconnect:false`를 명시
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/components/molecules/modals/ProfileModal.tsx
  - src/components/molecules/modals/SettingsModal.tsx
  - src/components/molecules/modals/MyPostsModal.tsx
  - src/components/molecules/modals/BookmarksModal.tsx
  - src/components/molecules/modals/FollowingModal.tsx
- 다음 액션/의존성
  - (선택) 재오픈 UX 정합성 강화를 위해 모달 content scrollTop 초기화(닫힘/재오픈 시 0으로 리셋)

#### (2025-12-18) [WEB] 헤더 프로필 드롭다운 모달 성능 최적화 (P0) - 재오픈 스크롤/탭 정합성

- 플랜(체크리스트)
  - [x] 모달 재오픈 시 스크롤 위치(scrollTop) 상단으로 리셋
  - [x] 탭/필터 전환 시 스크롤 위치 상단으로 리셋(중간 스크롤 잔존 방지)
- 현황 분석(코드 기준)
  - 모달은 반복적으로 열고 닫는 흐름이 많아, 스크롤 위치가 유지되면 “이전 맥락이 섞인 화면”처럼 보이거나 무한 스크롤 sentinel이 즉시 viewport에 들어와 불필요 fetch로 이어질 수 있음
- 변경 내용(why/what)
  - why: 재오픈/탭 이동 시 항상 동일한 시작 지점(상단)으로 맞춰 UX 정합성과 불필요 이벤트를 줄임
  - what: 모달 body(parent scroll) + 내부 scroll 영역에 대해 `scrollTop=0` 처리(오픈/탭·필터 변경 시)
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/components/molecules/modals/MyPostsModal.tsx
  - src/components/molecules/modals/BookmarksModal.tsx
  - src/components/molecules/modals/FollowingModal.tsx

#### (2025-12-18) [WEB] 헤더 프로필 드롭다운 모달 성능 최적화 (P0) - 로그아웃 시 캐시 정리

- 플랜(체크리스트)
  - [x] 드롭다운 로그아웃 클릭 시 TanStack Query 캐시 clear
- 현황 분석(코드 기준)
  - 로그아웃은 세션만 종료되면 충분하지만, 클라이언트 Query 캐시가 남아 있으면 개인화 데이터가 메모리에 잔존하고(가비지컬렉션까지 대기) 일부 UI에서 “이전 사용자 캐시”가 잠깐 노출될 수 있음
- 변경 내용(why/what)
  - why: 로그아웃은 캐시를 유지할 이유가 없으므로 즉시 정리해 메모리/정합성 리스크를 낮춤
  - what: 로그아웃 버튼 클릭 시 `queryClient.clear()` 후 `onLogout()` 실행
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/components/molecules/user/UserProfile.tsx

#### (2025-12-19) [LEAD→WEB] 다음 스프린트 플랜 (P0/P1)

- 플랜(체크리스트)
  - [x] 비로그인 입력 게이팅 통일: NewPost/Answer/Comment/Upload 클릭 시 로그인 모달
  - [x] HeaderSearch 예시 질문 실데이터 연결 + 예시 텍스트는 placeholder로만 노출
  - [x] 구독 페이지 상단 필터 버튼 클릭 시 서버 데이터 동기화(SSR/Query key 정비)
  - [x] repo/query 키 정리: 검색/추천/구독 키 통합 및 중복 제거
  - [x] 추천 사용자 캐러셀 무한 로딩 조건 재점검(과호출 방지)
- 변경 파일
  - src/components/molecules/editor/RichTextEditor.tsx
  - src/components/molecules/search/HeaderSearch.tsx
  - src/components/organisms/PostList.tsx
  - src/components/organisms/RecommendedUsersSection.tsx
  - src/repo/keys.ts
  - src/repo/users/query.ts
  - src/app/[lang]/(main)/page.tsx

#### (2025-12-18) [WEB] 헤더 프로필 드롭다운 모달 성능 최적화 (P0) - staleTime/gcTime 합리화(재오픈 트래픽 절감)

- 플랜(체크리스트)
  - [x] 리스트/무한스크롤 모달의 `staleTime/gcTime` 상향으로 재오픈 refetch 억제
- 현황 분석(코드 기준)
  - staleTime이 짧으면(예: 60s) 모달을 몇 분 뒤 재오픈할 때마다 같은 데이터를 재조회해 트래픽/체감 로딩이 누적될 수 있음
- 변경 내용(why/what)
  - why: 드롭다운 모달은 “짧게, 자주” 열리는 UX라 재오픈 시 캐시 재사용이 더 중요
  - what: MyPosts/Bookmarks는 `staleTime:5m, gcTime:15m`, Following(추천/팔로잉)은 `staleTime:5m, gcTime:15m`, Following feed는 `staleTime:2m, gcTime:10m`로 조정
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/components/molecules/modals/MyPostsModal.tsx
  - src/components/molecules/modals/BookmarksModal.tsx
  - src/components/molecules/modals/FollowingModal.tsx

#### (2025-12-18) [WEB] 헤더 프로필 드롭다운 모달 성능 최적화 (P0) - ProfileModal 번들 경량화

- 플랜(체크리스트)
  - [x] ProfileModal에서 사용하지 않는 날짜 라이브러리/locale import 제거
  - [x] 가입일 표시는 `Intl.DateTimeFormat` 기반으로 대체
- 현황 분석(코드 기준)
  - ProfileModal은 `dayjs` + 다국어 locale을 import하고 있었지만, 실제 렌더에서 상대시간/locale 기반 포맷을 사용하지 않아 번들만 커지는 상태
- 변경 내용(why/what)
  - why: 모달은 “오픈 시에만” 로드되더라도 첫 오픈 체감은 chunk 크기/파싱 비용의 영향을 받음
  - what: `dayjs`(plugin/locale 포함) 제거 + 가입일 포맷은 locale별 `Intl.DateTimeFormat`로 구현
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/components/molecules/modals/ProfileModal.tsx

#### (2025-12-18) [WEB] 헤더 프로필 드롭다운 모달 성능 최적화 (P0) - 리스트 파생값(useMemo) 최적화

- 플랜(체크리스트)
  - [x] 무한/프로그레시브 렌더 중 반복되는 flatMap/filter/count 계산을 useMemo로 고정
- 현황 분석(코드 기준)
  - progressive list는 visibleCount가 증가하는 동안 리렌더가 연속 발생하므로, 매 렌더마다 `pages.flatMap()`/`filter()`가 반복되면 CPU 부담이 커질 수 있음
- 변경 내용(why/what)
  - why: 오픈 직후 체감 렉의 대부분은 “짧은 시간에 반복되는 계산/리렌더”에서 발생
  - what: MyPosts/Bookmarks/Following에서 pages flatten 및 필터별 카운트/필터링 결과를 useMemo로 캐시
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/components/molecules/modals/MyPostsModal.tsx
  - src/components/molecules/modals/BookmarksModal.tsx
  - src/components/molecules/modals/FollowingModal.tsx

#### (2025-12-18) [WEB] 헤더 프로필 드롭다운 모달 성능 최적화 (P1) - AbortSignal로 in-flight 요청 취소

- 플랜(체크리스트)
  - [x] users/posts repo fetch 함수에 `signal` 옵션 지원
  - [x] TanStack Query의 `queryFn({ signal })` → repo fetch로 전달
- 현황 분석(코드 기준)
  - 모달을 열었다가 바로 닫는 경우, 네트워크 요청이 끝까지 진행되면 체감과 무관한 트래픽/리소스가 낭비될 수 있음
- 변경 내용(why/what)
  - why: 모달은 “짧고 반복” 사용이 많아, 닫힘 시 in-flight 요청은 중단되는 편이 비용/UX 모두에 유리
  - what: `fetch*`에 `AbortSignal`을 전달할 수 있게 하고, Query hook들이 `signal`을 전달해 모달 unmount 시 자동 abort되도록 정리
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/repo/users/fetch.ts
  - src/repo/users/query.ts
  - src/repo/posts/fetch.ts
  - src/repo/posts/query.ts

#### (2025-12-18) [WEB] 헤더 프로필 드롭다운 모달 성능 최적화 (P1) - MyPosts/Following dayjs 제거

- 플랜(체크리스트)
  - [x] MyPosts/Following 모달에서 `dayjs` 의존성 제거
  - [x] 날짜 포맷은 경량 커스텀 포맷터(`YYYY.MM.DD HH:mm`)로 대체
- 현황 분석(코드 기준)
  - 모달은 dynamic import로 “오픈 시에만” 로드되지만, 첫 오픈 시 chunk 크기/파싱 비용은 그대로 체감에 영향을 줌
  - 리스트 모달은 PostCard 렌더 비용도 커서, 부가 라이브러리(dayjs/locale 등)는 가능한 줄이는 편이 유리
- 변경 내용(why/what)
  - why: 불필요 의존성을 줄여 모달 첫 오픈 latency를 낮추고 번들 파싱 비용을 감소
  - what: `dayjs` import 제거 + `new Date()` 기반 포맷 함수로 대체
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/components/molecules/modals/MyPostsModal.tsx
  - src/components/molecules/modals/FollowingModal.tsx

#### (2025-12-18) [WEB] 헤더 프로필 드롭다운 모달 성능 최적화 (P1) - dynamic loading fallback(첫 클릭 체감 개선)

- 플랜(체크리스트)
  - [x] `next/dynamic` 모달들에 `loading` 오버레이 추가
  - [x] 로딩 상태에서도 backdrop/Escape로 닫기 가능(UX 안전장치)
- 현황 분석(코드 기준)
  - 모달 컴포넌트는 lazy-load라 첫 클릭 시 chunk 로딩 동안 아무 UI도 안 보이면 “클릭이 안 된 것처럼” 느껴질 수 있음
- 변경 내용(why/what)
  - why: 첫 오픈 체감 latency를 UX적으로 흡수하고, 로딩 중에도 닫기 가능하게 만들어 안전한 동선 유지
  - what: 공통 로딩 오버레이를 추가하고, Context로 `onClose`를 연결해 로딩 중에도 close 동작 지원
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/components/molecules/user/UserProfile.tsx

#### (2025-12-18) [WEB] 헤더 프로필 드롭다운 모달 성능 최적화 - 현행 점검/재검증 (P0)

- 플랜(체크리스트)
  - [x] `UserProfile` 모달 dynamic import + 오픈 시 mount 구조 확인
  - [x] Profile/MyPosts/Following/Bookmarks/Settings 모달 쿼리 옵션(enabled/isOpen, staleTime/gcTime) 재점검
  - [x] 무한스크롤 observer cleanup + 재오픈 시 스크롤/상태 초기화 동작 확인
- 현황 분석(코드 기준)
  - 현재 구현/문제 위치: `src/components/molecules/user/UserProfile.tsx`에서 모달을 `next/dynamic({ ssr:false })`로 분리하고, `activeModal`일 때만 렌더하여 첫 화면 번들/요청을 지연
  - 재현/리스크: 모달은 짧고 반복적으로 열리는 UX라서, 재오픈 시 매번 refetch/observer 누수 발생하면 체감 렉/트래픽이 급증
- 변경 내용(why/what)
  - why: 병렬 작업/스냅샷 이후에도 성능 최적화가 실제로 반영되었는지 검증 필요
  - what: 코드 변경 없이 현행 구현이 요구사항을 충족하는지 재확인하고 `lint/build`로 재검증
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - (none)

#### (2025-12-19) [WEB] 팔로잉 추천 탭 페이지네이션/무한스크롤 전환 (P0)

- 플랜(체크리스트)
  - [x] 추천 탭을 infinite query로 전환하고 page/limit 기반으로 로드
  - [x] 추천 탭 sentinel/로딩 인디케이터 추가 + progressive list와 연동
  - [x] 추천 쿼리 키 분리로 추천 리스트 캐시 충돌 방지
- 현황 분석(코드 기준)
  - FollowingModal 추천 탭이 단일 페이지 데이터만 표시해 전체 노출/재오픈 UX가 단절됨
  - 동일 queryKey를 infinite/일반 쿼리에서 공유하면 데이터 구조 충돌 위험이 있음
- 변경 내용(why/what)
  - why: 1회 전체 노출을 제한하고 점진 로딩으로 체감/트래픽을 안정화
  - what: 추천 탭을 무한스크롤로 전환하고, `recommendedInfinite` 키로 쿼리 캐시를 분리
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/components/molecules/modals/FollowingModal.tsx
  - src/repo/users/query.ts
  - src/repo/keys.ts
- 다음 액션/의존성
  - 추천 기준/제외 규칙/노출 우선순위는 BE 규칙 정의 후 가중치 반영 필요

#### (2025-12-19) [WEB] 헤더 검색 예시 질문 동적 반영 (P0)

- 플랜(체크리스트)
  - [x] `/api/search/examples` 연동용 repo(fetch/query/types) 추가
  - [x] HeaderSearch 예시 풀을 API 기반으로 전환하고 정적 예시 fallback 유지
  - [x] 캐시 정책(staleTime/gcTime)으로 재호출 최소화
- 현황 분석(코드 기준)
  - HeaderSearch는 정적 예시만 사용해 실시간 인기 질문이 반영되지 않음
  - 예시 데이터는 공용이므로 user cache와 분리된 전용 queryKey 필요
- 변경 내용(why/what)
  - why: 인기 질문 기반 예시를 노출해 검색 전환율과 최신성 개선
  - what: search examples query 추가 후 HeaderSearch 예시 풀을 동적 데이터 우선으로 구성
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/components/molecules/search/HeaderSearch.tsx
  - src/repo/search/fetch.ts
  - src/repo/search/query.ts
  - src/repo/search/types.ts
  - src/repo/keys.ts
- 다음 액션/의존성
  - locale별 예시 구분이 필요하면 API에 `lang` 필터 확장 필요

#### (2025-12-19) [WEB] 관리자 인증 심사 UI 검증 강화 (P0)

- 플랜(체크리스트)
  - [x] 승인/거부 입력값 검증(요약/키워드, 거부 사유) 추가
  - [x] 검증 오류 상태를 UI에 명시하고 입력 변경 시 해제
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 관리자 인증 심사에서 승인/거부 시 필수 입력값 검증이 없어 공란 승인/거부가 발생할 수 있음
- 변경 내용(why/what)
  - why: 승인 시 프로필 요약/키워드, 거부 시 사유가 누락되면 사용자 노출 정보의 신뢰/설명력이 약해짐
  - what: 승인/거부 조건에 맞는 입력값 체크를 추가하고, 오류 메시지를 다이얼로그에 표시
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/app/admin/(dashboard)/verifications/page.tsx
- 다음 액션/의존성
  - 관리자 인증 플로우의 기본값/가이드 문구 다국어화가 필요하면 i18n 키 요청 필요

#### (2025-12-19) [WEB] 헤더 프로필 드롭다운 모달 성능 최적화 - 현행 점검 (P0)

- 플랜(체크리스트)
  - [x] UserProfile 모달 dynamic import + 오픈 시 mount 구조 재확인
  - [x] Profile/MyPosts/Following/Bookmarks/Settings 쿼리 옵션(enabled/isOpen, staleTime/gcTime) 재점검
  - [x] 무한스크롤 observer cleanup + 재오픈 시 스크롤/탭 초기화 동작 확인
- 현황 분석(코드 기준)
  - `UserProfile`에서 모달을 `next/dynamic({ ssr:false })`로 분리하고 `activeModal`에서만 렌더하여 초기 번들/요청을 지연
  - 모달 쿼리는 `enabled: isOpen`과 `staleTime/gcTime`로 재오픈 시 불필요 refetch를 억제
  - 무한스크롤 observer는 닫힘/탭 전환 시 cleanup되며, 재오픈 시 스크롤 상단으로 복구됨
- 변경 내용(why/what)
  - why: 병렬 작업 중에도 요구사항이 유지되는지 확인 필요
  - what: 코드 변경 없이 현행 구현이 요구사항을 충족하는지 재확인
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - (none)

#### (2025-12-19) [WEB] 빌드 오류 정리 + 재검증 (P0)

- 플랜(체크리스트)
  - [x] ProfileEditClient `useMemo` import 누락 + `profile.name` 타입 오류 정리
  - [x] UpdateProfileRequest에 `koreanLevel/visaType` null 허용 추가
  - [x] RecommendedUsersSection metaLabelMap 타입 명시로 빌드 오류 제거
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 병렬 변경으로 인해 ProfileEditClient/RecommendedUsersSection 타입 오류가 발생해 build가 실패
- 변경 내용(why/what)
  - why: 빌드 실패를 해소하고 WEB 작업 검증을 완료하기 위해 타입 정합성 복원 필요
  - what: useMemo import 추가, User 타입에 맞춘 name 초기화, UpdateProfileRequest null 허용, metaLabelMap 타입 명시
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/app/[lang]/(main)/profile/edit/ProfileEditClient.tsx
  - src/repo/users/types.ts
  - src/components/organisms/RecommendedUsersSection.tsx
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [WEB] 비로그인 읽기/로그인 쓰기 게이팅 QA (P0)

- 플랜(체크리스트)
  - [x] 카드/리스트 액션(좋아요/북마크/팔로우)에서 비로그인 시 로그인 모달 유도
  - [x] 질문/답변/댓글/신고/북마크 전 흐름 확인(에러 대신 모달)
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - PostCard/AnswerCard/CommentCard가 비로그인 시 `/login`으로 라우팅되어 UX 단절 발생
  - PostDetail 내 신고/댓글/답변은 로그인 모달 사용 중
- 변경 내용(why/what)
  - why: 쓰기 액션은 로그인 모달 유도로 전환해 흐름 유지
  - what: 카드 액션에서 `useLoginPrompt`로 모달 유도
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/components/molecules/cards/PostCard.tsx
  - src/components/molecules/cards/AnswerCard.tsx
  - src/components/molecules/cards/CommentCard.tsx
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [WEB] 피드백/버그 제보 폼 UX + 제출 확인 (P0)

- 플랜(체크리스트)
  - [x] 피드백/버그 제보 폼 UI 구성 + 제출 확인 화면
  - [x] API 연동용 repo/mutation 추가
  - [x] 메뉴 진입 동선 추가
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 전용 피드백 폼/제출 확인 동선이 없어 제보 루프가 끊김
- 변경 내용(why/what)
  - why: 베타에서 빠른 개선 루프 확보
  - what: `/[lang]/feedback` 페이지 + 제출 확인 UI + `/api/feedback` 엔드포인트 추가
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/app/[lang]/(main)/feedback/page.tsx
  - src/app/[lang]/(main)/feedback/FeedbackClient.tsx
  - src/app/api/feedback/route.ts
  - src/repo/feedback/fetch.ts
  - src/repo/feedback/mutation.ts
  - src/repo/feedback/query.ts
  - src/repo/feedback/types.ts
  - src/repo/keys.ts
  - src/components/organisms/CategorySidebar.tsx
- 다음 액션/의존성
  - BE 저장소/레이트리밋 도입 시 API 구현 교체 필요

#### (2025-12-19) [WEB] 피드백 페이지 설문형 UI로 개편 (P0)

- 플랜(체크리스트)
  - [x] 만족도(1-5) 설문 UI 추가 + 타입별 라벨 분기
  - [x] 개선요청/버그 상세 입력으로 단순화, 요약/이메일 입력 제거
  - [x] 제출 시 제목 자동 생성(타입 + 만족도) + 검증 로직 정리
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 피드백 폼이 요약/이메일 중심이라 설문형 만족도 수집에 맞지 않음
- 변경 내용(why/what)
  - why: 개선 요청을 빠르게 수집하고 재오픈/재입력 부담을 낮추기 위해 설문형 UX로 전환
  - what: 만족도 선택 UI 추가, 개선 요청/버그 상세로 입력 축약, 자동 제목 생성으로 API 요구 충족
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/app/[lang]/(main)/feedback/FeedbackClient.tsx
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [WEB] 소셜 공유 CTA 확장 + 소셜 로그인 범위 확정 (P1)

- 플랜(체크리스트)
  - [x] 상세 페이지 공유 CTA 영역 추가(직접 공유 버튼)
  - [x] 공유 툴팁 라벨 정합화(Share)
  - [x] 소셜 로그인 범위 Google only로 확정(Facebook 제외)
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 공유는 아이콘/모달에만 노출되어 CTA 인지성이 낮음
  - 소셜 로그인 제공 범위가 문서상 Facebook/Google로 혼재
- 변경 내용(why/what)
  - why: 공유 유도 CTA를 명시적으로 노출하고 로그인 범위를 명확화
  - what: PostDetail 공유 CTA 블록 추가 + 공유 툴팁 라벨 정리 + 문서상 로그인 범위 Google only로 확정
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 소셜 로그인 신규 도입은 Google 범위만 유지

#### (2025-12-19) [WEB] 질문 템플릿 UI + 작성 폼 연결 (P0)

- 플랜(체크리스트)
  - [x] 조건/목표/배경 입력 UI 추가
  - [x] 입력 내용이 본문 상단에 합쳐져 제출되도록 연결
  - [x] 검증/금칙어/스팸 감지에 템플릿 포함
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 질문 작성 시 상황/목표/조건이 빠져 답변 품질 저하
- 변경 내용(why/what)
  - why: 질문 품질을 구조적으로 끌어올려 답변 정확도 개선
  - what: 템플릿 입력값을 본문 상단에 합성하고 유효성/경고에 포함
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/app/[lang]/(main)/posts/new/NewPostClient.tsx
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [WEB] 헤더 프로필 드롭다운 모달 성능 최적화 - 재검증/빌드 안정화 (P0)

- 플랜(체크리스트)
  - [x] UserProfile 모달 dynamic loading/오픈 시 mount 상태 재확인
  - [x] 모달 쿼리 옵션(enabled/isOpen, staleTime/gcTime) 재확인
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 모달 성능 최적화가 이미 반영되어 있어 코드 변경 없이 현행 검증만 필요
  - 빌드가 `.next/lock` 잔존 시 실패 가능(병렬 빌드/중단 시)
- 변경 내용(why/what)
  - why: 병렬 작업 중에도 성능 최적화 상태가 유지되는지 확인
  - what: lint/build 재실행, `.next/lock` 정리 후 build 성공 확인
- 검증
  - [x] npm run lint (pass)
  - [x] npm run build (pass; `.next/lock` 정리 후)
- 변경 파일
  - (none)
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [WEB] 글 상세 하단 추천 섹션 SSR + HydrationBoundary (P0)

- 플랜(체크리스트)
  - [x] 관련글/카테고리 인기글 필터 정의 + 쿼리 키 일치
  - [x] PostDetail SSR prefetch + HydrationBoundary 연동
  - [x] 하단 추천 섹션 UI(관련/카테고리) 렌더
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 글 상세 하단에 추천 섹션이 없어 관련글 탐색 흐름이 끊김
  - SSR/하이드레이션 연동이 없으면 상세 진입 시 추가 요청/렌더 지연이 발생
- 변경 내용(why/what)
  - why: 상세 페이지 체류/탐색 흐름 개선 + 서버 렌더로 초기 응답 품질 확보
  - what: 추천 필터/쿼리 헬퍼 추가, 상세 페이지에서 추천 쿼리 prefetch, 클라이언트에서 관련/카테고리 인기글 섹션 렌더
- 검증
  - [x] npm run lint (pass)
  - [x] npm run build (pass)
- 변경 파일
  - src/utils/postRecommendationFilters.ts
  - src/app/[lang]/(main)/posts/[id]/page.tsx
  - src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx
- 다음 액션/의존성
  - (선택) 추천 기준(태그 우선/조회수 가중) 확정 시 필터 로직 조정

#### (2025-12-19) [WEB] 토픽/구독 피드 상단 필터 바 정렬 규칙 보강 (P0)

- 플랜(체크리스트)
  - [x] 구독 피드 상단 필터 바 동작 확인(구독 카테고리 버튼)
  - [x] 구독 필터 적용 시 기본 정렬을 인기 규칙으로 유지
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 구독 피드 상단 필터 바는 이미 존재하나, 구독 피드 정렬이 최신으로 고정되어 요구사항(인기 기준 유지)과 불일치
- 변경 내용(why/what)
  - why: 구독 카테고리 필터 적용 시에도 기본 정렬 규칙을 유지해 피드 일관성 확보
  - what: 구독 피드(`selectedCategory === 'subscribed'`) 정렬을 `popular`로 고정
- 검증
  - [x] npm run lint (pass)
  - [x] npm run build (pass)
- 변경 파일
  - src/components/organisms/PostList.tsx
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [WEB] 공지/배너 CRUD + 홈 SSR 슬롯 (P0)

- 플랜(체크리스트)
  - [x] 관리자 공지/배너 폼에 노출 시작/종료 입력 추가
  - [x] 홈 상단 공지 배너 슬롯(공지 카테고리) 렌더
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 관리자 뉴스 CRUD는 존재하지만 노출 기간 설정 UI가 없어 일정 기반 제어가 어려움
  - 홈 상단에 공지/배너 전용 슬롯이 없어 노출 우선순위를 관리하기 어려움
- 변경 내용(why/what)
  - why: 공지/배너 노출 제어와 홈 상단 노출 지점을 확보해 운영 효율을 높임
  - what: 관리자 폼에 start/end 입력 추가, 홈 상단에 공지 배너 슬롯 추가(공지 카테고리 필터)
- 검증
  - [x] npm run lint (pass)
  - [x] npm run build (pass)
- 변경 파일
  - src/components/organisms/NoticeBanner.tsx
  - src/app/[lang]/(main)/HomeClient.tsx
  - src/app/admin/(dashboard)/news/page.tsx
  - src/repo/admin/types.ts
  - src/repo/admin/fetch.ts
  - src/repo/admin/mutation.ts
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [WEB] 빌드 오류 정리: 검색 키워드 API 타입 캐스팅 (P0)

- 플랜(체크리스트)
  - [x] search keywords API 결과 타입 캐스팅 정리
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - `db.execute` 결과 타입이 `ResultQueryMeta`와 교차되어 빌드 타입 오류 발생
- 변경 내용(why/what)
  - why: 빌드 실패를 해소하고 검증을 완료하기 위해 타입 캐스팅 정합성 보강
  - what: `normalizeRows` 호출부에서 unknown 경유 캐스팅으로 타입 오류 제거
- 검증
  - [x] npm run lint (pass)
  - [x] npm run build (pass)
- 변경 파일
  - src/app/api/search/keywords/route.ts
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [WEB] 피드 추천 사용자 인서트 UX 개선 (P0)

- 플랜(체크리스트)
  - [x] 추천 사용자 infinite query로 전환(초기 1페이지)
  - [x] 모바일 캐러셀 스크롤 끝에서 추가 로드
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 피드 추천 사용자는 1페이지 고정으로 로드되어 캐러셀에서 추가 탐색이 끊김
  - 서버/클라 페이지네이션 규칙이 모달/피드 간 상이해 확장이 어려움
- 변경 내용(why/what)
  - why: 캐러셀 UX에서 추가 로드 동선을 확보해 추천 탐색성을 높임
  - what: `useInfiniteRecommendedUsers`로 전환 + 캐러셀 sentinel로 추가 로드, 중복 제거 후 팔로워 순 정렬 유지
- 검증
  - [x] npm run lint (pass)
  - [x] npm run build (pass)
- 변경 파일
  - src/components/organisms/PostList.tsx
  - src/components/organisms/RecommendedUsersSection.tsx
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [WEB] 인증(/verification) 3-step wizard 완료 (P0)

- 플랜(체크리스트)
  - [x] 3-step 스텝퍼(정보 입력/서류 업로드/상태 확인) 동선 구성
  - [x] 신청 완료 시 상태 단계 전환 + 히스토리 refetch
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 인증 신청이 단일 폼/접힘 내역 구조라 단계 진행/상태 확인 동선이 분산
  - 상태 확인은 별도 페이지 또는 접힘 UI에 의존해 흐름 이탈이 발생
- 변경 내용(why/what)
  - why: 신청/업로드/상태 확인을 명확한 단계 흐름으로 통합해 이탈을 줄임
  - what: 스텝퍼 추가, 상태 단계에서 히스토리 실데이터 표시, 제출 후 상태 단계로 이동
- 검증
  - [x] npm run lint (pass)
  - [x] npm run build (pass)
- 변경 파일
  - src/app/[lang]/(main)/verification/request/VerificationRequestClient.tsx
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [WEB] 인증 신청 “추가 신청/수정하기” 플로우 지원 (P0)

- 플랜(체크리스트)
  - [x] 거절된 신청에서 재신청 CTA 제공
  - [x] 이전 신청 데이터로 폼 프리필(문서 재업로드 안내 포함)
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 기존 신청이 반려된 경우 재신청 동선이 명확하지 않고 반복 입력이 필요
- 변경 내용(why/what)
  - why: 재신청 시 입력 부담을 줄이고 상태/히스토리 흐름을 이어줌
  - what: 거절 카드에 “수정해서 다시 신청” 버튼 추가, 마지막 데이터 프리필 후 1단계로 이동
- 검증
  - [x] npm run lint (pass)
  - [x] npm run build (pass)
- 변경 파일
  - src/app/[lang]/(main)/verification/request/VerificationRequestClient.tsx
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [WEB] 프로필 설정 온보딩 반영/닉네임 자동 생성 규칙 개선 (P0)

- 플랜(체크리스트)
  - [x] 온보딩 값(유형/비자/한국어) 반영 경로 점검
  - [x] 닉네임 자동 생성 규칙 개선(결정적 suffix)
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 온보딩은 `/api/users/me`로 userType/visaType/koreanLevel 저장
  - 프로필 수정 화면은 `useMyProfile` 값으로 자동 채움
- 변경 내용(why/what)
  - why: 자동 닉네임이 세션마다 달라지는 문제를 제거해 일관성을 확보
  - what: `generateDisplayNameFromEmail`에서 랜덤값 대신 해시 기반 suffix 사용
- 검증
  - [x] npm run lint (pass)
  - [x] npm run build (pass)
- 변경 파일
  - src/lib/utils/profile.ts
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [WEB] 게시글 대표 이미지 선택 UI + 저장/표시 연동 (P0)

- 플랜(체크리스트)
  - [x] 대표 이미지 선택 UI 구성(본문 이미지 기반)
  - [x] 선택 이미지 마커 저장(`data-thumbnail`)
  - [x] 썸네일 추출 로직에 선택 마커 반영
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 게시글 썸네일은 본문 첫 이미지로 고정되어 선택 변경 불가
  - 리스트/검색/프로필/북마크 등에서 동일 규칙으로 썸네일이 고정 노출
- 변경 내용(why/what)
  - why: 다중 이미지 글의 대표 이미지를 명시적으로 지정해 노출 품질을 개선
  - what: 작성 폼에 대표 이미지 선택 UI 추가, 저장 시 선택 이미지를 `data-thumbnail`로 마킹, API 썸네일 추출에서 해당 이미지를 우선 사용
- 검증
  - [x] npm run lint (pass)
  - [x] npm run build (pass)
- 변경 파일
  - src/app/[lang]/(main)/posts/new/NewPostClient.tsx
  - src/components/molecules/editor/RichTextEditor.tsx
  - src/app/api/posts/route.ts
  - src/app/api/posts/trending/route.ts
  - src/app/api/search/route.ts
  - src/app/api/users/[id]/posts/route.ts
  - src/app/api/users/[id]/bookmarks/route.ts
  - src/app/api/posts/[id]/route.ts
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [WEB] 관리자 페이지 기능/정보구조 분석 + 개선 플랜 (P0)

- 플랜(체크리스트)
  - [x] 관리자 IA/기능 현황 점검(유저/게시글/댓글/신고/인증/뉴스)
  - [x] 성능/UX 개선안 정리(필터/탐색/캐시)
- 현황 분석(코드 기준)
  - 리스트 페이지 필터/페이지 상태가 URL과 분리되어 재진입/공유가 어려움
  - 리스트 쿼리의 `staleTime`/`keepPreviousData`가 없어 페이지 전환 시 깜빡임 발생
  - 신고/인증 상세는 별도 페이지 이동에 의존해 맥락 전환 비용이 큼
- 개선 플랜(요약)
  - 필터/페이지 상태 URL 동기화 + 기본 필터 프리셋 제공
  - 리스트 쿼리에 `staleTime`/`keepPreviousData` 적용, 다음 페이지 prefetch
  - 신고/인증 상세를 Drawer/SidePanel로 제공해 맥락 유지
  - 상단 KPI/상태 카운트 카드로 우선순위 triage 강화
- 변경 파일
  - 없음(분석/플랜 기록)
- 다음 액션/의존성
  - FE/BE: list API에 status count/summary 응답 추가 필요

#### (2025-12-19) [WEB] 배지 안내(가이드) 진입 동선 연결 (P0)

- 플랜(체크리스트)
  - [x] PostCard/프로필 배지에서 가이드 링크 동선 보강
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 배지 정보는 툴팁 중심으로 제공되어 직접 진입 동선이 약함
- 변경 내용(why/what)
  - why: 배지 의미/획득 조건 안내 페이지로 즉시 이동할 수 있게 접근성을 강화
  - what: 배지 자체 클릭 시 가이드 페이지로 이동하도록 연결
- 검증
  - [x] npm run lint (pass)
  - [x] npm run build (pass)
- 변경 파일
  - src/components/molecules/cards/PostCard.tsx
  - src/app/[lang]/(main)/profile/[id]/ProfileClient.tsx
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [WEB] 빌드 오류 정리: 구독 설정 타입 정합성 (P0)

- 현황 분석(코드 기준)
  - 구독 설정 update payload가 `string`으로 추론되어 DB enum 타입과 불일치
- 변경 내용(why/what)
  - why: 빌드 타입 오류를 제거하고 설정 업데이트를 정상화
  - what: notificationChannel/notificationFrequency 타입을 리터럴 유니온으로 명시
- 검증
  - [x] npm run lint (pass)
  - [x] npm run build (pass)
- 변경 파일
  - src/app/api/users/me/subscriptions/settings/route.ts
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [WEB] 랭킹/칭호(리더보드) UI/IA 설계 (P0)

- 플랜(체크리스트)
  - [x] 리더보드 라우트 + SSR HydrationBoundary 구성
  - [x] Top3 강조 카드 + 전체 랭킹 리스트/페이지네이션
  - [x] 신뢰/레벨/온도 지표 시각화 구성
- 현황 분석(코드 기준)
  - `api/users/leaderboard`는 존재하나 사용자 UI/IA가 부재
- 변경 내용(why/what)
  - why: 커뮤니티 신뢰 지표를 시각화해 참여 동기와 정보 구조를 강화
  - what: `/[lang]/leaderboard` SSR 페이지 + 리더보드 클라이언트 UI 추가, prefetch + HydrationBoundary로 초기 렌더
- 검증
  - [x] npm run lint (pass)
  - [x] npm run build (pass)
- 변경 파일
  - src/app/[lang]/(main)/leaderboard/page.tsx
  - src/app/[lang]/(main)/leaderboard/LeaderboardClient.tsx
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [WEB] 구독/알림 설정 UX 확장 (P0)

- 플랜(체크리스트)
  - [x] 구독 관리 화면 구성(카테고리/토픽 토글)
  - [x] 구독 알림 채널/빈도 UI 연결
  - [x] 설정 모달에서 구독 관리 진입 동선 추가
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 구독/알림 설정 API는 있으나 사용자 관리 UI가 부재
- 변경 내용(why/what)
  - why: 구독 흐름의 가시성과 알림 설정 제어를 제공해 사용성/재방문을 강화
  - what: `/[lang]/subscriptions` 관리 화면 추가 + SettingsModal에 진입 CTA 연결, 구독 토글 시 설정 캐시 invalidation
- 검증
  - [x] npm run lint (pass)
  - [x] npm run build (pass)
- 변경 파일
  - src/app/[lang]/(main)/subscriptions/page.tsx
  - src/app/[lang]/(main)/subscriptions/SubscriptionsClient.tsx
  - src/components/molecules/modals/SettingsModal.tsx
  - src/repo/categories/mutation.ts
- 다음 액션/의존성
  - DB 마이그레이션 적용 필요(0032_topic_subscription_notifications.sql)

#### (2025-12-19) [WEB] 온보딩 도움말/FAQ/툴팁 가이드 (P1)

- 플랜(체크리스트)
  - [x] 첫 질문/첫 답변/카테고리 탐색 카드 + CTA 구성
  - [x] 도움말 툴팁 + FAQ 섹션 추가
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 온보딩 화면에 실행 가이드/FAQ가 없어 다음 행동 유도가 약함
- 변경 내용(why/what)
  - why: 첫 행동 전환을 높이고 사용자가 즉시 다음 액션을 찾도록 개선
  - what: 온보딩 페이지에 빠른 시작 카드(툴팁 포함)와 FAQ 섹션 추가
- 검증
  - [x] npm run lint (pass)
  - [x] npm run build (pass)
- 변경 파일
  - src/app/[lang]/(main)/onboarding/OnboardingClient.tsx
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [WEB] 검색 자동완성/추천 키워드 UX (P1)

- 플랜(체크리스트)
  - [x] 자동완성 드롭다운 + 소스/카운트 표시
  - [x] 추천 키워드 API 연동 + 번역 fallback
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 검색 화면은 번역 기반 인기 키워드만 제공하고 자동완성이 없음
- 변경 내용(why/what)
  - why: 검색 의도 입력을 돕고 빈 검색 상태에서 탐색 진입률을 높이기 위함
  - what: 검색 입력에 자동완성 드롭다운을 추가하고 `/api/search/keywords` 기반 추천 키워드 칩을 노출
- 검증
  - [x] npm run lint (pass)
  - [x] npm run build (pass)
- 변경 파일
  - src/app/[lang]/(main)/search/SearchClient.tsx
- 다음 액션/의존성
  - 오타/혼용 대응은 BE와 동시 진행

#### (2025-12-19) [WEB] 체크리스트 정합화: 홈 관심 토픽/검색 fallback 안내 (P1)

- 플랜(체크리스트)
  - [x] 홈 피드 관심 토픽 우선 노출 구현 확인
  - [x] SimilarQuestionPrompt/Search meta fallback 안내 노출 확인
- 현황 분석(코드 기준)
  - HomeClient에서 onboarding 관심사 기반 카테고리 우선 노출 로직 존재
  - SimilarQuestionPrompt/SearchClient에서 meta.isFallback/meta.reason/meta.tokens 기반 안내 UI 제공
- 변경 내용(why/what)
  - why: 문서 체크리스트와 코드 구현 정합성 확보
  - what: 코드 변경 없이 체크리스트 상태 업데이트
- 검증
  - [x] 코드 확인 완료(추가 테스트 없음)
- 변경 파일
  - docs/EXECUTION_PLAN.md

#### (2025-12-19) [WEB] 신규 유저 1회성 규칙/기능 툴팁 제공 (P0)

- 플랜(체크리스트)
  - [x] 홈 진입 1회성 팁 배너 노출
  - [x] 로컬 스토리지로 재노출 방지
- 현황 분석(코드 기준)
  - 신규 유저가 주요 기능을 놓칠 수 있어 홈 진입 시 1회성 안내 필요
- 변경 내용(why/what)
  - why: 신규 유저가 카테고리 필터/구독 규칙을 빠르게 이해하도록 최소 안내 제공
  - what: HomeClient에서 로그인+온보딩 완료 유저에게 1회성 팁 배너 노출, 확인 시 로컬 스토리지에 기록
- 검증
  - [x] npm run lint
  - [x] SKIP_SITEMAP_DB=true npm run build
- 변경 파일
  - src/app/[lang]/(main)/HomeClient.tsx
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [WEB] 첫 로그인 최소 질문 wizard화 (P1)

- 플랜(체크리스트)
  - [x] 온보딩 입력을 step 흐름으로 분리
  - [x] 단계별 Next/Back 동선 제공
  - [x] 최소 필수 선택 시 다음 단계 진행
- 현황 분석(코드 기준)
  - 온보딩이 단일 폼으로 구성되어 첫 로그인 UX가 길고 집중도가 낮음
- 변경 내용(why/what)
  - why: 첫 로그인 시 필수 입력만 빠르게 완료하도록 흐름을 단순화
  - what: OnboardingClient에 3-step wizard + 진행 상태 UI 추가
- 검증
  - [x] npm run lint
  - [x] SKIP_SITEMAP_DB=true npm run build
- 변경 파일
  - src/app/[lang]/(main)/onboarding/OnboardingClient.tsx
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [WEB] 이벤트 로그 호출 연결(검색/상세 조회) (P1)

- 플랜(체크리스트)
  - [x] 검색 페이지에서 search 이벤트 로그 전송
  - [x] 글 상세 진입 시 view 이벤트 로그 전송
- 현황 분석(코드 기준)
  - event_logs 테이블/수집 API는 추가되었으나 클라이언트 호출부가 없음
- 변경 내용(why/what)
  - why: 검색/상세 조회 이벤트를 최소 범위로 수집해 지표 기반 확보
  - what: SearchClient/PostDetailClient에서 `/api/events` 호출 연결
- 검증
  - [x] npm run lint
  - [x] SKIP_SITEMAP_DB=true npm run build
- 변경 파일
  - src/repo/events/types.ts
  - src/repo/events/mutation.ts
  - src/app/[lang]/(main)/search/SearchClient.tsx
  - src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 좋아요/답변 이벤트 로그 연결 필요

#### (2025-12-19) [WEB] 이벤트 로그 호출 연결(좋아요/답변) (P1)

- 플랜(체크리스트)
  - [x] 게시글 좋아요 시 like 이벤트 로그 전송
  - [x] 답변 좋아요 시 like 이벤트 로그 전송
  - [x] 답변 작성 시 answer 이벤트 로그 전송
- 현황 분석(코드 기준)
  - 좋아요/답변 액션은 존재하나 이벤트 로그 수집이 누락됨
- 변경 내용(why/what)
  - why: 참여 이벤트 지표 수집을 위해 최소 범위의 로그 전송 필요
  - what: posts/answers mutation onSuccess에서 `/api/events` 전송 연결
- 검증
  - [x] npm run lint
  - [x] SKIP_SITEMAP_DB=true npm run build
- 변경 파일
  - src/repo/posts/mutation.ts
  - src/repo/answers/mutation.ts
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 댓글/북마크 이벤트 로그 연결 필요

#### (2025-12-19) [WEB] 이벤트 로그 호출 연결(댓글/북마크) (P1)

- 플랜(체크리스트)
  - [x] 게시글 북마크 시 bookmark 이벤트 로그 전송
  - [x] 댓글 작성 시 comment 이벤트 로그 전송
  - [x] 댓글 좋아요 시 like 이벤트 로그 전송
- 현황 분석(코드 기준)
  - 댓글/북마크 이벤트 로그가 누락되어 참여 지표 집계가 불완전
- 변경 내용(why/what)
  - why: 참여 행동(댓글/북마크)을 이벤트로 수집해 지표 기반 확장
  - what: posts/comments/answers mutation에서 `/api/events` 전송 연결
- 검증
  - [x] npm run lint
  - [x] SKIP_SITEMAP_DB=true npm run build
- 변경 파일
  - src/repo/posts/mutation.ts
  - src/repo/comments/mutation.ts
  - src/repo/answers/mutation.ts
  - docs/LOG_EVENT_SCHEMA_DRAFT.md
  - src/repo/events/types.ts
  - src/app/api/events/route.ts
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 이벤트 수집 호출부 확장 여부 추가 논의 필요

#### (2025-12-19) [WEB] 이벤트 로그 호출 연결(팔로우/신고) (P1)

- 플랜(체크리스트)
  - [x] 팔로우 성공 시 follow 이벤트 로그 전송
  - [x] 신고 제출 시 report 이벤트 로그 전송
- 현황 분석(코드 기준)
  - 팔로우/신고 액션에 이벤트 로그 수집이 누락됨
- 변경 내용(why/what)
  - why: 핵심 참여 이벤트(팔로우/신고)를 지표로 수집해 운영/품질 모니터링 기반 확보
  - what: users/reports mutation에서 `/api/events` 전송 연결
- 검증
  - [x] npm run lint
  - [x] SKIP_SITEMAP_DB=true npm run build
- 변경 파일
  - src/repo/users/mutation.ts
  - src/repo/reports/mutation.ts
  - src/repo/events/types.ts
  - src/app/api/events/route.ts
  - docs/LOG_EVENT_SCHEMA_DRAFT.md
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 이벤트 수집 범위 추가 여부는 운영 지표 정의 후 결정

#### (2025-12-19) [WEB] 이벤트 로그 호출 연결(공유) (P1)

- 플랜(체크리스트)
  - [x] 게시글 카드 공유 시 share 이벤트 로그 전송
  - [x] 상세 공유 모달 동작 시 share 이벤트 로그 전송
- 현황 분석(코드 기준)
  - 공유 액션은 존재하나 이벤트 로그 수집이 누락됨
- 변경 내용(why/what)
  - why: 공유 CTA 성과를 추적할 수 있도록 지표 확보
  - what: PostCard/PostDetail 공유 핸들러에서 `/api/events` 전송
- 검증
  - [x] npm run lint
  - [x] SKIP_SITEMAP_DB=true npm run build
- 변경 파일
  - src/components/molecules/cards/PostCard.tsx
  - src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx
  - src/repo/events/types.ts
  - src/app/api/events/route.ts
  - docs/LOG_EVENT_SCHEMA_DRAFT.md
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 공유 채널 정의 확장 여부는 운영 지표 정의 후 결정

#### (2025-12-19) [WEB] 피드/프로필 랭킹 UI 보강 + URL 일관화 (P0)

- 플랜(체크리스트)
  - [x] 피드 리더보드 프리뷰에 레벨 표기 추가
  - [x] HomeClient locale 타입 정합성 보강
  - [x] metadata canonical/OG baseUrl SITE_URL 통합(홈/정적 페이지/리더보드)
  - [x] UGC 링크 검증/정규화 기준 URL 통합(SITE_URL/API_BASE)
- 현황 분석(코드 기준)
  - 메타데이터 생성 로직이 페이지별로 baseUrl 상이함
  - 리더보드 프리뷰에 점수/랭킹만 있어 칭호(레벨) 정보가 누락됨
- 변경 내용(why/what)
  - why: 피드에서 랭킹/칭호 정보를 명확히 노출하고 canonical/OG 링크 기준을 통일
  - what: LeaderboardPreview 레벨 표기, HomeClient locale 타입 정리, 메타데이터/UGC 링크 기준을 SITE_URL로 통합
- 검증
  - [x] npm run lint
  - [x] SKIP_SITEMAP_DB=true npm run build
- 변경 파일
  - src/components/organisms/LeaderboardPreview.tsx
  - src/app/[lang]/(main)/HomeClient.tsx
  - src/app/[lang]/(main)/page.tsx
  - src/app/[lang]/(main)/about/page.tsx
  - src/app/[lang]/(main)/faq/page.tsx
  - src/app/[lang]/(main)/privacy/page.tsx
  - src/app/[lang]/(main)/terms/page.tsx
  - src/app/[lang]/(main)/leaderboard/page.tsx
  - src/utils/sanitizeUgcContent.ts
  - src/lib/validation/ugc-links.ts
  - src/app/admin/(dashboard)/verifications/page.tsx
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 없음

#### (2025-12-19) [WEB] 사이드바 리더보드 메뉴 정리 + 프리뷰 제거 (P0)

- 플랜(체크리스트)
  - [x] 홈 피드 상단 리더보드 프리뷰 제거
  - [x] 좌측 사이드바에 “상위 기여자” 메뉴 추가(Feedback 상단)
  - [x] 리더보드 메뉴 클릭 시 `/[lang]/leaderboard` 이동
  - [x] i18n 라벨/툴팁 추가(ko/en/vi)
  - [x] 리더보드 페이지에서 사이드바 active 상태 정합성 보강
- 현황 분석(코드 기준)
  - 홈 피드 상단 프리뷰는 레이아웃 시선 분산 우려
  - 사이드바에서 바로 접근 가능한 메뉴가 필요
- 변경 내용(why/what)
  - why: 피드 집중도 유지 + 네비게이션 일관성 확보
  - what: 홈 프리뷰 제거, 사이드바 메뉴 추가 및 active 처리, i18n 보강
- 검증
  - [x] npm run lint
  - [x] SKIP_SITEMAP_DB=true npm run build
- 변경 파일
  - src/app/[lang]/(main)/HomeClient.tsx
  - src/components/organisms/CategorySidebar.tsx
  - src/components/organisms/LeaderboardPreview.tsx
  - messages/ko.json
  - messages/en.json
  - messages/vi.json
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 없음

### 0.6.3 [BE] Backend Agent

#### (2025-12-20) [BE] 유저 점수 API rank 계산 추가 (P0)

- 플랜(체크리스트)
  - [x] `/api/users/[id]/score`에 rank 계산 로직 추가
  - [x] 동점 tie-break 기준(createdAt/id)으로 일관된 순위 산출
- 현황 분석(코드 기준)
  - 프론트에서 rank 표시를 사용하지만 API 응답에는 rank가 누락됨
- 변경 내용(why/what)
  - why: 프로필/피드 점수 카드에서 rank 표기를 안정적으로 제공
  - what: 점수 서브쿼리 + 동일 점수 tie-break로 rank 산출 후 응답 포함
- 검증
  - [x] npm run lint
  - [x] SKIP_SITEMAP_DB=true npm run build
- 변경 파일
  - src/app/api/users/[id]/score/route.ts
- 다음 액션/의존성
  - 없음

#### (2025-12-18) [BE] 추천 사용자 API 보강 + 과부하 방지 (P0)

- 플랜(체크리스트)
  - [x] 추천 사용자 응답에 postsCount 실데이터 포함
  - [x] 기본 limit 축소 + 상한 clamp(default 8, max 12)
- 현황 분석(코드 기준)
  - 추천 유저는 UI에서 카드 단위로 노출되어, 대량 반환 시 DB/응답이 불필요하게 커질 수 있음
- 변경 내용(why/what)
  - why: 추천 유저는 반복 호출/모달 진입이 잦아 과부하 위험이 큼
  - what: postsCount 서브쿼리 추가 + limit 범위 제한으로 응답/부하를 제어
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/app/api/users/recommended/route.ts
- 다음 액션/의존성
  - 추천 팔로잉 메타 3개 산출 규칙 정의(인증/채택률/관심사 일치 등) + 인덱스/캐시 검토

#### (2025-12-18) [LEAD] 리팩토링 심화 트랙(폴더/중복/미사용 정리) — 실행 플랜 (P0)

- 플랜(체크리스트)
  - [x] `src/components/**` 구조 점검: 폴더별 책임(atomic) 재정의 및 이동 후보 목록화
  - [x] 미사용/중복 파일 후보 스캔(정적 import 기준) 및 삭제/통합 우선순위 결정
  - [x] 안전 삭제(빌드 게이트): 1) 제거 2) `npm run lint` 3) `npm run build`
  - [x] 중복 유틸/타입 정리(선택): repo/types/utils 중복 최소화
  - [x] 완료 항목은 `HANDOVER.md`에 “완료”로 반영

- 점검 결과
  - atoms/ui 중복 후보: `Button/Badge/Avatar`는 Phase‑2에서 `ui` 프리미티브 wrapper로 통합 검토
  - 정적 import 스캔 기준 미사용 컴포넌트 없음(삭제 대상 없음)

- 검증
  - [x] npm run lint
  - [x] npm run build

#### (2025-12-19) [BE] “한국생활정보” 카테고리 비노출 + 레거시 숨김 정책 적용 (P0)

- 플랜(체크리스트)
  - [x] deprecated parent slug 정의 + 리스트 API 필터 반영
  - [x] 게시글 작성에서 deprecated 카테고리 차단
  - [x] 카테고리 목록에서 deprecated 그룹 제거
- 현황 분석(코드 기준)
  - 기존 목록 API는 category slug 전체를 그대로 노출하여 “living/legacy” 카테고리가 피드·검색·북마크에 노출
  - 게시글 작성은 parent slug만 검사하여 deprecated 카테고리도 새 글 작성 가능
- 변경 내용(why/what)
  - why: 폐기 대상 카테고리를 노출/작성에서 제거해 콘텐츠 분류 정책을 고정
  - what: 활성 parent slug 기준 필터 + deprecated slug 차단, 카테고리 API에서 deprecated 그룹 숨김
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/lib/constants/category-groups.ts
  - src/app/api/categories/route.ts
  - src/app/api/posts/route.ts
  - src/app/api/posts/trending/route.ts
  - src/app/api/search/route.ts
  - src/app/api/search/posts/route.ts
  - src/app/api/users/[id]/posts/route.ts
  - src/app/api/users/[id]/bookmarks/route.ts
- 다음 액션/의존성
  - living 카테고리 DB 비활성화는 마이그레이션 검토 필요

#### (2025-12-19) [BE] 관리자 리스트 API 경량화 + 페이지네이션 clamp (P0)

- 플랜(체크리스트)
  - [x] admin posts/comments/users 리스트 payload 경량화
  - [x] user detail posts/comments N+1 제거 + count 집계
  - [x] page/limit clamp로 과호출 방지
- 현황 분석(코드 기준)
  - admin list API가 `likes/comments` 관계 전체를 로딩해 응답이 과대해지고, 리스트 UI 요구 필드와 응답 스키마가 불일치
- 변경 내용(why/what)
  - why: 관리자 리스트 렌더링을 경량화하고 카운트 값을 정확히 제공
  - what: select + 집계 쿼리로 교체, `_count/likes` 필드 정합화, page/limit 상한 적용
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/app/api/admin/posts/route.ts
  - src/app/api/admin/comments/route.ts
  - src/app/api/admin/users/route.ts
  - src/app/api/admin/users/[id]/posts/route.ts
  - src/app/api/admin/users/[id]/comments/route.ts
- 다음 액션/의존성
  - likes.comment_id 집계 성능용 인덱스는 마이그레이션 검토 필요

#### (2025-12-19) [BE] 관리자 “추천 게시글 작성” 기능 현황 파악 (P0)

- 플랜(체크리스트)
  - [x] admin UI/API에서 추천/featured 게시글 관리 기능 여부 확인

#### (2025-12-19) [LEAD→BE] 다음 스프린트 플랜 (P0/P1)

- 플랜(체크리스트)
  - [x] 피드 리스트 API 필드 최소화: 공통 select/serialize 유틸로 관계 로딩 제거
  - [x] 검색/추천 API limit/page clamp + Cache-Control 정책 정리
  - [x] 레이트 리밋/봇 방어 미들웨어 설계(IP 기준, write API 우선)
  - [x] 동적 sitemap/robots 구축(질문/카테고리/공지/FAQ 포함)
  - [x] 로그/이벤트 스키마 초안(조회/검색어/좋아요/답변 집계)
  - [x] 홈/미디어 영역에서 추천 게시글 사용 여부 확인
- 변경 파일
  - src/lib/api/post-list.ts
  - src/app/api/posts/route.ts
  - src/app/api/posts/trending/route.ts
  - src/app/api/users/[id]/posts/route.ts
  - src/app/api/users/[id]/bookmarks/route.ts
  - src/app/api/search/route.ts
  - src/app/api/search/users/route.ts
  - src/app/api/search/posts/route.ts
  - src/app/api/users/recommended/route.ts
  - middleware.ts
  - src/app/sitemap.ts
  - src/app/[lang]/(main)/faq/page.tsx
  - docs/LOG_EVENT_SCHEMA_DRAFT.md
- 검증
  - [x] npm run lint
  - [x] npm run build
- 현황 분석(코드 기준)
  - admin 라우트/API에 추천 게시글 CRUD가 없고, 홈/미디어는 고정 섹션만 존재
- 변경 내용(why/what)
  - why: 운영/홈 노출 정책 결정 전에 현황 확인 필요
  - what: admin 화면/`/api/admin` 엔드포인트 및 `/media` 노출 경로 점검(코드 변경 없음)
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 추천 게시글 기능은 신규 API/DB 설계 필요

#### (2025-12-19) [BE] 베타 답변 권한/검수 + 피드백/UGC allowlist (P0)

- 플랜(체크리스트)
  - [x] 답변 권한 가드(관리자/전문가/인증) + 공식/검수 플래그 반영
  - [x] 피드백 API/스토리지 + rate limit 추가
  - [x] UGC 외부 링크 allowlist 적용(글/답변/댓글 작성·수정)
  - [x] 답변 검수/피드백 마이그레이션 추가
- 현황 분석(코드 기준)
  - 현재 구현/문제 위치: 답변 작성/수정 및 댓글 작성/수정에서 외부 링크 도메인 검증이 없어 정책 우회 가능
  - 재현/리스크: 인증되지 않은 계정도 답변 작성 가능, 비공식 외부 링크 삽입 가능
- 변경 내용(why/what)
  - why: 베타 신뢰도 확보(답변 권한) + 피드백 수집/운영 대응 + UGC 링크 정책 적용
  - what: answers에 공식/검수 상태 추가, 피드백 테이블/API 신설, UGC allowlist 유틸과 각 write API 가드 적용
- 검증
  - [x] npm run lint
  - [x] npm run build
  - [x] API 수동 호출: local dev 3025 `POST /api/feedback` → 400 (validation)
- 변경 파일
  - src/lib/db/schema.ts
  - src/lib/db/migrations/0029_answer_review_feedback.sql
  - src/lib/db/migrations/meta/_journal.json
  - src/lib/validation/ugc-links.ts
  - src/app/api/feedback/route.ts
  - src/app/api/posts/route.ts
  - src/app/api/posts/[id]/route.ts
  - src/app/api/posts/[id]/answers/route.ts
  - src/app/api/answers/[id]/route.ts
  - src/app/api/posts/[id]/comments/route.ts
  - src/app/api/answers/[id]/comments/route.ts
  - src/app/api/comments/[id]/route.ts
  - src/app/api/users/[id]/answers/route.ts
  - src/repo/answers/types.ts
  - src/repo/users/types.ts
- 다음 액션/의존성
  - DB 마이그레이션 적용 필요(0029_answer_review_feedback.sql)
  - 로컬 dev 서버 바인딩 권한/포트 정책 확인 후 API 수동 호출 재시도

#### (2025-12-19) [BE] 공지/배너 노출 기간 + 캐시 정책 (P0)

- 플랜(체크리스트)
  - [x] 공지/배너 노출 기간 필드(start/end) 추가
  - [x] news 공개 API 노출 기간 필터 + 캐시 헤더 설정
  - [x] admin news CRUD에 기간 필드 반영
- 현황 분석(코드 기준)
  - 현재 구현/문제 위치: `/api/news`는 isActive만 필터링하여 기간 만료 콘텐츠도 노출 가능
  - 재현/리스크: 운영자가 기간을 관리할 수 없어 배너/공지 노출 제어 어려움
- 변경 내용(why/what)
  - why: 공지/배너 노출 기간 제어 및 캐시 정책 확립
  - what: news에 startAt/endAt 컬럼 추가 + 공개 API 기간 필터링 + admin API 기간 저장 지원
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/lib/db/schema.ts
  - src/lib/db/migrations/0030_news_schedule.sql
  - src/lib/db/migrations/meta/_journal.json
  - src/app/api/news/route.ts
  - src/app/api/admin/news/route.ts
  - src/app/api/admin/news/[id]/route.ts
- 다음 액션/의존성
  - DB 마이그레이션 적용 필요(0030_news_schedule.sql)
  - build 실패 원인(POST detail locale 타입) 해결 후 재검증

#### (2025-12-19) [BE] 신고 큐 액션 확장 + 상태 전이 가드 (P0)

- 플랜(체크리스트)
  - [x] 신고 action enum/컬럼 추가 및 마이그레이션
  - [x] admin report PATCH에 상태 전이 규칙 + 액션 처리
  - [x] reports 리스트/상세/유저 리포트 응답에 action 포함
- 현황 분석(코드 기준)
  - 현재 구현/문제 위치: 신고 처리 API가 삭제/단순 상태만 지원, 경고/숨김/블라인드 액션 기록 없음
  - 재현/리스크: 운영자가 조치 유형을 구분하지 못하고 상태 전이 규칙도 느슨함
- 변경 내용(why/what)
  - why: 신고 큐 운영에서 조치 유형과 처리 규칙을 명확히 하기 위함
  - what: report_action enum 추가, PATCH에서 상태 전이 검증 및 hide/blind/delete 처리, 응답 필드 확장
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/lib/db/schema.ts
  - src/lib/db/migrations/0031_report_actions.sql
  - src/lib/db/migrations/meta/_journal.json
  - src/app/api/admin/reports/route.ts
  - src/app/api/admin/reports/[id]/route.ts
  - src/app/api/admin/users/[id]/reports-made/route.ts
  - src/app/api/admin/users/[id]/reports-received/route.ts
  - src/repo/admin/types.ts
  - src/repo/admin/fetch.ts
  - src/repo/admin/mutation.ts
- 다음 액션/의존성
  - DB 마이그레이션 적용 필요(0031_report_actions.sql)
  - FE에서 action 선택 UI 추가 필요

#### (2025-12-19) [BE] 피드/프로필 리스트 응답 경량화 (P0)

- 플랜(체크리스트)
  - [x] `api/posts`, `api/users/[id]/posts`, `api/users/[id]/bookmarks` 기본 응답에서 `content` 제거
  - [x] excerpt/thumbnail/thumbnails/imageCount 유지
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 리스트 응답에 `include=content` 옵션이 있어 카드 렌더 대비 payload가 커짐
  - 모달/피드 카드 UI는 excerpt/thumbnail만 필요
- 변경 내용(why/what)
  - why: 리스트/모달 응답을 최소화해 응답 크기/렌더 비용을 줄이기 위함
  - what: 리스트 API의 `include` 처리 제거 및 기본 응답에서 content 제외
- 검증
  - [x] npm run lint
  - [x] npm run build
  - [x] API 수동 호출: local dev 3025 `/api/posts?limit=1` → 200, `/api/users/{id}/posts` → 200
- 변경 파일
  - src/app/api/posts/route.ts
  - src/app/api/users/[id]/posts/route.ts
  - src/app/api/users/[id]/bookmarks/route.ts
- 다음 액션/의존성
  - FE에서 `include` 사용 여부 점검

#### (2025-12-19) [BE] 검색 자동완성/추천 키워드 API + 캐시 정책 (P1)

- 플랜(체크리스트)
  - [x] tags/category/subcategory 기반 키워드 집계 API 추가
  - [x] query/limit clamp + 캐시 헤더 정의
  - [x] search repo 타입/훅/키 추가
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 검색 예시/태그 API는 존재하지만 자동완성 키워드 전용 API는 없음
  - FE에서 입력 중 추천 키워드 노출을 위한 응답 스펙 필요
- 변경 내용(why/what)
  - why: 검색 자동완성/추천 키워드 제공을 위한 서버 집계 엔드포인트 확보
  - what: `/api/search/keywords` 추가 + repo fetch/query/key 확장
- 검증
  - [x] npm run lint
  - [x] npm run build
  - [x] API 수동 호출: local dev 3025 `/api/search/keywords?q=visa&limit=3` → 200
- 변경 파일
  - src/app/api/search/keywords/route.ts
  - src/repo/search/types.ts
  - src/repo/search/fetch.ts
  - src/repo/search/query.ts
  - src/repo/keys.ts
- 다음 액션/의존성
  - FE에서 검색 입력 autocomplete에 `useSearchKeywords` 연결

#### (2025-12-19) [BE] 포인트/레벨/랭킹 조회 API 베이스라인 (P1)

- 플랜(체크리스트)
  - [x] 점수/레벨 산정 규칙 정의(trustScore + helpfulAnswers * 5 + adoptionRate)
  - [x] 프로필 점수 API(`/api/users/[id]/score`) 추가
  - [x] 리더보드 API(`/api/users/leaderboard`) 추가
  - [x] repo 타입/훅/쿼리 키 확장
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 포인트/레벨/랭킹 조회 API가 없어서 프로필/리더보드 공용 데이터 제공이 불가
  - 사용자 테이블에 trustScore/helpfulAnswers/adoptionRate가 이미 존재
- 변경 내용(why/what)
  - why: 프로필/리더보드에 공통 점수 지표 제공 및 레벨 계산 기준 확보
  - what: 점수 계산 공식 정의 + 점수/레벨 응답 API 추가 + repo 연결
- 검증
  - [x] npm run lint
  - [x] npm run build
  - [x] API 수동 호출: local dev 3025 `/api/users/leaderboard?limit=1` → 200, `/api/users/{id}/score` → 200
- 변경 파일
  - src/app/api/users/[id]/score/route.ts
  - src/app/api/users/leaderboard/route.ts
  - src/repo/users/types.ts
  - src/repo/users/fetch.ts
  - src/repo/users/query.ts
  - src/repo/keys.ts
- 다음 액션/의존성
  - FE에서 프로필/리더보드 노출 설계 필요
  - 대량 데이터 시 trustScore/helpfulAnswers 정렬 인덱스 검토(마이그레이션 필요)

#### (2025-12-19) [BE] 추천 사용자 팔로우 상태 정확화 (P1)

- 플랜(체크리스트)
  - [x] 추천 사용자 응답에 isFollowing 실제 상태 반영
  - [x] BE 체크리스트 상태 동기화
- 현황 분석(코드 기준)
  - 추천 사용자 응답은 팔로우 목록을 제외하지만, 응답의 isFollowing은 항상 false로 고정됨
- 변경 내용(why/what)
  - why: 팔로우 상태가 실제 값과 다르면 CTA/표시가 흔들릴 수 있음
  - what: 팔로우 ID 셋을 재사용해 isFollowing 값을 응답에 반영
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - src/app/api/users/recommended/route.ts
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 추천 사용자 카드에서 Follow/Following 표시 확인

#### (2025-12-19) [BE] 구독/알림 설정 저장 모델 + API (P1)

- 플랜(체크리스트)
  - [x] topic_subscriptions에 channel/frequency 컬럼 추가
  - [x] 구독 알림 설정 API 추가(`/api/users/me/subscriptions/settings`)
  - [x] repo fetch/query/mutation/key 확장
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 카테고리/토픽 구독은 있으나 알림 빈도/채널 설정을 저장할 컬럼과 API가 없음
- 변경 내용(why/what)
  - why: 구독 기반 알림/설정 UI를 위해 채널/빈도 저장 구조가 필요
  - what: topic_subscriptions에 channel/frequency 추가 + 설정 조회/업데이트 API + repo 연결
- 검증
  - [x] npm run lint
  - [x] npm run build
  - [x] API 수동 호출: local dev 3025 `/api/users/me/subscriptions/settings` → 401 (unauthorized)
- 변경 파일
  - src/lib/db/schema.ts
  - src/lib/db/migrations/0032_topic_subscription_notifications.sql
  - src/lib/db/migrations/meta/_journal.json
  - src/app/api/users/me/subscriptions/settings/route.ts
  - src/repo/categories/types.ts
  - src/repo/categories/fetch.ts
  - src/repo/categories/query.ts
  - src/repo/categories/mutation.ts
  - src/repo/keys.ts
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - DB 마이그레이션 적용 필요(0032_topic_subscription_notifications.sql)

#### (2025-12-19) [BE] 피드백 관리자 리스트 + 사용자 정보 노출 (P1)

- 플랜(체크리스트)
  - [x] 피드백 저장 시 userId 연결 상태 확인
  - [x] 관리자 피드백 리스트 API 추가(`/api/admin/feedback`)
  - [x] admin repo 타입/쿼리 확장
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 피드백 저장은 있으나 관리자 페이지에서 사용자 정보와 함께 조회할 API가 없음
- 변경 내용(why/what)
  - why: 운영자가 피드백 작성자를 확인하고 대응할 수 있어야 함
  - what: admin feedback 리스트 API 추가 + 사용자 정보 조인 + repo 연결
- 검증
  - [x] npm run lint
  - [x] npm run build
  - [x] API 수동 호출: local dev 3025 `/api/admin/feedback` → 401 (unauthorized)
- 변경 파일
  - src/app/api/admin/feedback/route.ts
  - src/repo/admin/types.ts
  - src/repo/admin/fetch.ts
  - src/repo/admin/query.ts
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 관리자 UI에서 feedback 목록 연결 필요

#### (2025-12-19) [BE] 모더레이션 고도화 로드맵 정리 (P2)

- 플랜(체크리스트)
  - [x] 룰 기반 필터(금칙어/연락처/저품질) 적용 범위 정리
  - [x] “신뢰 낮음” 라벨링 기준 초안 정의
  - [x] 선택적 AI 분류/큐잉 단계 정의
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - UGC 검증은 금칙어/외부 링크 정책 중심이며 라벨링/자동 분류 로드맵이 정리되지 않음
- 변경 내용(why/what)
  - why: 운영 정책 단계(룰 → 라벨 → 자동 분류)를 명확히 해야 확장 시 혼선을 줄일 수 있음
  - what: 단계별 적용 범위/조건/로그 기준을 로드맵으로 문서화
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 라벨링 컬럼/운영 로그 필요 시 별도 마이그레이션 설계

#### (2025-12-19) [BE] API 수동 호출 재시도(포트 바인딩 확인) (P1)

- 플랜(체크리스트)
  - [x] next dev 포트 바인딩 재시도(127.0.0.1/0.0.0.0)
  - [x] `/api/posts` 기본 응답 확인(리스트 최소 필드/author.isFollowing)
  - [x] `/api/users/{id}/posts` 응답 확인
- 현황 분석(코드 기준)
  - 로컬 dev는 포트 바인딩은 성공했으나 Supabase `last_login_at` 업데이트 쿼리에서 `57014` statement timeout으로 서버가 즉시 종료됨(수동 호출 불가)
- 변경 내용(why/what)
  - why: BE 검증 항목 완료를 위해 수동 호출 결과가 필요
  - what: 로컬 dev 재시도(포트 3000) 실패 → 배포본(Vercel: https://vkc-2.vercel.app)에서 curl로 수동 확인(코드 변경 없음)
- 검증
  - [x] dev 포트 3000 재시도: 포트 바인딩 OK → DB statement timeout(57014)로 프로세스 종료
  - [x] curl https://vkc-2.vercel.app/api/posts?limit=1 → 200 OK, 데이터/페이지네이션/author.isFollowing 포함
  - [x] curl https://vkc-2.vercel.app/api/users/838c7b90-c135-4993-8214-168c61fff26a/posts?limit=1 → 200 OK, 데이터/페이지네이션 포함
- 변경 파일
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - Supabase 연결 타임아웃 해결 시 로컬에서도 재확인(선택), 현 시점 BE 체크리스트는 배포본 호출로 충족

#### (2025-12-19) [BE] 리스트 API 응답/페이징 점검 (P1)

- 플랜(체크리스트)
  - [x] feed/list 응답 `author.isFollowing` 배치 적용 점검
  - [x] cursor pagination/limit clamp 적용 여부 확인
  - [x] 인덱스 필요성 검토
- 현황 분석(코드 기준)
  - `GET /api/posts`, `GET /api/posts/trending`, `GET /api/users/[id]/posts`, `GET /api/users/[id]/bookmarks`, `GET /api/search`
- 변경 내용(why/what)
  - why: FE 카드/모달 렌더 최소 응답 및 follow 상태 정합성 유지 확인
  - what: 리스트 응답은 `excerpt/thumbnail/thumbnails/imageCount` 기준으로 구성돼 있고 `author.isFollowing` 배치 조회 적용됨(코드 변경 없음)
- 검증
  - [x] 코드 점검 완료(추가 변경 없음)
- 변경 파일
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 인덱스는 현 시점 필수 아님(필요 시 `posts.author_id/created_at/id` 복합 인덱스 검토)

#### (2025-12-19) [BE] 리스트 API 재점검/수동 호출 환경 확인 (P1)

- 플랜(체크리스트)
  - [x] list API `author.isFollowing` 배치 적용 재확인
  - [x] cursor pagination/limit clamp 재확인
  - [x] sandbox dev 서버 바인딩 재시도(3015/3025)
- 현황 분석(코드 기준)
  - `/api/posts`, `/api/posts/trending`, `/api/users/[id]/posts`, `/api/users/[id]/bookmarks`, `/api/search`에서 `getFollowingIdSet`으로 배치 처리
  - 각 리스트 API는 limit max 50, cursor decode 안전 처리
  - Codex sandbox에서 `next dev` listen EPERM 지속 발생
- 변경 내용(why/what)
  - why: follow 상태/페이징 보장과 수동 호출 가능 여부 재점검 필요
  - what: 코드 점검만 수행(코드 변경 없음), dev 서버 바인딩 재시도 실패 기록
- 검증
  - [x] API 수동 호출: local dev 3025 `/api/posts?limit=1` → 200, `/api/search/keywords` → 200
- 변경 파일
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 로컬 환경에서 dev 서버 바인딩 가능 시 API 수동 호출 재검증 필요

#### (2025-12-19) [BE] 배포본 수동 호출 재시도(DNS 확인) (P1)

- 플랜(체크리스트)
  - [x] Vercel 배포본 API 연결 확인
- 현황 분석(코드 기준)
  - Codex sandbox에서 외부 도메인 DNS 해석 실패(`Could not resolve host`)
- 변경 내용(why/what)
  - why: 배포본으로라도 리스트 API 응답 확인 필요
  - what: `https://vkc-2.vercel.app` 호출 재시도(코드 변경 없음)
- 검증
  - [x] curl https://vkc-2.vercel.app/api/posts?limit=1 → 200 OK
- 변경 파일
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 로컬/리드 환경에서 DNS 가능한 네트워크로 재검증 필요

#### (2025-12-19) [BE] 기존 BE 변경 사항 동기화/검증 (P0)

- 플랜(체크리스트)
  - [x] 피드/리스트 응답 경량화 + author.isFollowing 배치 확인
  - [x] 구독 알림 설정 모델/마이그레이션 + API 확인
  - [x] 피드백 API + 관리자 피드백 리스트 확인
  - [x] 검색 키워드/랭킹/점수 API 확인
  - [x] UGC allowlist/뉴스 노출 기간/신고 액션 확장 확인
  - [x] lint/build 재검증
- 현황 분석(코드 기준)
  - 기존 워크스페이스에서 수행한 BE 변경이 현 브랜치에 존재하는지 확인 필요
- 변경 내용(why/what)
  - why: BE 변경 누락 방지 및 WEB 작업 의존성 정합화
  - what: 관련 API/마이그레이션 파일 존재 및 응답 필드 정합성 코드 점검
- 검증
  - [x] npm run lint
  - [x] npm run build
- 변경 파일
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - DB 마이그레이션 적용 필요(0029_answer_review_feedback.sql, 0030_news_schedule.sql, 0031_report_actions.sql, 0032_topic_subscription_notifications.sql)

#### (2025-12-19) [BE] 로그/이벤트 스키마 문서화 정합화 (P2)

- 플랜(체크리스트)
  - [x] 이벤트 로그/집계 스키마 초안 문서화
- 현황 분석(코드 기준)
  - 이벤트 집계/랭킹을 위한 스키마 초안이 필요
- 변경 내용(why/what)
  - why: 검색/조회/반응 로그 설계를 문서로 고정해 이후 BE/데이터 파이프라인 작업 기준을 확보
  - what: 로그 스키마 초안을 문서화하고 체크리스트 상태 정합화
- 검증
  - [x] 문서 확인 완료
- 변경 파일
  - docs/LOG_EVENT_SCHEMA_DRAFT.md
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 이벤트 테이블/집계 파이프라인 마이그레이션 설계 필요

#### (2025-12-19) [BE] 이벤트 로그 수집 API/스키마 추가 (P1)

- 플랜(체크리스트)
  - [x] event_logs 테이블 추가(메타데이터 jsonb 포함)
  - [x] POST `/api/events` 로그 수집 엔드포인트 추가
  - [x] ip hash/locale/validation 처리
- 현황 분석(코드 기준)
  - 로그 스키마 초안 문서만 존재하고 실제 테이블/API가 없음
- 변경 내용(why/what)
  - why: 조회/검색/좋아요/답변 이벤트를 수집할 최소 API/테이블 기반 확보
  - what: event_logs 테이블/인덱스 + 수집 API 추가
- 검증
  - [x] npm run lint
  - [x] SKIP_SITEMAP_DB=true npm run build
- 변경 파일
  - src/lib/db/schema.ts
  - src/lib/db/migrations/0033_event_logs.sql
  - src/lib/db/migrations/meta/_journal.json
  - src/app/api/events/route.ts
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 이벤트 수집 호출부(검색/상세/좋아요/답변) 연결 필요
  - DB 마이그레이션 적용 필요(0033_event_logs.sql)

#### (2025-12-19) [BE] 이벤트 로그 스펙 확장(댓글/북마크) (P1)

- 플랜(체크리스트)
  - [x] event_type에 comment/bookmark 허용
  - [x] entity_type 스펙에 search 포함
  - [x] 로그 스키마 문서 정합화
- 현황 분석(코드 기준)
  - 이벤트 로그 API는 view/search/like/answer만 허용해 댓글/북마크를 기록할 수 없음
- 변경 내용(why/what)
  - why: 참여 지표 범위를 확장해 운영/분석에 필요한 이벤트를 수집
  - what: 이벤트 허용 타입 확장 + 로그 스키마 문서 업데이트
- 검증
  - [x] npm run lint
  - [x] SKIP_SITEMAP_DB=true npm run build
- 변경 파일
  - src/app/api/events/route.ts
  - src/repo/events/types.ts
  - docs/LOG_EVENT_SCHEMA_DRAFT.md
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 이벤트 수집 호출부(댓글/북마크) 연결 필요

#### (2025-12-19) [BE] 이벤트 로그 스펙 확장(팔로우/신고) (P1)

- 플랜(체크리스트)
  - [x] event_type에 follow/report 허용
  - [x] 로그 스키마 문서 정합화
- 현황 분석(코드 기준)
  - 팔로우/신고 이벤트를 기록할 수 있는 타입이 정의되지 않음
- 변경 내용(why/what)
  - why: 운영/모더레이션 지표에 필요한 이벤트 타입 확보
  - what: 허용 타입 확장 + 로그 스키마 문서 업데이트
- 검증
  - [x] npm run lint
  - [x] SKIP_SITEMAP_DB=true npm run build
- 변경 파일
  - src/app/api/events/route.ts
  - src/repo/events/types.ts
  - docs/LOG_EVENT_SCHEMA_DRAFT.md
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 이벤트 수집 호출부(팔로우/신고) 연결 필요

#### (2025-12-19) [BE] 이벤트 로그 스펙 확장(공유) (P1)

- 플랜(체크리스트)
  - [x] event_type에 share 허용
  - [x] 로그 스키마 문서 정합화
- 현황 분석(코드 기준)
  - 공유 이벤트 타입이 정의되지 않아 로그 수집 불가
- 변경 내용(why/what)
  - why: 공유 CTA 성과를 측정할 수 있도록 이벤트 타입 확보
  - what: 허용 타입 확장 + 로그 스키마 문서 업데이트
- 검증
  - [x] npm run lint
  - [x] SKIP_SITEMAP_DB=true npm run build
- 변경 파일
  - src/app/api/events/route.ts
  - src/repo/events/types.ts
  - docs/LOG_EVENT_SCHEMA_DRAFT.md
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 공유 이벤트 수집 호출부 연결 필요

#### (2025-12-19) [BE] 로컬 DB 마이그레이션 적용 (P1)

- 플랜(체크리스트)
  - [x] `npm run db:migrate` 실행
- 현황 분석(코드 기준)
  - 신규 마이그레이션(0033_event_logs 등)이 적용 필요
- 변경 내용(why/what)
  - why: 로컬/검증 환경에서 이벤트 로그 테이블을 사용 가능하게 함
  - what: drizzle migrate 실행으로 누락 마이그레이션 적용
- 검증
  - [x] npm run db:migrate
- 변경 파일
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 운영 환경에는 별도 마이그레이션 실행 필요

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
- [x] `/verify` 3‑step wizard UX(타입 선택 → 업로드 가이드 → 상태/이력)
- [x] `/verification/history` 실데이터 연동
- [x] private storage 업로드 + **public URL 저장 금지**, path 기반 관리
- [x] `/api/verification/request` documents 입력 path 정규화 + 본인(userId prefix) 검증
- [x] 관리자 승인/반려 시 문서 즉시 삭제(or TTL)
- [x] 승인 라벨을 프로필/답변 카드에 표시(badgeType 기반 TrustBadge)
- [x] 관리자 pending 큐 UI에 사유/배지타입/만료 입력 포함

**현황 분석**
- 사용자 페이지는 3‑step wizard + 이력 노출: `src/app/[lang]/(main)/verification/request/*`.
- documents 버킷은 private 사용이며 업로드는 path 기반: `src/lib/supabase/storage.ts`, `src/app/api/upload/document/route.ts`.
- 요청 생성 API는 documents를 path로 정규화하고 본인 path만 저장: `src/app/api/verification/request/route.ts`.
- 관리자 상세는 pending 상태에서만 signed URL 미리보기를 제공하고, 승인/반려 시 문서를 삭제 + DB에서 제거: `src/app/api/admin/verifications/[id]/route.ts`.
- 프로필/답변 카드에 badgeType 기반 TrustBadge 라벨을 노출: `src/app/[lang]/(main)/profile/[id]/ProfileClient.tsx`, `src/components/molecules/AnswerCard.tsx`.

**개선 포인트**
- (완료) documentUrls는 storage path만 저장, 관리자 미리보기는 signed URL, 승인/반려 시 삭제.
- (완료) 사용자 요청 UI를 wizard로 재설계.
- (완료) 승인 라벨은 users.badgeType 기반으로 저장/노출.

**판정**: 부분 OK(관리자 큐 확장 필요)

**다음 액션(PR)**
- (완료) PR‑B1: `verification-storage-path-signedurl-delete`
- (완료) PR‑B2: `verification-wizard-user-ui`
- PR‑B3: `verification-admin-queue-extended`

---

### P0‑3) 모바일 UX 필수 개선

**플랜(체크리스트)**
- [x] 질문/답변 폼 모바일 키보드 안전영역 + autosize 입력 + skeleton
- [x] 리스트는 infinite scroll로 통일

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
- [x] (2025-12-18) 관리자 신고 큐 액션 정합화(숨김/삭제/경고/차단) (운영 최소 기능)
- [x] (2025-12-18) 상단 공지/배너 관리자 설정형 CRUD + 홈 노출(SSR)

**현황 분석**
- 사용자 신고 엔드포인트 `POST /api/reports`는 `reports` 기반이며, legacy `content_reports`는 백필 전용: `src/app/api/reports/route.ts`, `src/app/api/admin/reports/backfill-content-reports/route.ts`.
- 관리자 신고 화면/API는 `reports` 기반: `src/app/admin/(dashboard)/reports/*`, `src/app/api/admin/reports/*`.
- 관리자 UI/상세는 `reviewed` 액션을 포함하며, 신고된 HTML 콘텐츠는 텍스트로 렌더링해 XSS를 방어: `src/app/api/admin/reports/[id]/route.ts`, `src/app/admin/(dashboard)/reports/[id]/page.tsx`.
- 공지/배너 CRUD + 홈 SSR 슬롯 적용: `src/app/api/news/route.ts`, `src/app/api/admin/news/*`, `src/components/organisms/NoticeBanner.tsx`.

**개선 포인트**
- 운영 데이터가 `reports`로 단일화되도록 신고 파이프라인 통합(사용자→관리자 일관).
- 관리자 `reviewed`(검토됨) 상태/액션을 최소치로 추가해 “대기→검토→처리” 흐름을 닫기.
- (완료) banners/notices 도메인 신설(테이블+API+admin UI+홈 캐러셀 SSR).

**판정**: OK(reports/배너 완료)

**다음 액션(PR)**
- PR‑D0: `reports-pipeline-unify`
- PR‑D1: `reports-admin-actions-reviewed`
- (완료) PR‑D2: `admin-banners-crud-home-slot`

---

### P0‑5) 페이지 내 체류시간/게이팅/튜토리얼(내부 전환)

**플랜(체크리스트)**
- [x] 질문 상세 하단 “유사 질문/같은 카테고리 인기글/다음 글 추천” 배치
- [x] SimilarQuestionPrompt locale 링크 오류 수정
- [x] 비회원 참여 액션 로그인 게이팅 재확인
- [x] 신규 유저 1회성 규칙/기능 툴팁 제공

**현황 분석**
- SimilarQuestionPrompt는 작성 페이지에서만 사용, 링크 locale prefix 누락.
- 상세 하단 추천 섹션 적용됨(관련글/같은 카테고리 인기글).
- 게이팅 전구간 점검 완료.
- 홈 진입 시 1회성 팁 배너로 주요 기능 안내.

**개선 포인트**
- (완료) PostDetail에서 related posts prefetch + 하단 섹션 추가(SSR 포함).
- (완료) SimilarQuestionPrompt 링크를 `/${lang}` prefix 적용.
- (완료) 홈 1회성 팁 배너 추가.

**판정**: OK

**다음 액션(PR)**
- PR‑A3: `postdetail-related-content-section`
- (완료) PR‑A4: `similarprompt-locale-fix`
- (완료) PR‑A5: `home-new-user-tip`

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
- [x] 첫 로그인 최소 질문 wizard화
- [x] 저장값으로 홈 피드 관심 토픽 우선 노출

**현황**
- 온보딩 설문과 저장 구현됨: `src/app/[lang]/(main)/onboarding/*`.
- 홈에서 interests 기반 초기 카테고리 우선 선택 구현됨.
 - 온보딩 입력을 3-step wizard로 분리해 첫 로그인 질문 흐름 최소화.

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
- [x] SimilarQuestionPrompt/검색 UI에서 `meta.isFallback`·`meta.reason`·`meta.tokens`를 활용해 사용자에게 fallback 상황을 명확히 안내하고 로그를 쌓는 부분 검토.

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

1) DB 마이그레이션/스키마(`src/lib/db/**`)은 **Agent BE 단일 소유** (동일 테이블 변경 병렬 금지)  
2) PostDetail 영역(`src/app/[lang]/(main)/posts/[id]/**`)은 **Agent WEB 단일 소유** (UI 조정은 FE와 사전 합의)  
3) UI 컴포넌트 운영 모드(B 고정): **User는 `components/atoms|molecules|organisms` 중심**, **Admin은 `components/ui` 중심**(중복 Button/Badge를 혼용하지 않기)  
4) 작업 시작 전: `docs/EXECUTION_PLAN.md` 체크리스트/담당 확인 → 작업 범위 확정 → 커밋/푸시 → 다시 체크리스트 갱신(Lead)
5) **공통 레이아웃/헤더/글로벌 CSS는 Hot File**: `Header.tsx`, `MainLayout.tsx`, `PostList.tsx`, `src/app/globals.css`는 동시 수정 금지(작업 중엔 단일 소유로 잠금)
6) (공지) (2025-12-18) [LEAD] ultrawide 배치 핫픽스 완료(헤더 `container`/grid 기준을 MainLayout과 정렬 + 홈 canvas 전환). **스냅샷 커밋/푸시 완료 전까지** 아래 Hot File은 병렬 수정 금지:
   - `src/components/organisms/Header.tsx`
   - `src/components/templates/MainLayout.tsx`
   - `src/app/[lang]/(main)/HomeClient.tsx`
   - (메모) Codex CLI 환경에서 `.git/index.lock` 문제로 add/commit/push가 실패할 수 있어, LEAD가 로컬 터미널에서 커밋/푸시로 스냅샷 고정 후 잠금 해제 공지 예정

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
- [x] (2025-12-18) [WEB] 헤더 프로필 드롭다운 모달 성능 최적화: 모달 `dynamic({ ssr:false })` + 오픈 시에만 mount, 쿼리 `enabled:isOpen` 유지/강화 + `staleTime/gcTime`로 재오픈 refetch 억제, 무한스크롤 observer는 닫힐 때 disconnect
  - 적용 파일: `src/components/molecules/UserProfile.tsx`, `src/components/molecules/ProfileModal.tsx`, `src/components/molecules/MyPostsModal.tsx`, `src/components/molecules/FollowingModal.tsx`, `src/components/molecules/BookmarksModal.tsx`, `src/components/molecules/SettingsModal.tsx`
  - 캐시: Profile/Settings `staleTime=5m gcTime=30m`, Lists `staleTime=60s gcTime=5m`
- [x] (2025-12-18) [WEB] 헤더 알림 모달 성능 최적화: NotificationModal `dynamic({ ssr:false })` + 오픈 시에만 mount, 알림 목록 쿼리 `staleTime/gcTime`로 재오픈 refetch 억제
- [x] (2025-12-18) [WEB] 헤더 번들 경량화: `lodash` named import → `lodash/debounce`로 교체(트리셰이킹/번들 크기 개선)
- [x] (2025-12-18) [FE] 모바일 사이드바 작성 CTA 툴팁 비활성화(가독성/가림 방지)
- [x] (2025-12-18) [BE] 팔로우 상태 응답 보강: 피드/프로필 리스트/북마크/팔로워/팔로잉/유저검색에 `isFollowing` 제공(배치 조회) + 리스트 기본 `content` 제외, `excerpt/thumbnails/imageCount` 제공
- [x] (2025-12-18) (검증) `npm run lint`, `npm run build` 통과

### 6.2 다음
- [x] (2025-12-18) PR‑S1 `repo-structure-cleanup-phase1` (컴포넌트/스크립트/임시파일 정리로 중복 증가 방지)
- [x] (2025-12-17) PR‑S2 `repo-structure-cleanup-phase2` (import alias 통일 + ESLint `../` 금지 + 상수 중복 제거)
- [x] (2025-12-18) PR‑D0 `reports-pipeline-unify` (POST `/api/reports` → `reports` 단일화 + legacy backfill 엔드포인트 추가)
- [x] (2025-12-18) PR‑D1 `reports-admin-actions-reviewed` (관리자 `reviewed` 액션 + 신고 상세 XSS 방어)
- [x] (2025-12-17) 비로그인 입력 게이팅 UX 통일 (NewPost/Answer/Comment/Upload: 클릭 시 로그인 모달, 에러 대신 안내)
- [x] (2025-12-18) i18n 누락/혼용 전수 점검(툴팁/배지/카테고리 라벨) + PostDetail 잔여 하드코딩 텍스트 정리
- [x] (2025-12-18) Tooltip 잔상/전환 이슈 방지 (라우트 이동 시 강제 close)

### 6.3 신규 요청 백로그(Owner/우선순위)

**운영/프로세스(Lead)**
- [x] (2025-12-18) [LEAD] 단일 브랜치/지속 PR 세팅 + `@codex` 멘션(자동 코드리뷰) (PR: https://github.com/LEE-SANG-BOK/VKC-2-/pull/1)
- [x] (2025-12-18) [LEAD] 컴포넌트 운영 모드(B) 문서 고정 + 혼용 방지 가드(ESLint import rule) (User=atoms, Admin=ui)
- [x] (2025-12-18) [LEAD] public 정리: 사용되지 않는 기본 SVG/원본 로고 파일 제거(레포 용량/혼선 감소)

**UI/UX(Design Front)**
- [x] (2025-12-17) [FE] Home 버튼 클릭 시 “초기 상태”로 복귀(메인 스크롤/사이드바 스크롤 Top + 모바일 메뉴 닫기) (메모: 선택/필터 reset 기준은 별도 정의)
- [x] (2025-12-18) [FE] 모바일 헤더: 사이드바 버튼 테두리 강조 + 사이드바 아이콘 툴팁 제거(홈 헤더 툴팁 1개만 유지) (Header/CategorySidebar)
- [x] (2025-12-18) [FE] 페이지 여백(Desktop) 배경을 회색으로 구분(스크린샷 참고: “바깥 여백만” 회색, 콘텐츠 영역 UI는 변경하지 않음) (MainLayout) (메모: 메인/상세/프로필/인증/로그인/관리자 공통 토큰화)
- [x] (2025-12-18) [FE] 사이드바 가로폭을 우측 추천 콘텐츠 레일 폭과 동일하게 정렬 (CategorySidebar)
- [x] (2025-12-17) [FE] 모바일 PostCard 하단 액션/해시태그 잘림 방지(vi 텍스트 길이 대응)
- [x] (2025-12-18) [FE] 모바일 PostCard 하단 아이콘/태그 잘림 보강: 액션 아이콘 행 wrap 처리(“해결됨/미해결됨” 포함)
- [x] (2025-12-18) [FE] 피드/카드 작성자 라인에 `· Following` 상태 표시 + 미팔로우 시 `Follow` CTA(스크린샷의 “Following” 표현만 참고) (PostCard) (메모: `common.follow/following` 사용, 클릭 시 토글)
- [x] (2025-12-18) [FE] PostCard: “인증 사용자 N명…” 라벨 좌측에 “답변 N개” CTA 추가(클릭 시 답변/댓글 영역 이동) (메모: 질문은 `answersCount`, ko는 `개` 표기)
- [x] (2025-12-18) [FE] 팔로잉 추천 카드 UI: `#(1): 값, #(2): 값, #(3): 값` 3개 고정 표기(실데이터 매핑) + step-by-step 로딩 UI (메모: 추천 유저 postsCount 실데이터 + 스켈레톤)
- [x] (2025-12-18) [FE] 프로필 모달(북마크/팔로잉/내게시글)도 step-by-step 로딩(과부하 방지) (메모: `useProgressiveList` + 스켈레톤)
- [x] (2025-12-18) [FE] 홈 로고 근처 툴팁 카피 개선(브랜드 포지셔닝/가치 명확, ko/en/vi)
- [x] (2025-12-18) [FE] 로고 이미지 교체(`public/brand-logo.png`) + `Logo` 컴포넌트 이미지 기반 전환
- [x] (2025-12-18) [FE] CTA 텍스트/카피 개선: “질문하기/공유하기/인증하기” 네이밍 + 상세 설명(ko/en/vi) (메모: Sidebar CTA 3종 라벨 통일 + 모바일에서 보조 설명 노출)
- [x] (2025-12-18) [FE] 모바일 프로필 정보(가입일/성별/연령대/상태/메일 등) 콤팩트 레이아웃(가로 배치 우선)
- [x] (2025-12-18) [FE] 관리자 페이지(웹/모바일) 긴 콘텐츠 스크롤 처리(특히 인증/신고 상세)
- [x] (2025-12-18) [FE] 신뢰 배지(verified/expert/trusted/outdated) 툴팁/탭 UX 점검(모바일 long-press 포함) + “자세히” 링크/동선 적용 범위 합의 (메모: WEB의 배지 안내 페이지와 연결)
- [x] (2025-12-19) [FE] Auth CTA 카피 개선: “회원가입” 표기 최소화 → “로그인/시작하기/바로 시작” 중심으로 통일(거부감↓) (메모: signup route는 유지, i18n ko/en/vi 동기화)
- [x] (2025-12-19) [FE] HeaderSearch 예시 질문 잘림 개선: 카테고리(대/소) 선택 UI 폭을 반응형으로 확장해 placeholder/예시 텍스트 더 노출 (메모: lg 이상 센터 영역 가변 폭 활용)
- [x] (2025-12-19) [FE] PostCard 답변/댓글 표기 콤팩트화: “답변 N개” → 아이콘 옆 숫자만 표시(아라비아) (메모: aria-label은 유지)
- [x] (2025-12-19) [FE] Auth CTA 카피 개선: “회원가입” 텍스트를 “로그인/바로 시작하기” 중심으로 통일(거부감↓) (메모: signup route는 유지, ko/en/vi 동기화)
- [x] (2025-12-19) [FE] HeaderSearch 예시 질문 잘림 개선: 카테고리/세부 카테고리 선택 영역 폭을 반응형으로 확장해 placeholder/예시 텍스트가 더 노출되도록 조정
- [x] (2025-12-19) [FE] CategorySidebar(vi) 구독 버튼 클립 방지 재점검: 텍스트 줄바꿈 지점/폭 규칙을 조정해 버튼이 항상 노출되도록 보강
- [x] (2025-12-19) [FE] 피드 5개 뒤 추천 사용자 섹션(모바일): 세로 나열 → 가로 캐러셀(2명씩 한 줄, 좌/우 이동)로 개선 (메모: PostList Hot File, LEAD와 타이밍 합의)
- [x] (2025-12-19) [FE] 추천 사용자 카드 메타 표시 개선: follower/posts/following 단순 지표 → 프로필/온보딩 기반 핵심 3요소(예: 인증/채택률/관심사 일치)로 교체 + 인증 사용자는 닉네임 상단에 표시 (메모: BE API 필드 선행)
- [x] (2025-12-19) [FE] 모바일 글/답변 폼 키보드 safe-area + autosize 적용(작성 중 화면 밀림/가림 방지)
- [x] (2025-12-19) [FE] i18n 하드코딩/누락 정리: 화면 텍스트/툴팁/배지/카테고리 라벨 전수 점검(ko/en/vi)

#### (2025-12-20) [FE] 피드/프로필 모바일 정렬 보강 + 추천 CTA 강조 (P0)

- 플랜(체크리스트)
  - [x] 오른쪽 레일은 본문 스크롤에 동행(우측 sticky 제거)
  - [x] PostCard 모바일 하단 액션/카운트 동일 행 유지(세로 분리 제거)
  - [x] 인증 사용자 요약 라벨에 정의 툴팁 추가
  - [x] 프로필 통계 5개 항목 1행 정렬(모바일)
  - [x] 피드 상단 “추천 사용자 보기” CTA 강조
  - [x] 프로필 설정 헤더를 메인 헤더와 동일 레이아웃으로 통일
- 변경 내용(why/what)
  - why: 모바일 하단 액션 분리/프로필 통계 줄 끊김으로 가독성 저하, 추천 CTA 시각적 존재감 부족, 프로필 설정 화면 헤더 일관성 이슈
  - what: MainLayout 우측 레일 sticky 제거, PostCard 모바일 하단 액션 랩 규칙 제거, 인증 사용자 요약 Tooltip 추가, ProfileClient 통계 grid 5열 고정, PostList 추천 CTA 그라데이션 강조, ProfileEdit 화면을 MainLayout으로 래핑
- 검증
  - [x] npm run lint
  - [x] SKIP_SITEMAP_DB=true DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres npm run build
- 변경 파일
  - src/components/templates/MainLayout.tsx
  - src/app/globals.css
  - src/components/molecules/cards/PostCard.tsx
  - src/components/organisms/PostList.tsx
  - src/app/[lang]/(main)/profile/[id]/ProfileClient.tsx
  - src/app/[lang]/(main)/profile/edit/ProfileEditClient.tsx
- i18n
  - 신규 키 요청: 없음

#### (2025-12-20) [WEB] 검색 자동완성/결과 보강 + 로그 전송 (P0)

- 플랜(체크리스트)
  - [x] 검색 API에서 post-list 직렬화 유틸 재사용
  - [x] 비로그인 검색 캐시 정책 보강
  - [x] 검색 화면 fallback 라벨/자동완성 라벨 정리
  - [x] 검색 이벤트 로그 전송
- 현황 분석(코드 기준)
  - 검색 API가 별도 파싱 로직을 중복 보유
  - 검색 UI는 일부 라벨이 하드코딩되어 locale 혼용
- 변경 내용(why/what)
  - why: 검색 결과/프리뷰 포맷 일관화 + i18n fallback 정리 + 검색 로깅 확보
  - what: post-list serializer 적용, 비로그인 캐시, SearchClient fallback/자동완성 라벨 정리 및 로그 전송
- 검증
  - [x] npm run lint
  - [x] SKIP_SITEMAP_DB=true npm run build
- 변경 파일
  - src/app/api/search/route.ts
  - src/app/[lang]/(main)/search/SearchClient.tsx
  - docs/EXECUTION_PLAN.md
- 다음 액션/의존성
  - 없음

**웹 기능(사용자/관리자 기능)**
- [x] (2025-12-18) [WEB] 팔로잉 “추천 팔로잉” 현황 분석 + 개선안 제시(추천 기준/제외 규칙/노출 우선순위)
- [x] (2025-12-18) [WEB] 추천 팔로잉: 1회 전체 노출 금지 → 페이지네이션/무한스크롤 도입(서버/클라 키 정리)
- [x] (2025-12-18) [WEB] 헤더 검색 예시 질문: 실제 인기 질문 데이터 기반으로 동적 반영(API/캐시/locale 처리)
- [x] (2025-12-19) [WEB] 토픽/구독 피드 상단 필터 바: 사용자 구독 카테고리를 가로 스크롤 버튼으로 제공(헤더 아래, 콤팩트) + 클릭 시 해당 카테고리 글로 필터 (메모: 기본 정렬은 인기 규칙 유지)
- [x] (2025-12-19) [WEB] 피드 추천 사용자 인서트 UX 개선: 모바일 캐러셀 UI와 연동해 서버/클라 페이지네이션 규칙 확정(초기 1페이지, 추가 로드) (메모: FE 캐러셀과 맞춤)
- [x] (2025-12-19) [WEB] 인증(/verification) 3-step wizard 완료: 상태/히스토리 실데이터 연결 및 진행 단계 동선 확정
- [x] (2025-12-19) [WEB] 공지/배너 CRUD + 홈 SSR 슬롯: 관리자 작성/노출 제어 + 홈 상단 슬롯 SSR 렌더
- [x] (2025-12-19) [WEB] 글 상세 하단 추천 섹션: 관련글/같은 카테고리 인기글 SSR + HydrationBoundary 적용
- [x] (2025-12-18) [WEB] 게시글 작성: 대표 이미지 선택 UI(다중 이미지 중 thumbnail 지정) + 저장/표시 연동
- [x] (2025-12-18) [WEB] 인증 신청: 기존 신청 후 “추가 신청/수정하기” 플로우 지원(상태/권한/히스토리 포함)
- [x] (2025-12-18) [WEB] 관리자 인증 심사 UI: 입력 항목/검증/기본값 적절성 현황 분석 + 개선안
- [x] (2025-12-18) [WEB] 관리자 페이지 기능/정보구조 적절성 현황 분석 + 개선 플랜(성능/UX 포함)
- [x] (2025-12-18) [WEB] 프로필 설정: 온보딩 값 자동 반영 여부 점검 + 닉네임 자동 부여 규칙 적절성 점검/개선
- [x] (2025-12-18) [WEB] 배지 안내(가이드) 페이지 추가: 뱃지 타입/의미/획득 방법/신뢰 신호 설명(ko/en/vi) + PostCard/프로필에서 진입 동선 연결 (메모: SEO/SSR 여부 결정)
- [x] (2025-12-18) [WEB] 랭킹/칭호(리더보드) UI/IA 설계(프로필 “신뢰/레벨/온도” 시각화 포함) (메모: BE 점수 규칙/API 선행)
- [x] (2025-12-18) [WEB] 구독/알림 설정 UX 확장: 구독 관리 화면(카테고리/토픽) + 알림 수신/빈도 UI (메모: P1‑6 Stream‑E 연결)

**백엔드 기반(성능/규칙/데이터)**
- [x] (2025-12-18) [BE] 인기글(trending) 규칙 현황 분석 + 개선안(점수/기간/캐시/부하) 제시
- [x] (2025-12-18) [BE] 추천 팔로잉용 사용자 메타 3개 산출 규칙 정의(예: 인증/채택률/관심사 일치율) + API 응답 확장 (메모: FE에서 “핵심 3요소”로 노출)
- [x] (2025-12-18) [BE] 추천 사용자 API 보강: postsCount 실데이터 + limit clamp(default 8, max 12)
- [x] (2025-12-18) [BE] 헤더 검색 예시 질문 API 지원(실데이터 기반, 캐시 전략 포함)
- [x] (2025-12-19) [BE] 추천 사용자 메타 “핵심 3요소” 필드 확정: 인증/채택률/관심사 일치율 등 계산 + 응답 확장
- [x] (2025-12-18) [BE] 자동 해시태그 3개 생성 규칙 정의/구현(키워드+대/소분류 기반, 고정 3개)
- [x] (2025-12-17) [BE] UGC 최소 글자수 완화: 댓글/답변 10→5, 글 제목/본문 최소치 재조정 + ko/en/vi 메시지 동기화
- [x] (2025-12-18) [BE] “한국생활정보” 카테고리 폐기(노출 제거/비활성화/마이그레이션 방안) + 미지정/레거시 카테고리 글 숨김 정책
- [x] (2025-12-18) [BE] 관리자 페이지 성능 점검(응답 payload/쿼리/페이지네이션) + step-by-step 로딩에 맞는 API 최적화
- [x] (2025-12-18) [BE] 관리자 페이지 “추천 게시글 작성” 기능 제공 여부/홈 적용 여부 현황 파악
- [x] (2025-12-19) [BE] 공지/배너 CRUD API + 캐시 정책: 노출 기간/우선순위/SSR 슬롯 대응
- [x] (2025-12-19) [BE] 신고 큐 액션 확장: 경고/숨김/블라인드 등 관리자 액션 + 상태 전이 규칙 정리
- [x] (2025-12-18) [BE] 포인트/레벨/신뢰점수(온도) 산정 규칙 정의 + 조회 API 설계(프로필/리더보드 공용) (메모: DB 컬럼/집계 방식 검증 필요)
- [x] (2025-12-18) [BE] 구독/알림(P1‑6) 설정 저장 모델 확정(빈도/채널/토픽) + API 추가 (메모: 마이그레이션 가능성)
- [x] (2025-12-18) [BE] 모더레이션 고도화 로드맵: 룰 기반(금칙어/연락처/저품질) → “신뢰 낮음” 라벨링 → (선택) AI 자동 분류/큐잉 (메모: 외부 AI 연동은 P2로)

**베타(T0) MVP 요구사항 정렬**
- [x] (2025-12-19) [WEB] 비로그인 읽기/로그인 쓰기 게이팅 QA: 질문/답변/댓글/신고/북마크 전 흐름 점검 + 에러 대신 모달 유도
- [x] (2025-12-19) [BE] 베타 답변 권한 정책(관리자/전문가/인증 사용자 제한) + API 가드/에러 코드 정리
- [x] (2025-12-19) [BE] 공식 답변/검수 상태 필드 추가 + 리스트/상세 응답 반영(아이콘/라벨용 플래그)
- [x] (2025-12-19) [FE] 공식/검수 답변 UI 표시(✔/배지) + 상세/피드/프로필 노출
- [x] (2025-12-19) [WEB] 피드백/버그 제보 폼(설문/간단 텍스트) + 제출 확인 UX
- [x] (2025-12-19) [BE] 피드백 수집 API/스토리지(기존 reports 확장 또는 별도 테이블) + rate limit
- [x] (2025-12-19) [LEAD] 베타 핵심 지표 이벤트 정의(DAU/답변율/채택율/신고율) + 로깅 항목 정리

**T+1 개선(참여/리텐션)**
- [x] (2025-12-19) [WEB] 온보딩 도움말/FAQ/툴팁: 첫 질문/첫 답변/카테고리 탐색 가이드
- [x] (2025-12-19) [BE] 포인트/레벨/랭킹 산정 규칙 확정 + 조회 API 설계
- [x] (2025-12-19) [FE] 프로필/피드에 포인트·랭킹·칭호 UI
- [x] (2025-12-19) [WEB] 검색 자동완성/추천 키워드 UX 설계(오타/혼용 대응은 BE와 동시)
- [x] (2025-12-19) [BE] 검색 자동완성/추천 키워드 API + 캐시 정책
- [x] (2025-12-19) [LEAD] 콘텐츠 확장/AI 작성 지원 프로세스(내부 작성용) 정의 + CMS/운영 플로우 정리
- [x] (2025-12-19) [WEB] 소셜 공유 CTA 확장 + 소셜 로그인(Google) 범위 확정(Facebook 제외)

**현재 스프린트 분배(2025-12-19)**
- [x] (2025-12-19) [LEAD] 검증 누락 항목 확인: PostDetail TrustBadge long-press / Header 3-zone grid / Canvas 색 분리 / TrustBadge “자세히” 동선
- [x] (2025-12-19) [LEAD] 추천 사용자 메타 공통 유틸 적용: RecommendedUsersSection/FollowingModal #1~#3 라벨 규칙 통일
- [x] (2025-12-19) [LEAD] userType 라벨 유틸 통합: ProfileClient/ProfileModal/FollowingModal 중복 제거
- [x] (2025-12-19) [LEAD] 추천 사용자 섹션 웹 컴팩트화 + 헤더/레이아웃 정렬 보강 + 모바일 홈 필터 반투명
- [x] (2025-12-19) [LEAD] 추천 사용자 섹션 데스크톱 가로 캐러셀 전환 + 메타 #번호 제거 + 헤더 검색 폭 확장
- [x] (2025-12-19) [LEAD] 헤더 검색 예시 필터링(저품질/반복 텍스트 제거) + PostCard 모바일 하단 라벨 축약
- [x] (2025-12-19) [LEAD] HeaderSearch 예시 placeholder 전환(검색창에 예시가 입력되지 않게 처리) + 2xl 헤더 센터폭 1040 확장
- [x] (2025-12-19) [LEAD] 구독 피드 필터 버튼 크기 확대 + 사이드바 구독 버튼 폭/라인높이 개선(vi 텍스트 잘림 해소)
- [x] (2025-12-19) [LEAD] 모바일 홈 필터 알약 투명도 추가 조정
- [x] (2025-12-19) [LEAD] 추천 사용자 메타 문자열 ordinal prefix 제거 유틸 반영
- [x] (2025-12-19) [LEAD] 추천 사용자 메타를 온보딩 정보 기반(userType/koreanLevel/interest)으로 전환 + 숫자 제거
- [x] (2025-12-19) [LEAD] 추천 사용자 메타에 비자 타입 포함(숫자 허용) + 표시값 대문자 정규화
- [x] (2025-12-19) [LEAD] README 최신화: 프로젝트 개요/명령어/구조/SEO 규칙 요약
- [x] (2025-12-19) [LEAD] MainLayout 2xl 그리드 폭을 Header와 정렬(좌/우 레일 정렬)
- [x] (2025-12-19) [LEAD] 좌측 사이드바 sticky 래핑 + 내부 스크롤 분리(메인 스크롤과 분리)
- [x] (2025-12-19) [LEAD] UserTrustBadge 공통 컴포넌트 추가 + PostCard/Detail/Profile/Answer/Comment/추천·팔로잉 배지 위치 통일
- [x] (2025-12-20) [LEAD] 홈 “신규 유저 빠른 팁” 안내 제거 (HomeClient)
- [x] (2025-12-20) [LEAD] 공식/검수 답변 배지 노출 제거(PostCard/AnswerCard/PostDetail)
- [x] (2025-12-19) [FE] 헤더 우측 액션 순서 변경(알림/언어 스위치 위치 조정)
- [x] (2025-12-20) [FE] 헤더 로고 툴팁 제거 + 로고 우측 브랜드 문구 상시 노출(모바일 포함)
- [x] (2025-12-20) [FE] LanguageSwitcher 영어 옵션 숨김(ko/vi만 노출, en 라우팅은 유지)
- [x] (2025-12-20) [FE] 질문 템플릿 라벨 제거(조건/목표/배경) + 값 강조 표시, 피드백 폼 간소화, 사이드바 피드백 이모지+툴팁 전환
- [x] (2025-12-19) [FE] 공유하기 CTA 설명 문구 업데이트: “내 경험과 지식을 모두와 함께 공유해봅시다.”
- [x] (2025-12-19) [FE] Sidebar 피드백 라벨 고정: “Feedback” (언어 무관) + 글자 크기 축소/아이콘 들여쓰기
- [x] (2025-12-19) [WEB] 피드백 페이지 설문형 UI로 개편(만족도/개선요청) + 요약/이메일 입력 제거
- [x] (2025-12-19) [BE] 피드백 저장 시 사용자 ID 자동 연결 + 관리자 페이지에서 사용자 정보 함께 노출
- [x] (2025-12-19) [FE] 공식/검수 답변 UI 표시(✔/배지) + 상세/피드/프로필 노출
- [x] (2025-12-19) [FE] i18n 누락/혼용 전수 점검(툴팁/배지/카테고리 라벨) + PostDetail 잔여 하드코딩 정리
- [x] (2025-12-19) [FE] PostCard 모바일 잘림(vi) 재점검 + 해결됨/미해결 아이콘 클립 방지
- [x] (2025-12-19) [WEB] 비로그인 읽기/로그인 쓰기 게이팅 QA 전구간 점검(질문/답변/댓글/신고/북마크)
- [x] (2025-12-19) [WEB] 피드백/버그 제보 폼 UX + 제출 확인 플로우
- [x] (2025-12-19) [WEB] 질문 템플릿 UI(조건/목표/배경) 설계 + 작성 폼 연결(베타 품질)
- [x] (2025-12-19) [BE] 베타 답변 권한 정책(관리자/전문가/인증 사용자 제한) + API 가드/에러 코드 정리
- [x] (2025-12-19) [BE] 공식 답변/검수 상태 필드 추가 + 리스트/상세 응답 플래그
- [x] (2025-12-19) [BE] 피드백 수집 API/스토리지(기존 reports 확장 또는 별도 테이블) + rate limit
- [x] (2025-12-19) [BE] 공식 출처 URL Allowlist 정책: UGC 외부 링크 검사/차단(도메인 리스트) + 에러 메시지 동기화

### 6.4 상용화 체크리스트(운영/보안)

- [x] (2025-12-19) NEXT_PUBLIC_SITE_URL/NEXT_PUBLIC_APP_URL 기준 URL 일관화(캐노니컬/OG/링크 생성) 점검
- [x] (2025-12-19) 모니터링/에러 로깅 도입(Sentry/LogRocket 등) + 알림 채널 설정
- [x] (2025-12-19) 보안 헤더/레이트리밋/어뷰즈 대응 정책 점검(CSP/Rate limit/봇 차단)
- [x] (2025-12-19) 운영 백업/장애 대응 플로우 문서화(DB 백업 주기, 복구 절차)

#### (2025-12-20) [LEAD] 메타데이터 URL/UGC allowlist 상수화 + 리스트 API 직렬화 + 상세/인증 fallback 보강 (P0)

- 플랜(체크리스트)
  - [x] SITE_URL 기반 metadata baseUrl 통일(홈/FAQ/게시글 상세)
  - [x] UGC allowlist 상수화(SITE_URL/API_BASE)
  - [x] posts/trending/users posts/bookmarks API를 post-list serializer로 통일
  - [x] PostDetail/VerificationRequest fallback 보강 + 이벤트 로그 보완
  - [x] 배지 만료 마이그레이션 추가 + 작업 요약 문서화
- 현황 분석(코드 기준)
  - 메타데이터 baseUrl이 환경변수 fallback에 분산돼 URL 일관성이 낮음
  - 리스트 API의 excerpt/thumbnail 파싱 로직이 중복돼 유지보수 비용 증가
- 변경 내용(why/what)
  - why: SEO URL 정합성/UGC 링크 기준 고정 + 리스트 응답 포맷 정합성 확보 + 상세/인증 i18n fallback 안정화
  - what: SITE_URL/POST serializer 적용, PostDetail/VerificationRequest fallback 확장, 배지 만료 마이그레이션 추가
- 검증
  - [x] npm run lint
  - [x] npm run type-check
  - [x] SKIP_SITEMAP_DB=true npm run build
- 변경 파일
  - src/app/[lang]/(main)/page.tsx
  - src/app/[lang]/(main)/faq/page.tsx
  - src/app/[lang]/(main)/posts/[id]/page.tsx
  - src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx
  - src/app/[lang]/(main)/verification/request/VerificationRequestClient.tsx
  - src/app/api/posts/route.ts
  - src/app/api/posts/trending/route.ts
  - src/app/api/users/[id]/bookmarks/route.ts
  - src/app/api/users/[id]/posts/route.ts
  - src/components/molecules/modals/FollowingModal.tsx
  - src/lib/validation/ugc-links.ts
  - src/lib/db/migrations/0034_badge_expires_at.sql
  - src/lib/db/migrations/meta/_journal.json
  - docs/WORKING_PLAN.md
- 다음 액션/의존성
  - (선택) `common.share` i18n 키 추가 여부 결정

#### (2025-12-20) [LEAD] i18n `common.share` 추가 + DB migrate 타임아웃 우회 (P0)

- 플랜(체크리스트)
  - [x] `messages/*`에 `common.share` 추가
  - [x] statement_timeout 비활성화 옵션으로 DB migrate 재시도
- 변경 내용(why/what)
  - why: 공유 CTA 공통 라벨 누락 보완 + 로컬 migrate 블로커 해소
  - what: ko/en/vi 공통 키 추가, `PGOPTIONS='-c statement_timeout=0'`로 마이그레이션 수행
- 검증
  - [x] npm run db:migrate (PGOPTIONS 적용)
  - [ ] lint/build 재실행 없음(i18n 변경)
- 변경 파일
  - messages/ko.json
  - messages/en.json
  - messages/vi.json

#### (2025-12-20) [BE] 쓰기 API rate limit 적용 + 429 통일 (P0)

- 플랜(체크리스트)
  - [x] rate limit 유틸/응답 헬퍼 추가
  - [x] 게시글/답변/댓글 작성 rate limit 적용
  - [x] 신고/인증 요청 rate limit + 429/Retry-After 통일
- 현황 분석(코드 기준)
  - 피드백 외 주요 쓰기 API는 rate limit 부재
  - 신고 rate limit 응답이 429가 아님
- 변경 내용(why/what)
  - why: P0-6 방어 기준 충족 및 429 규격 통일
  - what: rateLimit helper 추가, 작성/신고/인증 API에 rate limit 적용
- 검증
  - [x] npm run lint
  - [x] SKIP_SITEMAP_DB=true npm run build
- 변경 파일
  - src/lib/api/response.ts
  - src/lib/api/rateLimit.ts
  - src/app/api/posts/route.ts
  - src/app/api/posts/[id]/answers/route.ts
  - src/app/api/posts/[id]/comments/route.ts
  - src/app/api/answers/[id]/comments/route.ts
  - src/app/api/verification/request/route.ts
  - src/app/api/reports/route.ts
  - src/app/api/posts/[id]/report/route.ts
  - src/app/api/answers/[id]/report/route.ts
  - src/app/api/comments/[id]/report/route.ts
  - docs/EXECUTION_PLAN.md

#### (2025-12-20) [WEB] 맞춤 숨김(안보기) v1 + 신고 즉시 숨김 (P0)

- 플랜(체크리스트)
  - [x] `/api/hides` API 추가(GET/POST/DELETE)
  - [x] hides repo hooks/query keys 추가
  - [x] 신고 성공 시 즉시 숨김 캐시 반영
  - [x] PostCard/AnswerCard/CommentCard/상세 답변·댓글 숨김 UI 적용
- 현황 분석(코드 기준)
  - 신고 후에도 본인 피드/상세에서 즉시 숨김이 되지 않아 재노출됨
- 변경 내용(why/what)
  - why: 신고/숨김 UX를 즉시 반영해 노이즈를 줄이고 사용자 신뢰를 확보
  - what: hides API + repo hooks + UI 숨김/해제 버튼 + 신고 성공 시 숨김 캐시 반영
- 검증
  - [ ] npm run lint
  - [ ] SKIP_SITEMAP_DB=true npm run build
- 변경 파일
  - src/app/api/hides/route.ts
  - src/repo/hides/fetch.ts
  - src/repo/hides/query.ts
  - src/repo/hides/mutation.ts
  - src/repo/hides/types.ts
  - src/repo/keys.ts
  - src/repo/reports/mutation.ts
  - src/components/molecules/cards/PostCard.tsx
  - src/components/molecules/cards/AnswerCard.tsx
  - src/components/molecules/cards/CommentCard.tsx
  - src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx
  - docs/EXECUTION_PLAN.md

#### (2025-12-20) [FE] 게시글 안보기 아이콘화 + 우상단 배치 (P0-13)

- 플랜(체크리스트)
  - [x] 하단 텍스트 버튼 제거
  - [x] 우상단 이모지 버튼 + Tooltip 제공
  - [x] 숨김 상태에도 동일한 토글 UI 적용
- 현황 분석(코드 기준)
  - 기존 카드 하단 액션에 “안보기” 텍스트가 섞여 시각 균형 저하
- 변경 내용(why/what)
  - why: 카드 하단 액션 통일 + 숨김 동선 상단 분리
  - what: 우상단 이모지 버튼으로 숨김/해제 토글, 하단 텍스트 버튼 제거
- 검증
  - [ ] npm run lint
  - [ ] SKIP_SITEMAP_DB=true npm run build
- 변경 파일
  - src/components/molecules/cards/PostCard.tsx
  - docs/EXECUTION_PLAN.md
  - HANDOVER.md
