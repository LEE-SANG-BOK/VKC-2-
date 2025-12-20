# WORKING_PLAN

본 문서는 현재 코드/문서 현황을 기준으로 “무엇을 언제(P0/P1/P2)까지 닫을지”를 고정한다. 구현 단위는 기능(도메인) 기준으로 쪼개고, Hot File 충돌을 피하며, 릴리즈 게이트(Playwright/Rate limit)를 P0에서 확정한다.

## Plan (요약)

- P0(출시 전)은 “실데이터/SEO 정합 + 모바일 UX + 신뢰(인증/배지) + 운영도구(계측/방어) + 필수 자동화(Playwright/Rate limit)”를 닫는 데 집중한다.
- P1은 안정화/유지보수 체계(테스트 확장, Admin 정리, 모니터링), P2는 스케일/확장(캐시/레플리카/플래그/CMS/추천 고도화)로 분리한다.
- 추가 정책: `en`은 웹 UI에서 숨김(언어 스위치/노출 동선 제거)하되, 기존 `en` 페이지/번역은 삭제하지 않고 SEO 노출은 유지한다. 앞으로 신규 작업은 `en` 번역 추가/검수는 하지 않음(단, 페이지 렌더가 깨지지 않도록 fallback은 보장).

## Policy decisions (확정)

- AI 번역/챗봇: 도입/PoC 모두 제외
- 신규 유저 빠른 팁 UI는 사용하지 않음(배너/카드 노출 금지)
- Workspace: 단일 워크트리 = `/Users/bk/Desktop/viet-kconnect-renew-nextjs-main 2`
- Branch: 단일 브랜치 = `codex-integration`
- Language: UI 노출 로케일 = `ko/vi`, SEO 로케일 = `ko/en/vi` (예: `src/app/sitemap.ts`, `src/app/[lang]/layout.tsx`의 alternates는 유지)
- i18n: 신규 작업은 `en` 번역 키를 추가/검수하지 않음, `en` 렌더는 `ko` fallback으로 깨짐 방지
- E2E: Playwright 필수(릴리즈 게이트에 포함)
- Abuse 방어: Rate limit 필수(주요 쓰기 API에 적용)
- 커뮤니티 랭킹(leaderboard): `레벨` UI는 폐지하고 `온도(기본 36.5)`만 노출(온도 상승 시 더 “뜨거운” 이모지/아이콘), 총 멤버 수는 미노출, 상단 안내는 “신뢰도 계산식”이 아니라 “랭킹이 오르는 행동” 설명으로 고정
- 커뮤니티 랭킹 레이아웃: 웹은 우측 여백(약 4컬럼)을 남기고, 모바일은 상단 안내 영역을 남겨 “Event(추후)” 영역으로 확장 가능한 구조로 고정(메뉴 라벨은 `상위 기여자(Event)`로 임시 표기)

## 현황(폴더/구조 기반 스냅샷)

- 스택/기본 전제: Next.js 16(App Router) + React 19 + TS strict (`package.json:1`, `tsconfig.json:1`)
- 라우팅/i18n: `src/app/[lang]/**` + locale redirect(`middleware.ts:1`), UI는 `ko/vi`만 노출(`src/components/atoms/LanguageSwitcher.tsx:1`), SEO는 `ko/en/vi` 유지(`src/app/sitemap.ts:1`, `src/i18n/config.ts:1`)
- API/데이터 레이어: 서버 액션 없이 `src/app/api/**` 라우트 핸들러 + `src/repo/**` TanStack Query 레이어(도메인별 `fetch/mutation/query/types` + keys 중앙화) (`src/repo/keys.ts:1`)
- CI 게이트: `lint/type-check/build/npm audit` 중심으로 간결함. E2E는 아직 CI에 고정돼 있지 않음(`.github/workflows/ci.yml:1`)
- 운영/모더레이션 기반: `middleware.ts:1`에 “쓰기 API” in-memory rate limit이 이미 있음(프로덕션 서버리스/멀티 인스턴스에서 실효성은 제한적)

## 사용자 이용 환경 가정(리서치 반영, 반응형 웹 전제)

- 모바일 우선: 유입/재방문이 모바일 중심이라는 전제 하에, “모바일에서 완벽히 동작”을 1순위 품질 게이트로 둔다(터치 타깃/키보드/세이프에어리어/한손 내비).
- 네트워크 편차: 지하철/실내 등 저속·불안정 구간을 기본 시나리오로 본다(이미지 경량화, 불필요 요청 제거, 로딩/오류/재시도 UX, 오프라인 폴백/캐시).
- 핵심 소비 패턴: 비자/취업/생활 Q&A를 “읽고 저장하고 다시 찾는” 흐름이 핵심이므로, 검색/목록/상세는 SSR 기반으로 빠르게 보이고(SEO 포함) 재방문 시 캐시/북마크/구독으로 다시 찾기 쉬워야 한다.
- 재방문 동력: 알림/구독(앱 내)은 기본, PWA/이메일 등 외부 채널은 P1~P2에서 “운영 효율을 해치지 않는 방식”으로 확장한다.
- 외부 공유: FB/메신저 중심 공유가 많으므로 OG/Twitter 메타 정합성은 P0에서 보장하고(중복 UI 제거 포함), 채널별 추가 연동은 P2에서 “운영자 큐레이션 콘텐츠”부터 단계적으로 한다.

## 작업 분량/보고/커밋 단위(병렬 운영)

- 작업 분량(1회): 서브태스크 2~4개 또는 변경 파일 1~5개
- 보고 단위: 작업 완료 즉시 `WORKING_PLAN.md`에 체크리스트 갱신 + 변경 파일/의존성 기입
- 커밋 단위: 요청 1건 = 1커밋(요청 묶음 금지). P0/P1 아이템 기준 1커밋(Hot File 포함 시 단독 커밋)
- 병렬 보고 주기: 하루 1회 또는 완료 즉시(둘 중 빠른 쪽)
- 커밋 기록: 에이전트는 “커밋에 필요한 정보(파일/검증/의존성/메시지)”를 본 문서에 남긴다

### 요청 단위 커밋 분리안(권장)

- 워크트리는 나누지 않는다. 단일 워크트리/단일 브랜치 정책을 유지한다.
- 기능 단위로 스테이징/커밋을 분리한다.

1. 공식 답변/검수 답변 제거 + 카드 액션 정리(피드/상세) [FE]
   - `src/components/molecules/cards/PostCard.tsx`
   - `src/components/molecules/cards/AnswerCard.tsx`
   - `src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx`
   - 연관 시 `src/components/organisms/PostList.tsx`

2. 피드백 UX 정리 + 사이드바 피드백 표기 축소 [FE]
   - `src/app/[lang]/(main)/feedback/FeedbackClient.tsx`
   - `src/components/organisms/CategorySidebar.tsx`
   - `src/components/molecules/categories/CategoryItem.tsx`

3. Rate limit/API 응답 정리 [BE]
   - `src/lib/api/rateLimit.ts`
   - `src/lib/api/response.ts`
   - `src/app/api/**`(reports/verification/comments/answers/posts)

4. 글쓰기/등록 흐름 변경 [WEB]
   - `src/app/[lang]/(main)/posts/new/NewPostClient.tsx`

5. 문서 업데이트(마지막 또는 각 기능별 동반) [LEAD]
   - `docs/WORKING_PLAN.md`
   - `HANDOVER.md`

## 객관적 개선점(효율/반복 최소화 관점에서 ‘구조적으로’ 해결해야 하는 것)

### 1. 중복/분산된 규칙·로직을 ‘단일 소스’로 묶는 작업이 ROI 최상

- 현황/리스크
  - `generateMetadata`가 페이지별로 반복되고, “키워드/태그/요약” 로직도 UI/SEO/API에 분산되어 있어 유지보수 비용이 커질 가능성이 큼
  - 예: `src/app/[lang]/(main)/search/page.tsx:1`, `src/app/[lang]/(main)/posts/[id]/page.tsx:1`, `src/app/api/search/keywords/route.ts:1`, `src/app/[lang]/(main)/posts/new/NewPostClient.tsx:1`
- 방향: “메타/키워드 빌더(공용)”를 만들어 한 번만 정의하고 각 영역은 결과만 소비(중복 제거)
- 연계: `P0-12`(메타/키워드 통합), `P0-13`(노출 규칙 정리)

### 2. 테스트/감사 스크립트는 있는데 ‘현재 라우트 구조와 불일치’(효율 저하)

- 현황/리스크
  - 성능/접근성 감사 스크립트가 Playwright/Lighthouse를 전제로 하지만 의존성이 기본 설치가 아니고, 테스트 대상 URL도 현 라우트(`/[lang]`)와 맞지 않는 부분이 있음
  - 예: `scripts/performance-audit.js:1`, `scripts/accessibility-audit.js:1`
- 방향: “현재 라우트 + 현재 정책(ko/vi UI, en SEO)”에 맞게 스크립트/게이트/URL 타깃을 재정렬해 자동화가 실제로 작동하게 함
- 연계: `P0-7`(Playwright 게이트), `P0-9`(수동 QA), `P1-1`(커버리지 확장)

### 3. 패키지 매니저/락파일 일관성은 운영 비용 직결

- 현황/리스크
  - CI는 `npm ci`를 사용(`.github/workflows/ci.yml:1`)하지만, 저장소에는 `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`이 동시에 존재
  - 설치 재현성/취약점 대응/온보딩 비용을 올리는 전형적인 “반복 비용” 요인
- 방향: CI 기준에 맞춰 단일 매니저/단일 락파일로 규칙화(문서 + 체크로 강제)

### 4. Rate limit은 “존재”하지만 “확장 가능한 설계”가 아직 아님

- 현황/리스크
  - `middleware.ts:1`의 Map 기반 제한은 MVP엔 도움이 되지만, 출시 후 스팸/남용 방어(정책 세분화/유저 단위/엔드포인트 단위/429 UX)에는 부족
- 방향: 정책 정의(임계치/범위/우선순위) → 저장소(외부/지속) → 공통 응답 스키마 → 클라 UX까지 한 번에 표준화
- 연계: `P0-6`(rate limit + 429 UX), `P1-2`(고도화)

