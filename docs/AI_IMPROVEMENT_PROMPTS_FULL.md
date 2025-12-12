# VietHub 전체 개선 백로그 AI 프롬프트 모음 (Full)

> 작성일: 2025-12-12  
> 목적: 현 단계에서 필요한 **모든 개선사항을 우선순위(P0→P3)**로 정리하고, 각 항목을 AI에게 바로 요청할 수 있는 프롬프트 형태로 제공합니다.  
> 범위: 기능/SEO/성능/모바일/디자인/리팩토링/운영/스케일링 전반

---

## 1. 공통 컨텍스트 프롬프트 (모든 요청 맨 위에 첨부)

```text
[공통 컨텍스트]
- 이 프로젝트는 Next.js 16(App Router) + React 19 + TypeScript(strict) + Tailwind CSS 4 기반입니다.
- 서버 액션은 절대 사용하지 않고, Next.js API Routes(`/api/**`)만 사용합니다.
- 데이터 패칭/변경은 TanStack Query를 사용하며, repo 구조는 `src/repo/[domain]/(fetch.ts, query.ts, mutation.ts, types.ts)`를 유지합니다.
- Query Keys는 `src/repo/keys.ts`에서 중앙 관리합니다.
- 컴포넌트는 ATOMIC 패턴(atoms/molecules/organisms/templates)과 default export를 준수합니다.
- i18n은 ko/en/vi 3개 언어를 지원하며 텍스트는 `messages/*.json`에 추가합니다.
- SEO는 `generateMetadata`, 리스트/상세 SSR + JSON-LD 구조화 데이터를 준수합니다.
- 스타일은 Magic UI(`src/components/ui/*`)와 기존 Tailwind 토큰을 우선 사용합니다.
- 기존 API 응답 형식/라우트 구조는 최대한 유지하면서 점진적으로 개선합니다.
```

---

## 2. P0 — 베타/출시 전 필수 안정화

### 2.1 게시글 목록 날짜 필터 버그 수정

```text
게시글 목록에서 과거 글이 보이지 않는 버그를 수정해줘.

## 현재 동작
- 홈/카테고리/검색 피드에서 오늘 작성된 글만 노출됨.
- 어제 이전 게시글은 DB에 있어도 API에서 필터링되어 내려오지 않음.

## 기대 동작
- 모든 게시글이 최신/인기 정렬 기준에 따라 정상 노출되어야 함.
- 특별한 기간 필터를 선택하지 않는 한 날짜 제한이 없어야 함.

## 재현 방법
1. 오늘 이전 날짜의 게시글을 하나 생성한다.
2. 홈 피드(`/[lang]?c=latest`) 또는 `/api/posts`를 조회한다.
3. 게시글이 목록에 나오지 않음.

## 영향 범위
- 인기/최신/팔로잉/구독/내글 피드 전체.
- SEO 색인 및 사용자 리텐션 지표.

## 관련 파일
- src/app/api/posts/route.ts
- src/repo/posts/fetch.ts
- src/repo/posts/query.ts

## 제약 조건
- 기존 API 응답 형식은 유지.
- 서버 액션 금지, API 라우트만 수정.
```

### 2.2 게시글/상세 mock 데이터 및 mock 파일 제거

```text
게시글 상세/피드에 남아있는 mock 데이터와 불필요한 mock 파일을 제거해줘.

## 현재 문제
- `src/app/[lang]/(main)/posts/[id]/postData.ts`에 mockPosts 등 더미 데이터가 남아 있음.
- 실제 SSR/API 기반 렌더링과 혼재/혼동을 유발하고 빌드 크기를 키움.

## 요구사항
- postData.ts 및 관련 mock 로직이 실제 코드에서 사용되지 않는지 확인하고, 사용처가 없다면 삭제.
- 만약 사용 중인 라우트가 있다면 DB/API 기반으로 완전히 교체.
- 더미 이미지/텍스트가 남아있지 않도록 전수 검사.

## 관련 파일
- src/app/[lang]/(main)/posts/[id]/postData.ts
- src/app/[lang]/(main)/posts/[id]/page.tsx
- src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx
```

### 2.3 PostList 렌더 중 setState 호출 리팩토링

```text
PostList 컴포넌트의 렌더 중 setState 호출 문제를 리팩토링해줘.

## 현재 문제
- selectedCategory가 바뀔 때 컴포넌트 본문에서 setState를 호출해 React 경고/불필요 렌더링이 발생할 수 있음.

## 개선 방향
- selectedCategory 변경 감지를 useEffect로 옮겨 안정적으로 초기화.
- 외부 Props 인터페이스 및 UI는 그대로 유지.

## 관련 파일
- src/components/organisms/PostList.tsx
```

### 2.4 답변 채택/전문가/업보트 기반 정렬 및 라벨링

```text
질문 상세의 답변 정렬 규칙을 '채택된 답변 → 전문가/인증 답변 → 좋아요(유용함) 순 → 최신'으로 개선해줘.

## 현재 문제
- 답변 목록 정렬이 단순 최신순이거나 기준이 불명확함.
- 채택/전문가 답변의 가시성이 낮아 신뢰/전환이 떨어짐.

## 요구사항
- GET /api/posts/[id]/answers 응답에서 정렬을 위 규칙으로 서버에서 보장.
- adoptedAnswerId/isAdopted, author.isExpert/isVerified, likesCount/helpful 등을 기준으로 정렬.
- 클라이언트에서도 동일 기준을 유지하되, 중복 정렬 로직은 제거.
- 다국어 라벨(채택/전문가/인증)을 AnswerCard/상세에서 명확히 표시.

## 관련 파일
- src/app/api/posts/[id]/answers/route.ts
- src/repo/answers/fetch.ts
- src/repo/answers/query.ts
- src/components/molecules/AnswerCard.tsx
- src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx
```

### 2.5 전문가/인증/신뢰 뱃지 UI 일관화

```text
전문가/인증/커뮤니티/오래된 정보 등 신뢰 뱃지 UI를 프로필·게시글·답변에 일관되게 노출해줘.

## 현재 문제
- TrustBadge/author.isExpert/isVerified 데이터는 있으나 일부 화면에서 노출이 불완전하거나 스타일이 제각각임.

## 요구사항
- PostCard, PostDetail, AnswerCard, UserProfile, UserChip에서 동일 컴포넌트/토큰으로 뱃지 표시.
- 뱃지 타입별 색/아이콘/툴팁을 공통 atoms로 정의.
- 관리자 승인 시 badgeType 자동 부여 흐름과 UI가 정확히 연결되는지 확인.
- i18n 라벨/툴팁을 messages에 보강.

## 관련 파일
- src/components/atoms/TrustBadge.tsx
- src/components/molecules/PostCard.tsx
- src/components/molecules/AnswerCard.tsx
- src/components/molecules/UserChip.tsx
- src/app/[lang]/(main)/profile/[id]/page.tsx
- src/app/api/admin/verifications/[id]/route.ts
```

### 2.6 Posts API 디버그 로그/에러 처리 정리

```text
Posts 관련 API의 디버그 로그를 정리하고, 에러 처리를 일관화해줘.

## 현재 문제
- POST /api/posts 등에 console.error 디버그 출력이 남아 있음.
- 에러 응답 메시지가 라우트마다 불균일함.

## 개선 방향
- 운영 환경에서 불필요한 로그 제거.
- `src/lib/api/response.ts` 규칙을 따라 에러 응답을 일관화.
- 기존 응답 스키마/프론트 호환성은 유지.

## 관련 파일
- src/app/api/posts/route.ts
- src/app/api/posts/[id]/route.ts
- src/lib/api/response.ts
```

### 2.7 OpenGraph/metadata locale 동적화

```text
언어별 페이지 메타데이터(OpenGraph/Twitter/alternates)가 locale에 맞게 동적으로 설정되도록 개선해줘.

## 현재 문제
- 일부 전역 메타(OpenGraph locale, description 등)가 ko 기준으로 고정될 위험이 있음.

## 요구사항
- `/[lang]` 이하 모든 라우트에서 `lang` 파라미터 기반으로 locale/alternates가 정확히 설정.
- 기존 `generateMetadata` 패턴을 유지.

## 관련 파일
- src/app/[lang]/layout.tsx
- src/app/[lang]/(main)/page.tsx
- src/app/[lang]/(main)/posts/[id]/page.tsx
```

### 2.8 동적 sitemap/robots 정비

```text
동적 sitemap을 DB 기반으로 확장해 Q&A/카테고리/프로필 URL이 모두 색인되도록 개선해줘.

## 현재 문제
- `src/app/sitemap.ts`에서 카테고리 슬러그가 일부만 하드코딩되어 있음.
- 사용자 프로필 URL이 sitemap에 포함되지 않음.

## 요구사항
- categories/posts/users 테이블에서 실제 slug/id를 조회해 locales별 URL 생성.
- posts는 updatedAt 기준 최신 N개를 포함하되, 글 수 증가 시 limit/갱신 전략을 명확히 함.
- profiles는 공개 사용자만 포함(정지/탈퇴 제외).
- robots.ts의 sitemap 경로와 hreflang alternates 유지.

## 관련 파일
- src/app/sitemap.ts
- src/app/robots.ts
- src/lib/db/schema.ts
```

### 2.9 홈/뉴스/피드 Spacing Quick Fix

```text
홈 화면의 섹션 간격을 모바일/웹 모두에서 더 촘촘하고 일관되게 조정해줘.

## 현재 문제
- HomeClient/NewsSection/PostList에서 gap/space-y/px가 중복 또는 과도해 첫 화면 밀도가 낮음.

## 요구사항
- `docs/UI_UX_IMPROVEMENT_PLAN.md`의 spacing fix 권장안을 기준으로:
  - 홈 섹션 gap 축소(24px -> 12px 수준).
  - NewsSection과 PostList 사이 상단 여백 최소화.
  - container 패딩 중복 제거.
- 레이아웃/기존 디자인 컨셉은 유지하되 가독성과 스크롤 효율을 높임.

## 관련 파일
- src/app/[lang]/(main)/HomeClient.tsx
- src/components/organisms/NewsSection.tsx
- src/components/organisms/PostList.tsx
- src/components/templates/MainLayout.tsx
```

### 2.10 모바일 기본 UX 베타 기준 보강

```text
모바일 베타 기준에 맞게 기본 UX를 재점검하고 보강해줘.

## 요구사항
- 모든 버튼/링크 터치 타깃 최소 44px 보장(필요 시 atoms Button/IconButton에서 공통 적용).
- Tailwind breakpoints(sm/lg) 기반으로 레이아웃이 깨지지 않도록 Header/Sidebar/PostCard/RichTextEditor를 점검·수정.
- PostCard 모바일 썸네일을 상단 16:9 풀폭 형태로 정렬하고, 텍스트 가독성 강화.
- 하단 네비/모바일 드로어 안전영역(safe-area) 패딩 및 닫힘 UX를 확인.

## 관련 파일
- src/components/atoms/Button.tsx
- src/components/organisms/Header.tsx
- src/components/organisms/CategorySidebar.tsx
- src/components/molecules/PostCard.tsx
- src/components/molecules/RichTextEditor.tsx
- src/components/organisms/BottomNavigation.tsx
- src/components/templates/MainLayout.tsx
```

---

## 3. P1 — 핵심 UX 차별화 + 프론트엔드 개선/리팩토링

### 3.1 비자 단계 필터 + 체크리스트 카드

```text
홈/검색에 비자 단계 기반 필터와 체크리스트 카드 UI를 개발해줘.

## 요구사항
- 홈 `/[lang]` 상단에 “비자 단계 타임라인/체크리스트” 카드 블록 추가 (D-2 → D-10 → E-7 → F-2 등).
- 카드에서 비자 단계를 클릭하면 피드가 해당 단계 관련 카테고리/태그로 필터링.
- 검색 페이지(`/[lang]/search`)에도 비자 단계, E-7 우호 직군, 지역 필터를 추가.
- 모바일 우선, 원핸드 조작 가능하도록 스티키/드롭다운 UI 고려.
- 필터 상태는 URL query로 유지(`?visa=...&job=...&region=...`)해 공유/SEO 가능.

## 백엔드
- `GET /api/posts`에 visa/job/region 파라미터를 추가해 필터링 지원.
- 필요 시 Drizzle migration + Zod 검증을 적용.

## 참고
- 기존 카테고리/필터 구조(`src/app/api/posts/route.ts`, `PostList.tsx`) 확장 방식.
- SSR은 HydrationBoundary 패턴 유지.

## 관련 파일
- src/app/[lang]/(main)/page.tsx
- src/app/[lang]/(main)/HomeClient.tsx
- src/components/organisms/PostList.tsx
- src/app/[lang]/(main)/search/page.tsx
- src/app/api/posts/route.ts
- src/repo/posts/fetch.ts
- src/repo/posts/query.ts
- src/repo/posts/types.ts
```

### 3.2 카테고리 그룹핑/토픽 보강

```text
카테고리/토픽 정보 구조를 4개 그룹(생활/취업·경력/교육/문화)로 재구성하고, 누락된 핵심 토픽을 추가해줘.

## 요구사항
- CategorySidebar에 그룹 헤더 + 접기/펼치기 UI 추가.
- 기존 14개 카테고리를 그룹별로 묶어 표시하되 URL/slug/DB 구조는 유지.
- `TOPIC_CATEGORY_ANALYSIS.md` 권장안에 따라 topik, scholarship, interview-tips, worker-rights 등 세부 토픽(서브카테고리 또는 topic 레벨)을 추가.
- 그룹/토픽별 아이콘과 ko/en/vi 라벨 제공.
- 홈/검색/온보딩에서 그룹/토픽 기준 필터링이 자연스럽게 동작하도록 연결.

## 백엔드/DB
- 필요 시 categories 테이블에 그룹 필드 또는 매핑 상수(CATEGORY_GROUPS)를 lib에 추가.
- admin/categories 화면에서도 그룹/토픽 관리 가능하도록 확장.

## 관련 파일
- src/components/organisms/CategorySidebar.tsx
- src/lib/constants/categories.ts (또는 신규 constants)
- src/app/api/categories/*
- src/app/admin/(dashboard)/categories/*
- messages/*.json
```

### 3.3 유사 질문/관련 질문 추천

```text
유사 질문 추천 기능을 개발해줘.

## 요구사항
- 질문 작성 페이지에서 제목 입력 시 실시간으로 유사 질문 목록을 최대 5개 추천.
- 추천 기준: 제목 유사도(ILIKE/pg_trgm) + 동일 카테고리/태그 우선.
- 유사 질문이 있으면 “기존 답변 확인” CTA를 노출해 중복 질문을 줄임.
- 질문 상세 페이지 하단에도 “관련 질문” 섹션을 자동 노출.
- SSR 초기 렌더에 관련 질문 1차 로딩 포함(SEO).

## API
- GET /api/posts/similar?title=...&category=... (작성 시)
- GET /api/posts/[id]/related (상세 추천)

## 관련 파일
- src/app/[lang]/(main)/posts/new/*
- src/components/molecules/RichTextEditor.tsx (또는 작성 폼)
- src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx
- src/app/api/posts/*
- src/repo/posts/*
```

### 3.4 무한스크롤 + 페이지네이션 URL 병행

```text
무한 스크롤 피드에 페이지네이션 URL을 병행하는 기능을 추가해줘.

## 요구사항
- 현재 무한 스크롤 UX는 유지.
- URL에 `?page=`가 반영되고 페이지별 고유 URL이 생성되도록 구현.
- 피드 하단에 Prev/Next/숫자 링크를 제공해 SEO/공유/재방문 동선 강화.
- SSR 초기 페이지는 `page` 값을 읽어 해당 페이지 데이터를 prefetch.

## 관련 파일
- src/app/[lang]/(main)/page.tsx
- src/components/organisms/PostList.tsx
- src/repo/posts/query.ts
- src/app/api/posts/route.ts
```

### 3.5 Header/Sidebar 탐색·검색 UX 개선

```text
Header와 Sidebar의 탐색/검색 UX를 개선해 체류시간을 늘려줘.

## 요구사항
- Header 검색창을 데스크탑에서 더 넓게(max-w-lg 수준) 하고, 모바일에서는 아이콘→확장형 검색으로 전환.
- 알림 아이콘에 미읽음 뱃지 강조, 모바일 상단 동선 단순화.
- Sidebar는 그룹핑 기반(3.2)으로 정돈하고, 스크롤 독립 + 주요 CTA(질문하기/구독 관리)를 sticky 영역으로 고정.
- 메인 콘텐츠 max width를 max-w-4xl로 제한해 가독성 유지.

## 관련 파일
- src/components/organisms/Header.tsx
- src/components/organisms/CategorySidebar.tsx
- src/components/templates/MainLayout.tsx
- src/app/[lang]/(main)/page.tsx
```

### 3.6 모바일 피드 인터랙션 강화(스와이프/리프레시/FAB)

```text
모바일 피드 인터랙션을 '탭 스와이프 + pull-to-refresh + 플로팅 질문 버튼'으로 강화해줘.

## 요구사항
- 홈 피드 탭(popular/latest/following/subscribed/my-posts)을 좌우 스와이프로 전환 가능하게 구현.
- PostList 상단에서 아래로 당기면 refetch 되는 pull-to-refresh 추가.
- 스크롤 중에도 '질문하기' FAB를 노출(하단 네비와 충돌하지 않도록 safe-area 위).
- 애니메이션은 framer-motion 또는 Magic UI 패턴 사용.

## 관련 파일
- src/app/[lang]/(main)/HomeClient.tsx
- src/components/organisms/PostList.tsx
- src/components/atoms/Button.tsx
```

### 3.7 브랜드 컬러/타이포/디자인 토큰 통일

```text
브랜드 컬러/타이포그래피/디자인 토큰을 통일해 화면 간 일관성을 높여줘.

## 현재 문제
- blue/amber/red 계열 accent가 화면마다 혼재하고 타이포 크기도 불일치함.

## 요구사항
- Tailwind theme 또는 CSS 변수로 primary/secondary/accent/danger 컬러를 확정하고 atoms(Button, Badge, TrustBadge 등)에서만 변형.
- 페이지/섹션/카드/메타 텍스트의 타이포 스케일을 `docs/UI_UX_IMPROVEMENT_PLAN.md` 권장안에 맞춰 정렬.
- 다국어 길이 차이를 고려해 line-height/spacing 조정.
- 기존 디자인을 크게 바꾸지 않되, 색/폰트 기준만 일관되게 리팩토링.

## 관련 파일
- src/app/globals.css
- src/components/atoms/*
- src/components/molecules/*
- src/components/organisms/*
```

### 3.8 카드 UI 소비 효율 개선(Post/Answer/Comment)

```text
PostCard/AnswerCard/CommentCard의 레이아웃과 액션 UI를 재정의해 콘텐츠 소비 효율을 높여줘.

## 요구사항
- 모바일: PostCard 썸네일 상단 16:9, 제목 2줄 우선, 메타/태그는 compact.
- 데스크탑: 썸네일 우측 4:3 유지, 텍스트 영역 max-w-4xl 내 가독성 확보.
- 좋아요/북마크/공유/신고 버튼 위치와 스타일을 카드·상세·답변에서 동일 규칙으로 맞춤.
- 터치 타깃/hover 상태/다크모드 색상 규칙을 atoms 기반으로 통일.

## 관련 파일
- src/components/molecules/PostCard.tsx
- src/components/molecules/AnswerCard.tsx
- src/components/molecules/CommentCard.tsx
- src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx
```

### 3.9 대형 컴포넌트 분리 리팩토링

```text
대형 클라이언트 컴포넌트를 atomic 구조에 맞게 분리 리팩토링해줘.

## 현재 문제
- PostDetailClient.tsx, PostCard.tsx 등 일부 파일이 너무 길고 UI/비즈니스 로직이 섞여 유지보수 비용이 큼.

## 개선 방향
- UI 영역은 molecules/organisms 하위 컴포넌트로 분리(PostDetailHeader, PostDetailActions, AnswerList, CommentList 등).
- 좋아요/북마크/팔로우/신고 등 로직은 커스텀 훅(usePostActions, useAnswerActions ...)으로 분리.
- 외부 Props/URL/기존 UI는 최대한 유지.
- 타입(any) 제거와 함께 진행.

## 관련 파일
- src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx
- src/components/molecules/PostCard.tsx
- src/repo/posts/*
- src/repo/answers/*
- src/repo/comments/*
```

### 3.10 타입 통합 및 any 제거

```text
Post/Answer/Comment/User 타입을 통합 정리하고 any 사용을 줄여 strict TypeScript 안정성을 높여줘.

## 현재 문제
- PostDetailClient, HomeClient 등에서 any 또는 임시 매핑이 많아 타입 안정성이 떨어짐.
- API 응답 타입과 클라이언트 타입이 일부 불일치함.

## 요구사항
- src/repo/*/types.ts를 기준으로 공통 타입 정의 위치를 명확히 하고 중복 제거.
- API 응답 스키마와 UI 타입을 분리하되 매핑 함수는 lib/utils에 배치.
- 캐스팅 대신 타입 가드/Drizzle Zod 사용.
- 린트/tsc에서 noImplicitAny 만족.

