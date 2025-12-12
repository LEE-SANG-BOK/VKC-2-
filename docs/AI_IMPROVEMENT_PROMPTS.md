# VietHub 개선 플랜 AI 프롬프트 모음

> 작성일: 2025-12-12  
> 목적: VietHub(Viet K-Connect) MVP/베타 개선 로드맵을 **AI에게 바로 요청할 수 있는 프롬프트 형태**로 정리합니다.  
> 사용법: 아래 프롬프트를 그대로 복사해 Claude/ChatGPT에 붙여넣고, 필요한 파라미터(기간/페이지/디자인 등)만 조정해 사용하세요.

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
```

---

## 2. Phase 0 (P0) — 즉시 안정화

### 2.1 게시글 목록 날짜 필터 버그 수정 프롬프트

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

### 2.2 PostList 렌더 중 setState 호출 리팩토링 프롬프트

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

### 2.3 Posts API 디버그 로그/에러 처리 정리 프롬프트

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

### 2.4 OpenGraph/metadata locale 동적화 프롬프트

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

---

## 3. Phase 1 (P1) — 핵심 UX 차별화

### 3.1 비자 단계 필터 + 체크리스트 카드 프롬프트

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

### 3.2 유사 질문/관련 질문 추천 기능 프롬프트

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

### 3.3 무한스크롤 + 페이지네이션 URL 병행 프롬프트

```text
무한 스크롤 피드에 페이지네이션 URL을 병행하는 기능을 추가해줘.

## 요구사항
- 현재 무한 스크롤 UX는 유지.
- URL에 `?page=`가 반영되고, 페이지별 고유 URL이 생성되도록 구현.
- 피드 하단에 Prev/Next/숫자 링크를 제공해 SEO/공유/재방문 동선 강화.
- SSR 초기 페이지는 `page` 값을 읽어 해당 페이지 데이터를 prefetch.

## 관련 파일
- src/app/[lang]/(main)/page.tsx
- src/components/organisms/PostList.tsx
- src/repo/posts/query.ts
- src/app/api/posts/route.ts
```

### 3.4 공지/배너 시스템 최소 버전 프롬프트

```text
공지/배너 시스템 최소 버전을 개발해줘.

## 요구사항
- 사용자 홈 상단에 닫을 수 있는 공지/배너 캐러셀 영역 추가(기존 VietnamBanner 영역 활용 가능).
- 관리자 화면에서 CRUD + 노출 기간/우선순위/언어별 내용을 관리.
- 배너는 모바일에서 슬림하게, 과도한 이미지 사용 금지.
- SSR로 공지/배너 초기 로딩(SEO/웹 성능 고려).

## 백엔드/DB
- banners(또는 notices) 테이블 신설: title, body, imageUrl, linkUrl, locale, startAt, endAt, order, isActive.
- API 라우트 `/api/banners`, `/api/admin/banners` 추가.

## 관련 파일
- src/app/[lang]/(main)/page.tsx
- src/components/organisms/VietnamBanner.tsx (또는 신규 organism)
- src/app/admin/(dashboard)/*
- src/app/api/admin/*
- src/repo/admin/*
```

---

## 4. Phase 2 (P2) — 리텐션/신뢰 강화

### 4.1 PWA 푸시 알림 + 알림 센터 고도화 프롬프트

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

### 4.2 주간 베스트/레벨/배지/프로필 성취감 프롬프트

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

### 4.3 신고/모더레이션 자동화 + Rate Limit 프롬프트

```text
신고/모더레이션 자동화 정책과 API Rate Limit를 추가해 어뷰징 대응력을 높여줘.

## 요구사항
- 동일 IP/계정의 과도한 글/댓글/신고 요청을 제한하는 rate limit 미들웨어 추가.
- 신고 누적 임계치(예: 5회) 이상인 콘텐츠는 자동 임시 숨김 처리.
- 관리자 패널에서 자동 숨김/복구/제재 로그를 확인 가능.

## 제약 조건
- 기존 reports/관리자 흐름과 호환.
- 서버 액션 금지, API 라우트 레벨에서 구현.

## 관련 파일
- src/app/api/reports/route.ts
- src/app/api/admin/reports/*
- src/lib/api/*
- src/lib/db/schema.ts
```

### 4. FAQ/가이드 허브 프롬프트

```text
질문/답변의 신뢰도 강화를 위해 FAQ/가이드 허브를 구축해줘.

## 요구사항
- `/[lang]/guide` 또는 `/[lang]/faq` 허브 페이지를 SSR로 구축하고 JSON-LD 적용.
- 관리자에서 FAQ/가이드 글 CRUD 및 언어별 관리 가능.

## 관련 파일
- src/app/[lang]/guide/*
- src/app/admin/(dashboard)/*
- src/components/molecules/*
- src/app/api/admin/*
- src/lib/db/schema.ts
```

---

## 5. Phase 3 (P3) — 스케일/콘텐츠 성장

### 5.1 검색 성능 고도화 프롬프트

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

### 5.2 인기/트렌딩 스코어 DB화/캐시화 프롬프트

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
- scripts/ (배치 스크립트가 필요하면 이곳)
```

### 5.3 미디어 메타 저장(대표 이미지/이미지 카운트) 프롬프트

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


```