## 개선 플랜(리서치 → 의사결정 → 실행 보드로 내리는 방식, 단일 소스 지향)

### 1) “단일 소스 오브 트루스(SoT)” 재정의(1회로 끝내는 정리)

- 목표: 문서/정책/규칙이 분산돼 반복 확인이 생기는 비용 제거
- 리서치: 작업 규칙/SEO/i18n/모더레이션/게이트가 문서 어디에 흩어져 있는지 인덱싱(`docs/WORKING_PLAN.md:1`을 SoT로 확정)
- 의사결정: “정책은 WORKING_PLAN 1곳, 상세는 링크” 원칙 채택
- 산출물: WORKING_PLAN 상단에 “정책/게이트/SoT 링크” 고정 + 나머지 문서에는 “참고 문서, SoT는 WORKING_PLAN” 문구만(중복 본문은 제거)

### 2) SEO/키워드/메타 “단일 파이프라인” 통합(반복 제거의 핵심)

- 목표: `generateMetadata(title/summary/OG/Twitter)`와 “자동 키워드/추천 태그/키워드 자동완성”을 같은 소스로 통합
- 리서치
  - 메타 생성 위치 목록화: `src/app/**/page.tsx`의 `generateMetadata`
  - 키워드 산출 위치 목록화: 검색 키워드 API, 글쓰기 자동 태그, 유사질문 토큰 등
- 의사결정(전략): “키워드 빌더 1개 + 메타 빌더 1개”로 통합하고, 나머지는 결과만 사용(중복 알고리즘 금지)
- 산출물(플랜 결과물 정의): 공용 메타 빌더/키워드 빌더 도입 계획 + 적용 우선순위(게시글 상세 → 검색 → 글쓰기)

### 3) “노출은 강조(Highlight)”, “분류 라벨은 숨김” UI 원칙 정리

- 목표: 사용자에게는 “학생/근로자” 같은 값만 자연스럽게 강조, “조건/유형/배경” 같은 라벨은 노출하지 않음
- 리서치: 라벨이 실제로 노출되는 지점 추적(예: 글쓰기 템플릿이 본문에 `<h3>조건</h3>` 형태로 삽입되는지 등)
- 의사결정: “라벨은 내부 분류/필터/추천에만, UI는 값만”을 디자인 규칙으로 고정
- 연계: `P0-13`(라벨 제거 + 강조 UI)

### 4) 피드백(Feedback) UX를 “최소 입력, 최대 신호”로 재설계

- 목표: 운영 효율(분류 가능)과 사용자 효율(제출 쉬움)을 동시에 확보
- 리서치: 진입 동선(사이드바)과 제출 폼(피드백/버그)의 입력 항목이 실제로 유효한 신호를 주는지 점검
- 의사결정: 사이드바는 “작은 이모지 + 툴팁”만, 폼은 “필수 입력 최소”로
- 연계: `P0-14`(피드백 UX 간소화 + 사이드바 피드백 아이콘-only)

### (C) 릴리즈 게이트 설계(Playwright + Rate limit 포함)

- 목표: CI/로컬/스테이징에서 “무엇을 언제 막을지”를 확정(재현 비용 최소화)
- 요약 설계
  - CI(PR): 빠른 정적 게이트만 “항상 필수” 유지 = `lint → type-check → build`(`.github/workflows/ci.yml:1`)
  - Release(Staging): “항상 필수” = Playwright 스모크 + Rate limit 스모크(예: `POST /api/__probe__` 반복 호출로 429 확인; `middleware.ts:6`) 실패 시 배포 중단
  - Local: 정적 게이트는 항상, E2E는 스테이징 URL/로컬 데이터 환경이 준비된 경우에만 수행

### 요청 이해한 내용(추가 반영 대상, 요약)

- (C) 릴리즈 게이트 설계: CI/로컬/스테이징에서 “무엇을 언제 막을지”를 확정(Playwright + Rate limit 포함)
- 게시글 상세: 공유 UI 중복 정리(좋아요 옆 공유 vs 하단 공유), 신고 버튼 빨강 제거 + 우측 끝 정렬, 추천 섹션 2개 동시 노출 금지(1개만), 답변/댓글 ↔ 추천 사이 구분선
- 사이드바 피드백: 아이콘(이모지)만 + 툴팁, 메뉴 텍스트 왼쪽(아이콘 슬롯)에 작게, 클릭 시 이동

### 현재 구현 근거(코드 기준)

- 공유 중복: 액션 행 공유 버튼 + 하단 공유 CTA + 공유 모달이 동시에 존재(`src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx:2270`, `src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx:3309`)
- 신고 버튼이 빨강 배경/텍스트로 과도하게 강조됨(`src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx:2315`)
- 추천이 “관련 글 + 같은 카테고리 인기글” 2개가 함께 렌더될 수 있음(`src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx:3259`)
- 관련 글 규칙: 태그(우선) 또는 제목 토큰(최대 4개)으로 검색어를 만들고 같은 카테고리에서 최신순 조회(`src/utils/postRecommendationFilters.ts:26`)
- CI는 현재 `lint/type-check/build/audit`만 있고 Playwright 게이트는 없음(`.github/workflows/ci.yml:1`)
- rate limit은 현재 `middleware.ts`의 in-memory Map 기반(서버리스 내구성 낮음)(`middleware.ts:6`)
- 사이드바 피드백은 현재 라벨 텍스트가 있음(`src/components/organisms/CategorySidebar.tsx:241`)

## P0 Execution Board (1 page)

아래 보드는 “지금 당장 병렬로 진행할 수 있는 P0 단위”만 요약한다. 상세 설계/작업 항목은 문서 하단의 P0/P1/P2 섹션을 따른다.

| ID | Primary | Support | Hot/Shared 리스크 | 산출물(예시) | 완료 기준(요약) |
| --- | --- | --- | --- | --- | --- |
| P0-0 | Lead | All | Shared(문서) | 운영 잠금/게이트 1페이지 요약 | Hot/공유 파일 규칙 + 머지 게이트가 문서로 고정 |
| P0-1 | Lead | Web Feature, Design Front | Shared(i18n/SEO) | `en` UI 숨김 + SEO 유지 + fallback | UI에서 `en` 미노출 + `/en/*` 렌더/alternates/sitemap 유지 |
| P0-2 | Design Front | Web Feature | Shared(messages) | `ko/vi` 하드코딩 제거 + 클립 0 | 핵심 플로우에서 `ko/vi` 텍스트 잘림 0(의도된 truncate 제외) |
| P0-3 | Design Front | Web Feature | - | 모바일 키보드/스크롤 하드닝 | iOS/Android에서 입력/제출 막힘 0 |
| P0-4 | Web Feature | Design Front | - | 이미지 표준화 + 코드스플리팅 + Query 튜닝 | 저속/저사양에서 체감 개선 + 불필요 백그라운드 요청 제거 |
| P0-5 | Design Front | - | - | A11y 최소 기준 + 터치 타깃 규격 | 아이콘 버튼 무라벨 0 + 모바일 최소 터치 크기 준수 |
| P0-6 | BE | Web Feature | Shared(API) | rate limit 유틸 + 429 규격 + UX | 지정 엔드포인트 429 동작 + 클라 UX 처리 완료 |
| P0-7 | Lead | Web Feature | - | Playwright 스모크 + 릴리즈 게이트 | CI/릴리즈 절차에 고정 + 실패 시 배포 중단 |
| P0-8 | Lead | BE, Web Feature | Shared(API) | 이벤트 스키마 + `/api/events` + 트리거 | 적재 확인(샘플) + 핵심 지표 목록 합의 |
| P0-9 | Lead | Design Front | - | 크로스브라우징/반응형 QA 리포트 | Blocker/Major 0, Minor는 P1로 이월 목록화 |
|P0-10 | Lead | Web Feature, BE  | Shared(API/DB) | 가이드라인 안내/유도 v1(비차단) | 최초 노출/확인 기록 + 작성 플로우는 영향 0 |
| P0-11 | BE | Web Feature, Design Front | Shared(API/DB) | 맞춤 숨김(안보기) v1 + 신고 즉시 숨김 | 신고한 사용자는 승인 전에도 즉시 숨김, 카드 “안보기”/“숨김 해제” 동작 |
| P0-12 | Web Feature | Lead, BE, Design Front | Shared(SEO/키워드) | SEO 메타 자동화 + 키워드 파이프라인 통합 | generateMetadata(OG/Twitter) ↔ 자동 키워드가 같은 소스(중복 로직 제거) |
| P0-13 | Design Front | Web Feature | Shared(UI) | 카드/템플릿 “강조 표시” 정리 | “조건/유형/배경” 라벨 노출 제거 + 값만 강조(배열 나열 대신) |
| P0-14 | Design Front | Web Feature | Shared(UI) | 피드백 UX 간소화 + 사이드바 피드백 아이콘화 | 버그 폼 단순화 + 제출 감사 메시지 + 사이드바는 이모지+툴팁만 |
| P0-15 | Design Front | Web Feature | Shared(상세 UI) | 게시글 상세 액션/추천 정리 | 공유/신고 UI 정리 + 추천 섹션 1개화 + 구분선 도입 |
| P0-16 | Design Front | Lead | Shared(UI/레이아웃) | 피드 카드 헤더 정렬 + 데스크톱 카드 폭 제한 | 제목/본문 시작점이 닉네임 기준 정렬 + 데스크톱 과확장 없음 |
| P0-17 | Lead | Design Front | Hot(레이아웃) | 좌측 사이드바 고정 + 독립 스크롤 | 메인 스크롤과 분리 + 사이드바 내부 스크롤만 동작 |
| P0-18 | Lead | Design Front | Hot(Header) | 헤더 “뒤로가기” 줄바꿈/깨짐 제거 | `Quay lại` 등 다국어에서 줄바꿈 0 + 헤더 높이/정렬 안정 |
| P0-19 | Web Feature | Design Front, Lead, BE | Shared(랭킹/메뉴) | 커뮤니티 랭킹: 온도-only + Event 자리 | 레벨 UI 제거 + 온도 36.5 기본 + 총멤버 숨김 + 우측 4컬럼/모바일 상단 Event 영역 |