## 관련 파일
- src/repo/posts/types.ts
- src/repo/answers/types.ts
- src/repo/comments/types.ts
- src/types/* (있다면)
- src/app/[lang]/(main)/**/*.tsx
```

### 3.11 비로그인 전환/콘텐츠 CTA·퀵투어 강화

```text
비로그인 사용자 전환과 콘텐츠 내 CTA를 강화해 가입/재방문 루프를 설계해줘.

## 요구사항
- 비로그인 상태에서 좋아요/북마크/답변/댓글 등 참여 시 로그인 유도 모달 + 혜택 안내 제공.
- 질문 상세 하단에 '나도 질문하기 / 저장하기 / 관련 질문 더보기' CTA 블록 추가.
- 첫 로그인 후 3-step 퀵투어(검색→질문→채택) 또는 툴팁 온보딩 제공.
- 온보딩 완료 전 리다이렉트/차단 UX가 과하지 않도록 개선.

## 관련 파일
- src/components/organisms/LoginPrompt.tsx
- src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx
- src/app/[lang]/(main)/onboarding/OnboardingClient.tsx
- src/components/templates/MainLayout.tsx
```

### 3.12 Lighthouse/성능 감사 스크립트 정비

```text
Lighthouse/Playwright 기반 성능 감사 스크립트를 프로젝트에 추가/정비해줘.