## Progress Checklist (집계용)

### P0

- [ ] P0-0 (LEAD: Hot File 잠금/i18n 담당/게이트 고정)
- [ ] P0-1 (LEAD/WEB/FE: en UI 숨김 + alternates/sitemap 유지 + ko fallback)
- [ ] P0-2 (FE/WEB: ko/vi 하드코딩 제거 + 클립 0)
- [ ] P0-3 (FE: 모바일 키보드/스크롤 UX 하드닝)
- [ ] P0-4 (WEB/FE: 이미지 표준화 + 코드 스플리팅 + Query 튜닝)
- [ ] P0-5 (FE: A11y 최소 기준)
- [ ] P0-6 (BE/WEB: rate limit + 429 UX)
- [ ] P0-7 (LEAD/WEB: Playwright 스모크/게이트)
- [ ] P0-8 (LEAD/BE/WEB: 이벤트 스키마 + 수집)
- [ ] P0-9 (LEAD/FE: 크로스브라우징 QA)
- [ ] P0-10 (LEAD/WEB/BE/FE: 가이드라인 v1)
- [x] P0-11 (BE/WEB/FE: 숨김/신고 즉시 숨김)
- [ ] P0-12 (WEB/BE/FE: 메타/키워드 파이프라인 통합)
- [ ] P0-13 (FE/WEB: 라벨 제거 + 강조 UI)
- [ ] P0-14 (FE/WEB: 피드백 UX 간소화)
- [ ] P0-15 (FE/WEB: 게시글 상세 액션/추천 정리)
- [ ] P0-16 (FE/LEAD: 카드 헤더 정렬 + 데스크톱 폭 제한)
- [ ] P0-17 (LEAD/FE: 좌측 사이드바 고정 + 독립 스크롤)
- [ ] P0-18 (LEAD/FE: 헤더 뒤로가기 줄바꿈/정렬)
- [ ] P0-19 (WEB/FE/BE: 랭킹 온도-only + Event 자리)

### P1

- [ ] P1-1 (WEB/LEAD: Playwright 확장)
- [ ] P1-2 (BE: rate limit 고도화 + CAPTCHA 옵션)
- [ ] P1-3 (BE/WEB: Admin 경계/성능 정리)
- [ ] P1-4 (LEAD: 모니터링/Runbook)
- [ ] P1-5 (FE/LEAD: 디자인/컴포넌트 가이드)
- [ ] P1-6 (WEB: 온보딩 개인화)
- [ ] P1-7 (WEB: 신뢰/전환 고도화)
- [ ] P1-8 (WEB/BE: 출처 표기)
- [ ] P1-9 (BE: 모더레이션 자동화 고도화)
- [ ] P1-10 (WEB: 튜토리얼/리마인드)
- [ ] P1-11 (WEB/FE: 저속·오프라인 UX/PWA 폴백 v1)
- [ ] P1-12 (LEAD/WEB: 성능·접근성 감사 스크립트 정렬)

### P2

- [ ] P2-1 (BE: 캐시/스케일)
- [ ] P2-2 (BE: Feature Flag)
- [ ] P2-3 (LEAD: CMS 도입 판단)
- [ ] P2-4 (BE: 추천/분석 고도화)
- [ ] P2-5 (WEB: 미션/랭크/콘텐츠 확장)
- [ ] P2-6 (BE: AI 모더레이션/유사질문 임베딩)
- [ ] P2-7 (LEAD/WEB: 멀티 채널 퍼블리싱 v1)

### Hot File 요청 방식(충돌 방지)

- Hot File: `src/components/organisms/Header.tsx`, `src/components/templates/MainLayout.tsx`, `src/components/organisms/PostList.tsx`, `src/app/globals.css`
- 원칙: Hot File 직접 수정/머지는 Lead만 수행
- 요청 방법(Non-Lead)
  - 1) “왜 필요한지/재현/스크린샷/원하는 UX/영향 범위”를 남기고, 변경 후보를 구체화한다
  - 2) Hot File 외 영역(컴포넌트/유틸/스타일 토큰/테스트)을 먼저 분리 커밋으로 준비한다
  - 3) Lead가 Hot File에 최소 diff로 흡수 머지한다

### QA 체크리스트(P0-9)

- 자동(필수): `npm run lint` → `npm run type-check` → `SKIP_SITEMAP_DB=true npm run build` → Playwright 스모크
- Playwright 스모크(필수): 홈 로드, ko↔vi 전환, 검색 진입, 상세 진입, 글쓰기 시도→로그인/게이팅, 429 케이스
- 수동(필수): iPhone SE급~태블릿, iOS Safari/Android Chrome/Edge에서 로그인 모달/작성/검색/프로필/구독/알림/인증 플로우 확인

## 현황 기반 평가(선별)

### 이미 반영되었거나 방향이 맞는 항목

- 모바일 사이드바: 모바일에서 `CategorySidebar`는 드로어(Sheet)로 가려지는 구조가 이미 적용됨(`src/components/templates/MainLayout.tsx`)
- 원핸드 내비: `BottomNavigation` 구현/렌더링이 이미 존재함(“미구현”으로 가정하고 새로 만드는 작업은 불필요)(`src/components/organisms/BottomNavigation.tsx`, `src/app/[lang]/layout.tsx`)
- 신뢰 배지: 배지 표시 컴포넌트가 분리되어 확장/통일이 쉬운 구조(`src/components/molecules/user/UserTrustBadge.tsx`)
- 코드 스플리팅: 무거운 UI 일부는 `dynamic import`로 분리 중(추가 확대가 과제)(`src/components/organisms/Header.tsx`)
- PWA 기반: `next-pwa` 적용과 `manifest.json`이 존재(기반은 있으나, 오프라인 폴백/캐시 전략은 P1에서 확정 필요)(`next.config.ts:1`)

### P0로 반영할 가치가 큰 항목(출시 품질 직결)

- 모바일 터치 타깃(44px): 아이콘 버튼/헤더 액션에서 최소 크기 규격을 강제(특히 모바일에서 `p-1` 계열 점검)
- 모바일 키보드/세이프에어리어/스크롤: 글/답변/댓글/모달 입력에서 “키보드 올라와도 제출/완료 가능”을 종료조건으로
- 신뢰→전환 UX: 비인증 사용자에게 인증 CTA를 자연스럽게 노출, 인증 답변의 시각적 강조(채택/신뢰 전환)
- TanStack Query 튜닝: `enabled`/`staleTime`/refetch 정책을 “열릴 때만/필요할 때만”으로 고정(모바일 데이터/배터리 최적화)
- 신고 UX: 신고 직후 사용자 피드백(처리됨/숨김) 제공, 최소한의 사용자별 숨김/차단 로직 검토(스팸 리스크가 크면 P0)
  - 보완 포인트: 서버에서 “룰 기반(금칙어/연락처/광고)” 검증이 이미 있더라도, 신고 후 UX(즉시 숨김/처리됨 안내)와 운영 큐(관리자 확인 경로)가 없으면 체감 품질이 낮아짐

### P1로 반영하는 것이 합리적인 항목(가치 크지만 범위/의존성 큼)

- 온보딩 개인화(추가 유저 필드/마이그레이션 포함): 관심사/상태 수집 → 추천/피드에 반영(데이터 모델 합의 필요)
- 질문자↔답변자 전환 유도: 채택 리마인드/팔로우 유도(마이크로 전환 설계)
- 출처 표기: 답변 UI에 “출처/날짜” 구조화 필드(데이터 모델 + UX 합의 필요, UGC 링크 정책 유지)
- 검색 UX 고도화: 필터/추천 키워드/연관 검색(현 구조 위에 점진적 개선)
- 저속·불안정 네트워크 대응: 오프라인 폴백, 캐시 정책, 로딩/오류 UX, 글쓰기 드래프트 보존(필요 구간부터)
- 성능/접근성 감사 자동화: 기존 스크립트의 라우트 불일치 해소 후, “릴리즈 차단”이 아닌 “정기 점검(week/nightly)”로 운영

### P2(확장/성장) 또는 보류

- 미션/랭크/게이미피케이션(장기 ROI는 높지만 MVP 범위 초과 가능)
- 숏폼/카드뉴스 등 멀티미디어 UGC 확장(운영/모더레이션 부담이 커 단계적 추진)
- 실시간(WebSocket) 고도화, 대규모 검색/추천(트래픽/데이터 축적 이후)
- 멀티 채널 퍼블리싱(외부 확산): 자동 게시의 대상/권한/운영 부담이 크므로 “운영자 큐레이션 콘텐츠”부터 단계적으로

## 운영/병렬 규칙(공통)

- Hot File(Lead only): `src/components/organisms/Header.tsx`, `src/components/templates/MainLayout.tsx`, `src/components/organisms/PostList.tsx`, `src/app/globals.css`
- 공유 충돌 파일(사전 합의 후): `messages/ko.json`, `messages/vi.json`, `src/repo/keys.ts`, `src/app/[lang]/layout.tsx`, `src/app/sitemap.ts`, `middleware.ts`
- i18n 키 추가 담당 1인 지정(권장: Lead): `ko/vi`만 의무, `en`은 신규 작업에서 추가하지 않음
- 통합 윈도우 고정(권장: 하루 1회): 게이트 통과 후만 머지
- 머지 게이트(필수): `npm run lint` → `npm run type-check` → `SKIP_SITEMAP_DB=true npm run build` → Playwright 스모크 통과 → (Lead) 수동 QA 체크리스트 OK

## 소유권(역할)

- Design Front: `src/components/**`, 반응형/A11y/미디어 품질, 모바일 입력 UX
- Web Feature: `src/repo/**`, SSR/Hydration, 페이지 기능(Hot File 제외), 클라이언트 상태/UX 처리
- BE: `src/app/api/**`, `src/lib/db/**`, 권한/레이트리밋/계측 저장
- Lead: Hot File, 문서, 품질 게이트, 릴리즈 QA, 통합/충돌 조정

---

## 작업 기록 템플릿(append-only)

#### (YYYY-MM-DD) [AGENT] 작업명 (P0/P1)

- 플랜(체크리스트)
  - [ ] 서브태스크 1
  - [ ] 서브태스크 2
- 현황 분석(코드 기준)
  - 현재 구현/문제 위치:
  - 재현/리스크:
- 변경 내용(why/what)
  - why:
  - what:
- 검증
  - [ ] npm run lint
  - [ ] npm run type-check
  - [ ] npm run build
- 변경 파일
  - path1
  - path2
- 커밋 준비(필수)
  - 커밋 스코프(요청 1건):
  - 필요한 파일 목록:
  - 필요 검증(lint/type-check/build/기타):
  - 의존성/선행 작업:
  - 커밋 메시지 제안:
- 다음 액션/의존성
  - (예: BE API 선행 필요 / FE UI 확정 필요)

#### (2025-12-20) [FE] 인증 요약 CTA/액션 정렬 + 템플릿 입력 컴팩트 (P0-13/P0-14)

- 플랜(체크리스트)
  - [x] PostCard 인증 요약 라벨을 버튼화(hover 강조) + 답변 앵커 이동
  - [x] PostCard 하단 액션/카운트를 1줄 고정(모바일 포함)
  - [x] 질문 템플릿 입력 영역(조건/목표/배경) 레이아웃 컴팩트화
  - [x] 사이드바 피드백 메뉴를 텍스트 버튼으로 전환
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
- 다음 액션/의존성
  - 모바일/데스크톱에서 인증 요약 라벨 길이별 레이아웃 확인 필요

#### (2025-12-20) [FE] 프로필 통계 1행 유지 + 프로필 설정 헤더 정합 (P0-2)

- 플랜(체크리스트)
  - [x] 프로필 통계 5개를 모바일에서도 1행 유지(가로 스크롤 허용)
  - [x] 프로필 설정 페이지 헤더를 메인 헤더 구성과 동일하게 노출
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
- 다음 액션/의존성
  - 모바일 프로필 통계 가로 스크롤 UX 확인 필요

#### (2025-12-20) [LEAD] 카드 정렬/폭 축소 + 좌측 사이드바 고정 (P0-16/P0-17)

- 플랜(체크리스트)
  - [x] [FE] PostCard 제목/본문/태그/액션을 닉네임 기준으로 정렬(lg 이상)
  - [x] [LEAD] 데스크톱 메인 컬럼 폭 축소(1040px → 960px) + 헤더 정렬
  - [x] [LEAD] 좌측 사이드바 sticky 고정 + 독립 스크롤 보강
- 현황 분석(코드 기준)
  - 현재 구현/문제 위치: `src/components/molecules/cards/PostCard.tsx`, `src/components/templates/MainLayout.tsx`, `src/components/organisms/Header.tsx`, `src/components/organisms/CategorySidebar.tsx`
  - 재현/리스크: 데스크톱에서 카드 가로 길이 과도 + 제목/본문이 아바타 아래로 밀림, 좌측 사이드바 스크롤이 메인과 분리되지 않음
- 변경 내용(why/what)
  - why: 데스크톱 가독성/정렬 개선 + 좌측 사이드바 고정성 확보
  - what: 카드 본문/태그/액션에 `lg:pl-12` 적용, 2xl 메인 폭 960px로 축소, 좌측 레일 sticky 적용/overscroll 보강
- 검증
  - [ ] npm run lint
  - [ ] npm run type-check
  - [ ] npm run build
- 변경 파일
  - src/components/molecules/cards/PostCard.tsx
  - src/components/templates/MainLayout.tsx
  - src/components/organisms/Header.tsx
  - src/components/organisms/CategorySidebar.tsx
  - docs/WORKING_PLAN.md
- 커밋 준비(필수)
  - 커밋 스코프(요청 1건): P0-16/17 카드 정렬/폭 축소 + 좌측 사이드바 고정
  - 필요한 파일 목록: 위 변경 파일 전체
  - 필요 검증(lint/type-check/build/기타): lint/build 권장
  - 의존성/선행 작업: 없음(Hot File)
  - 커밋 메시지 제안: `[LEAD] align card content + fix sidebar sticky`
- 다음 액션/의존성
  - 데스크톱/태블릿에서 카드 폭/정렬 체감 확인
  - 좌측 사이드바 스크롤 분리 동작 확인

#### (2025-12-20) [FE] 게시글 안보기 아이콘화 + 우상단 배치 (P0-13)

- 플랜(체크리스트)
  - [x] 하단 텍스트 버튼 제거
  - [x] 우상단 이모지 버튼으로 전환 + Tooltip 제공
  - [x] 숨김 상태에서도 동일 UI로 토글
- 현황 분석(코드 기준)
  - 현재 구현/문제 위치: `src/components/molecules/cards/PostCard.tsx`
  - 재현/리스크: 하단 액션 행에 “안보기” 텍스트가 섞여 시각적 균형이 깨짐
- 변경 내용(why/what)
  - why: 카드 하단 액션은 통일된 아이콘 행으로 유지하고, 숨김 동선은 상단 보조 액션으로 분리
  - what: 상단 우측에 이모지 버튼(tooltip/aria-label) 배치, 하단 텍스트 버튼 제거
- 검증
  - [ ] npm run lint
  - [ ] npm run type-check
  - [ ] npm run build
- 변경 파일
  - src/components/molecules/cards/PostCard.tsx
- 다음 액션/의존성
  - 카드 상단 여백과 겹침 여부 확인 필요

#### (2025-12-20) [WEB/BE] 맞춤 숨김 v1 + 신고 즉시 숨김 (P0-11)

- 플랜(체크리스트)
  - [x] /api/hides GET/POST/DELETE 추가 (content_reports 기반)
  - [x] 신고 API에서 content_reports 동시 기록
  - [x] 카드/상세에서 숨김 표시 + 숨김 해제
  - [x] hide 쿼리/뮤테이션 + report 성공 시 hide 캐시 갱신
- 현황 분석(코드 기준)
  - 현재 구현/문제 위치: 신고는 reports 테이블만 기록, 사용자별 숨김 저장/렌더 경로 없음
  - 재현/리스크: 신고 직후에도 리스트/상세에서 콘텐츠가 계속 노출됨
- 변경 내용(why/what)
  - why: 신고 즉시 숨김 요구 사항과 사용자 맞춤 숨김 v1 제공
  - what: content_reports 기반 hides API/쿼리 추가, 카드/상세에서 숨김 상태 렌더, 신고 성공 시 hide 캐시 반영
- 검증
  - [x] npm run lint
  - [ ] npm run type-check
  - [x] SKIP_SITEMAP_DB=true npm run build
- 변경 파일
  - src/app/api/hides/route.ts
  - src/app/api/reports/route.ts
  - src/app/api/posts/[id]/report/route.ts
  - src/app/api/answers/[id]/report/route.ts
  - src/app/api/comments/[id]/report/route.ts
  - src/repo/hides/types.ts
  - src/repo/hides/fetch.ts
  - src/repo/hides/query.ts
  - src/repo/hides/mutation.ts
  - src/repo/keys.ts
  - src/repo/reports/mutation.ts
  - src/components/molecules/cards/PostCard.tsx
  - src/components/molecules/cards/AnswerCard.tsx
  - src/components/molecules/cards/CommentCard.tsx
  - src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx
  - docs/WORKING_PLAN.md
- 커밋 준비(필수)
  - 커밋 스코프(요청 1건): P0-11 숨김 v1 + 신고 즉시 숨김
  - 필요한 파일 목록: 위 변경 파일
  - 필요 검증(lint/type-check/build/기타): lint/build 완료, type-check 미실행
  - 의존성/선행 작업: 없음
  - 커밋 메시지 제안: [WEB/BE] P0-11 hide v1 + report immediate hide
- 다음 액션/의존성
  - type-check 필요 시 실행

## P0 (출시 전: Launch blocking)

#### (2025-12-20) [LEAD] P0-0 운영/병렬 규칙 고정 (P0)

- 플랜(체크리스트)
  - [ ] [LEAD] Hot File 잠금/소유권 요약 1페이지 반영
  - [ ] [LEAD] i18n 키 담당/요청 프로세스 확정
  - [ ] [LEAD] 게이트(lint/type-check/build + Playwright) 고정

- 목표: Hot File 충돌/번역키 충돌/통합 타이밍 문제를 구조적으로 차단
- 작업
  - Hot File 단일 소유 재확인: Header/MainLayout/PostList/globals.css는 Lead만 머지
  - i18n 키 추가 담당 1인 지정(Lead 권장): `messages/ko.json`, `messages/vi.json`만 의무
  - 통합 윈도우/릴리즈 게이트 고정: lint/type-check/build + Playwright 통과 후만 머지
- 완료 기준: `docs/EXECUTION_PLAN.md`에 “잠금/소유/게이트”가 1페이지 요약으로 반영

#### (2025-12-20) [LEAD] P0-1 en UI 숨김 + SEO 유지 (P0)

- 플랜(체크리스트)
  - [ ] [FE] LanguageSwitcher en 숨김(ko/vi만 노출)
  - [ ] [WEB] sitemap/alternates en 유지 + locale fallback 병합
  - [ ] [LEAD] QA 기준(ko/vi UI, en SEO 유지) 문서 반영

- 목표: 사용자는 `ko/vi`만 보되, 검색엔진은 `en` URL을 계속 발견/색인 가능
- 작업(핵심 파일 힌트)
  - UI: 언어 스위치에서 `en` 제거(예: `src/components/atoms/LanguageSwitcher.tsx`에 UI_LOCALES = `['ko','vi']`)
  - SEO: `src/app/sitemap.ts`의 locales = `['ko','en','vi']` 유지
  - Metadata: `src/app/[lang]/layout.tsx`의 alternates.languages에 `en` 유지
  - Fallback: 앞으로 `en` 번역을 추가하지 않아도 렌더가 깨지지 않게 dictionary 로딩 단계에서 `ko` 기반 fallback 병합
- QA
  - UI에서 언어 선택에 `en`이 보이지 않음
  - 직접 URL `/en/...` 접근 시 페이지 렌더/메타 alternates/sitemap의 `en` 노출 유지

#### (2025-12-20) [FE] P0-2 i18n 전수 점검(ko/vi) + 텍스트 길이/클립 제거 (P0)