## 요구사항
- npm script `audit:performance`(또는 유사) 추가, 로컬에서 CWV(LCP/INP/CLS) 지표 측정 가능하게.
- 결과를 docs/checks 또는 docs/summaries에 기록하는 워크플로우 제공.
- CI 연결은 옵션으로 두되 최소 로컬 실행을 보장.

## 관련 파일
- package.json
- scripts/*
- docs/checks/*
```

---

## 4. P2 — 리텐션/신뢰/운영 강화

### 4.1 토픽/카테고리 구독 시스템 완성

```text
토픽/카테고리 구독 시스템을 완성하고 구독 기반 피드를 제공해줘.

## 현재 상태
- topic_subscriptions 테이블/구독 API는 있으나 UX/피드 반영이 부분적임.

## 요구사항
- CategorySidebar/토픽 페이지에서 구독 토글 UX 정교화(구독 중 표시, 언어별 라벨).
- 구독한 토픽의 새 글/답변을 모아 보는 피드 탭을 제공(`/[lang]?c=subscribed` 유지).
- 토픽별 피드 라우트 `/[lang]/topics/[slug]` 제공.
- 구독 이벤트가 알림/푸시(4.2/4.3)와 연결되도록 준비.

## 관련 파일
- src/app/api/topics/[slug]/subscribe/*
- src/repo/topics/* (신규 또는 확장)
- src/components/organisms/CategorySidebar.tsx
- src/app/[lang]/(main)/page.tsx
```

### 4.2 PWA 푸시 알림 + 알림 센터 고도화

```text
PWA 푸시 알림 및 알림 센터 리텐션 기능을 고도화해줘.

## 요구사항
- next-pwa 설정 기반으로 웹 푸시 구독/해지 플로우를 추가.
- 새 답변/채택/팔로우/구독 등 주요 이벤트 발생 시 푸시 발송 옵션 제공.
- 프로필 설정에서 pushNotifications on/off, 카테고리별 알림 세분화.
- 알림 센터(`/[lang]/notifications`) UX 개선: 그룹화, 미읽음 필터, 빠른 전체읽음.

## 참고
- 서버 액션 금지, `/api/push/*` 형태로 API 라우트를 설계.
- Supabase/외부 Push Provider 연동은 인터페이스 먼저 구현.

## 관련 파일
- next.config.ts
- src/app/[lang]/(main)/notifications/*
- src/app/api/notifications/*
- src/lib/notifications/*
- src/lib/db/schema.ts
```

### 4.3 이메일/주간 다이제스트 + 알림 설정 세분화

```text
이메일/주간 다이제스트와 카테고리별 알림 설정 기능을 추가해 리텐션을 강화해줘.

## 요구사항
- users 테이블의 emailNotifications/notify* 필드를 기반으로:
  - 주간 인기글/내 구독 토픽 새글을 이메일로 발송하는 배치/템플릿 구조 설계.
  - 알림 설정 UI에서 전체/카테고리별/이벤트별 on/off 제공.
- 발송 자체는 추후 연동 가능하도록 인터페이스/큐 구조 우선 구현.

## 관련 파일
- src/lib/notifications/*
- src/app/[lang]/(main)/profile/edit/*
- src/app/api/notifications/*
- src/lib/db/schema.ts
```

### 4.4 주간 베스트/레벨/배지/프로필 성취감

```text
주간 베스트 답변/레벨/배지/프로필 성취감 UI를 추가해 재방문을 강화해줘.

## 요구사항
- “주간 베스트 답변자/게시글” 섹션을 홈 또는 별도 페이지로 제공.
- 사용자 프로필에 질문/답변/채택률/좋아요/랭킹을 시각화(진행바/레벨업 UI).
- 레벨/배지는 기존 users 컬럼(trust_score, helpful_answers 등)과 연동.
- 다국어 텍스트 제공.

## 백엔드
- 필요 시 랭킹/주간 집계 API(`/api/posts/trending`, `/api/users/ranking`) 추가.
- 집계 비용 최소화를 위해 주 1회 배치 또는 캐시 전략 포함.

## 관련 파일
- src/app/[lang]/(main)/page.tsx
- src/app/[lang]/(main)/profile/[id]/*
- src/components/molecules/UserProfile.tsx
- src/components/organisms/PostList.tsx
- src/app/api/posts/trending/*
- src/app/api/users/*
```

### 4.5 신고/모더레이션 자동화 + Rate Limit

```text
신고/모더레이션 자동화 정책과 API Rate Limit를 추가해 어뷰징 대응력을 높여줘.

## 요구사항
- 동일 IP/계정의 과도한 글/댓글/신고 요청을 제한하는 rate limit 미들웨어 추가.
- 신고 누적 임계치(예: 5회) 이상인 콘텐츠는 자동 임시 숨김 처리.
- 관리자 패널에서 자동 숨김/복구/제재 로그 확인 가능.

## 제약 조건
- 기존 reports/관리자 흐름과 호환.
- 서버 액션 금지, API 라우트 레벨에서 구현.

## 관련 파일
- src/app/api/reports/route.ts
- src/app/api/admin/reports/*
- src/lib/api/*
- src/lib/db/schema.ts
```

### 4.6 공식 출처 슬롯 + FAQ/가이드 허브

```text
질문/답변의 신뢰도 강화를 위해 “공식 출처 슬롯” UI와 FAQ/가이드 허브를 구축해줘.

## 요구사항
- 게시글/답변 UI에 “출처 링크/문서”를 표준 형태로 표시하는 컴포넌트 추가.
- `/[lang]/guide` 또는 `/[lang]/faq` 허브 페이지를 SSR로 구축하고 JSON-LD 적용.
- 관리자에서 FAQ/가이드 글 CRUD 및 언어별 관리 가능.

## 관련 파일
- src/app/[lang]/guide/*
- src/app/admin/(dashboard)/*
- src/components/molecules/*
- src/app/api/admin/*
- src/lib/db/schema.ts
```

### 4.7 소셜 로그인 확장(Google + Zalo 등)

```text
Google 외 소셜 로그인(Zalo 등)을 추가해 가입 진입장벽을 낮춰줘.

## 요구사항
- NextAuth v5 provider 구조를 확장해 Zalo(또는 Facebook) OAuth를 추가.
- 기존 Google 로그인과 UI/세션 구조는 유지.
- 로그인 버튼/텍스트는 i18n 지원.
- 신규 provider의 콜백/유저 프로필 매핑이 users 테이블과 정상 연결되도록 확인.

## 관련 파일
- src/lib/auth.ts (또는 NextAuth 설정 파일)
- src/app/api/auth/[...nextauth]/route.ts
- src/app/[lang]/(auth)/login/*
- messages/*.json
```

### 4.8 KPI 이벤트 로깅/분석 파이프라인

```text
핵심 KPI(가입 전환, 재방문, 알림 클릭, 채택률, 저장/공유 등) 이벤트 로깅을 설계·구현해줘.

## 요구사항
- 프론트에서 주요 액션(로그인 완료, 질문 작성, 답변 작성, 채택, 저장, 공유, 알림 클릭 등)에 이벤트를 남김.
- 서버 `/api/analytics/events`로 수집하여 DB 테이블(kpi_events 등)에 저장.
- 추후 GA/Amplitude 연동 가능하도록 이벤트 스키마를 명확히 정의.
- 개인정보/UGC 안전(PII 최소화) 기준 포함.

## 관련 파일
- src/app/api/analytics/* (신규)
- src/lib/db/schema.ts
- src/components/**/*
- src/app/[lang]/**/*
```

### 4.9 카테고리/추천 데이터 캐시 레이어

```text
카테고리/구독/추천 등 자주 조회되는 데이터를 캐싱해 초기 트래픽 증가에 대비해줘.