- 플랜(체크리스트)
  - [ ] [FE] 컴포넌트 하드코딩 텍스트 제거
  - [ ] [WEB] 페이지/모달 하드코딩 텍스트 제거
  - [ ] [LEAD] messages 키 정리/중복 제거

- 목표: 출시 직전 가장 많이 터지는 “베트남어 길이/하드코딩/번역 누락/클립” 제거
- 작업
  - 하드코딩 문자열 제거(CTA/배지/툴팁/에러/빈상태 우선) → `ko/vi` 키로 통일
  - “클립” 패턴 수정: `min-w-0`, `break-words`, `flex-wrap`, padding 기반 버튼, 긴 라벨은 2줄 허용(의도된 `truncate` 제외)
  - 신규 작업부터 `en` 키 추가/검수는 하지 않되, `en` 렌더 fallback 병합으로 깨짐 방지
- 완료 기준: 핵심 플로우(홈/검색/상세/글쓰기/프로필/구독/알림/인증/피드백)에서 `ko/vi` 기준 “텍스트 잘림 0(의도된 truncate 제외)”

#### (2025-12-20) [FE] P0-3 모바일 키보드/스크롤(WebView 포함) UX 하드닝 (P0)

- 플랜(체크리스트)
  - [ ] [FE] 입력 폼 safe-area/100dvh/overflow 점검
  - [ ] [FE] 키보드 노출 시 제출 버튼 접근 테스트

- 목표: iOS/Android에서 입력 폼이 키보드에 가려지거나 스크롤이 잠기는 문제 제거
- 작업
  - 글/답변/댓글/모달 입력에서 safe-area + `100dvh` + overflow 처리 점검
  - “키보드 올라옴 → 제출 버튼 접근 가능”을 종료 조건으로 맞춤(로그인 모달 포함)
- 완료 기준: iPhone SE급에서도 입력/제출이 막히지 않음

#### (2025-12-20) [WEB] P0-4 퍼포먼스 1차(저사양/저속) (P0)

- 플랜(체크리스트)
  - [ ] [FE] 이미지 sizes/lazy/placeholder 통일
  - [ ] [WEB] dynamic import 확대(에디터/모달/관리자)
  - [ ] [WEB] Query enabled/staleTime 튜닝

- 목표: 초기 로딩/스크롤 체감 개선(이미지/무거운 UI 중심 + 불필요 API 호출 감소)
- 작업
  - 이미지 표준화: 피드/썸네일을 공용 컴포넌트로 통일하고 `next/image`의 `sizes`/lazy/placeholder 규격화(과한 해상도 요청 방지)
  - 코드 스플리팅: 에디터/모달/관리자/리더보드 등 무거운 컴포넌트 `dynamic import` 확대
  - Query 튜닝: 알림/모달/드로어/탭 등 “열렸을 때만” 요청(`enabled`), 불필요 refetch 제거, 적정 `staleTime` 설정
- 완료 기준: 저속 네트워크에서 첫 인터랙션 체감 개선 + “불필요 백그라운드 요청”이 발생하지 않음

#### (2025-12-20) [FE] P0-5 A11y 최소 기준(출시 차단만) (P0)

- 플랜(체크리스트)
  - [ ] [FE] 아이콘-only 버튼 aria-label 전수
  - [ ] [FE] 터치 타깃 최소 규격 점검

- 목표: 아이콘 버튼/내비/모달 접근성 결함으로 인한 이탈 방지
- 작업
  - 아이콘-only 버튼 `aria-label` 전수(예: 네비/카드 액션/헤더)
  - 포커스 링/키보드 탭 이동/대비 기본 점검(치명 항목만)
- 완료 기준: 주요 화면에서 “무라벨 버튼 0”

#### (2025-12-20) [BE] P0-6 Rate limit 필수 적용(쓰기 API 우선) (P0)

- 플랜(체크리스트)
  - [ ] [BE] rate limit 유틸 + 정책 정의
  - [ ] [WEB] 429 UX 처리(토스트/재시도 안내)
  - [ ] [LEAD] 적용 엔드포인트 목록 확정

- 목표: 스팸/남용 방어(출시 직후 가장 흔한 장애 요인)
- 작업
  - 공용 rate limit 유틸 설계(스토리지 포함): Redis/KV 우선, 로컬/개발 환경은 in-memory fallback(환경변수 on/off)
  - 적용 우선순위(필수): 글/답변/댓글/신고/피드백/인증 요청 + 비용 큰 읽기(검색/키워드 추천 등)
  - 429 응답 규격 통일 + 프론트 UX 처리(토스트/재시도 안내, `Retry-After` 준수)
- 완료 기준: 지정된 엔드포인트에서 임계치 초과 시 429 + 클라이언트 UX 처리 완료

#### (2025-12-20) [LEAD] P0-7 Playwright 필수 도입(릴리즈 게이트) (P0)

- 플랜(체크리스트)
  - [ ] [WEB] Playwright 스모크 시나리오 작성
  - [ ] [LEAD] 릴리즈 게이트/CI 연결 문서화

- 목표: 최소 자동화로 “깨짐”을 배포 전에 잡는다
- 작업
  - Playwright 설정/스크립트 추가(`test:e2e` 등) + 릴리즈 게이트에 포함
  - 브라우저: Chromium + WebKit(iOS 대체) + 모바일 viewport 1종
  - 스모크 시나리오(로그인 없이 가능한 범위 우선)
    - 홈 로드/언어(ko↔vi) 전환
    - 검색 페이지/상세 진입
    - 글쓰기 시도 → 로그인 모달/게이팅 동작 확인
    - Rate limit 429 동작(테스트 가능한 조건/엔드포인트 포함)
- 릴리즈 게이트 설계(필수, C)
  - CI(PR): 정적 게이트만 유지(항상 필수)
    - `npm run lint` → `npm run type-check` → `SKIP_SITEMAP_DB=true npm run build` (`.github/workflows/ci.yml:1`)
  - Release(Staging): E2E 게이트(항상 필수)
    - Playwright 스모크(Chromium + WebKit + Mobile viewport 1종)
    - Rate limit 스모크(429): 미인증/무DB로도 검증 가능한 방식 우선(예: `POST /api/__probe__` 반복 호출로 middleware 429 확인, `middleware.ts:1`)
    - 성공/실패 기준을 “배포 전 체크리스트”에 고정(실패 시 배포 중단)
  - Local(개발자): 빠른 게이트 + 필요 시 E2E
    - 빠른 게이트는 항상 수행, E2E는 “스테이징 URL 또는 로컬 데이터 환경”이 준비된 경우에만 수행
  - 스크립트 정렬(필요)
    - 기존 감사/스모크 스크립트는 현재 라우트(`/[lang]`) 기준으로 재정렬 필요(`scripts/performance-audit.js:1`, `scripts/accessibility-audit.js:1`, `scripts/verify-api.sh:1`)
- 완료 기준: “릴리즈 전 필수로 돌리는 Playwright 스모크”가 문서/CI에 고정되고, 실패 시 배포 중단

#### (2025-12-20) [LEAD] P0-8 핵심 지표 이벤트 정의 + 수집 v1 (P0)

- 플랜(체크리스트)
  - [ ] [LEAD] 이벤트 목록/스키마 정의
  - [ ] [BE] `/api/events` 저장/검증
  - [ ] [WEB] 핵심 트리거 연결

- 목표: 출시 후 의사결정/운영이 가능한 최소 계측
- 작업
  - 이벤트 목록/필드/트리거 정의(DAU, 질문/답변/댓글, 채택/해결, 신고, 인증 신청, 구독/알림 등)
  - `/api/events` 수집 + 저장(크기 제한/개인정보 최소화/검증)
  - 클라이언트는 핵심 트리거에만 연결(실패해도 UX 영향 0)
- 완료 기준: 이벤트가 실제 적재되고(샘플 확인), “볼 지표”가 합의됨

#### (2025-12-20) [LEAD] P0-9 크로스브라우징/반응형 QA 라운드 (P0)

- 플랜(체크리스트)
  - [ ] [LEAD] QA 매트릭스/체크리스트 확정
  - [ ] [FE] 이슈 수정 및 재검증

- 목표: iOS Safari/Android Chrome/Edge에서 치명 레이아웃/입력 결함 제거
- 작업: iPhone SE~태블릿까지 체크리스트 기반 수동 QA(스크린샷/재현 스텝 기록)
- 완료 기준: Blocker/Major 0, Minor는 P1 이월 목록화

#### (2025-12-20) [LEAD] P0-10 신규 사용자 가이드라인 안내/유도 v1 (P0)

- 플랜(체크리스트)
  - [ ] [LEAD] 가이드라인 정책/문구 확정(비차단)
  - [ ] [WEB] 1회 노출/상태 저장 UX 구현
  - [ ] [BE] 저장 필드/버전 관리
  - [ ] [FE] 모달/배너 UI 정리

- 목표: “신뢰 기반 커뮤니티” 규칙을 신규 유저에게 확실히 안내하되, 게시글 작성(작성/제출) 플로우에는 영향을 주지 않는다
- 반영 범위(권장 v1)
  - 최초 1회 “규칙 안내 모달/튜토리얼” 노출(규칙 체크박스 + 스크롤 확인 포함 가능)
  - 사용자가 “확인했어요/동의합니다”를 누르면 확인 시점/버전 저장(선택)
  - 사용자가 닫아도 작성 플로우는 영향 0(작성/제출 차단 없음)
  - 첫 작성 화면에서는 “가이드라인 링크/요약”을 비차단 배너/툴팁으로 한 번 더 리마인드(선택)
- 구현 힌트
  - 데이터: `users`에 `community_guidelines_seen_at` + (선택) `community_guidelines_accepted_at`, `community_guidelines_version` 추가
  - UI: 첫 로그인/온보딩 완료 직후 또는 첫 작성 시점에 모달로 노출(현재 온보딩 플로우와 충돌 없이 1회만)
- 완료 기준
  - 신규 유저가 1회 노출/확인 후 반복 노출이 과하지 않음(1회 또는 낮은 빈도)
  - 작성/제출 플로우에 영향 0(가이드라인 확인 여부로 작성이 막히지 않음)

#### (2025-12-20) [BE] P0-11 맞춤 숨김(안보기) v1 + 신고 즉시 숨김 (P0)

- 플랜(체크리스트)
  - [ ] [BE] user_content_hides 테이블 + API
  - [ ] [WEB] 리스트/검색/상세 필터링 적용
  - [ ] [FE] 숨김/해제 UI + 토스트

- 목표: 사용자가 불편/유해 콘텐츠를 “즉시” 피드에서 제외할 수 있게 하고, 신고 승인 전이라도 신고자에게는 해당 콘텐츠가 보이지 않게 한다
- 요구사항(확정)
  - 신고한 사용자는 승인 전이라도 해당 콘텐츠(게시글/답변/댓글)를 즉시 숨김 처리
  - 신고와 무관하게 게시글 카드에서 “안보기(숨김)”를 사용자가 직접 설정 가능(맞춤 처리)
- 구현 가이드(v1 권장)
  - 데이터: `user_content_hides`(가칭) 테이블 추가(`user_id`, `target_type`(post/answer/comment), `target_id`, `reason`(report/manual), `created_at`) + 유니크 인덱스
  - API
    - 신고 API에서 “신고 생성”과 “신고자 숨김 생성”을 함께 처리(동일 요청 내 upsert)
    - “안보기/숨김 해제” 전용 API 추가(토글); 별도 “숨김 관리 페이지”는 만들지 않음(토스트 Undo만)
  - 노출/필터링
    - 리스트/검색/트렌딩에서 숨김 대상은 기본적으로 제외
    - 상세 화면에서는 “숨김 처리된 콘텐츠” 플레이스홀더 + “숨김 해제” 버튼(해제 시 토스트 + Undo 제공)
- 완료 기준
  - 신고 직후(승인 전) 신고자 피드/검색/상세에서 해당 콘텐츠가 즉시 비노출
  - 게시글 카드에서 “안보기”가 동작하고, 사용자 기준으로 지속됨(새로고침/다시 방문에도 유지)
  - 숨김된 콘텐츠를 직접 URL로 접근하면 “숨김 처리됨” 화면이 나오고, 해제는 토스트 Undo로 충분함

#### (2025-12-20) [WEB] P0-12 SEO 메타 자동화 + 키워드 파이프라인 통합 (P0)

- 플랜(체크리스트)
  - [ ] [WEB] 메타 빌더/키워드 빌더 도입
  - [ ] [BE] 키워드 API/연동 정리
  - [ ] [FE] UI 해시태그/추천 표시 연동

- 목표: SEO 메타(title/description/OG/Twitter) 생성과 “자동 키워드(해시태그/추천 키워드)”를 같은 소스에서 만들고, 중복 로직을 제거한다
- 핵심 원칙(효율/반복 최소화)
  - 키워드 추출/랭킹 로직은 1곳(공용 유틸)에서만 관리하고, UI/SEO/API는 이를 호출만 한다
  - `generateMetadata`는 페이지마다 복붙하지 않고 공용 빌더를 사용한다(타이틀/요약/OG/Twitter 카드 규격 통일)
- 작업(권장)
  - 공용 SEO 빌더 도입: `src/lib/seo/metadata.ts`(가칭)로 title/description/canonical/OG/Twitter 생성 규격 통일
  - 공용 키워드 빌더 도입: `src/lib/seo/keywords.ts`(가칭)로 “추천 키워드/태그 후보”를 산출
    - 입력: `{ title, contentText, tags, category, subcategory, locale }`
    - 출력: `{ primary: string[], secondary: string[] }`(노출/저장 용도 분리 가능)
  - UI 연동(대체)
    - “자동 키워드 #” 노출은 단순 토큰 분해가 아니라, 공용 키워드 빌더(또는 `/api/search/keywords`) 결과로 대체
    - 기존 자동 태그/추천 태그(글쓰기)도 같은 빌더를 사용하도록 교체(현재 컴포넌트 내부 매핑/토큰 로직 제거)
  - generateMetadata 연동
    - 게시글 상세 `generateMetadata`의 `keywords`/`openGraph.tags`는 공용 키워드 빌더 결과를 사용(태그가 없을 때도 안정)
- 완료 기준
  - `generateMetadata`(OG/Twitter 포함)와 “자동 키워드(해시태그)”가 동일 파이프라인을 사용
  - 키워드 로직이 1곳에만 존재하고(중복 제거), UI/SEO/API 모두 결과만 소비

#### (2025-12-20) [FE] P0-13 카드/템플릿 “강조 표시” 정리(라벨 제거) (P0)

- 플랜(체크리스트)
  - [ ] [FE] 라벨 숨김 + 강조 UI 적용
  - [ ] [WEB] 템플릿 출력 규칙 정리