## 현재 문제
- /api/posts 등에서 categories 전체 조회 및 HTML 파싱을 매 요청마다 수행.
- 구독/팔로잉 필터가 실시간 join으로 비용이 큼.

## 요구사항
- categories는 서버 캐시(메모리/edge cache) 또는 정적 JSON으로 1차 캐시.
- 인기/추천/구독 필터는 캐시 키 전략을 정의해 응답 속도 개선.
- 캐시 무효화는 admin/categories 변경 시 또는 TTL 기준.

## 관련 파일
- src/app/api/posts/route.ts
- src/app/api/categories/*
- src/lib/api/*
- scripts/*
```

### 4.10 Next.js image 도메인 allowlist 정비

```text
Next.js image remotePatterns를 서비스 도메인 기준으로 제한해 보안/성능을 개선해줘.

## 현재 문제
- next.config.ts에서 모든 외부 도메인을 허용하고 있어 예기치 않은 리소스 로딩/보안 리스크 가능.

## 요구사항
- Supabase storage, trusted CDN 등 실제 사용 도메인만 allowlist.
- 로컬/dev 환경은 완화할 수 있으나 prod는 제한.
- 변경이 기존 이미지 로딩을 깨지지 않는지 점검.

## 관련 파일
- next.config.ts
- src/lib/supabase/*
```

---

## 5. P3 — 스케일/콘텐츠 성장

### 5.1 검색 성능 고도화

```text
검색 성능을 고도화해 트래픽 증가에 대응해줘.

## 현재 문제
- `/api/search`, `/api/posts`에서 ILIKE 기반 검색만 사용하여 데이터가 늘면 느려짐.

## 요구사항
- Postgres full-text 검색 또는 pg_trgm 기반 유사도 검색으로 전환.
- 검색 API 응답 형식은 유지하되, 필드/정렬 정확도 향상.
- 필요 시 인덱스 추가/마이그레이션 포함.

## 관련 파일
- src/app/api/search/*
- src/app/api/posts/route.ts
- src/lib/db/schema.ts
- src/repo/search/*
```

### 5.2 인기/트렌딩 스코어 DB화/캐시화

```text
인기/트렌딩 스코어 계산을 DB 또는 캐시 레벨로 옮겨 정확도와 성능을 개선해줘.

## 현재 문제
- 인기 정렬이 API에서 메모리 재정렬로 처리되어 비용이 크고 페이지 밖 인기글이 반영되지 않음.

## 요구사항
- 게시글에 트렌딩 스코어 컬럼을 두거나, 집계 뷰/캐시 테이블로 계산.
- `/api/posts/trending`과 홈 인기 정렬이 동일 기준을 사용.
- 주기적 배치/캐시 무효화 전략 포함.

## 관련 파일
- src/app/api/posts/route.ts
- src/app/api/posts/trending/*
- src/lib/db/schema.ts
- scripts/*
```

### 5.3 미디어 메타 저장(대표 이미지/이미지 카운트)

```text
게시글 이미지 메타(대표 이미지/이미지 카운트)를 저장해 목록 성능을 개선해줘.

## 현재 문제
- 목록 API에서 매번 HTML regex로 이미지 추출을 수행함.

## 요구사항
- posts 테이블에 대표 이미지(thumbnailUrl)와 imageCount 저장.
- 게시글 생성/수정 시 서버에서 메타를 계산해 저장.
- 목록 응답은 저장된 메타를 사용.

## 관련 파일
- src/app/api/posts/route.ts
- src/app/api/posts/[id]/route.ts
- src/lib/db/schema.ts
- src/repo/posts/types.ts
```

### 5.4 카드뉴스/숏폼 허브 + CTA 연계

```text
카드뉴스/숏폼 허브 섹션을 구축하고 Q&A와 교차 추천되도록 개발해줘.

## 요구사항
- 홈에 카드뉴스/숏폼 전용 섹션을 추가(큰 타이포, 2언어 표기, 저장/공유 CTA 포함).
- 카드뉴스 상세/플레이리스트 페이지 제공.
- 질문 상세 하단에 관련 카드뉴스/숏폼 추천.
- 관리자에서 카드뉴스/숏폼 CRUD 가능.

## 관련 파일
- src/app/[lang]/(main)/media/*
- src/components/organisms/*
- src/app/api/admin/*
- src/lib/db/schema.ts
```

### 5.5 토픽 키워드 매핑/자동 분류 시스템

```text
토픽 키워드 매핑/자동 분류 시스템을 도입해 검색·추천 정확도를 높여줘.

## 요구사항
- `TOPIC_CATEGORY_ANALYSIS.md`의 키워드 권장안을 기준으로 다국어 키워드 사전을 정의.
- 게시글 생성/수정 시 제목/본문을 분석해 자동 카테고리/토픽 추천 또는 태그 추천.
- 유사 질문 추천(3.3)과 연계 가능하도록 모듈화.
- 관리자에서 키워드 사전을 수정할 수 있는 구조를 고려.

## 관련 파일
- src/lib/topic-keywords.ts (신규)
- src/app/api/posts/route.ts
- src/app/api/posts/[id]/route.ts
- src/repo/posts/*
- src/app/admin/(dashboard)/categories/*
```

### 5.6 운영자 AI 콘텐츠 자동화 API 골격

```text
운영자를 위한 AI 콘텐츠 자동화 API 골격을 추가해 콘텐츠 시딩/태그추천/답변초안/번역을 자동화해줘.

## 요구사항
- /api/ai/content 라우트 신설, 운영자 화이트리스트 기반 인증.
- 액션: ask_seed, tag, answer_draft, translate, summary.
- Zod 검증 + 타임아웃/폴백 구조 포함.
- 결과 캐시(ai_content_cache)와 로그(ai_generation_logs) 테이블/마이그레이션 추가.
- 관리자에서 실행/결과 확인 UI 최소 버전 제공.

## 관련 파일
- src/app/api/ai/content/route.ts (신규)
- src/lib/db/schema.ts
- src/app/admin/(dashboard)/*
- scripts/*
```

### 5.7 트래픽 증가 대응 아키텍처/배치·큐 분리

```text
트래픽 증가에 대비한 백엔드 스케일링/배치/큐 구조를 설계해줘.

## 요구사항
- 인기 스코어, 이메일/푸시, AI 콘텐츠 등 비용 큰 작업을 배치/큐(cron/worker)로 분리하는 아키텍처 제안.
- Redis 캐시/큐 도입 시 최소 침투 방식과 코드 위치 제안.
- Supabase/Vercel 환경에서 운영 가능한 현실적 구성을 우선.

## 산출물
- 아키텍처 다이어그램
- 단계별 마이그레이션 플랜
```