- 목표: “조건/유형/배경”은 분류/표시 기준으로만 쓰고, 카드/UI에는 라벨을 노출하지 않는다(예: “유형 학생”이 아니라 “학생”만)
- 작업(권장)
  - 글쓰기 템플릿(조건/목표/배경) 출력 방식 정리
    - 사용자에게는 값 자체만 “강조(Highlight)”로 보이게 하고, 라벨(조건/목표/배경)은 숨긴다
    - 카드/요약 영역에서 배열 나열(#키워드 여러 개) 대신 “핵심 1~2개 강조”로 표시(나머지는 툴팁/상세에서만)
  - 추천/배지/요약 정보 표시 규칙 통일
    - 상단 강조는 “한 줄/한 덩어리”로: 아이콘/색/배경으로 강조(텍스트를 나열하지 않음)
    - 라벨이 필요한 경우도 텍스트로 붙이지 말고 툴팁으로 대체
- 완료 기준
  - 카드/리스트에서 “조건/유형/배경” 같은 라벨 텍스트가 보이지 않음
  - 상단 강조는 단순 배열이 아니라 “강조 UI”로 통일됨(정보 과밀 방지)

#### (2025-12-20) [FE] P0-14 피드백 UX 간소화 + 사이드바 피드백 아이콘화 (P0)

- 플랜(체크리스트)
  - [ ] [FE] 피드백 UI 간소화
  - [ ] [WEB] 피드백 폼 필드 최소화 + 제출 UX

- 목표: 피드백 제출 허들을 낮추고, 사이드바 피드백 진입을 “작고 명확한 이모지 + 툴팁”으로 정리한다
- 작업(권장)
  - 피드백 페이지
    - 만족도: “전반적인 경험을 선택” 같은 짧은 힌트 대신, 만족도 아래에 텍스트 입력을 유도(예: “본 사이트에 대한 전반적인 경험을 작성해주세요”)
    - 버그: 영향도 조사 제거 + 재현 단계 입력 제거(필수 입력은 “버그 설명”만)
    - 제출 후: 감사 메시지로 마무리(예: “감사합니다. 제출하신 내용 반영하여 페이지 개선에 힘쓰겠습니다.”)
    - “현재 페이지(URL)” 입력 UI는 노출하지 않고 자동 수집만 유지(표시는 제거)
  - 사이드바 피드백
    - 메뉴 리스트의 “아이콘 슬롯(메뉴 텍스트 왼쪽)”에 피드백을 “아이콘(이모지)만”으로 배치(라벨 텍스트는 숨김)
    - 설명은 Tooltip로 대체(접근성 `aria-label` 포함), 클릭 시 `/${lang}/feedback`로 이동
- 완료 기준
  - 버그 폼에서 영향도/재현 단계가 사라지고, 제출 후 감사 UX가 일관됨
  - 사이드바 피드백은 이모지+툴팁만으로 동작하며, 시각적 노이즈가 줄어듦

#### (2025-12-20) [FE] P0-15 게시글 상세 액션/추천 정리 (P0)

- 목표: 중복 UI(공유), 과도한 강조(신고), 추천 섹션 과밀(2개 동시 노출)을 제거해 “한 화면 1규칙”으로 단순화한다
- 현황(코드 근거)
  - 공유 UI가 3중 구조로 중복됨: 액션 버튼(Like 옆) + 하단 공유 CTA + 모달 메뉴(`src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx:2240`)
  - 신고 버튼이 과도하게 빨간색/큰 버튼으로 노출됨(`src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx:2315`)
  - 추천 섹션이 “관련 글 + 같은 카테고리 인기글” 2개가 동시에 노출될 수 있음(`src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx:3180`)
  - 관련 글 규칙: 태그(우선) 또는 제목 토큰 최대 4개로 검색어를 만들고, 같은 카테고리에서 최신순으로 조회(`src/utils/postRecommendationFilters.ts:1`)
- 작업(권장)
  - 공유 UI 단일화(중복 제거)
    - “하단 공유 CTA(플랫폼 버튼)”을 단일 SoT로 유지
    - Like 옆 공유 버튼은 “하단 공유 CTA로 스크롤/포커스 이동”으로 역할 변경(옵션 목록 중복 제거)
    - 모달형 공유 메뉴는 제거(또는 CTA를 재사용하도록 통합)
  - 신고 UI 톤다운 + 정렬 정리
    - 빨간 배경/텍스트 강조 제거, 다른 아이콘 버튼과 동일 톤(중립색) + Tooltip로 의미 제공
    - 액션 행의 가장 오른쪽에 아이콘-only로 배치(텍스트 라벨은 Tooltip로 대체)
  - 추천 섹션 1개화 + 구분선 도입
    - 관련 글이 충분히 나오면(예: N개 이상) 관련 글만 노출, 부족하면 같은 카테고리 인기글로 대체(둘 다는 노출하지 않음)
    - 답변/댓글 영역과 추천 영역 사이에 구분선(Separator/Border) 도입
- 완료 기준
  - 공유 동선은 “1개의 옵션 목록”만 존재(중복 UI 제거)
  - 신고 버튼은 과도한 시각적 경고(빨강) 없이도 접근 가능(툴팁/접근성 포함)
- 추천은 항상 1개 섹션만 보이고, 답변/댓글과 시각적으로 분리됨

#### (2025-12-20) [FE] P0-16 피드 카드 헤더 정렬 + 데스크톱 카드 폭 제한 (P0)

- 플랜(체크리스트)
  - [ ] [FE] 카드 헤더 레이아웃 정렬(닉네임 기준으로 제목/본문 시작점 통일)
  - [ ] [LEAD] 데스크톱 카드 최대 폭 제한 + 그리드 폭 재정렬(Hot File)

- 목표: 데스크톱에서 카드 폭 과확장을 줄이고, 프로필 사진 아래로 텍스트가 밀리지 않도록 “닉네임 시작점 정렬”로 정돈한다
- 현황(스크린샷 기준)
  - 카드 제목/본문이 아바타 아래로 내려가 시선 흐름이 끊김
  - 초광폭 화면에서 카드가 가로로 길어져 읽기 집중이 떨어짐
- 작업(권장)
  - 카드 헤더 정렬 기준 통일
    - 닉네임/메타와 동일한 좌측 시작점으로 제목/본문이 시작되도록 정렬
    - 아바타 영역과 텍스트 영역 간 간격을 최소화해 스캔 효율 개선
  - 데스크톱 카드 폭 제한
    - 메인 컬럼의 최대 폭을 제한해 카드 가로 길이 과확장을 방지
    - 좌/우 컬럼 폭과 함께 그리드 균형을 재정렬
- 완료 기준
  - 제목/본문이 닉네임 기준으로 시작하고 아바타 아래로 내려가지 않음
  - 데스크톱에서 카드 폭이 과도하게 늘어나지 않음(가독성 개선)

#### (2025-12-20) [LEAD] P0-17 좌측 사이드바 고정 + 독립 스크롤 (P0)

- 플랜(체크리스트)
  - [ ] [LEAD] 좌측 컬럼 고정(스크롤 분리) 레이아웃 설계/반영(Hot File)
  - [ ] [FE] 좌측 사이드바 내부 스크롤/높이 동작 정리

- 목표: 메인 스크롤을 내릴 때 좌측 사이드바는 화면에 고정되고, 필요한 경우 내부 스크롤만 동작하도록 한다
- 현황(스크린샷 기준)
  - 메인 콘텐츠를 스크롤하면 좌측 사이드바도 함께 내려가 고정성이 무너짐
  - 사이드바 자체 스크롤이 있어도 메인 스크롤에 의해 위치가 변함
- 작업(권장)
  - 좌측 컬럼 sticky 고정
    - 헤더 높이 기준으로 `top` 오프셋을 설정해 스크롤 시 화면에 고정
  - 사이드바 내부 스크롤 분리
    - 최대 높이를 `calc(100vh - header - spacing)`로 제한
    - 내용이 길 때만 내부 스크롤 동작
- 완료 기준
  - 메인 스크롤과 무관하게 좌측 사이드바가 고정되어 유지됨
  - 좌측 사이드바는 자체 스크롤만 동작하고, 하단으로 더 내려가지 않음

#### (2025-12-20) [LEAD] P0-18 헤더 “뒤로가기” 줄바꿈/깨짐 제거 (P0)

- 목표: 다국어(특히 `vi`의 `Quay lại`)에서 헤더 좌측 “뒤로가기”가 2줄로 깨지거나 헤더 높이가 흔들리는 문제를 제거한다
- 현황(코드/스크린샷 근거)
  - `showBackButton` 시 “← Quay lại”가 줄바꿈되어 `Quay` / `lại`로 쪼개짐(좌측 320px 고정 컬럼 내 폭 부족 + 텍스트 wrap)
  - 헤더 좌측 컬럼이 `lg:grid-cols-[320px_…_320px]`로 고정(`src/components/organisms/Header.tsx:131`)이고, `showBackButton` 시 “뒤로 버튼 + 로고 + 브랜드 소개”가 같은 줄에 놓임(`src/components/organisms/Header.tsx:133`)
- 작업(권장, Hot File=Lead)
  - `showBackButton`일 때 레이아웃 분기(폭 확보)
    - (우선순위 1) 뒤로 버튼은 icon-only(+Tooltip) 또는 `whitespace-nowrap` + 텍스트 축약(예: `sm:inline` 이상에서만 텍스트)
    - (우선순위 2) `showBackButton`에서는 브랜드 소개 문구를 숨기거나(또는 더 짧게) 좌측 공간을 “뒤로 버튼”에 양보
    - (우선순위 3) 필요한 경우에만 좌측 고정 폭을 조건부로 확장(예: 320→360)하되, 전체 그리드 정렬이 깨지지 않게 제한
- 완료 기준
  - 데스크톱/모바일에서 `Quay lại` 포함 모든 로케일의 “뒤로가기”가 줄바꿈되지 않음(또는 의도적으로 icon-only)
  - 헤더 높이/정렬이 안정(줄바꿈으로 인한 CLS/라인깨짐 0)

#### (2025-12-20) [WEB] P0-19 커뮤니티 랭킹: 온도-only + Event 자리 (P0)

- 목표: “레벨” 개념을 제거하고 “온도(기본 36.5)”로 단일화해 이해 비용을 낮추며, 상단/우측 영역을 향후 Event로 확장 가능한 구조로 만든다
- 현황(코드 근거)
  - 랭킹 페이지에서 `Level`/진행바/퍼센트가 노출됨(`src/app/[lang]/(main)/leaderboard/LeaderboardClient.tsx:255`, `src/app/[lang]/(main)/leaderboard/LeaderboardClient.tsx:329`)
  - “전체 멤버” 카운트가 별도 박스로 노출됨(`src/app/[lang]/(main)/leaderboard/LeaderboardClient.tsx:181`)
  - 상단 안내가 “신뢰 배지 안내 + 점수 계산식” 형태(`src/app/[lang]/(main)/leaderboard/LeaderboardClient.tsx:188`)
  - 점수는 `trust + helpful*5 + adoptionRate`로 계산되고 level은 score/100 step으로 산정(`src/app/api/users/leaderboard/route.ts:14`)
- 작업(권장)
  - UI: 레벨/레벨 진행바 제거 → 온도만 노출
    - 온도 기본값 = 36.5, 온도 표시 단위는 소수 1자리(권장)
    - 온도 이모지/아이콘은 “기본(현재 온도색 유지)”에서 시작하고, 특정 임계치 이상에서만 더 뜨거운 표현으로 강화
  - 온도 값 매핑(v1 효율 우선)
    - API 점수는 유지하되, UI 표시용 온도는 단조 증가 함수로 스케일링(예: `36.5 + log10(score+1) * k` 형태)하여 극단값을 방지
    - 계산식(수학)을 UI에 노출하지 않음(정책)
  - 상단 안내: “신뢰도 계산” → “랭킹이 오르는 행동” 설명으로 교체
    - 예: 도움되는 답변/채택/신고 없는 건강한 활동/프로필 인증/꾸준한 참여 등 “행동 기준”만
  - 정보 노이즈 제거
    - 전체 멤버 수 박스 제거(필요하면 내부적으로만 사용)
  - 레이아웃 확장성(Event 자리)
    - 웹(lg+): 12컬럼 기준 “랭킹 콘텐츠 8 + 우측 4 비워두기(또는 Event placeholder)”로 고정
    - 모바일: 상단 안내 영역을 유지하고, 해당 영역을 “Event(추후)”로 전환 가능한 컴포넌트 슬롯으로 확보
    - 메뉴 라벨: `상위 기여자(Event)`로 임시 표기(사이드바/툴팁/페이지 타이틀과 일관성 유지)
- 완료 기준
  - 랭킹 페이지에서 `Level` 관련 UI가 보이지 않음(진행바/라벨 포함)
  - 온도는 기본 36.5 기반으로 표시되며, 높은 온도에서만 “더 뜨거운” 표현이 적용됨
  - 상단 안내에 계산식이 아닌 “랭킹 상승 행동”만 안내되고, 전체 멤버 수는 노출되지 않음
  - 웹은 우측 여백/컬럼이 확보되고, 모바일 상단은 Event로 확장 가능한 영역으로 남아 있음

### P0 Exit criteria

- UI에서 언어 선택은 `ko/vi`만 보임, `/en/*` 직접 접근 및 sitemap/alternates의 `en` 노출은 유지
- Rate limit 적용 엔드포인트에서 429가 동작하고, 클라 UX가 깨지지 않음
- Playwright 스모크가 릴리즈 게이트로 고정되고 항상 통과
- 모바일 입력/키보드 이슈로 “작성 불가” 케이스 0
- `ko/vi` 기준 텍스트 클립/하드코딩이 핵심 화면에서 0(의도된 `truncate` 제외)
- 가이드라인 안내가 1회 동작하고(노출/확인 기록), 작성/제출 플로우에 영향 0
- 신고 즉시 숨김 및 “안보기” 맞춤 숨김이 동작하고(승인 전 포함), 피드/검색에서 재노출되지 않음
- SEO 메타/키워드 파이프라인이 통합되고(중복 로직 제거), 카드/피드백 UX가 요구사항대로 정리됨
- 데스크톱 카드 폭/정렬이 개선되고 좌측 사이드바 고정/독립 스크롤이 정상 동작
- 헤더 뒤로가기(`Quay lại` 등) 줄바꿈/정렬 문제가 재현되지 않음
- 커뮤니티 랭킹은 온도-only로 단순화되고(Event 확장 자리 포함) 불필요 지표(레벨/총멤버/계산식)가 UI에 노출되지 않음

---

## P1 (출시 직후 1~2 스프린트: 안정화/유지보수)

#### (2025-12-20) [WEB] P1-1 Playwright 커버리지 확장 (P1)

- 플랜(체크리스트)
  - [ ] [WEB] 로그인/작성/채택 시나리오 추가
  - [ ] [LEAD] CI 게이트 확장 반영

- 로그인/작성/채택/구독/알림 핵심 플로우(필요 시 test-only auth 전략은 “프로덕션 비활성” 전제로)

#### (2025-12-20) [BE] P1-2 Rate limit 고도화 (P1)

- 플랜(체크리스트)
  - [ ] [BE] 엔드포인트별 정책 세분화
  - [ ] [BE] CAPTCHA 옵션 설계

- 정책 세분화(엔드포인트별/유저별), 오탐 대응, CAPTCHA 옵션 검토

#### (2025-12-20) [BE] P1-3 Admin 모듈 정리 (P1)

- 플랜(체크리스트)
  - [ ] [BE] admin 유틸/타입 경계 정리
  - [ ] [WEB] 관리자 페이지네이션/성능 통일

- admin 관련 유틸/타입/쿼리 경계 정리 + 페이지네이션/성능 일관화

#### (2025-12-20) [LEAD] P1-4 운영 모니터링/Runbook 강화 (P1)

- 플랜(체크리스트)
  - [ ] [LEAD] 모니터링 도구/알림 채널 확정
  - [ ] [LEAD] Runbook 작성/갱신

- 오류율/응답시간/DB 지표 알림 + 장애 대응/롤백 절차 리허설

#### (2025-12-20) [FE] P1-5 디자인/컴포넌트 가이드 (P1)

- 플랜(체크리스트)
  - [ ] [FE] atoms/molecules/organisms 기준 정리
  - [ ] [FE] 로딩/빈상태/에러 상태 표준화

- atoms/molecules/organisms 분류 기준/예시, 로딩/빈상태/에러 상태 표준화(Storybook은 선택)

#### (2025-12-20) [WEB] P1-6 온보딩 개인화(선택) (P1)

- 플랜(체크리스트)
  - [ ] [WEB] 관심사/상태 데이터 반영 규칙 확정
  - [ ] [WEB] 개인화 피드 적용

- 관심사/상태 수집 → 추천/피드/구독 초기값에 반영(데이터 모델 합의 후)

#### (2025-12-20) [WEB] P1-7 신뢰/전환 고도화(선택) (P1)

- 플랜(체크리스트)
  - [ ] [WEB] 채택 리마인드 UX
  - [ ] [WEB] 프로필 지표 노출

- 채택 리마인드, 팔로우 유도, 프로필 지표(채택률/도움된 답변 수) 노출

#### (2025-12-20) [WEB] P1-8 출처 표기(선택) (P1)

- 플랜(체크리스트)
  - [ ] [WEB] 출처/날짜 입력 UI
  - [ ] [BE] 출처 필드 저장

- 답변 작성 시 출처/날짜 필드 + 본문 하단 렌더, UGC 링크 정책(`rel="ugc"`) 문서화

#### (2025-12-20) [BE] P1-9 모더레이션 자동화 고도화(권장) (P1)

- 플랜(체크리스트)
  - [ ] [BE] 룰 기반(금칙어/연락처/링크) 강화
  - [ ] [BE] 신고 누적 자동 숨김 + 리뷰 큐

- 룰 기반(금칙어/연락처/링크) 강화 + 신고 누적(신뢰 가중) 자동 숨김 + 관리자 리뷰 큐/복구

#### (2025-12-20) [WEB] P1-10 튜토리얼/리마인드(선택) (P1)

- 플랜(체크리스트)
  - [ ] [WEB] 투어 슬라이드 UI
  - [ ] [WEB] 공지/알림 리마인드

- 짧은 투어 슬라이드(검색/좋은 질문/좋아요/채택) + 공지/알림으로 분기별 리마인드 + 배지(선택)

#### (2025-12-20) [WEB] P1-11 저속·오프라인 UX/PWA 폴백 v1 (P1)

- 목표: 불안정 네트워크에서도 “읽기/탐색/작성 시도”가 깨지지 않고, 실패하더라도 사용자가 상황을 이해하고 복구할 수 있게 한다
- 리서치(현황 확인)
  - PWA는 `next-pwa`로 구성되어 있으나, 프로덕션에서는 `ENABLE_PWA=true`가 아니면 비활성화될 수 있음(운영 환경 정책 확정 필요)(`next.config.ts:1`)
  - TanStack Query는 캐시/재시도/오프라인 UX의 중심이므로 전역 기본값/핵심 쿼리의 `enabled`/`staleTime`을 재점검
- 작업(권장 v1)
  - 오프라인/저속 폴백 UX
    - 오프라인/실패 시 “재시도/캐시된 콘텐츠 표시/네트워크 상태 안내”를 표준 컴포넌트로 통일(P1-5와 연계)
    - 목록/상세는 stale 캐시라도 우선 렌더 후 백그라운드 갱신(stale-while-revalidate UX) 적용 범위 확정
  - PWA 캐시 전략(운영 효율 우선)
    - 정적 자산 중심 캐시 + 핵심 읽기 API는 제한적 캐시(과도한 캐시로 인한 정보 최신성 문제 방지)
    - 오프라인 페이지/안내(“인터넷 연결 없음, 최근 본 콘텐츠/재시도”)를 최소 구현으로 제공
  - 작성 실패 보호(필요 구간부터)
    - 글/답변/댓글 작성 중 네트워크 오류 시 임시 저장(로컬)과 복구 동선 제공(완전한 백그라운드 동기화는 P2로)
- 완료 기준
  - 저속/오프라인 상황에서 “빈 화면/무반응” 대신 명확한 안내와 복구 동선이 제공됨
  - PWA 활성화 조건(환경변수/배포 정책)과 캐시 범위가 문서로 확정됨

#### (2025-12-20) [LEAD] P1-12 성능·접근성 감사 스크립트 정렬 (P1)

- 목표: 존재하는 감사 스크립트가 “현재 라우트(`/[lang]`) + 현재 정책(ko/vi UI, en SEO)”에 맞게 실제로 돌 수 있게 정렬한다
- 현황(코드 근거)
  - 감사 스크립트의 테스트 URL이 구 라우트(`/questions` 등)를 기준으로 되어 있음(`scripts/performance-audit.js:1`, `scripts/accessibility-audit.js:1`)
- 작업(권장)
  - 타깃 URL을 현재 구조로 교체(예: `/{lang}` 홈, `/{lang}/search`, `/{lang}/posts/{id}` 등)
  - 네트워크 프로파일을 포함한 실행 규칙 정의(예: 모바일 viewport + 3G throttle 1회는 “정기 점검”)
  - 운영 방식 결정
    - 릴리즈 차단 게이트에 넣지 않고, “주간/야간 점검”으로 고정(실패 시 이슈 트래킹)
- 완료 기준
  - 스크립트가 현재 라우트에서 실행 가능하고, “언제/어디서/무엇을 본다”가 문서로 고정됨

---

## P2 (확장 단계: 스케일/성장)

#### (2025-12-20) [BE] P2-1 캐시/스케일 (P2)

- 플랜(체크리스트)
  - [ ] [BE] 캐시 계층/TTL 정의
  - [ ] [BE] read replica 기준선/알람 정의

- Redis/KV 캐시, Supabase read replica 기준선/알람, 고빈도 조회 API 최적화

#### (2025-12-20) [BE] P2-2 Feature Flag (P2)

- 플랜(체크리스트)
  - [ ] [BE] feature flag 스키마/스토리지 정의
  - [ ] [BE] 토글 적용 방식 정리

- 점진 릴리즈/실험 체계

#### (2025-12-20) [LEAD] P2-3 CMS 도입 판단 (P2)

- 플랜(체크리스트)
  - [ ] [LEAD] CMS 도입 기준/비용 비교
  - [ ] [LEAD] 전환 계획 초안

- 공지/가이드/뉴스 운영량 기준으로 “현 admin 유지 vs CMS”

#### (2025-12-20) [BE] P2-4 추천/분석 고도화 (P2)

- 플랜(체크리스트)
  - [ ] [BE] 상호작용 데이터 모델 설계
  - [ ] [BE] 배치/캐시 계획 수립

- 상호작용 데이터 모델(좋아요/스크랩/조회) + 룰/배치/캐시

#### (2025-12-20) [WEB] P2-5 미션/랭크/콘텐츠 확장(선택) (P2)

- 플랜(체크리스트)
  - [ ] [WEB] 랭크/미션 UI 설계
  - [ ] [WEB] 포인트 표시 규칙 정의

- 운영 리소스와 모더레이션 체계가 갖춰진 이후 단계적으로 추진

#### (2025-12-20) [BE] P2-6 AI 모더레이션/유사질문 임베딩(선택) (P2)

- 플랜(체크리스트)
  - [ ] [BE] 평가 기준/오탐 기준 정의
  - [ ] [BE] 비용/성능 기준 수립

- 외부 AI 의존성/비용/오탐을 감안해 “룰 기반+운영 큐”가 안정화된 뒤에만 검토

#### (2025-12-20) [LEAD] P2-7 멀티 채널 퍼블리싱 v1 (P2)

- 목표: “한 번 만든 콘텐츠”를 외부 채널로 확산하되, 운영 리스크/반복 업무를 최소화하는 방식으로만 단계적으로 도입한다
- 범위(원칙)
  - AI 기반 생성/번역은 제외(정책)
  - UGC(사용자 글) 자동 게시 금지(운영/법적 리스크) → v1은 운영자 큐레이션 콘텐츠(공지/뉴스/가이드) 중심
- 작업(권장 v1)
  - 콘텐츠 단일 소스 확정
    - “외부 배포 가능한 콘텐츠 타입”을 명시적으로 정의(예: `news`, `admin notice`, `guide`)
  - 피드/배포 포맷 제공
    - RSS/Atom/JSON Feed 중 1~2개를 표준으로 선택하고, 배포 대상 콘텐츠만 포함(노출 정책/권한 준수)
  - 외부 공유 품질(클릭률) 기반 정비
    - OG/Twitter 메타를 신뢰할 수 있게 유지(P0-12의 공용 메타 빌더를 그대로 활용)
    - 공유 CTA/버튼은 P0-15 정책(중복 제거) 하에서 채널 확장(Zalo/FB 등)은 “필요 시”만
  - 운영 자동화(반복 최소화)
    - 코딩 없이 가능한 자동화(Zapier/IFTTT 등)와 “주간/월간 요약 발행” 루틴을 비교해, 최소 운영 비용으로 가능한 흐름부터 적용
- 완료 기준
  - 외부 배포 대상/권한/노출 정책이 문서로 고정되고, 운영자 개입 없이도 일정 수준의 자동 배포가 가능

---

## Testing and validation (게이트)

- 공통: `npm run lint` → `npm run type-check` → `SKIP_SITEMAP_DB=true npm run build`
- 필수: Playwright 스모크 통과
- 필수: Rate limit 동작 확인(429 + UX 처리)
- 수동: P0-9 크로스브라우징 체크리스트 완료
