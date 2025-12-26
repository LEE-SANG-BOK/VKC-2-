# WORKING_PLAN

본 문서는 현재 코드/문서 현황을 기준으로 “무엇을 언제(P0/P1/P2)까지 닫을지”를 고정한다. 구현 단위는 기능(도메인) 기준으로 쪼개고, Hot File 충돌을 피하며, 릴리즈 게이트(Playwright/Rate limit)를 P0에서 확정한다.

## Plan (요약)

- P0(출시 전)은 “실데이터/SEO 정합 + 모바일 UX + 신뢰(인증/배지) + 운영도구(계측/방어) + 필수 자동화(Playwright/Rate limit)”를 닫는 데 집중한다.
- P1은 안정화/유지보수 체계(테스트 확장, Admin 정리, 모니터링), P2는 스케일/확장(캐시/레플리카/플래그/CMS/추천 고도화)로 분리한다.
- 추가 정책: `en`은 웹 UI에서 숨김(언어 스위치/노출 동선 제거)하되, 기존 `en` 페이지/번역은 삭제하지 않고 SEO 노출은 유지한다. 앞으로 신규 작업은 `en` 번역 추가/검수는 하지 않음(단, 페이지 렌더가 깨지지 않도록 fallback은 보장).
- STEP3(비자 확률 추천/서류 PDF 자동화/공식정보 동기화) 실행 문서는 `docs/STEP3_VISA_AI_DOC_AUTOMATION_PLAN.md`에서 관리한다.
  - STEP3 SoT(공식 링크/템플릿/비자 목록/리드 기준): `docs/STEP3_SOT_RESOURCES.md`
- Codex 프롬프트/개발 워크플로우 SoT: `docs/CODEX_PROMPT_PROTOCOL.md` (Task Intake → Done 기준 → 검증 게이트)

## Policy decisions (확정)

- AI 번역/챗봇: 도입/PoC 모두 제외
- 신규 유저 빠른 팁 UI는 사용하지 않음(배너/카드 노출 금지)
- Workspace: 단일 워크트리 = `/Users/bk/Desktop/viet-kconnect-renew-nextjs-main 2`
- Branch: 단일 브랜치 = `codex-integration`
- Language: UI 노출 로케일 = `ko/vi`, SEO 로케일 = `ko/en/vi` (예: `src/app/sitemap.ts`, `src/app/[lang]/layout.tsx`의 alternates는 유지)
- i18n: 신규 작업은 `en` 번역 키를 추가/검수하지 않음, `en` 렌더는 `ko` fallback으로 깨짐 방지
- E2E: Playwright 필수(릴리즈 게이트에 포함)
- Abuse 방어: Rate limit 필수(주요 쓰기 API에 적용)
- 프로필 이동 UX(통일): “프로필 사진/닉네임이 보이는 모든 영역”은 동일 규칙을 따른다 = 클릭 시 `/{lang}/profile/{id}`로 이동(leaderboard/추천 사용자/댓글/답변/모달 포함). 구현은 공용 컴포넌트/랩퍼로만 처리해 페이지별 편차를 금지한다.
- 팔로우 추천(필수): 홈의 `팔로우(following)` 탭은 **상단 CTA(추천 사용자 보기)** + **하단 추천 사용자 리스트**를 기본 구성으로 유지한다. 추천 결과가 0이면 fallback(예: leaderboard 상위/최근 활동)로 최소 N명을 노출한다. 비로그인 상태에서도 노출은 가능하되 Follow 액션은 로그인 프롬프트로 게이트한다.
- 글쓰기 #태그 자동생성(품질 규칙): 자동 태그는 **3개 고정**. 금지 = `#정보/#Tip/#추천` 같은 범용 seed 도배. 규칙 = (A) 모더레이션 입력(조건/목표/배경)이 있으면 “모더레이션에서 2개 추출 + (대분류/세부분류/작성 목적)에서 1개” (B) 모더레이션 미입력 시 “대분류 + 세부분류 + 작성 목적” 3개. 중복 제거/현지화/길이·품질 필터는 공용 유틸에서 단일화한다.
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
- 성능 목표(CWV): `LCP ≤ 2.5s`, `INP ≤ 200ms`, `CLS ≤ 0.1`을 “Good” 기준으로 본다(측정/운영은 `P1-12`, 기준 확인: `https://wallaroomedia.com/blog/what-are-core-web-vitals/`).
- AI 검색/요약(LLM/SGE) 전제: 핵심 정보(목록/상세/프로필)는 로그인 없이 SSR HTML에서 바로 읽혀야 하고, 제목/헤딩/리스트/스키마/업데이트 일자까지 “기계가 추출 가능한 구조”로 제공되어야 한다(실행은 `P1-15`).
- SEO 언어/키워드 우선순위: `vi`(1) → `ko`(2) 순으로 “콘텐츠/메타 품질”을 맞추고, `en`은 UI 숨김+SEO 유지 정책 하에서 신규 번역 작업 없이 렌더 안정성만 보장한다.
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
- 요청 단위로 스테이징/커밋을 분리한다(요청 1건 = 1커밋).

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

#### 0.5.1 Codex CLI 스킬 프롬프트 (GitHub PR/CI)

- 목적: GitHub PR에서 **리뷰 코멘트 처리** / **CI(GitHub Actions) 실패 분석·수정**을 빠르게 표준화한다.
- 사용 조건: Codex CLI에서 스킬이 존재하고(예: `~/.codex/skills/*`, `./.codex/skills/*`), 스킬을 인식하는 **새 Codex 세션**에서 실행한다.
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

#### 0.5.2 Repo-local Codex 스킬 세팅 (VKC)

- 목적: 반복 폭발 구간을 “스킬”로 고정해 **반복 최소화/체계화/ROI/확장성**을 확보한다.
- 위치: `./.codex/skills/**` (레포에 커밋/공유되는 표준 스킬)
- 사용법
  - 프롬프트 상단에 `$<skill-name>`을 명시하면 해당 스킬을 강제로 사용한다.
  - 예: `$vkc-repo-guardrails` / `$vkc-api-route-pattern` / `$vkc-wizardkit`
  - 로컬 검사 스크립트: `bash .codex/skills/vkc-repo-guardrails/scripts/guardrails.sh`
- “새 Codex 세션” 의미: Codex는 **시작 시점에 스킬을 스캔**하므로, 새로 추가/수정된 `./.codex/skills/**`를 인식시키려면 Codex CLI를 종료 후 다시 실행(= 새 세션)해야 한다.
  - 근거: Codex 스킬은 “startup discovery” 방식으로 로딩된다(스킬 목록은 실행 중 핫리로드되지 않음).

##### P0 (무조건 먼저) — 반복 폭발 구간 6개

- `vkc-repo-guardrails`: 비협상 규칙 점검(서버 액션 금지/API Routes만/Drizzle/Supabase/Repo 레이어/i18n 안전)
- `vkc-api-route-pattern`: `src/app/api/**` 표준 골격(세션/검증/DB/응답/레이트리밋)
- `vkc-drizzle-schema-migration`: Drizzle 스키마/마이그레이션 표준화(룰셋/템플릿 DB화 강제)
- `vkc-i18n-ko-vi-safety`: ko/vi 키 안전 + 베트남어 긴 문자열 UI 깨짐 방지
- `vkc-wizardkit`: Step UI + 하단 고정 CTA + safe-area + draft 저장 + 제출 이벤트 로깅 패턴
  - Wizard 카피/톤은 `docs/UX_AGENT_PERSONA.md`를 단일 소스로 고정(비자/서류/상담 플로우 공통)
- `vkc-admin-ops-workflow`: Draft → 검토 → 예약발행 → 게시 운영 워크플로우 표준화
- `vkc-ux-audit`: UX 전문가 감사(휴리스틱 + 모바일 + i18n + CWV/a11y) — 스프린트 말/릴리즈 전 QA 게이트
  - 페르소나 SoT: `docs/UX_REVIEW_AGENT_PERSONA.md`

##### P1 (차별화 핵심) — 엔진화 2개

- `vkc-visa-assessment-engine`: 비자 평가 엔진(룰셋 JSON/버전/효력일자, 결과 스키마) — 코드 하드코딩 금지
- `vkc-docgen-template-engine`: 문서 템플릿 엔진(템플릿 스키마+PDF renderSpec+히스토리+Storage) — 2개→50개 선형 확장

##### P2 (지속 업데이트/최신성)

- `vkc-regulation-knowledge-updater`: 공식 공지/규정 업데이트 파이프라인(스냅샷→검수→활성화) 기반

#### 0.5.3 MCP (Model Context Protocol) 활용 (반복 최소화용)

- 현황: `repo-fs`(filesystem) MCP는 활성화되어 있으나, `list_mcp_resources == []`는 “tools-only 서버” 케이스로 정상일 수 있음(= 리소스 자동 주입 없음). GitHub/DB/Deploy 등 외부 컨텍스트 MCP는 아직 미연결.
- 목적: PR/DB/배포 로그 같은 “외부 컨텍스트”를 리소스로 연결해, 리서치·재확인·복붙 비용을 구조적으로 제거
- 운용 원칙
  - MCP 리소스는 “근거 입력(SoT)”로만 사용하고, 실제 변경은 레포 규칙/게이트(Playwright 포함)로 검증한다.
  - MCP에 없는 정보는 문서/코드/로그를 기준으로 판단하고, MCP는 “있으면 쓰는 가속기”로 취급한다.
  - MCP 신규 연결/토큰 설정/DB 접근이 필요해지면, 연결·사용 전에 반드시 사용자에게 보고 후 진행한다.
- 권장 연결(우선순위)
  - GitHub(PR/Checks): PR 상태/실패 로그를 MCP 리소스로 제공(gh CLI 보완)
  - DB/Schema: Drizzle 마이그레이션 상태/실 스키마를 리소스로 제공(피드백/추천 사용자 등 DB 불일치 예방)
  - Deploy logs: Vercel 레이트리밋/배포 실패 로그를 리소스로 제공(원인 파악 시간 단축)

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
- 연계: `P1-18`

### 4. Rate limit은 “존재”하지만 “확장 가능한 설계”가 아직 아님

- 현황/리스크
  - `middleware.ts:1`의 Map 기반 제한은 MVP엔 도움이 되지만, 출시 후 스팸/남용 방어(정책 세분화/유저 단위/엔드포인트 단위/429 UX)에는 부족
- 방향: 정책 정의(임계치/범위/우선순위) → 저장소(외부/지속) → 공통 응답 스키마 → 클라 UX까지 한 번에 표준화
- 연계: `P0-6`(rate limit + 429 UX), `P1-2`(고도화)

### 5. 추천 사용자(Recommended Users)–온보딩/배지 데이터 불일치

- 현황/리스크
  - 추천 API는 “인증 우선 + 팔로워 수” 정렬로만 추천되어 개인화가 없음(`src/app/api/users/recommended/route.ts:87`)
  - API가 `isExpert/badgeType`을 조회하지만 응답에 포함하지 않아 UI에서 상세 배지가 사라짐(`src/app/api/users/recommended/route.ts:54`, `src/app/api/users/recommended/route.ts:111`)
  - 온보딩은 관심사를 category `id(UUID)`로 저장하는데(`src/app/[lang]/(main)/onboarding/OnboardingClient.tsx:321`), 추천 메타는 숫자 포함 값을 제거해 관심사가 누락됨(`src/app/api/users/recommended/route.ts:107`)
- 방향: 데이터 표현(관심사)과 배지 노출(응답 계약)을 한 번에 정리해 “반복 수정” 비용을 제거
- 연계: `P1-13`, `P1-14`

### 6. AI 검색/요약(LLM/SGE) 노출을 위한 “추출 가능한 구조”가 시스템화돼 있지 않음

- 현황/리스크
  - Q&A 상세는 `QAPage/DiscussionForumPosting` JSON-LD가 있으나, 채택 답변(acceptedAnswer)/수정일(dateModified) 등 “AI 요약에 유리한 핵심 필드”가 비어 있는 케이스가 있음(`src/app/[lang]/(main)/posts/[id]/page.tsx:209`)
  - FAQ/가이드/HowTo/VideoObject 등 “구조화 데이터 적용 기준(UGC vs 운영자 큐레이션)”이 문서/코드에서 단일화되어 있지 않음
  - `robots.ts`는 Google/Bing 중심이며, GPTBot/OAI-SearchBot 등 AI 크롤러 허용/차단 정책이 미정(`src/app/robots.ts:4`)
  - 출처/업데이트 표기(신뢰·최신성) 정책이 화면/메타/스키마에 일관되게 반영되지 않으면 E-E-A-T 신호가 약해짐(P1-8 연계)
- 방향: “AI 검색 대비 SEO 계약(헤딩/즉답 구조/스키마/최신성/크롤링)”을 SoT로 만들고 템플릿화해 반복 비용을 제거
- 연계: `P1-15`, `P1-8`

### 7. UGC 보안(XSS)–서버 “무해화” 부재 + `dangerouslySetInnerHTML` 렌더

- 현황/리스크
  - 게시글/답변/댓글은 HTML을 그대로 저장/반환하는 구조이며, 클라이언트에서 `dangerouslySetInnerHTML`로 렌더됨(`src/app/api/posts/route.ts:666`, `src/app/api/posts/route.ts:819`, `src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx:2273`)
  - 현재 `createSafeUgcMarkup`는 링크에 `rel="ugc"`를 보정하는 수준이며, HTML 태그/속성 allowlist 기반 “무해화(스크립트/이벤트/위험 URL 차단)”를 수행하지 않음(`src/utils/sanitizeUgcContent.ts:17`)
- 방향
  - UGC는 “서버 write-time 무해화 + read-time 안전 렌더”를 단일 파이프라인으로 고정(허용 태그/속성/URL 스킴 규칙)
  - 대표 페이로드 회귀 방지용 테스트/샘플을 최소로라도 갖춰 “다시 열리는” 보안 이슈를 구조적으로 차단
- 연계: `P0-20`(UGC 무해화 + 링크 정책 단일화)

### 8. UGC 링크 정책이 분산/충돌(공식 출처 allowlist가 사실상 동작하지 않을 수 있음)

- 현황/리스크
  - 금칙어/스팸 필터가 `https?://` 자체를 스팸 시그널로 취급해 외부 링크를 사실상 차단하는 경향이 있음(`src/lib/content-filter.ts:15`)
  - 동시에 “공식 출처 도메인 allowlist” 검증 로직이 존재해 정책이 이중화되어 있음(`src/lib/validation/ugc-links.ts:57`)
- 방향
  - 링크 허용/차단은 allowlist(공식 출처) 1곳을 SoT로 두고, 스팸/연락처/광고 필터는 별도 신호로만 사용(순서/조건을 문서+코드로 통일)
  - 외부 링크 rel 정책(`ugc` + 필요 시 `nofollow/sponsored`)은 렌더 단계에서 일괄 적용해 SEO/운영 리스크를 동시에 최소화
- 연계: `P0-20`

### 9. `next/image` 원격 호스트 전면 허용(`remotePatterns: **` + `http`)은 운영/보안 리스크

- 현황/리스크
  - `images.remotePatterns`가 모든 호스트(`**`)를 허용하고 `http`까지 허용함(`next.config.ts:22`)
  - UGC/프로필/썸네일 등에서 외부 이미지 URL이 섞이면 서버가 원격 이미지를 fetch/리사이즈하는 형태가 되어 SSRF/DoS/성능 리스크가 커짐
- 방향
  - 프로덕션은 allowlist 기반으로 축소(예: Supabase Storage + 1st-party 도메인)하고, 나머지는 업로드/프록시/`unoptimized` 등 정책을 명확히 분리
  - 이미지 src는 공용 정규화 유틸로 통일(`src/utils/normalizePostImageSrc.ts:1`)
- 연계: `P0-21`(이미지 원격 정책 고정)

### 10. PWA 의존성/캐시 경계가 ‘정책’으로 고정돼 있지 않음(중복/오동작 위험)

- 현황/리스크
  - PWA는 `@ducanh2912/next-pwa` 기반으로 구성되어 있으나(`next.config.ts:3`), 의존성에 `next-pwa`도 함께 존재해 중복/혼선 가능성이 있음(`package.json:28`, `package.json:60`)
  - `aggressiveFrontEndNavCaching` 등 캐시 옵션이 개인화/동적 페이지에서 stale UI를 만들 가능성이 있음(`next.config.ts:13`)
- 방향: PWA는 의존성 1개로 통일하고, 캐시 가능한 영역(정적/큐레이션)과 캐시 금지 영역(작성/알림/프로필/세션)을 정책으로 고정
- 연계: `P1-17`

### 11. SEO/검색 계약(SearchAction/Query Param)이 SoT에 고정돼 있지 않으면 드리프트가 발생

- 현황/리스크
  - 전역 Structured Data의 `SearchAction`은 `/search?q=` 계약에 의존하며(`src/components/organisms/StructuredData.tsx:21`), 검색 라우트/파라미터가 바뀔 경우 SEO/AI 추출 품질이 즉시 하락할 수 있음
- 방향: 검색 URL 계약을 “메타/스키마 빌더” 레이어에서 1회 정의하고, StructuredData/페이지/라우트는 결과만 소비하게 한다
- 연계: `P1-15`

### 12. Cache-Control/개인화 응답 캐싱 경계가 단일 정책으로 고정돼 있지 않음

- 현황/리스크
  - API 응답에서 `Cache-Control`이 엔드포인트별로 흩어져 있어 “공개 캐시(public)로 내려가도 되는 응답”과 “개인화/세션 기반(private/no-store) 응답”의 경계가 코드 리뷰만으로 유지되기 쉬움
  - 기본 응답 헬퍼는 `no-store`를 쓰지만(`src/lib/api/response.ts:47`), 개별 라우트에서 직접 헤더를 세팅하는 패턴이 혼재함(예: `src/app/api/categories/route.ts:55`, `src/app/api/users/leaderboard/route.ts:79`)
- 방향
  - 캐시 정책을 1곳(헬퍼/유틸)에서만 정의하고, 라우트는 “public/private tier”를 선택만 하게 한다(반복 방지)
  - public 캐시 적용 라우트는 “viewer-dependent 필드”가 절대 포함되지 않음을 점검하고, 필요한 경우 `Vary`(Authorization/Cookie 등) 정책을 함께 고정
- 연계: `P1-19`

## 개선 플랜(리서치 → 의사결정 → 실행 보드로 내리는 방식, 단일 소스 지향)

### 0) 구조적 최적화/공통화/효율화 로드맵(SoT/계약/템플릿)

- 목표: 기능이 늘어나도 변경 비용이 선형으로 증가하지 않도록, “정책/계약/빌더(SoT)”는 1곳에서만 정의하고 나머지는 소비만 하게 만든다
- 운영 원칙(반복 비용 차단)
  - SoT 문서: `docs/WORKING_PLAN.md` 1곳(정책/게이트/결정 기록)
  - SoT 코드: `builder/contract/serializer`는 중앙화(새 구현은 중앙 모듈 추가만 허용), 페이지/컴포넌트는 “사용(consume)”만
  - 릴리즈 게이트: `lint → type-check → build → Playwright smoke → rate limit smoke`(P0에서 고정)
- 공통화 우선순위(ROI 순)
  - 1) API/Repo “계약(Contract)” 공통화
    - API 응답/에러 스키마를 통일(예: `{ code, message, retryAfter }` + `Retry-After`), 클라이언트 UX도 동일 규칙으로 처리
    - request/response 검증(Zod)과 타입 SoT는 `src/repo/[domain]/types.ts`에 두고, 화면은 타입을 소비만 하도록 유지
    - “유저/프로필 payload(배지/인증/만료)”를 공용 serializer로 통일(프로필/피드/추천에서 불일치 금지)
    - 연계: `P0-6`(429 규격/UX), `P0-8`(events), `P1-3`(admin), `P1-13`(추천), `P1-14`(배지)
  - 2) SEO/메타/키워드 “단일 파이프라인”
    - `generateMetadata`와 자동 키워드(완성/추천/태그) 로직을 공용 빌더로 합치고, 페이지는 결과만 사용(중복 알고리즘 금지)
    - JSON-LD/최신성/robots(크롤러 정책)까지 “콘텐츠 계약”으로 고정해 반복 비용 제거
    - 연계: `P0-12`(메타/키워드 SoT), `P1-15`(AI 검색/요약 대비 SEO 구조화)
  - 3) i18n 공통화(ko/vi 우선, en은 SEO 유지+fallback)
    - dictionary 로더에서 `ko(base) + locale override` 병합으로 렌더 안정성을 보장(신규 `en` 번역 추가/검수 없이도 깨짐 0)
    - 하드코딩 유입을 “정책+리뷰 체크”로 차단(핵심 CTA/에러/빈상태 우선)
    - 연계: `P0-1`(en UI 숨김), `P0-2`(ko/vi 하드코딩 제거)
  - 4) UI 공통 컴포넌트(성능/A11y/모바일을 기본값으로)
    - 이미지: `next/image` 규격(sizes/lazy/placeholder)을 공용 래퍼로 고정(페이지별 제각각 금지)
    - 액션 버튼: 44px 터치 타깃 + `aria-label` 강제 래퍼로 표준화(아이콘-only 버튼 무라벨 0)
    - 강조(Highlight): 메타/배지/상태는 “값만 1~2개 강조, 라벨/배열 나열 금지”를 공용 UI로 고정
    - 연계: `P0-4`(이미지/스플리팅), `P0-5`(A11y), `P0-13`(강조 규칙)
  - 5) 데이터 패칭/캐시/퍼포먼스 공통화(TanStack Query)
    - 전역 기본값(`staleTime/refetch/retry/enabled`)을 정책으로 고정하고, “열릴 때만 enabled” 원칙으로 불필요 요청을 구조적으로 제거
    - SSR+HydrationBoundary 템플릿을 고정해 리스트/상세/프로필이 같은 패턴으로 움직이게 한다
    - 연계: `P0-4`(Query 튜닝), `P1-11`(저속/오프라인), `P1-12`(성능 감사)
  - 6) 자동화/검증 공통화(게이트를 ‘재현 가능’하게)
    - Playwright 스모크는 릴리즈 게이트에 고정(P0), 커버리지는 P1에서 확장
    - 성능/접근성 감사는 “현재 라우트(`/[lang]`) + 정책(ko/vi UI, en SEO)” 기준으로 정렬하고 정기 점검으로 운영(릴리즈 차단은 최소화)
    - 설치 재현성을 위해 패키지 매니저/락파일을 1개로 강제(운영 비용 절감)
    - 연계: `P0-7`(Playwright), `P1-1`(확장), `P1-12`(감사 스크립트)
  - 7) 운영도구 공통화(방어/신뢰/추천을 같은 규칙으로)
    - rate limit 정책 정의→저장소→응답 스키마→클라 UX까지 표준화(쓰기 API 우선)
    - 신고/숨김/차단/리뷰 큐는 “사용자 체감(즉시 숨김)”과 “운영 효율(규칙 기반)”을 같이 만족하도록 단일 플로우로 정리
    - 인증/배지/추천은 “taxonomy + payload + UI 라벨”이 항상 일치하도록 SoT로 고정
    - 연계: `P0-6`(rate limit), `P0-11`(숨김/신고), `P1-9`(모더레이션), `P1-14`(배지), `P1-13`(추천)

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

### 5) AI 검색 대비 SEO “콘텐츠 계약” 표준화(추출 최적화)

- 목표: AI 요약/AI Overview에서 인용 가능한 “즉답/헤딩/리스트/스키마/최신성/크롤링”을 시스템화해 반복 비용을 줄인다
- 리서치: Q&A/프로필/뉴스/가이드의 JSON-LD 현황, robots 정책, 로그인/게이팅이 크롤링에 미치는 영향, 업데이트 일자/출처 표기 현황
- 의사결정(원칙)
  - UGC(질문/답변) = `QAPage/DiscussionForumPosting` 중심(FAQPage 남용 금지)
  - 운영자 큐레이션(공지/가이드/FAQ) = `FAQPage/HowTo/Article` 등 적용 기준을 명시적으로 분리
  - “질문 → 즉답(2~3문장) → 절차/체크리스트(리스트) → 근거/출처”를 기본 템플릿으로 정리(페이지별 복붙 금지)
  - 크롤러 접근: 읽기 페이지는 로그인 없이 SSR HTML로 노출, 쓰기만 게이팅(정책 유지)
- 산출물: `P1-15`(AI 검색 대비 SEO 구조화)로 실행 보드화

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
| P0-20 | BE | Web Feature, Lead | Shared(API/보안) | UGC 무해화 + 링크 정책 단일화 | XSS 0 + allowlist/rel 정책 1규칙 |
| P0-21 | Lead | Web Feature, Design Front | Shared(next.config) | `next/image` 원격 allowlist | `remotePatterns` 와일드카드 제거 + https-only + 이미지 로딩 정상 |

## Progress Checklist (집계용)

### P0

- [x] P0-0 (LEAD: Hot File 잠금/i18n 담당/게이트 고정)
- [x] P0-1 (LEAD/WEB/FE: en UI 숨김 + alternates/sitemap 유지 + ko fallback)
- [ ] P0-2 (FE/WEB: ko/vi 하드코딩 제거 + 클립 0)
- [ ] P0-3 (FE: 모바일 키보드/스크롤 UX 하드닝)
- [x] P0-4 (WEB/FE: 이미지 표준화 + 코드 스플리팅 + Query 튜닝)
- [x] P0-5 (FE: A11y 최소 기준)
- [x] P0-6 (BE/WEB: rate limit + 429 UX)
- [x] P0-7 (LEAD/WEB: Playwright 스모크/게이트)
- [x] P0-8 (LEAD/BE/WEB: 이벤트 스키마 + 수집)
- [ ] P0-9 (LEAD/FE: 크로스브라우징 QA)
- [x] P0-10 (LEAD/WEB/BE/FE: 가이드라인 v1)
- [x] P0-11 (BE/WEB/FE: 숨김/신고 즉시 숨김)
- [x] P0-12 (WEB/BE/FE: 메타/키워드 파이프라인 통합)
- [x] P0-13 (FE/WEB: 라벨 제거 + 강조 UI)
- [x] P0-14 (FE/WEB: 피드백 UX 간소화)
- [x] P0-15 (FE/WEB: 게시글 상세 액션/추천 정리)
- [x] P0-16 (FE/LEAD: 카드 헤더 정렬 + 데스크톱 폭 제한)
- [x] P0-17 (LEAD/FE: 좌측 사이드바 고정 + 독립 스크롤)
- [x] P0-18 (LEAD/FE: 헤더 뒤로가기 줄바꿈/정렬)
- [x] P0-19 (WEB/FE/BE: 랭킹 온도-only + Event 자리)
- [x] P0-20 (BE/WEB: UGC 무해화 + 링크 정책 단일화)
- [x] P0-21 (LEAD/WEB: `next/image` 원격 allowlist + https-only)

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
- [x] P1-12 (LEAD/WEB: 성능·접근성 감사 스크립트 정렬)
- [x] P1-13 (WEB/BE/FE: 추천 사용자 개인화/표시 규칙 정리)
- [ ] P1-14 (LEAD/BE/WEB: 인증/배지 taxonomy + 운영 workflow 정리)
- [ ] P1-15 (LEAD/WEB: AI 검색/요약 대비 SEO 구조화)
- [ ] P1-16 (LEAD: SEO KPI/리뷰 리듬(GSC/GA4))
- [x] P1-17 (LEAD/WEB: PWA 의존성 단일화 + 캐시 경계 고정)
- [x] P1-18 (LEAD: 패키지 매니저/락파일 단일화)
- [x] P1-19 (BE/LEAD: Cache-Control 정책 SoT + 캐시 감사)
- [ ] P1-20 (LEAD/WEB: 카테고리 IA 개편 + 키워드 매핑/자동 분류)

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
- 추천 사용자(팔로우 유도): 온보딩 정보 기반 개인화 + 카드 정보(배지/메타) 표시 규칙 정리
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
  - Playwright 운영 원칙(항상):
    - 모든 PR: `npm run test:e2e` 통과
    - UI 영향(PRD/레이아웃/피드/카드/헤더 등): `npm run test:e2e:ui` 실행 → 생성된 `test-results/**/home-*.png`로 시각 확인(필요 시 PR에 스크린샷 첨부)
    - 기능 플로우 검증은 `E2E_TEST_MODE=1`(in-memory 스토어) 기준으로 추가/확장해 “DB/시드 의존” 없이 재현 가능하게 유지
    - 기능/버그 수정은 “변경 지점”을 1개 이상 Playwright로 재현/검증 가능한 형태로 남긴다(테스트 추가/확장 또는 최소 스모크/리퀘스트 검증 추가)

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
  - [x] npm run lint
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
  - [x] npm run lint
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
  - [x] npm run lint
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
  - [x] npm run lint
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

#### (2025-12-20) [FE] 숨김/신고 빠른 메뉴 + 숨김 카드 제거 (P0-11)

- 플랜(체크리스트)
  - [x] 숨김 버튼을 `...`로 통일하고 카드 우상단 고정
  - [x] 소형 메뉴(숨김/신고)로 통합 + 신고 선택 모달 연결
  - [x] 숨김 처리된 카드 자체를 제거(플레이스홀더 미노출)
- 현황 분석(코드 기준)
  - 현재 구현/문제 위치: `src/components/molecules/cards/PostCard.tsx`
  - 재현/리스크: 이미지 유무에 따라 숨김 버튼 위치가 흔들림, 숨김 처리 후 “숨긴 게시글입니다” 카드가 남아 UI 노이즈 발생
- 변경 내용(why/what)
  - why: 위치 일관성 확보 + 숨김 처리 시 리스트 가독성 유지
  - what: 우상단 고정 메뉴로 변경, 숨김/신고 단일 메뉴 제공, 신고는 선택 모달로 확장, 숨김 시 렌더 제거
- 검증
  - [ ] npm run lint
  - [ ] npm run type-check
  - [ ] npm run build
- 변경 파일
  - src/components/molecules/cards/PostCard.tsx
  - docs/WORKING_PLAN.md
- 커밋 준비(필수)
  - 커밋 스코프(요청 1건): 숨김/신고 빠른 메뉴 + 숨김 카드 제거
  - 필요한 파일 목록: 위 변경 파일
  - 필요 검증(lint/type-check/build/기타): lint/build 권장
  - 의존성/선행 작업: 없음
  - 커밋 메시지 제안: `[FE] replace hide placeholder with quick menu`
- 다음 액션/의존성
  - 신고 기본 타입 고정(현재 spam) 정책 합의 필요

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
- 커밋 준비(필수)
  - 커밋 스코프(요청 1건): 게시글 안보기 이모지 버튼 상단 배치
  - 필요한 파일 목록: `src/components/molecules/cards/PostCard.tsx`
  - 필요 검증(lint/type-check/build/기타): lint, type-check, build
  - 의존성/선행 작업: 없음
  - 커밋 메시지 제안: `[FE] PostCard 안보기 이모지 버튼 상단 배치`
- 다음 액션/의존성
  - 카드 상단 여백과 겹침 여부 확인 필요

#### (2025-12-20) [FE] 구독 카테고리 필터 여백 보강 (P0-2)

- 플랜(체크리스트)
  - [x] 구독 카테고리 알약과 카드 사이 간격 확대
- 현황 분석(코드 기준)
  - 현재 구현/문제 위치: `src/components/organisms/PostList.tsx`
  - 재현/리스크: 구독 카테고리 알약 줄과 카드 상단이 밀착되어 답답하게 보임
- 변경 내용(why/what)
  - why: 필터 영역과 카드 영역 간 시각적 분리 강화
  - what: 구독 카테고리 필터 래퍼 `mb-3` → `mb-4`
- 검증
  - [ ] npm run lint
  - [ ] npm run type-check
  - [ ] npm run build
- 변경 파일
  - src/components/organisms/PostList.tsx
- 커밋 준비(필수)
  - 커밋 스코프(요청 1건): 구독 카테고리 필터 여백 보강
  - 필요한 파일 목록: `src/components/organisms/PostList.tsx`
  - 필요 검증(lint/type-check/build/기타): lint, type-check, build
  - 의존성/선행 작업: Hot File(Lead 머지 필요)
  - 커밋 메시지 제안: `[FE] 구독 카테고리 필터 여백 보강`
- 다음 액션/의존성
  - Hot File 변경이라 Lead 머지 타이밍 확인 필요

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
#### (2025-12-20) [WEB] P0-4 퍼포먼스 1차(에디터 스플릿 + 쿼리 튜닝) (P0)

- 플랜(체크리스트)
  - [x] PostDetail RichTextEditor dynamic import
  - [x] follow/status/score 쿼리 staleTime/gcTime 기본값 튜닝
  - [ ] 이미지 sizes/lazy/placeholder 통일(이관 필요)
- 현황 분석(코드 기준)
  - 현재 구현/문제 위치: `src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx`, `src/repo/users/query.ts`
  - 재현/리스크: 상세 진입 시 에디터 번들이 선로드, 팔로우/점수 쿼리 재요청 빈도
- 변경 내용(why/what)
  - why: 초기 로딩 JS 축소 + 불필요 refetch 감소
  - what: 상세 에디터 dynamic import, user score/followStatus 기본 staleTime/gcTime 적용
- 검증
  - [x] npm run lint
  - [ ] npm run type-check
  - [ ] npm run build
- 변경 파일
  - src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx
  - src/repo/users/query.ts
  - docs/WORKING_PLAN.md
- 커밋 준비(필수)
  - 커밋 스코프(요청 1건): P0-4 editor split + query tuning
  - 필요한 파일 목록: 위 변경 파일
  - 필요 검증(lint/type-check/build/기타): lint 완료, type-check/build 미실행
  - 의존성/선행 작업: FE 이미지 표준화 후속
- 커밋 메시지 제안: [WEB] split editor + tune user queries
- 다음 액션/의존성
  - FE 이미지 표준화 작업 병행 필요

#### (2025-12-20) [WEB] P0-15 상세 공유/신고/추천 정리 (P0)

- 플랜(체크리스트)
  - [x] 공유 버튼을 하단 CTA로 스크롤 이동
  - [x] 신고 버튼 아이콘-only + 중립 톤으로 정리
  - [x] 추천 섹션 1개만 노출 + 구분선 추가
- 현황 분석(코드 기준)
  - 현재 구현/문제 위치: `src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx`
  - 재현/리스크: 공유/신고 UI 중복 및 과한 강조, 추천 섹션 2개 동시 노출
- 변경 내용(why/what)
  - why: 중복 동선 제거 + 과한 강조 완화 + 화면 규칙 1개화
  - what: 공유 모달 제거 및 CTA 스크롤로 통합, 신고 버튼 톤다운, 추천 섹션 단일화/구분선 추가
- 검증
  - [x] npm run lint
  - [ ] npm run type-check
  - [ ] npm run build
- 변경 파일
  - src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx
  - docs/WORKING_PLAN.md
- 커밋 준비(필수)
  - 커밋 스코프(요청 1건): P0-15 상세 공유/신고/추천 정리
  - 필요한 파일 목록: 위 변경 파일
  - 필요 검증(lint/type-check/build/기타): lint/type-check/build
  - 의존성/선행 작업: 없음
  - 커밋 메시지 제안: [WEB] simplify post detail share/report/recs
- 다음 액션/의존성
  - 추천 섹션 노출 기준(related >= 2) 검토 필요 시 조정

#### (2025-12-20) [WEB] Trending/Leaderboard 쿼리 캐시 튜닝 (P0-4)

- 플랜(체크리스트)
  - [x] Trending/Leaderboard staleTime 기본값 추가
  - [x] refetchOnWindowFocus 기본값 false
- 현황 분석(코드 기준)
  - 현재 구현/문제 위치: `src/repo/posts/query.ts`, `src/repo/users/query.ts`
  - 재현/리스크: 포커스 전환/탭 복귀 시 불필요한 재요청 발생
- 변경 내용(why/what)
  - why: 리스트/랭킹 재요청 감소로 체감 성능 개선
  - what: trending/leaderboard 쿼리에 기본 staleTime + refetchOnWindowFocus false 설정
- 검증
  - [ ] npm run lint (eslint 패키지 누락으로 실패 기록)
  - [ ] npm run type-check
  - [ ] npm run build
- 변경 파일
  - src/repo/posts/query.ts
  - src/repo/users/query.ts
  - docs/WORKING_PLAN.md
- 커밋 준비(필수)
  - 커밋 스코프(요청 1건): Trending/Leaderboard 쿼리 캐시 기본값 튜닝
  - 필요한 파일 목록: `src/repo/posts/query.ts`, `src/repo/users/query.ts`
  - 필요 검증(lint/type-check/build/기타): lint 실패 기록, type-check/build 미실행
  - 의존성/선행 작업: 없음
  - 커밋 메시지 제안: `[WEB] tune trending/leaderboard query cache`
- 다음 액션/의존성
  - 로컬 lint 환경 재검증 필요

#### (2025-12-20) [WEB] P0-1 en fallback 병합 (P0)

- 플랜(체크리스트)
  - [x] en 딕셔너리에 ko fallback 병합
  - [x] sitemap/alternates en 노출 유지 확인
- 현황 분석(코드 기준)
  - 현재 구현/문제 위치: `src/i18n/get-dictionary.ts`
  - 재현/리스크: en 키 누락 시 UI 문구가 비는 경우 발생
- 변경 내용(why/what)
  - why: en 신규 키 추가 없이도 렌더 깨짐 방지
  - what: en 로드 시 ko 딕셔너리와 deep merge로 fallback 채움
- 검증
  - [ ] npm run lint
  - [ ] npm run type-check
  - [ ] npm run build
- 변경 파일
  - src/i18n/get-dictionary.ts
  - docs/WORKING_PLAN.md
- 커밋 준비(필수)
  - 커밋 스코프(요청 1건): P0-1 en fallback merge
  - 필요한 파일 목록: 위 변경 파일
  - 필요 검증(lint/type-check/build/기타): lint/type-check/build
  - 의존성/선행 작업: 없음
  - 커밋 메시지 제안: [WEB] merge ko fallback into en dictionary
- 다음 액션/의존성
  - FE 언어 스위처 en 숨김 진행 필요

#### (2025-12-20) [WEB] P0-12 메타/키워드 빌더 v1 (P0)

- 플랜(체크리스트)
  - [x] 메타 빌더/키워드 빌더 도입
  - [x] 게시글 상세/검색 generateMetadata 연결
  - [x] 추가 페이지 메타 이관(홈/프로필 등)
- 현황 분석(코드 기준)
  - 현재 구현/문제 위치: `src/app/[lang]/(main)/posts/[id]/page.tsx`, `src/app/[lang]/(main)/search/page.tsx`
  - 재현/리스크: 메타/키워드 생성 로직이 페이지마다 중복됨
- 변경 내용(why/what)
  - why: 메타/키워드 생성 단일 소스로 통합
  - what: `buildPageMetadata`/`buildKeywords` 도입, 상세/검색 메타에서 공용 빌더 사용
- 검증
  - [x] npm run lint
  - [ ] npm run type-check
  - [ ] npm run build
- 변경 파일
  - src/lib/seo/metadata.ts
  - src/lib/seo/keywords.ts
  - src/app/[lang]/(main)/posts/[id]/page.tsx
  - src/app/[lang]/(main)/search/page.tsx
  - docs/WORKING_PLAN.md
- 커밋 준비(필수)
  - 커밋 스코프(요청 1건): P0-12 metadata/keywords builder
  - 필요한 파일 목록: 위 변경 파일
  - 필요 검증(lint/type-check/build/기타): lint/type-check/build
  - 의존성/선행 작업: 없음
  - 커밋 메시지 제안: [WEB] add metadata/keywords builder
- 다음 액션/의존성
  - 홈/프로필 등 추가 메타 이관 필요

#### (2025-12-20) [WEB] P0-12 메타 이관 확장(홈/리더보드) (P0)

- 플랜(체크리스트)
  - [x] 홈 generateMetadata 빌더 적용
  - [x] 리더보드 generateMetadata 빌더 적용
- 현황 분석(코드 기준)
  - 현재 구현/문제 위치: `src/app/[lang]/(main)/page.tsx`, `src/app/[lang]/(main)/leaderboard/page.tsx`
  - 재현/리스크: 페이지별 메타 생성 로직 중복 유지
- 변경 내용(why/what)
  - why: 메타/키워드 파이프라인 통일
  - what: 홈/리더보드 메타를 `buildPageMetadata` + `buildKeywords`로 이관
- 검증
  - [x] npm run lint
  - [ ] npm run type-check
  - [ ] npm run build
- 변경 파일
  - src/app/[lang]/(main)/page.tsx
  - src/app/[lang]/(main)/leaderboard/page.tsx
  - docs/WORKING_PLAN.md
- 커밋 준비(필수)
  - 커밋 스코프(요청 1건): P0-12 metadata builder rollout
  - 필요한 파일 목록: 위 변경 파일
  - 필요 검증(lint/type-check/build/기타): lint 완료, type-check/build 미실행
  - 의존성/선행 작업: 없음
  - 커밋 메시지 제안: [WEB] expand metadata builder to home/leaderboard
- 다음 액션/의존성
  - 프로필 메타 이관 필요 시 범위 확정

#### (2025-12-20) [WEB] P0-12 메타 이관 확장(정적/알림/구독/작성/가이드) (P0)

- 플랜(체크리스트)
  - [x] 정적 페이지(about/faq/privacy/terms) 메타 이관
  - [x] 피드백/알림/구독/작성 메타 이관
  - [x] 가이드(신뢰 배지) 메타 이관
- 현황 분석(코드 기준)
  - 현재 구현/문제 위치: `src/app/[lang]/(main)/*/page.tsx`, `src/app/[lang]/guide/trust-badges/page.tsx`
  - 재현/리스크: 정적/유틸 페이지에서 메타 로직 분산
- 변경 내용(why/what)
  - why: 메타/키워드 파이프라인 통일 유지
  - what: 해당 페이지들의 `generateMetadata`를 공용 빌더로 이관
- 검증
  - [x] npm run lint
  - [ ] npm run type-check
  - [ ] npm run build
- 변경 파일
  - src/app/[lang]/(main)/about/page.tsx
  - src/app/[lang]/(main)/faq/page.tsx
  - src/app/[lang]/(main)/privacy/page.tsx
  - src/app/[lang]/(main)/terms/page.tsx
  - src/app/[lang]/(main)/feedback/page.tsx
  - src/app/[lang]/(main)/notifications/page.tsx
  - src/app/[lang]/(main)/posts/new/page.tsx
  - src/app/[lang]/(main)/subscriptions/page.tsx
  - src/app/[lang]/guide/trust-badges/page.tsx
  - docs/WORKING_PLAN.md
- 커밋 준비(필수)
  - 커밋 스코프(요청 1건): P0-12 metadata builder rollout (static pages)
  - 필요한 파일 목록: 위 변경 파일
  - 필요 검증(lint/type-check/build/기타): lint 완료, type-check/build 미실행
  - 의존성/선행 작업: 없음
  - 커밋 메시지 제안: [WEB] expand metadata builder to static pages
- 다음 액션/의존성
  - 프로필 메타 이관 필요 시 범위 확정

#### (2025-12-20) [WEB] P0-14 피드백 폼 필드 최소화 (P0)

- 플랜(체크리스트)
  - [x] 버그 타입 영향도 입력 제거
  - [x] 만족도 입력은 피드백만 노출
  - [x] 입력 유도 문구 위치 재정리
- 현황 분석(코드 기준)
  - 현재 구현/문제 위치: `src/app/[lang]/(main)/feedback/FeedbackClient.tsx`
  - 재현/리스크: 버그 제보에 만족도(영향도) 요구로 제출 허들 상승
- 변경 내용(why/what)
  - why: 버그 제보 필수 입력을 “상세 설명”만 남겨 제출 허들 최소화
  - what: 버그 타입에서는 만족도 영역 숨김, 피드백에만 만족도 선택 노출, 텍스트 입력 안내를 상세 입력 하단으로 이동
- 검증
  - [x] npm run lint
  - [x] npm run type-check
  - [x] npm run build
- 변경 파일
  - src/app/[lang]/(main)/feedback/FeedbackClient.tsx
  - docs/WORKING_PLAN.md
- 커밋 준비(필수)
  - 커밋 스코프(요청 1건): P0-14 feedback form simplification
  - 필요한 파일 목록: 위 변경 파일
  - 필요 검증(lint/type-check/build/기타): lint 완료, type-check/build 미실행
  - 의존성/선행 작업: FE 사이드바 피드백 아이콘화 작업 필요
  - 커밋 메시지 제안: [WEB] simplify feedback form fields
- 다음 액션/의존성
  - FE에서 사이드바 피드백 아이콘 전환 후 마무리

## P0 (출시 전: Launch blocking)

#### (2025-12-20) [LEAD] P0-0 운영/병렬 규칙 고정 (P0)

- 플랜(체크리스트)
  - [x] [LEAD] Hot File 잠금/소유권 요약 1페이지 반영
  - [x] [LEAD] i18n 키 담당/요청 프로세스 확정
  - [x] [LEAD] 게이트(lint/type-check/build + Playwright) 고정

- 목표: Hot File 충돌/번역키 충돌/통합 타이밍 문제를 구조적으로 차단
- 작업
  - Hot File 단일 소유 재확인: Header/MainLayout/PostList/globals.css는 Lead만 머지
  - i18n 키 추가 담당(Lead): `messages/ko.json`, `messages/vi.json`만 의무(신규 작업은 `en` 번역 키 추가/검수 없음)
    - 신규 키는 `ko` 기준으로 추가 → `vi`는 가능한 범위에서 즉시 반영(미반영 시 QA에서 클립/하드코딩 재점검)
  - 통합 윈도우/릴리즈 게이트 고정: lint/type-check/build + Playwright 통과 후만 머지
- 완료 기준: `docs/EXECUTION_PLAN.md`에 “잠금/소유/게이트”가 1페이지 요약으로 반영

#### (2025-12-20) [LEAD] P0-1 en UI 숨김 + SEO 유지 (P0)

- 플랜(체크리스트)
  - [x] [FE] LanguageSwitcher en 숨김(ko/vi만 노출)
  - [x] [WEB] sitemap/alternates en 유지 + locale fallback 병합
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

- 최근 구현(2025-12-21)
  - 글쓰기(`/posts/new`) 유효성 토스트의 한국어 하드코딩 fallback 제거 → 다국어 템플릿(`{min}/{max}`) 기반으로 통일
  - 신고 API(`/api/*/[id]/report`) 에러 응답을 코드 기반으로 통일 + ko/vi `errors` 매핑 추가(한국어 메시지 누수 제거)
  - 업로드 API(`/api/upload*`) 에러 응답 코드화 + 에디터/프로필/인증 업로드 토스트를 code→`errors`로 매핑(한국어 메시지 누수 제거)
  - 사이드바(CategorySidebar) 메뉴/툴팁/토스트 문구를 messages 기반으로 단일화하고 컴포넌트 내부 하드코딩 fallback 제거
  - 하단 내비게이션(BottomNavigation) 라벨/홈 피드 토글 라벨을 messages 기반으로 단일화하고 컴포넌트 내부 하드코딩 fallback 제거
  - 팔로우 버튼(FollowButton) 및 호출부(추천 사용자/프로필/상세/팔로잉 모달)에서 locale 분기 하드코딩 제거 → `common` 키 기반으로 통일
  - 공용 `common`에 `previous/next/learnMore`를 추가하고 주요 화면에서 locale 분기 하드코딩 제거(카드/상세/프로필/인증/글쓰기 가이드)
  - 인증 신청(VerificationRequest) step 라벨/재신청 버튼/유형 선택 에러 + 글쓰기(NewPost) 썸네일 선택 문구를 messages 키로 추가하고 locale 분기 하드코딩 fallback 제거
  - 검색/구독/게시글 상세(SSR)에서 `question/share/uncategorized/anonymous` locale 분기 fallback 제거 → translations 키 단일화
  - 헤더/로고(Header/Logo)에서 locale 분기 하드코딩 fallback 제거 + 뒤로가기 라벨을 truncate 처리해 모바일/좁은 폭 줄바꿈 방지
  - 프로필 수정(ProfileEdit)에서 locale 분기 하드코딩 fallback 제거 + `profileEdit` 누락 키 보강(`statusResident`/업로드 토스트 등) + 뒤로가기 버튼 줄바꿈 방지
  - 글쓰기 유사질문 프롬프트(SimilarQuestionPrompt)에서 locale 분기 fallback 제거 + `similarNoResults` 키 추가
  - 로그인 유도 모달(LoginPrompt) 전용 `loginPrompt` 섹션 도입으로 locale 분기 fallback 제거
  - 사이드바(CategorySidebar) `상위 기여자(Event)` 라벨을 messages로 고정하고 locale 분기 제거
  - 공지 배너(NoticeBanner)·뉴스 섹션(NewsSection) 라벨을 messages로 이동(공지/외부 링크/닫기)
  - 커뮤니티 랭킹(LeaderboardClient) 카피를 messages로 이동하고 locale 분기 fallback 제거(랭킹 안내/이벤트 영역 포함)
  - 에디터(RichTextEditor) 툴바/업로드/링크 UI 문구를 messages로 이동하고 locale 분기 fallback 제거
  - 홈 피드(PostList)·추천 사용자(RecommendedUsersSection) 라벨을 dictionary 섹션(profile/post/common) 기준으로 재정렬하고 locale 분기 fallback 제거(추천 CTA 키 추가 포함)
  - 알림 페이지(NotificationsClient)에서 locale 분기 하드코딩 fallback 제거 → `messages.notifications` 기반으로 통일
  - 홈 피드(PostList) 점수 요약 카드의 레이블/레벨 표기 locale 분기 제거 → `profile.points/title/rank/leaderboard/levelFormat` 키 추가
  - 프로필(ProfileClient)에서 locale 분기 하드코딩 fallback 제거 → `profile` 라벨/레벨 표기(`levelFormat`)/유저 타입 라벨을 messages 기반으로 통일(`editProfileTooltip/loading/userType*` 키 보강)
  - 게시글 상세(PostDetailClient)에서 공유/숨김/도움됨/관련 글/답변 작성 영역 locale 분기 fallback 제거 → `common`(save/unhide/helpful*) + `postDetail`(shareCta/related*/answerMinHint 등) 키 보강
  - 게시글 카드(PostCard)에서 툴팁/공유/숨김/신고 문구 locale 분기 fallback 제거 → `common.hide/hideFailed` + `postDetail.copyFailed` + `tooltips.close` 키 보강
  - 답변/댓글 카드(AnswerCard/CommentCard)에서 원글/삭제/숨김/도움됨 문구 locale 분기 fallback 제거 → `common.hideFailed` 범용 문구로 조정
  - 헤더 검색(HeaderSearch)에서 입력/라벨 locale 분기 fallback 제거 + `search.minLengthError` 키 추가
  - 추천 사용자 메타(RecommendedUsersSection/FollowingModal)용 `localizeRecommendationMetaItems`에서 locale 분기 fallback 제거 → `onboardingLabels` 기반으로 단일화
  - 검증: `npm run lint`, `npm run type-check`, `SKIP_SITEMAP_DB=true npm run build`, `npm run test:e2e`
  - 변경: `src/app/[lang]/(main)/posts/new/NewPostClient.tsx`
  - 변경: `src/app/api/posts/[id]/report/route.ts`, `src/app/api/answers/[id]/report/route.ts`, `src/app/api/comments/[id]/report/route.ts`, `messages/ko.json`, `messages/vi.json`
  - 변경: `src/app/api/upload/route.ts`, `src/app/api/upload/avatar/route.ts`, `src/app/api/upload/document/route.ts`, `src/components/molecules/editor/RichTextEditor.tsx`, `src/app/[lang]/(main)/profile/edit/ProfileEditClient.tsx`, `src/app/[lang]/(main)/verification/request/VerificationRequestClient.tsx`, `messages/ko.json`, `messages/vi.json`
  - 변경: `src/components/organisms/CategorySidebar.tsx`, `messages/ko.json`, `messages/vi.json`
  - 변경: `src/components/organisms/BottomNavigation.tsx`
  - 변경: `src/components/molecules/cards/PostCard.tsx`, `messages/ko.json`, `messages/vi.json`
  - 변경: `src/components/molecules/cards/AnswerCard.tsx`, `src/components/molecules/cards/CommentCard.tsx`, `messages/ko.json`, `messages/vi.json`
  - 변경: `src/components/molecules/search/HeaderSearch.tsx`, `messages/ko.json`, `messages/vi.json`
  - 변경: `src/utils/recommendationMeta.ts`
  - 변경: `src/components/atoms/FollowButton.tsx`, `src/components/organisms/RecommendedUsersSection.tsx`, `src/components/organisms/PostList.tsx`, `src/app/[lang]/(main)/profile/[id]/ProfileClient.tsx`, `src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx`, `src/components/molecules/modals/FollowingModal.tsx`, `messages/ko.json`, `messages/vi.json`
  - 변경: `src/components/molecules/cards/PostCard.tsx`, `src/components/molecules/cards/AnswerCard.tsx`, `src/components/molecules/cards/CommentCard.tsx`, `src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx`, `src/app/[lang]/(main)/profile/[id]/ProfileClient.tsx`, `src/app/[lang]/(main)/verification/request/VerificationRequestClient.tsx`, `src/app/[lang]/(main)/posts/new/NewPostClient.tsx`, `messages/ko.json`, `messages/vi.json`
  - 변경: `src/app/[lang]/(main)/notifications/NotificationsClient.tsx`
  - UserMenu 드롭다운/모달 번역 전달 경로 정합(번역 누락/blank 방지): Header→UserProfile→(Profile/MyPosts/Following/Bookmarks/Settings)에 full dictionary 전달
  - SettingsModal 저장 토스트/구독 관리 CTA를 i18n 키로 분리: `userMenu.saveSuccess/saveError/manageSubscriptions`(ko/vi)
  - 검증: `npm run lint`, `npm run type-check`, `SKIP_SITEMAP_DB=true npm run build`, `npm run test:e2e`
  - 변경: `src/components/organisms/Header.tsx`, `src/components/molecules/user/UserProfile.tsx`
  - 변경: `src/components/molecules/modals/ProfileModal.tsx`, `src/components/molecules/modals/MyPostsModal.tsx`, `src/components/molecules/modals/FollowingModal.tsx`, `src/components/molecules/modals/BookmarksModal.tsx`, `src/components/molecules/modals/SettingsModal.tsx`
  - 변경: `messages/ko.json`, `messages/vi.json`
  - trust-badges 가이드(`/guide/trust-badges`)의 `locale ===` 분기 제거: 메타 fallback은 locale map으로, CTA는 `bottomNav.home` + `sidebar.verificationRequest`, 배지 라벨/툴팁은 `trustBadges.*`만 사용
  - 검증: `npm run lint`, `npm run type-check`, `SKIP_SITEMAP_DB=true npm run build`, `npm run test:e2e`
  - 변경: `src/app/[lang]/guide/trust-badges/page.tsx`
  - 잔여 `locale === 'en'/'vi'` 분기 제거(정리): ShareButton/CardNews/Shorts/NotificationModal/날짜·배지·태그·카테고리 유틸 + 루트 레이아웃 메타 fallback → locale map/키 기반으로 통일(`src/i18n/get-dictionary.ts`의 en fallback merge는 유지)
  - 검증: `npm run lint`, `npm run type-check`, `SKIP_SITEMAP_DB=true npm run build`, `npm run test:e2e`
  - 변경: `src/components/molecules/actions/ShareButton.tsx`, `src/components/organisms/CardNewsShowcase.tsx`, `src/components/organisms/ShortFormPlaylist.tsx`, `src/components/molecules/modals/NotificationModal.tsx`
  - 변경: `src/utils/dateTime.ts`, `src/lib/utils/trustBadges.ts`, `src/lib/constants/tag-translations.ts`, `src/lib/constants/categories.ts`
  - 변경: `src/app/[lang]/layout.tsx`, `src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx`
  - 추가 i18n 스윕(2025-12-21): 온보딩/검색/글쓰기/인증/피드백/리더보드/게시글 상세 메타의 locale 분기 fallback 제거 → messages 기반으로 단일화(ko/vi 우선, en은 SEO 렌더 안정성만 보장)
  - 메타 보강: `metadata.feedback`, `metadata.leaderboard` 추가 + PostDetail notFound 메타 하드코딩 제거
  - 검증: `npm run lint`, `npm run type-check`, `SKIP_SITEMAP_DB=true npm run build`, `npm run test:e2e`
  - 변경: `src/app/[lang]/(main)/onboarding/OnboardingClient.tsx`, `src/app/[lang]/(main)/search/SearchClient.tsx`, `src/app/[lang]/(main)/posts/new/NewPostClient.tsx`
  - 변경: `src/app/[lang]/(main)/verification/request/VerificationRequestClient.tsx`, `src/app/[lang]/(main)/verification/history/VerificationHistoryClient.tsx`, `src/app/[lang]/(main)/feedback/FeedbackClient.tsx`
  - 변경: `src/app/[lang]/(main)/leaderboard/page.tsx`, `src/app/[lang]/(main)/posts/[id]/page.tsx`, `messages/ko.json`, `messages/vi.json`, `messages/en.json`

#### (2025-12-20) [FE] P0-3 모바일 키보드/스크롤(WebView 포함) UX 하드닝 (P0)

- 플랜(체크리스트)
  - [ ] [FE] 입력 폼 safe-area/100dvh/overflow 점검
  - [ ] [FE] 키보드 노출 시 제출 버튼 접근 테스트

- 목표: iOS/Android에서 입력 폼이 키보드에 가려지거나 스크롤이 잠기는 문제 제거
- 작업
  - 글/답변/댓글/모달 입력에서 safe-area + `100dvh` + overflow 처리 점검
  - “키보드 올라옴 → 제출 버튼 접근 가능”을 종료 조건으로 맞춤(로그인 모달 포함)
- 완료 기준: iPhone SE급에서도 입력/제출이 막히지 않음

- 최근 구현(2025-12-21)
  - 공용 `Modal`의 최대 높이를 `100dvh` 기준으로 조정해 모바일 키보드/뷰포트 변화에서 잘림 가능성 완화
  - 검증: `npm run lint`, `npm run type-check`, `SKIP_SITEMAP_DB=true npm run build`
  - 변경: `src/components/atoms/Modal.tsx`

#### (2025-12-20) [WEB] P0-4 퍼포먼스 1차(저사양/저속) (P0)

- 플랜(체크리스트)
  - [x] [FE] 이미지 sizes/lazy/placeholder 통일
  - [x] [WEB] dynamic import 확대(에디터/모달/관리자)
  - [x] [WEB] Query enabled/staleTime 튜닝

- 목표: 초기 로딩/스크롤 체감 개선(이미지/무거운 UI 중심 + 불필요 API 호출 감소)
- 작업
  - 이미지 표준화: 피드/썸네일을 공용 컴포넌트로 통일하고 `next/image`의 `sizes`/lazy/placeholder 규격화(과한 해상도 요청 방지)
  - 코드 스플리팅: 에디터/모달/관리자/리더보드 등 무거운 컴포넌트 `dynamic import` 확대
  - Query 튜닝: 알림/모달/드로어/탭 등 “열렸을 때만” 요청(`enabled`), 불필요 refetch 제거, 적정 `staleTime` 설정
- 완료 기준: 저속 네트워크에서 첫 인터랙션 체감 개선 + “불필요 백그라운드 요청”이 발생하지 않음

- 최근 구현(2025-12-21)
  - 좋아요/북마크 토글 이후 `refetchQueries(type='all')` 제거(불필요 네트워크/데이터 사용 감소)
  - 이미지 표준화: `DEFAULT_BLUR_DATA_URL` 단일화 + 아바타/배너/뉴스 썸네일에 `sizes`/placeholder 적용, `<img>` 기반 모달 프리뷰를 `next/image`로 교체
  - 검증: `npm run lint`, `npm run type-check`, `SKIP_SITEMAP_DB=true npm run build`, `npm run test:e2e`
  - 변경: `src/repo/posts/mutation.ts`, `src/repo/answers/mutation.ts`, `src/repo/comments/mutation.ts`
  - 변경: `src/components/atoms/Avatar.tsx`, `src/components/organisms/NoticeBanner.tsx`, `src/components/organisms/NewsSection.tsx`, `src/components/molecules/cards/NewsCard.tsx`

#### (2025-12-20) [FE] P0-5 A11y 최소 기준(출시 차단만) (P0)

- 플랜(체크리스트)
  - [x] [FE] 아이콘-only 버튼 aria-label 전수
  - [x] [FE] 터치 타깃 최소 규격 점검

- 목표: 아이콘 버튼/내비/모달 접근성 결함으로 인한 이탈 방지
- 작업
  - 아이콘-only 버튼 `aria-label` 전수(예: 네비/카드 액션/헤더)
  - 포커스 링/키보드 탭 이동/대비 기본 점검(치명 항목만)
- 완료 기준: 주요 화면에서 “무라벨 버튼 0”

- 최근 구현(2025-12-21)
  - 검색 페이지(H1/폼 레이블) 보강: `src/app/[lang]/(main)/search/SearchClient.tsx`
  - 헤더/검색/카드/사이드바 등 아이콘 버튼 `aria-label` 및 모바일 터치 타깃(≥44px) 정리
  - 글쓰기 페이지 A11y 보강: RichTextEditor 툴바/입력 aria-label 추가 + 템플릿 입력(조건/목표/배경) label 연결
  - 검증: `npm run lint`, `npm run type-check`, `SKIP_SITEMAP_DB=true npm run build`, `npm run test:e2e`, `node scripts/accessibility-audit.js`(Home/Search/NewPost/Leaderboard 0 violations)
  - 변경: `src/components/molecules/editor/RichTextEditor.tsx`, `src/app/[lang]/(main)/posts/new/NewPostClient.tsx`

#### (2025-12-20) [BE] P0-6 Rate limit 필수 적용(쓰기 API 우선) (P0)

- 플랜(체크리스트)
  - [x] [BE] 429 응답 스키마/Retry-After 통일(피드백 포함)
  - [x] [WEB] 429 UX 처리(ko/vi 에러키 + Retry-After 표시)
  - [x] [LEAD] 적용 엔드포인트 목록 확정

- 목표: 스팸/남용 방어(출시 직후 가장 흔한 장애 요인)
- 작업
  - 현재(베이스라인): `middleware.ts`에 “쓰기 메서드” in-memory 제한이 있고, 429 응답은 공용 스키마(`rateLimitResponse`) + `Retry-After`로 통일됨(프로덕션 멀티 인스턴스 내구성은 제한적)
  - 공용 rate limit 유틸 설계(스토리지 포함): Redis/KV 우선, 로컬/개발 환경은 in-memory fallback(환경변수 on/off)
  - 적용 우선순위(필수): 글/답변/댓글/신고/피드백/인증 요청 + 비용 큰 읽기(검색/키워드 추천 등)
  - 429 응답 규격 통일 + 프론트 UX 처리(토스트/재시도 안내, `Retry-After` 준수)
- 완료 기준: 지정된 엔드포인트에서 임계치 초과 시 429 + 클라이언트 UX 처리 완료

- 최근 구현(2025-12-21)
  - 429 응답 표준화
    - `POST /api/feedback`: rateLimitResponse + Retry-After 적용
    - `middleware.ts`: write-method 429 응답 스키마 통일(이전 작업)
  - 429 UX 처리(클라)
    - ApiError에 `retryAfterSeconds` 추가 + fetch 레이어에서 `Retry-After` 전달
    - ko/vi errors에 `*_RATE_LIMITED` 키 추가 후 토스트에 반영
  - 검증: `npm run lint`, `npm run type-check`, `SKIP_SITEMAP_DB=true npm run build`, `npm run test:e2e`
  - 변경: `src/app/api/feedback/route.ts`, `src/lib/api/errors.ts`, `src/repo/**/fetch.ts`, `src/app/[lang]/(main)/feedback/FeedbackClient.tsx`, `src/app/[lang]/(main)/verification/request/VerificationRequestClient.tsx`, `messages/ko.json`, `messages/vi.json`

#### (2025-12-20) [LEAD] P0-7 Playwright 필수 도입(릴리즈 게이트) (P0)

- 플랜(체크리스트)
  - [x] [WEB] Playwright 스모크 시나리오 작성
  - [x] [LEAD] 릴리즈 게이트/CI 연결 문서화

- 목표: 최소 자동화로 “깨짐”을 배포 전에 잡는다
- 작업
  - Playwright 설정/스크립트 추가(`test:e2e` 등) + 릴리즈 게이트에 포함
  - 브라우저: Chromium + WebKit(iOS 대체) + 모바일 viewport 1종
  - 스모크 시나리오(로그인 없이 가능한 범위 우선)
    - 홈 로드/언어(ko↔vi) 전환
    - 검색 페이지/상세 진입
    - 글쓰기 시도 → 로그인 모달/게이팅 동작 확인
    - Rate limit 429 동작(테스트 가능한 조건/엔드포인트 포함)
- 구현(코드 변경)
  - Playwright 도입
    - `package.json`에 `test:e2e` 추가
    - `playwright.config.ts` 추가(로컬은 `dev`, CI는 `start` 기반)
    - `e2e/smoke.spec.ts` 스모크 3종(정적 페이지, 언어 스위치, rate limit 429)
  - Rate limit 스모크용 probe 엔드포인트
    - `src/app/api/probe/rate-limit/route.ts` (env `ENABLE_PROBE_ENDPOINTS=true`일 때만 활성)
  - CI 게이트 연결
    - `.github/workflows/ci.yml`에 Playwright 브라우저 설치 + `npm run test:e2e` 추가
- 릴리즈 게이트 설계(필수, C)
  - CI(PR): “정적 + E2E” 게이트(항상 필수)
    - `npm run lint` → `npm run type-check` → `SKIP_SITEMAP_DB=true npm run build` → `npm run test:e2e` (`.github/workflows/ci.yml:1`)
    - E2E에는 429 스모크(`GET /api/probe/rate-limit`) 포함
  - Release(Staging): 동일 스모크를 스테이징 URL로 재실행(필요 시 `E2E_BASE_URL` 사용)
  - Local(개발자): 빠른 게이트 + 필요 시 E2E
    - 빠른 게이트는 항상 수행, E2E는 “스테이징 URL 또는 로컬 데이터 환경”이 준비된 경우에만 수행
  - 스크립트 정렬
    - 감사 스크립트는 현재 라우트(`/[lang]`) 기준으로 정렬 완료(`P1-12`, `scripts/performance-audit.js:1`, `scripts/accessibility-audit.js:1`)
    - API 스모크 스크립트는 현재 API 기준으로 정렬(`scripts/verify-api.sh:1`)
- 완료 기준: “릴리즈 전 필수로 돌리는 Playwright 스모크”가 문서/CI에 고정되고, 실패 시 배포 중단

#### (2025-12-20) [LEAD] P0-8 핵심 지표 이벤트 정의 + 수집 v1 (P0)

- 플랜(체크리스트)
  - [x] [LEAD] 이벤트 목록/스키마 정의
  - [x] [BE] `/api/events` 저장/검증
  - [x] [WEB] 핵심 트리거 연결

- 목표: 출시 후 의사결정/운영이 가능한 최소 계측
- 작업
  - 이벤트 스키마(SoT)
    - API: `POST /api/events` (`src/app/api/events/route.ts`)
    - eventType: `view|search|post|answer|comment|like|bookmark|follow|report|share`
    - entityType: `post|answer|comment|user|search`
    - 저장 필드(요약): `eventType`, `entityType`, `entityId`, `userId?`, `sessionId?`, `ipHash?`, `locale?`, `referrer?`, `metadata?`
    - 개인정보 최소화: IP는 해시로만 저장(`LOG_HASH_SALT` 기반), PII(이메일/전화번호/원문 텍스트) 적재 금지
  - 이벤트 목록/필드/트리거 정의(DAU, 질문/답변/댓글, 채택/해결, 신고, 인증 신청, 구독/알림 등)
  - `/api/events` 수집 + 저장(크기 제한/개인정보 최소화/검증)
  - 클라이언트는 핵심 트리거에만 연결(실패해도 UX 영향 0)
- 완료 기준: 이벤트가 실제 적재되고(샘플 확인), “볼 지표”가 합의됨

- 최근 구현(2025-12-21)
  - 게시글 작성 이벤트 추가: `eventType='post'`로 글 작성 시점 계측
  - 트리거 연결(예시)
    - 글 작성: `src/repo/posts/mutation.ts`
    - 답변/댓글/좋아요/북마크/팔로우/신고/공유/검색/조회: `src/repo/**/mutation.ts`, `src/app/[lang]/(main)/search/SearchClient.tsx`, `src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx`, `src/components/molecules/cards/PostCard.tsx`
  - 검증: `npm run lint`, `npm run type-check`, `SKIP_SITEMAP_DB=true npm run build`, `npm run test:e2e`

#### (2025-12-20) [LEAD] P0-9 크로스브라우징/반응형 QA 라운드 (P0)

- 플랜(체크리스트)
  - [ ] [LEAD] QA 매트릭스/체크리스트 확정
  - [ ] [FE] 이슈 수정 및 재검증

- 목표: iOS Safari/Android Chrome/Edge에서 치명 레이아웃/입력 결함 제거
- 작업: iPhone SE~태블릿까지 체크리스트 기반 수동 QA(스크린샷/재현 스텝 기록)
- 완료 기준: Blocker/Major 0, Minor는 P1 이월 목록화

#### (2025-12-20) [LEAD] P0-10 신규 사용자 가이드라인 안내/유도 v1 (P0)

- 플랜(체크리스트)
  - [x] [LEAD] 가이드라인 정책/문구 확정(비차단)
  - [x] [WEB] 1회 노출/상태 저장 UX 구현(localStorage)
  - [x] [BE] `/api/events`에 `guideline` 이벤트 타입 추가
  - [x] [FE] 글쓰기 화면에서 1회 모달로 가이드라인 리마인드

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

- 최근 구현(2025-12-21)
  - 글쓰기(`posts/new`)에서 가이드라인을 1회 모달로 노출하고, 닫으면 `localStorage(vk-guidelines-seen-v1:{userId})`로 저장
  - 닫기 시 `/api/events`에 `eventType='guideline'` 로깅(비차단)
  - 검증: `npm run lint`, `npm run type-check`, `SKIP_SITEMAP_DB=true npm run build`, `npm run test:e2e`
  - 변경: `src/app/[lang]/(main)/posts/new/NewPostClient.tsx`, `src/components/molecules/modals/GuidelinesModal.tsx`, `src/app/api/events/route.ts`, `src/repo/events/types.ts`

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
  - [x] [WEB] 메타 빌더/키워드 빌더 도입
  - [x] [BE] (P0 범위) 기존 `/api/search/keywords` 유지(DB 집계 기반), 메타/해시태그 SoT는 `keywords.ts`로 고정
  - [x] [FE] 글쓰기 자동 해시태그를 공용 키워드 빌더(`buildKeywords`)로 통일(중복 로직 제거)

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
  - 글쓰기 기본 태그 생성은 `src/lib/seo/keywords.ts`를 SoT로 사용(컴포넌트 내부 키워드 매핑/토큰 로직 없음)

- 최근 구현(2025-12-21)
  - 글쓰기 자동 태그(`posts/new`)를 `buildKeywords/flattenKeywords` 기반으로 통일
  - 키워드 추천 API(`/api/search/keywords`) date filter param 직렬화 오류 수정
  - 검증: `npm run lint`, `npm run type-check`, `SKIP_SITEMAP_DB=true npm run build`, `npm run test:e2e`
  - 변경: `src/app/[lang]/(main)/posts/new/NewPostClient.tsx`
  - 변경: `src/app/api/search/keywords/route.ts`

#### (2025-12-20) [FE] P0-13 카드/템플릿 “강조 표시” 정리(라벨 제거) (P0)

- 플랜(체크리스트)
  - [x] [FE] 라벨 숨김 + 강조 UI 적용
  - [x] [WEB] 템플릿 출력 규칙 정리

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

- 최근 구현(2025-12-21)
  - 프로필 상단 정보에서 라벨 텍스트를 숨기고 값만 pill로 강조(라벨은 `sr-only`로 접근성 유지)
  - 글쓰기 템플릿(조건/목표/배경) 출력은 라벨 없이 “값만 강조”로 상단 삽입(강조 HTML 생성)
  - 검증: `npm run lint`, `npm run type-check`, `SKIP_SITEMAP_DB=true npm run build`, `npm run test:e2e`
  - 변경: `src/app/[lang]/(main)/profile/[id]/ProfileClient.tsx`, `src/app/[lang]/(main)/posts/new/NewPostClient.tsx`

#### (2025-12-20) [FE] P0-14 피드백 UX 간소화 + 사이드바 피드백 아이콘화 (P0)

- 플랜(체크리스트)
  - [x] [FE] 피드백 UI 간소화
  - [x] [WEB] 피드백 폼 필드 최소화 + 제출 UX

- 목표: 피드백 제출 허들을 낮추고, 사이드바 피드백 진입을 “작고 명확한 이모지 + 툴팁”으로 정리한다
- 작업(권장)
  - 피드백 페이지
    - 만족도: “전반적인 경험을 선택” 같은 짧은 힌트 대신, 만족도 아래에 텍스트 입력을 유도(예: “본 사이트에 대한 전반적인 경험을 작성해주세요”)
    - 버그: 영향도 조사 제거 + 재현 단계 입력 제거(필수 입력은 “버그 설명”만)
    - 제출 후: 감사 메시지로 마무리(예: “감사합니다. 제출하신 내용 반영하여 페이지 개선에 힘쓰겠습니다.”)
    - “현재 페이지(URL)” 입력 UI는 노출하지 않고 자동 수집만 유지(표시는 제거)
  - 사이드바 피드백
    - “상위 기여자(Event)” 아래 우측에 “이모지 버튼(💬)만” 배치(라벨 텍스트 미노출)
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
  - [x] [FE] 카드 헤더 레이아웃 정렬(닉네임 기준으로 제목/본문 시작점 통일)
  - [x] [LEAD] 데스크톱 카드 최대 폭 제한 + 그리드 폭 재정렬(Hot File)

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

- 최근 구현(2025-12-21)
  - 카드 본문/태그/좌측 액션의 시작점을 닉네임 시작점으로 통일: `src/components/molecules/cards/PostCard.tsx`
  - 검증: `npm run lint`, `npm run type-check`, `SKIP_SITEMAP_DB=true npm run build`, `npm run test:e2e`

#### (2025-12-20) [LEAD] P0-17 좌측 사이드바 고정 + 독립 스크롤 (P0)

- 플랜(체크리스트)
  - [x] [LEAD] 좌측 컬럼 sticky 고정 + 높이 고정(Hot File)
  - [x] [FE] 좌측 사이드바 내부 스크롤 분리(overflow-y-auto)

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
- 구현(코드 변경)
  - 좌측 레일 sticky + 고정 높이: `src/components/templates/MainLayout.tsx`
  - 사이드바 내부 스크롤: `src/components/organisms/CategorySidebar.tsx`
- 검증(로컬)
  - `npm run lint`
  - `npm run type-check`
  - `SKIP_SITEMAP_DB=true npm run build`
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
- 구현(코드 변경)
  - 뒤로 버튼: 모바일은 icon-only, `sm+`에서만 텍스트 노출 + `whitespace-nowrap`로 다국어 줄바꿈 방지
  - `showBackButton`일 때 브랜드 소개(서브 텍스트)는 모바일에서 숨김 처리(폭 확보)
  - `src/components/organisms/Header.tsx`
- 검증(로컬)
  - `npm run lint`
  - `npm run type-check`
  - `SKIP_SITEMAP_DB=true npm run build`
  - `npm run test:e2e`
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
- 구현(코드 변경)
  - API: 점수(정렬)는 유지하되, UI 표시용 `temperature`를 추가(기본 36.5, 소수 1자리, `36.5 + log10(score+1)*2`)
    - `src/app/api/users/leaderboard/route.ts`
  - 타입: `UserLeaderboardEntry`에 `temperature` 추가 + 레벨 관련 필드 제거
    - `src/repo/users/types.ts`
  - UI: 레벨/진행바/총 멤버 수/계산식 노출 제거 → 온도-only + “랭킹이 오르는 행동” 안내로 교체 + 모바일 Event placeholder 추가
    - `src/app/[lang]/(main)/leaderboard/LeaderboardClient.tsx`
  - 레이아웃: 웹에서 우측 4 영역 확보를 위해 `rightRail`에 Event placeholder 추가
    - `src/app/[lang]/(main)/leaderboard/page.tsx`
  - 메뉴: `상위 기여자(Event)` 라벨 적용(vi/en도 Event 표기)
    - `src/components/organisms/CategorySidebar.tsx`
- 검증(로컬)
  - `npm run lint`
  - `npm run type-check`
  - `SKIP_SITEMAP_DB=true npm run build`
  - `npm run test:e2e`
- 완료 기준
  - 랭킹 페이지에서 `Level` 관련 UI가 보이지 않음(진행바/라벨 포함)
  - 온도는 기본 36.5 기반으로 표시되며, 높은 온도에서만 “더 뜨거운” 표현이 적용됨
  - 상단 안내에 계산식이 아닌 “랭킹 상승 행동”만 안내되고, 전체 멤버 수는 노출되지 않음
  - 웹은 우측 여백/컬럼이 확보되고, 모바일 상단은 Event로 확장 가능한 영역으로 남아 있음

#### (2025-12-20) [BE/WEB] P0-20 UGC 무해화 + 링크 정책 단일화 (P0)

- 목표: UGC(질문/답변/댓글)의 XSS/피싱 리스크를 “서버 write-time 무해화 + 단일 링크 정책”으로 구조적으로 차단한다
- 현황(코드 근거)
  - UGC는 HTML 그대로 저장/반환되고 클라이언트에서 `dangerouslySetInnerHTML`로 렌더됨(`src/app/api/posts/route.ts:666`, `src/app/api/posts/route.ts:819`, `src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx:2273`)
  - `createSafeUgcMarkup`는 링크 `rel="ugc"` 보정 수준이며, 태그/속성 allowlist 기반 무해화를 하지 않음(`src/utils/sanitizeUgcContent.ts:17`)
  - 링크 정책이 스팸 필터와 allowlist 검증으로 분산되어 충돌 가능(`src/lib/content-filter.ts:15`, `src/lib/validation/ugc-links.ts:57`)
- 작업(권장, 효율 우선)
  - 무해화 파이프라인 고정(SoT)
    - 서버에서 저장 직전에 HTML sanitize(허용 태그/속성/URL 스킴/이미지 src 규칙) → 저장/반환은 “이미 안전한 HTML”만
    - 렌더 단계에서는 “링크 rel 정책(ugc + 필요 시 nofollow/sponsored)”만 보정하고, sanitize는 중복하지 않음(성능/일관성)
  - 링크 정책 단일화(SoT)
    - allowlist(공식 출처)에서 허용/차단을 결정하고, 스팸/연락처/광고 필터는 “추가 신호”로만 사용(우선순위/조건을 문서+코드로 통일)
    - 허용되지 않은 외부 링크는 (1) 링크 제거(텍스트화) 또는 (2) 클릭 전 경고 화면 등 중 택1로 단순화(운영 효율 우선)
  - 회귀 방지 최소 세트
    - 대표 XSS 페이로드(스크립트/이벤트 핸들러/javascript: URL) 샘플을 문서/테스트로 고정해 재발 방지
- 구현(코드 변경)
  - 서버 write-time sanitize 도입: `src/lib/validation/ugc-sanitize.ts` (허용 태그/속성 allowlist, `data-thumbnail` 보존)
  - 링크 allowlist 검증 보강: protocol-relative(`//...`) 우회 차단(`src/lib/validation/ugc-links.ts`)
  - URL 스팸 차단 중복 제거: `src/lib/content-filter.ts`에서 URL 패턴 제거 → allowlist 검증이 SoT
  - 적용 라우트(저장 직전 sanitize)
    - `src/app/api/posts/route.ts`
    - `src/app/api/posts/[id]/route.ts`
    - `src/app/api/posts/[id]/answers/route.ts`
    - `src/app/api/posts/[id]/comments/route.ts`
    - `src/app/api/answers/[id]/route.ts`
    - `src/app/api/answers/[id]/comments/route.ts`
    - `src/app/api/comments/[id]/route.ts`
- 검증(로컬)
  - `npm run lint`
  - `npm run type-check`
  - `SKIP_SITEMAP_DB=true npm run build`
- 완료 기준
  - 대표 XSS 페이로드가 저장/렌더에서 실행되지 않음
  - 외부 링크 허용/차단/rel 정책이 단일 규칙으로 수렴하고(중복 로직 제거) 운영자가 예외를 1곳에서만 관리

#### (2025-12-20) [LEAD/WEB] P0-21 `next/image` 원격 allowlist + https-only (P0)

- 목표: `next/image` 원격 이미지 최적화가 “모든 호스트/HTTP”를 허용하는 상태를 해소해 SSRF/DoS/성능 리스크를 줄인다
- 현황(코드 근거)
  - `images.remotePatterns`가 모든 호스트(`**`)와 `http`까지 허용(`next.config.ts:22`)
- 작업(권장, 효율 우선)
  - 프로덕션 allowlist 고정
    - Supabase Storage: `NEXT_PUBLIC_SUPABASE_URL`의 hostname 1개만 허용 + pathname은 `/storage/v1/object/**`로 제한
    - Auth 아바타(현재 Google): `lh3.googleusercontent.com`(+필요 시 `lh4.googleusercontent.com`)만 허용
    - Seed/공지/미디어 썸네일(임시): `images.unsplash.com` 허용(필요 시 Supabase로 이관 후 제거)
    - (선택) 사이트 절대 URL이 이미지에 쓰이는 경우만 `NEXT_PUBLIC_SITE_URL|NEXT_PUBLIC_APP_URL|NEXTAUTH_URL` hostname을 허용(불필요하면 제외)
    - `http`는 금지하고 `https`만 허용(혼합 콘텐츠/보안 리스크 제거)
  - 실패 전략(깨짐 방지)
    - allowlist 밖 URL은 “이미지 없음” 처리(썸네일 placeholder) 또는 `unoptimized` 정책을 명확히 결정(성능/보안 기준으로)
  - 공용 이미지 래퍼에 규칙 고정
    - sizes/lazy/placeholder 뿐 아니라 “허용 src 정규화/검증”까지 공용 유틸/컴포넌트로 통일(페이지별 임의 처리 금지)
- 완료 기준
  - `remotePatterns` 와일드카드/`http` 허용이 제거되고, 필수 이미지(아바타/썸네일)가 정상 로딩
  - 외부 이미지가 섞여도 서버가 임의 호스트를 fetch/리사이즈하지 않음(정책 준수)

### P0 Exit criteria

- UI에서 언어 선택은 `ko/vi`만 보임, `/en/*` 직접 접근 및 sitemap/alternates의 `en` 노출은 유지
- Rate limit 적용 엔드포인트에서 429가 동작하고, 클라 UX가 깨지지 않음
- Playwright 스모크가 릴리즈 게이트로 고정되고 항상 통과
- 모바일 입력/키보드 이슈로 “작성 불가” 케이스 0
- `ko/vi` 기준 텍스트 클립/하드코딩이 핵심 화면에서 0(의도된 `truncate` 제외)
- 가이드라인 안내가 1회 동작하고(노출/확인 기록), 작성/제출 플로우에 영향 0
- 신고 즉시 숨김 및 “안보기” 맞춤 숨김이 동작하고(승인 전 포함), 피드/검색에서 재노출되지 않음
- UGC는 서버 write-time 무해화가 적용되어 XSS 페이로드가 실행되지 않고, 외부 링크 정책(allowlist + `rel="ugc"` + 필요 시 `nofollow`)이 단일 규칙으로 수렴
- `next/image` 원격 정책이 allowlist + https-only로 고정되어 `remotePatterns: **`/`http` 허용이 제거됨(이미지 로딩 정상)
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
- 판정 기준(고정): `LCP ≤ 2.5s`, `INP ≤ 200ms`, `CLS ≤ 0.1`(모바일 우선). 기준 확인: `https://wallaroomedia.com/blog/what-are-core-web-vitals/`
- 현황(코드 근거)
  - 감사 스크립트의 테스트 URL이 구 라우트(`/questions` 등)를 기준으로 되어 있음(`scripts/performance-audit.js:1`, `scripts/accessibility-audit.js:1`)
- 변경(반영)
  - 타깃 URL을 현재 구조로 교체(`/{lang}` 홈, `/{lang}/search`, `/{lang}/leaderboard`, 선택: `/{lang}/posts/{id}`, `/{lang}/profile/{id}`)
  - 실행 파라미터를 환경변수로 고정
    - `AUDIT_BASE_URL`(기본: `http://localhost:3000`)
    - `AUDIT_LANG`(기본: `ko`)
    - `AUDIT_POST_ID`/`AUDIT_USER_ID`(선택, 미지정 시 홈에서 1회 추출 시도)
  - 접근성 감사는 `@axe-core/playwright`가 없으면 lite(기본 규칙)로 자동 폴백
  - 리포트 출력 위치 고정: `reports/performance-audit.{json,html}`, `reports/accessibility-audit.{json,html}`
- 실행(예시)
  - 로컬: `AUDIT_LANG=ko npm run audit:performance`
  - 로컬: `AUDIT_LANG=vi npm run audit:accessibility`
  - 스테이징/프리뷰: `AUDIT_BASE_URL=https://<host> AUDIT_LANG=vi npm run audit:full`
- 운영 방식(권장)
  - 릴리즈 차단 게이트에 넣지 않고, “주간/야간 점검”으로 고정(실패 시 이슈/백로그로 기록)

#### (2025-12-20) [WEB/BE/FE] P1-13 추천 사용자(Recommended Users) 개인화/표시 규칙 정리 (P1)

- 목표: 추천 사용자 섹션을 온보딩 기반으로 개인화하고, 배지/메타 노출을 “강조 1~2개” 원칙으로 통일한다
- 현황(코드 근거)
  - 추천 API는 viewer 기반 `matchScore(userType/visaType/koreanLevel/interests)`로 우선 정렬하고, 활동/팔로워로 tie-break(`src/app/api/users/recommended/route.ts:87`)
  - 응답에 `isExpert/badgeType/(선택)badgeExpiresAt`을 포함하여 UI에서 상세 배지가 유지됨(`src/app/api/users/recommended/route.ts:54`, `src/app/api/users/recommended/route.ts:111`)
  - interests(UUID)는 카테고리 `slug`로 매핑되어 노출되며, 추천 메타는 2개까지로 제한(`src/app/api/users/recommended/route.ts:121`)
  - 추천 카드 메타는 `# 나열` 대신 chip 형태로 1~2개만 강조(`src/components/organisms/RecommendedUsersSection.tsx:235`)
  - PostList에서 추천 유저를 follower 기준으로 재정렬하지 않고 API 정렬을 그대로 사용(`src/components/organisms/PostList.tsx:223`)
- 작업(권장)
  - 데이터/표시 계약 정리
    - `/api/users/recommended` 응답에 `badgeType`, `isExpert` 포함(필요 시 `badgeExpiresAt`도 포함)
    - 메타는 1~2개만 노출(나머지는 툴팁/프로필 상세로), `#` 나열 대신 chip/inline 강조 UI로 교체
  - 관심사 표현(SoT) 통일
    - 권장: `users.interests`는 category `slug`로 저장(표시/추천/검색에서 재사용 가능)
    - 대안: `id` 유지 시, 추천 API에서 category 테이블(`src/lib/db/schema.ts:259`)을 통해 `slug/name`로 매핑하여 전달(UID 노출 금지)
  - 개인화 랭킹 v1(효율 우선)
    - viewer의 `userType/visaType/interests/koreanLevel` 기반 matchScore + `badgeType/isVerified/isExpert` 가중
    - 최근 활동(`lastLoginAt`) 가중으로 “휴면 계정” 노출 감소
    - 이미 팔로우/차단/숨김 유저 제외(기존 제외 + 숨김 정책 `P0-11` 연계)
    - 중복 노출 감소: 1일 단위 로테이션(랜덤 시드) 또는 “최근 노출된 추천 유저” 캐시(서버/클라 중 택1)
  - 노출 수(권장)
    - 모바일: 1~2개가 보이는 캐러셀, total 6
    - 태블릿: 2~3개, total 8
    - 데스크톱: 4개, total 8~12(캐러셀), 필요 시 “더 보기” 링크 추가
- 완료 기준
  - 추천 카드에서 `badgeType` 기반 배지(학생 인증/비자 전문가 등)가 노출됨
  - 추천 메타는 1~2개만 강조되고 UUID/잡문구가 노출되지 않음
  - 온보딩 데이터가 추천 노출/매칭에 실제로 사용됨(테스트 케이스/로그로 확인)

#### (2025-12-20) [LEAD/BE/WEB] P1-14 인증/배지 taxonomy + 운영 workflow 정리 (P1)

- 목표: 인증 요청(type) ↔ 배지 타입(badgeType) ↔ UI 라벨/툴팁이 같은 규칙을 공유하도록 “단일 소스”로 고정한다
- 현황(코드 근거)
  - 인증 요청 타입: `student/worker/expert/business/other`(`src/app/api/verification/request/route.ts:37`)
  - 배지 타입: `verified_student/verified_worker/verified_user/expert_visa/expert_employment/trusted_answerer`(`src/lib/constants/badges.ts:1`)
  - 승인 시 사용자 배지 세팅: `badgeType/isExpert/isVerified`(`src/app/api/admin/verifications/[id]/route.ts:108`)
  - “certified” 계산: `isVerified || isExpert || badgeType` 기준(`src/app/api/posts/route.ts:358`)
- 작업(권장)
  - taxonomy/문구 SoT 확정
    - 사용자용 의미(무엇이 “인증/전문가/신뢰 답변자”인지)와 운영자용 부여 기준을 1페이지로 고정
    - 만료(`badgeExpiresAt`) 정책: 만료 시 표시/숨김 기준과 갱신 절차(운영 효율 기준으로 최소화)
  - API 응답 일관화
    - 유저 payload(프로필/추천/게시글 작성자)에 `badgeType/isExpert/isVerified/(선택)badgeExpiresAt`을 항상 포함하도록 정리(공용 serializer 권장)
  - 운영 workflow 보강(필요 범위만)
    - Admin 권한 모델: 지금은 단일 admin 토큰(`src/lib/admin/auth.ts:1`)이므로, 필요 시 역할 분리(모더레이터/인증 담당) 또는 최소 감사 로그 도입(누가 무엇을 승인/거부했는지)
- 완료 기준
  - 동일 사용자에 대해 프로필/피드/추천에서 배지 라벨이 일관되게 보임(“검증됨”만 남는 케이스 제거)
  - 운영자가 어떤 경우에 어떤 배지를 부여해야 하는지 문서/툴팁이 일치함

#### (2025-12-20) [LEAD/WEB] P1-15 AI 검색/요약 대비 SEO 구조화 (P1)

- 목표: AI Overview/AI 검색에서 인용될 수 있는 “추출 가능한 구조(SSR HTML + 헤딩/리스트 + 스키마 + 최신성)”를 단일 규칙으로 고정해 반복 비용을 줄인다
- 현황(코드 근거)
  - Q&A 상세는 JSON-LD가 있으나 채택 답변(acceptedAnswer)/수정일(dateModified) 등 핵심 필드가 비어 있는 케이스가 있음(`src/app/[lang]/(main)/posts/[id]/page.tsx:209`)
  - robots 정책은 Google/Bing 중심이며, GPTBot/OAI-SearchBot 등 AI 크롤러 허용/차단 정책이 미정(`src/app/robots.ts:4`)
- 작업(권장 v1, 효율 우선)
  - “콘텐츠 계약(템플릿)” 1장 고정
    - 페이지 구조: H1 단일 + H2/H3 계층(가능하면 “질문형 헤딩”) + 즉답(2~3문장, 첫 단락) + 리스트/표(체크리스트) 우선
    - 글쓰기 스타일(역피라미드): “답(결론) → 근거/절차 → 예외/주의” 순서로 배치해 사람/AI 모두 즉시 핵심을 추출 가능하게
    - UGC(질문/답변)는 `QAPage/DiscussionForumPosting`만(FAQPage 남용 금지), 운영자 큐레이션만 `FAQPage/HowTo/Article/VideoObject` 적용
    - 최신성/신뢰: `dateModified`/업데이트 문구/출처 표기(`P1-8`)의 “표시 기준”을 문서로 확정
    - 크롤링 친화: 중요한 본문 텍스트는 SSR HTML에 포함(비동기/클라 전용 렌더에 의존 금지), `<article>` 등 의미 있는 마크업 유지
    - 토픽 클러스터(경쟁사 벤치마크): “허브(가이드) → 하위 글(세부)” 구조로 내부 링크를 엮고, 허브 페이지에 소개 텍스트/목차/관련 글을 고정(얇은 카테고리 페이지 금지)
    - 내부 링크(현실적 운영): “유저가 직접 링크를 붙이게” 강제하지 않고, **페이지 템플릿/에디터 UX가 링크를 자동 생산**하게 고정
      - UGC(일반 사용자 글): 본문 강제 규칙 금지(현실성 낮음) → 상세 페이지 템플릿에 항상 `관련 글(2~5) + 같은 카테고리(2~5) + 허브/가이드 1개`를 SSR로 렌더(= 크롤러가 링크를 따라감)
      - 글쓰기 UX(권장): 작성 단계에 “유사 질문/관련 글”을 먼저 노출하고, 원클릭으로 “관련 글 섹션”을 본문 하단에 삽입(선택 기능, 강제 X)
      - 키워드 자동 링크: `TOPIK/EPS/D-2/D-10/E-7/F-2` 등 사전(키워드→허브 URL)을 SoT로 두고 본문 첫 등장만 자동 링크(과링크 방지)
      - 쌍방향(역링크) 구현: “기존 핵심 글에 사람이 역링크 추가” 대신, 허브/가이드가 최신/인기 Q&A를 자동 집계해 역링크 역할을 수행(허브↔UGC)
      - 중복 질문 운영: 유사 질문이 높으면 신규 작성 전 기존 스레드로 유도, 게시 후에는 운영자 큐레이션으로 “대표(캐노니컬) 스레드”를 지정해 권위를 한 URL로 집중(필요 시 리다이렉트/정리)
    - 중복 질문 운영(SEO/신뢰): 글쓰기 시 “유사 질문”을 먼저 안내하고(검색 기반), 운영자 큐레이션 허브(FAQ/가이드)로 흡수해 동일 주제 권위를 한 페이지로 모으는 흐름을 고정
    - URL(운영자 큐레이션): 가이드/뉴스/FAQ는 의미 있는 `slug` 기반 URL(키워드 포함) 우선, UGC는 `id` 유지(크롤링/공유/중복 방지 기준으로)
  - JSON-LD 보강(핵심만)
    - 채택 답변이 있을 때만 `acceptedAnswer` 포함
    - `datePublished/dateModified`를 게시글/답변/프로필에 일관되게 포함(가능 범위에서)
    - UGC 외부 링크 정책(`rel="ugc"`)이 실제 렌더에서 보장되는지 점검(운영 리스크 최소화)
  - AI 크롤러 정책 결정(운영 리스크 최소화)
    - `GPTBot`(학습) vs `OAI-SearchBot`(검색) 허용/차단 기준을 1회 결정하고 `robots.ts`로 반영
  - 검증 루틴(차단 최소)
    - 구조화 데이터 스냅샷 검증(샘플 URL 3~5개) + 깨짐/누락은 이슈로 기록(릴리즈 차단은 P0가 아닌 P1에서만)
    - 분기 1회(선택): 크롤러 감사(Screaming Frog 등)로 링크/메타/중복/404/스키마 오류를 묶어서 점검(자동화가 어렵다면 체크리스트로만 유지)
- 완료 기준
  - Q&A 상세/프로필에서 JSON-LD가 일관된 필드를 포함하고(채택/수정일 등) “추출 가능한 구조”가 문서/코드에서 한 규칙으로 수렴
  - AI 크롤러 robots 정책이 결정되어 문서와 코드가 일치

#### (2025-12-20) [LEAD] P1-16 SEO KPI/리뷰 리듬(GSC/GA4) (P1)

- 목표: SEO를 “한 번 하고 끝”이 아니라 측정-개선 사이클로 운영하되, 반복 업무를 최소화하는 루틴을 고정한다
- 작업(권장)
  - 도구/데이터 연결
    - Google Search Console 연결 + sitemap 제출 + 색인/커버리지/오류 모니터링
    - GA4(또는 대체)로 유입/전환 지표 수집(가능한 최소 이벤트만)
  - KPI/리듬 고정(초기 과투자 금지)
    - KPI(v1): Organic 세션, 쿼리별 노출/클릭/CTR, 상위 랜딩 URL, 색인 오류(404/리다이렉트), CWV 상태(`P1-12`)
    - KPI(v1, 영상/숏폼 선택): Shorts/영상 조회수→사이트 유입(링크 클릭) + “영상 포함 페이지”의 CWV/이탈률/체류시간 비교(문제 페이지는 임베드 축소/제거)
    - 리뷰 주기: 런칭 직후 2주간 주 1회, 이후 월 1회(30분)로 고정 + 액션 3개만 선정
  - 콘텐츠 업데이트 운영
    - “법/비자/제도” 성격 페이지는 업데이트 날짜를 표준 위치에 표기하고(템플릿), 반기 단위 갱신 목록을 유지
    - 실시간 이슈 대응(시의성): 정책 변경/입국 규정/최신 통계 등 “뉴스성” 이슈는 24~48h 내 업데이트 또는 신규 발행(제목에 “2025년 기준/최신” 등 명시)
    - Evergreen 축적: 시의성 글은 허브(가이드) 페이지로 흡수/정리해 장기 콘텐츠로 누적(“최신 업데이트” 섹션으로 연결)
    - 트렌드 탐지(최소): GSC 쿼리 급상승 + 커뮤니티 질문 급증(카테고리/태그) + (선택) Google Trends를 “다음 2주 액션 3개”로만 연결
    - 언어/키워드 우선순위(운영): `vi`(타겟) > `ko`(파트너/기관) > `en`(SEO 보조) — hreflang/alternates는 유지(P0-1), 콘텐츠 생산/리프레시는 vi 중심
    - Discover/뉴스탭(선택): 운영자 큐레이션 뉴스/가이드만 대상으로 대표 이미지/요약/업데이트 일자를 갖춘 “읽기 좋은” 페이지로 운영(팝업/강제 로그인/무거운 스크립트 지양)
- 완료 기준
  - KPI/리뷰 루틴이 문서로 고정되고, 리포트가 자동/반자동으로 재현 가능(사람이 매번 수작업으로 모으지 않음)

#### (2025-12-20) [LEAD/WEB] P1-17 PWA 의존성 단일화 + 캐시 경계 고정 (P1)

- 목표: PWA가 “설치/오프라인 UX 개선”에만 기여하고, 개인화/동적 화면에서 stale UI를 만들지 않도록 정책을 고정한다
- 현황(코드 근거)
  - PWA는 `@ducanh2912/next-pwa` 기반이나(`next.config.ts:3`), 의존성에 `next-pwa`도 함께 존재해 중복/혼선 가능성이 있음(`package.json:28`, `package.json:60`)
  - `aggressiveFrontEndNavCaching` 등 캐시 옵션이 동적/개인화 화면에서 stale UI를 만들 가능성이 있음(`next.config.ts:13`)
- 작업(권장)
  - 의존성 단일화
    - PWA 패키지는 1개만 유지(중복 제거)하고, 활성화 조건(`ENABLE_PWA`)을 운영 정책으로 확정
  - 캐시 경계(SoT) 확정
    - 캐시 허용: 정적 자산 + 운영자 큐레이션 콘텐츠(가이드/공지/뉴스)
    - 캐시 금지: 작성/알림/프로필/세션/팔로우/좋아요 등 개인화·상태성 API 및 화면
    - 오프라인 폴백은 “읽기 UX”만 보장(작성/상태 변경은 온라인 필요)
  - 검증 루틴(운영 효율)
    - 오프라인/저속에서 홈/상세는 안내+캐시로 복구 가능, 개인화 화면은 “정상 안내”로 실패(무한 로딩 금지)
- 변경(반영)
  - 중복 의존성 제거: `next-pwa` 제거 → `@ducanh2912/next-pwa`만 유지(`package.json:1`)
  - 캐시 옵션 보수화: `cacheOnFrontEndNav=false`, `aggressiveFrontEndNavCaching=false`로 고정(`next.config.ts:1`)
- 완료 기준
  - PWA 패키지/설정이 1개로 수렴하고, 캐시 범위가 문서/코드에서 일치
  - PWA로 인해 개인화 화면에서 stale UI/오작동이 발생하지 않음(최소 시나리오 검증)

#### (2025-12-20) [LEAD] P1-18 패키지 매니저/락파일 단일화 (P1)

- 목표: 설치 재현성을 높여 온보딩/CI/보안 대응의 “반복 비용”을 제거한다
- 현황(코드 근거)
  - CI는 `npm ci`를 사용(`.github/workflows/ci.yml:1`)하지만, `package-lock.json`/`pnpm-lock.yaml`/`yarn.lock`이 동시에 존재(혼선/재현성 저하)
- 작업(권장)
  - 단일 매니저 확정: CI 기준으로 `npm` 고정(예: `package-lock.json`만 유지)
  - 다른 락파일 제거 + 재생성/검증 절차를 문서에 고정
  - CI/훅(선택): “다른 락파일이 생기면 실패” 체크 추가(반복 방지)
- 변경(반영)
  - `pnpm-lock.yaml`, `yarn.lock`, `.yarnrc.yml` 제거 → `package-lock.json`만 유지
  - CI에 락파일 가드 추가: `package-lock.json` 존재 + 다른 락파일이 있으면 실패(`.github/workflows/ci.yml:1`)
- 완료 기준
  - 저장소에 락파일이 1개만 존재하고, 로컬/CI 설치가 같은 결과를 재현

#### (2025-12-20) [BE/LEAD] P1-19 Cache-Control 정책 SoT + 캐시 감사 (P1)

- 목표: “공개 캐시 가능 응답”과 “개인화/세션 응답”의 경계를 단일 정책으로 고정해 데이터 노출/성능 이슈를 구조적으로 줄인다
- 현황(코드 근거)
  - 여러 API 라우트에서 `Cache-Control`을 개별 설정하고 있어 정책 드리프트 위험이 있음(예: `src/app/api/categories/route.ts:1`, `src/app/api/users/leaderboard/route.ts:1`)
  - 기본 응답 헬퍼는 `no-store`지만(`src/lib/api/response.ts:1`), 라우트에서 직접 세팅하는 패턴이 혼재
- 작업(권장, 효율 우선)
  - 캐시 tier 정의(SoT)
    - `public`: 익명 기준 동일 응답만(절대 viewer-dependent 필드 포함 금지)
    - `private`: 로그인/개인화 응답은 `private, no-store` 고정
    - `hybrid`: 필요한 경우에만 `Vary`를 명시하고, 공개 캐시를 쓰지 않도록 보수적으로 설계
  - 라우트 감사(소규모부터)
    - `public` 캐시를 사용하는 엔드포인트 목록화 → 응답 스키마에 개인화 필드가 없는지 점검
    - 위험 엔드포인트는 `private, no-store`로 내리고, 클라 캐시(TanStack Query)로 체감 성능 보완
- 변경(반영)
  - 캐시 정책 SoT 추가: `CACHE_CONTROL`, `setPublicSWR`, `setPrivateNoStore`, `setNoStore` (`src/lib/api/response.ts:1`)
  - API 라우트에서 문자열 직접 세팅 제거 → 유틸로 통일(드리프트 방지)
  - public 캐시는 “비로그인 + viewer-independent” 조건에서만 설정(`/api/posts`, `/api/posts/trending`, `/api/search*`, `/api/categories`, `/api/news`, `/api/users/leaderboard` 등)
- 완료 기준
  - 캐시 정책이 유틸/헬퍼로 단일화되고, 공개 캐시 적용 엔드포인트가 “안전 목록”으로 관리됨
  - 개인화 응답이 public 캐시로 내려가는 케이스가 0

#### (2025-12-22) [LEAD/WEB] P1-20 카테고리 IA 개편 + 키워드 매핑/자동 분류 (P1)

- 목표: “한국에서의 유학→취업→체류” 타겟 여정과 검색 의도를 정확히 반영하는 카테고리/탐색 구조를 고정하고, SEO/AEO(인용/요약)까지 연결되는 정보 구조를 만든다.
- 방향(IA 원칙)
  - 카테고리명은 “한국” 맥락이 항상 드러나도록(ko/vi 모두) 네이밍을 고정한다.
  - 초기에 카테고리가 과도하게 쪼개져 인기도가 분산되지 않도록 **대분류(탐색) + 세부분류/키워드(정밀)**의 역할을 분리한다.
  - “검색/자동 분류”가 카테고리 UX를 보조하도록 키워드 매핑을 SoT로 둔다.
- 작업(권장 v1)
  - 카테고리 재구성(대분류/세부분류)
    - 대분류(예시): `한국 비자·체류`, `한국 취업`, `한국 유학`, `한국 정착·주거`, `자유게시(기타)`
    - 세부분류(예시): 주거·정착(집/생활비/통신/초기정착), 4대보험, 아르바이트, 노동법·근로자 권리(EPS 포함), 이력서·면접, 한국어(TOPIK), 입학·장학금, 유학생활 가이드
  - 약어/코드 우선 반영
    - 사용자 커뮤니티에서 통용되는 키워드(TOPIK/EPS/D-2/D-10/E-7/F-2 등)를 카테고리 설명/메타/검색 제안어에 포함
  - 키워드 매핑/자동 분류(레거시 장점 흡수)
    - SoT를 1곳으로 고정(상수 또는 DB): `{ keyword/synonyms -> category/subcategory }`
    - 질문 작성 시 추천 카테고리/세부분류 자동 제안(강제 분류 X, “추천”)
    - 검색 자동완성/추천 검색어에 동일 매핑을 재사용(반복 구현 금지)
  - 모바일/PC 탐색 UX
    - 모바일은 핵심 탭(비자/취업/유학/정착/검색) 중심으로 “한 손 탐색” 최적화(기존 BottomNav와 충돌 없이)
    - PC는 카테고리 허브 페이지(소개/목차/관련 글/FAQ 일부)로 SEO 허브를 만들고 내부 링크를 고정(`P1-15` 연계)
- 완료 기준
  - 사용자 글 작성 시 카테고리 선택 이탈률이 줄고(추천 제안), 검색/탐색으로 같은 주제 글을 더 빨리 찾을 수 있음
  - 카테고리 허브 페이지가 “얇은 페이지”가 아니라 소개/목차/FAQ/관련 링크를 갖춘 SEO 랜딩으로 기능함

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
    - 영상(선택) — 성능/SEO 원칙(고정)
      - Self-hosting 금지(서버 부하/CWV 리스크)
      - 기본: `YouTube 업로드 + lazy embed`(썸네일 프리뷰 → 클릭 시 iframe 로드)
      - UX: autoplay 금지, 자막/요약 텍스트 제공, 모바일 기준 비율 고정(예: 16:9 또는 Shorts는 9:16)으로 CLS 방지
      - 임베드 최소화: 페이지당 임베드 수 제한(탭/아코디언 등으로 “1~2개만 로드”)
      - 파라미터(선택): `rel=0&modestbranding=1` 등으로 추천영상/브랜딩 최소화
      - SEO: 운영자 큐레이션 페이지에만 `VideoObject` 스키마 적용(필드: name/description/thumbnailUrl/uploadDate/duration/embedUrl)
      - 숏폼 검색 유입(선택): Google의 “Short Video” 노출을 고려해, 핵심 Q&A 5~10개를 Shorts(1분 내)로 제작/업로드하고 제목/설명에 핵심 키워드(ko/vi/필요 시 en)를 포함 + 설명/댓글에 canonical 링크를 고정
      - 텍스트 우선(필수): 검색엔진/AI가 영상 내용을 직접 읽지 못하므로, 영상이 있는 페이지는 “요약 텍스트 + 체크리스트/FAQ(큐레이션)”를 SSR HTML 본문에 반드시 포함
  - 운영 자동화(반복 최소화)
    - 코딩 없이 가능한 자동화(Zapier/IFTTT 등)와 “주간/월간 요약 발행” 루틴을 비교해, 최소 운영 비용으로 가능한 흐름부터 적용
  - 권위/백링크(선택, 장기)
    - 운영자 큐레이션 콘텐츠를 외부 채널/파트너(학교/기관/커뮤니티)에서 인용/링크될 수 있게 “허브 페이지” 중심으로 배포(브랜드 언급/백링크 축적)
- 완료 기준
  - 외부 배포 대상/권한/노출 정책이 문서로 고정되고, 운영자 개입 없이도 일정 수준의 자동 배포가 가능

#### (2025-12-21) [WEB] Auth 페이지 i18n 공용화 + noindex 메타 (P0-2)

- 플랜(체크리스트)
  - [x] `/login`, `/signup`의 하드코딩 번역(ko/en/vi) 제거 → `messages/*.json` 단일 소스 사용
  - [x] Auth 페이지를 Server wrapper + Client 컴포넌트로 분리(SSR 가능, 번역은 서버에서 주입)
  - [x] Auth 페이지 메타데이터 `noindex,nofollow` 적용(색인/노출 방지)
- 변경 내용(why/what)
  - why: 언어별 하드코딩/중복을 줄이고, 번역 소스/SEO 정책을 한 곳으로 통일
  - what: `login/signup`을 `getDictionary` 기반으로 전환하고, `messages`에 `signup` 섹션 추가
- 검증
  - [x] npm run lint
  - [ ] npm run type-check
  - [ ] SKIP_SITEMAP_DB=true npm run build
- 변경 파일
  - src/app/[lang]/(auth)/login/page.tsx
  - src/app/[lang]/(auth)/login/LoginClient.tsx
  - src/app/[lang]/(auth)/signup/page.tsx
  - src/app/[lang]/(auth)/signup/SignupClient.tsx
  - messages/ko.json
  - messages/vi.json
  - messages/en.json

#### (2025-12-21) [WEB] Media 섹션 i18n 단일 소스화 (P0-2)

- 플랜(체크리스트)
  - [x] `/media` 페이지/모달/섹션의 `lang ===` 하드코딩 제거 → `messages/*.json` 기반
  - [x] 카드뉴스/숏폼 섹션 라벨을 `translations` 주입 방식으로 통일
- 변경 내용(why/what)
  - why: Media 관련 텍스트가 코드/언어 분기 형태로 흩어져 있어 유지보수 비용이 커짐
  - what: `news.empty`, `media.cardNewsTab/shortsTab`, `cardNews.*`, `shorts.*` 키 추가 후 모든 라벨을 딕셔너리에서만 읽도록 전환
- 검증
  - [x] npm run lint
  - [ ] npm run type-check
  - [ ] SKIP_SITEMAP_DB=true npm run build
  - [ ] npm run test:e2e
- 변경 파일
  - src/app/[lang]/(main)/media/page.tsx
  - src/app/[lang]/(main)/media/MediaClient.tsx
  - src/components/organisms/CardNewsShowcase.tsx
  - src/components/organisms/ShortFormPlaylist.tsx
  - messages/ko.json
  - messages/vi.json
  - messages/en.json

#### (2025-12-21) [FE/WEB] 모바일 뷰포트(dvh) + 입력 폼(iOS zoom) 하드닝 (P0-3)

- 플랜(체크리스트)
  - [x] 주요 페이지/레이아웃의 `min-h-screen`을 `100dvh` 대응으로 보강
  - [x] PostDetail 주요 textarea 폰트 크기를 `16px`로 상향(모바일 iOS 입력 시 자동 확대 방지)
  - [x] 모달 로딩 오버레이 max-height를 `dvh` 기준으로 정규화
- 변경 내용(why/what)
  - why: iOS/웹뷰에서 키보드/주소창 변화로 인한 높이 계산 오류와 입력 시 자동 확대(zoom)로 UX가 깨질 수 있음
  - what: `min-h-[100dvh]`를 핵심 래퍼에 추가하고, 작성/신고 textarea는 `text-base`로 통일
- 검증
  - [x] npm run lint
  - [x] npm run type-check
  - [x] SKIP_SITEMAP_DB=true npm run build
  - [x] npm run test:e2e
- 변경 파일
  - src/components/templates/MainLayout.tsx
  - src/components/molecules/user/UserProfile.tsx
  - src/app/[lang]/(auth)/login/LoginClient.tsx
  - src/app/[lang]/(auth)/signup/SignupClient.tsx
  - src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx
  - src/app/[lang]/(main)/posts/new/NewPostClient.tsx
  - src/app/[lang]/(main)/profile/[id]/ProfileClient.tsx
  - src/app/[lang]/(main)/notifications/NotificationsClient.tsx
  - src/app/[lang]/(main)/verification/request/VerificationRequestClient.tsx
  - src/app/[lang]/(main)/verification/history/VerificationHistoryClient.tsx

#### (2025-12-21) [FE] 홈 피드 post-first + 공지/뉴스는 사이드바로 이동

- 플랜(체크리스트)
  - [x] 홈 메인 컬럼에서 `PostList` 위 블록 제거(게시글이 첫 콘텐츠)
  - [x] 공지/뉴스 노출은 좌측 사이드바(홈에서만)로 이동
- 변경 내용(why/what)
  - why: 메인 피드 상단이 배너/뉴스로 분산되면 게시글 소비 흐름이 끊기고 UI가 복잡해짐
  - what: `HomeClient`는 `PostList`만 렌더하고, 공지/뉴스는 `CategorySidebar`의 홈 전용 섹션에서 제공
- 검증
  - [x] npm run lint
  - [x] npm run type-check
  - [x] SKIP_SITEMAP_DB=true npm run build
  - [x] npm run test:e2e
- 변경 파일
  - src/app/[lang]/(main)/HomeClient.tsx
  - src/components/organisms/CategorySidebar.tsx

#### (2025-12-21) [WEB] 글쓰기 #태그 자동생성: 모더레이션 입력값/카테고리 기반 공용화

- 플랜(체크리스트)
  - [x] 태그 생성 로직을 공용 유틸로 분리(중복 제거)
  - [x] 모더레이션(조건/목표/배경) 입력값이 있으면 키워드에 반영
  - [x] 모더레이션 미입력 시 카테고리/세부분류 seed 기반 랜덤 추천(세션 seed로 안정화)
  - [x] 사용자가 태그를 수동 편집하면 자동 갱신 중단(`manualTagEdit`)
- 변경 내용(why/what)
  - why: 태그 추천이 카테고리 선택 시 1회만 생성되고, 모더레이션 입력과 연동되지 않아 품질/일관성이 떨어짐
  - what: `generatePostTags()`를 도입해 “카테고리 seed + 키워드 추출 + fallback” 파이프라인으로 통합하고, 자동 갱신 규칙을 명확히 함
- 검증
  - [x] npm run lint
  - [x] npm run type-check
  - [x] SKIP_SITEMAP_DB=true npm run build
  - [x] npm run test:e2e
- 변경 파일
  - src/lib/seo/postTags.ts
  - src/app/[lang]/(main)/posts/new/NewPostClient.tsx

#### (2025-12-22) [FE] 모바일 홈 추천 콘텐츠 재배치 + 피드 상단 점수 카드 제거

- 플랜(체크리스트)
  - [x] 모바일 드로어(좌측)에서 추천 콘텐츠 제거
  - [x] 모바일 홈 메인에서 추천 콘텐츠 노출(우측 레일의 모바일 대체)
  - [x] 피드 상단 포인트/Lv/랭킹 카드 제거(게시글 소비 흐름 우선)
- 현황 분석(코드 기준)
  - 현재 구현/문제 위치: `src/components/organisms/CategorySidebar.tsx`(모바일 홈 드로어), `src/components/organisms/PostList.tsx`(피드 상단 점수 카드)
  - 재현/리스크: 모바일에서 드로어에 추천 콘텐츠가 들어오면 “메인=게시글” 규칙이 깨지고, 상단 점수 카드로 인해 피드 첫 화면이 분산됨
- 변경 내용(why/what)
  - why: 홈은 “게시글 위주”를 유지하되, 추천 콘텐츠는 드로어가 아니라 메인(모바일)에서 접근 가능해야 함
  - what: 모바일 홈은 `NewsSection`을 메인 상단 카드로 노출(`lg:hidden`), 드로어에서는 제거, 피드 상단 점수 카드 제거
- 검증
  - [x] npm run lint
  - [x] npm run type-check
  - [x] SKIP_SITEMAP_DB=true npm run build
  - [x] npm run test:e2e (PORT=3000 고정, dev 실행 시 reuse)
- 변경 파일
  - src/app/[lang]/(main)/HomeClient.tsx
  - src/components/organisms/CategorySidebar.tsx
  - src/components/organisms/PostList.tsx
- 커밋
  - `[FE] move featured content to home and remove score widget` (ce170f6)

#### (2025-12-22) [FE] PostCard 모바일 액션 밀집/겹침 개선 + 태그/칩 클립 보정

- 플랜(체크리스트)
  - [x] `...`(숨김/신고) 메뉴가 썸네일과 겹치지 않게 위치 조정
  - [x] 인증 답변 안내 라벨을 모바일에서 컴팩트 표기로 전환(툴팁은 상세 유지)
  - [x] 액션 행 `nowrap` 강제 제거로 모바일 줄바꿈/정렬을 CSS 규칙에 위임
  - [x] 가로 스크롤 칩/태그 우측 클립 방지(`pr` + `scroll-px`)
  - [x] 해결/미해결(채택) 아이콘은 모바일에서 숨김(밀집 완화)
- 현황 분석(코드 기준)
  - 현재 구현/문제 위치: `src/components/molecules/cards/PostCard.tsx`(액션/메뉴), `src/components/organisms/NewsSection.tsx`(가로 스크롤), `src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx`(태그)
  - 재현/리스크: 모바일에서 `...` 버튼이 썸네일 영역에 겹치고, 인증 답변 문구가 길어 액션이 밀집됨
- 변경 내용(why/what)
  - why: 모바일에서 “터치 타깃 44px” 유지하면서도 액션이 겹치지 않게 정돈해야 함
  - what: `...` 메뉴를 카드 상단(작성자 라인)으로 이동, 인증 라벨은 `certifiedResponderCompact`로 모바일 표기, 가로 스크롤은 `pr-3 scroll-px-3`로 클립 방지
- 검증
  - [x] npm run lint
  - [x] npm run type-check
  - [x] SKIP_SITEMAP_DB=true npm run build
  - [x] npm run test:e2e (PORT=3000 고정, dev 실행 시 reuse)
- 변경 파일
  - src/components/molecules/cards/PostCard.tsx
  - src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx
  - src/components/organisms/NewsSection.tsx
- 커밋
  - `[FE] harden mobile post cards and horizontal chips` (df850ab)
  - `[FE] hide solved indicator on mobile post cards` (9e85b02)

#### (2025-12-22) [BE] 추천 사용자 API 500(빈 interests) 수정

- 플랜(체크리스트)
  - [x] viewer interests가 비어도 SQL이 유효하도록 배열 표현을 안전하게 구성
- 현황 분석(코드 기준)
  - 현재 구현/문제 위치: `src/app/api/users/recommended/route.ts`
  - 재현/리스크: interests가 비어 있을 때 `array_length(()::text[], 1)` 형태로 생성되며 Postgres syntax error로 500 발생
- 변경 내용(why/what)
  - why: 추천 사용자 섹션은 홈/팔로잉 플로우 핵심이며, 500은 즉시 사용자 경험을 깨뜨림
  - what: `viewerInterestsArray = ARRAY[...]::text[] | ARRAY[]::text[]`로 고정하고 overlap 조건은 해당 배열을 사용
- 검증
  - [x] npm run lint
  - [x] npm run type-check
  - [x] SKIP_SITEMAP_DB=true npm run build
  - [x] npm run test:e2e (PORT=3000 고정, dev 실행 시 reuse)
- 변경 파일
  - src/app/api/users/recommended/route.ts
- 커밋
  - `[BE] fix recommended users when interests empty` (d769ff9)

#### (2025-12-22) [LEAD] Leaderboard 이미지 500 방지 + E2E(3000) 안정화

- 플랜(체크리스트)
  - [x] `next/image` 원격 호스트(`ui-avatars.com`) 허용 추가(leaderboard 500 방지)
  - [x] Playwright는 PORT=3000 고정 + dev 서버 재사용 기본값으로 충돌 방지
  - [x] probe rate-limit 엔드포인트는 dev/E2E에서 기본 활성(프로덕션은 env로 차단 유지)
- 변경 내용(why/what)
  - why: leaderboard에서 `ui-avatars.com` 아바타가 `next/image`에 의해 차단되며 500 발생, 또한 E2E가 포트 충돌(3000)로 깨짐
  - what: `next.config.ts`에 remotePatterns 추가, `playwright.config.ts`의 `reuseExistingServer` 기본 활성, `/api/probe/rate-limit`은 production만 env로 게이트
- 검증
  - [x] npm run lint
  - [x] npm run type-check
  - [x] SKIP_SITEMAP_DB=true npm run build
  - [x] npm run test:e2e (PORT=3000 고정)
- 변경 파일
  - next.config.ts
  - playwright.config.ts
  - src/app/api/probe/rate-limit/route.ts
- 커밋
  - `[LEAD] allow ui-avatars images and stabilize e2e on 3000` (cdd9149)

#### (2025-12-22) [FE] 가로 스크롤 우측 클립 방지(Profile/추천 사용자)

- 플랜(체크리스트)
  - [x] 가로 스크롤 컨테이너에 `pr-3 scroll-px-3` 적용(우측 잘림 방지)
- 변경 내용(why/what)
  - why: 모바일에서 스탯/탭/캐러셀 마지막 아이템이 우측에서 잘려 보임
  - what: Profile 스탯/탭, 추천 사용자 캐러셀에 우측 패딩 + scroll padding 추가
- 검증
  - [x] npm run lint
  - [x] npm run type-check
  - [x] SKIP_SITEMAP_DB=true npm run build
  - [x] npm run test:e2e
- 변경 파일
  - src/app/[lang]/(main)/profile/[id]/ProfileClient.tsx
  - src/components/organisms/RecommendedUsersSection.tsx
- 커밋
  - `[FE] prevent horizontal scroll clipping` (b6d60a8)

#### (2025-12-22) [FE] 모바일 키보드 대응: 하단 시트/모달 dvh + safe-area

- 플랜(체크리스트)
  - [x] 입력이 있는 시트/모달의 max-height를 `dvh`로 전환(키보드/웹뷰 대응)
  - [x] 하단 버튼 영역에 safe-area inset-bottom을 반영(홈 인디케이터 간섭 방지)
- 변경 내용(why/what)
  - why: iOS/Android에서 키보드가 올라오면 `vh` 기준 모달이 과대 계산되어 입력/버튼이 가려질 수 있음
  - what: 신고 모달(게시글 카드/상세) 스크롤 영역을 `max-h-[60dvh]`로, 하단 액션은 `pb-[calc(1rem+env(safe-area-inset-bottom))]`로 보정. 팔로잉/내 글 모달도 `80dvh`로 통일
- 검증
  - [x] npm run lint
  - [x] npm run type-check
  - [x] SKIP_SITEMAP_DB=true npm run build
  - [x] npm run test:e2e
- 변경 파일
  - src/components/molecules/cards/PostCard.tsx
  - src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx
  - src/components/molecules/modals/MyPostsModal.tsx
  - src/components/molecules/modals/FollowingModal.tsx
- 커밋
  - `[FE] harden modals for mobile keyboard` (9944b32)

#### (2025-12-22) [BE] 추천 사용자 API 500(Postgres param 타입) 수정

- 플랜(체크리스트)
  - [x] Postgres `42P18`(파라미터 타입 추론 실패) 제거
- 현황 분석(코드 기준)
  - 현재 구현/문제 위치: `src/app/api/users/recommended/route.ts`
  - 재현/리스크: `CASE WHEN $x IS NOT NULL ...` 형태에서 Postgres가 `$x` 타입을 추론하지 못해 500 발생
- 변경 내용(why/what)
  - why: 추천 사용자 섹션(홈/팔로잉)이 500으로 깨지면 핵심 플로우가 즉시 붕괴
  - what: 가중치 score는 JS에서 조건 분기 후 `sql.join(parts, ' + ')`로 구성, `avatar` 중복 select 제거
- 검증
  - [x] npm run lint
  - [x] npm run type-check
  - [x] SKIP_SITEMAP_DB=true npm run build
  - [x] npm run test:e2e
- 변경 파일
  - src/app/api/users/recommended/route.ts

#### (2025-12-22) [BE/WEB] 피드백 제출 500 방지 + 최소 길이 제거

- 플랜(체크리스트)
  - [x] FE: 텍스트 최소 글자수 강제 제거(빈 값만 차단)
  - [x] BE: `feedbacks.title` 컬럼이 없을 때도 500 방지(fallback insert)
  - [x] Admin: 목록 API도 title-less 환경에서 동작(fallback title derivation)
- 현황 분석(코드 기준)
  - 현재 구현/문제 위치: `src/app/api/feedback/route.ts`, `src/app/api/admin/feedback/route.ts`
  - 재현/리스크: DB가 마이그레이션되지 않은 환경에서 `column "title" of relation "feedbacks" does not exist`로 500
- 변경 내용(why/what)
  - what: insert 실패 시 title 없는 insert로 fallback(제목은 `description` 상단에 합침), Admin 목록은 `split_part(description, '\n', 1)`로 title 제공
  - note: 근본 해결은 `npm run db:migrate`로 DB 스키마를 동기화하는 것(운영 반영 시점에 수행)
- 검증
  - [x] npm run lint
  - [x] npm run type-check
  - [x] SKIP_SITEMAP_DB=true npm run build
  - [x] npm run test:e2e
- 변경 파일
  - src/app/[lang]/(main)/feedback/FeedbackClient.tsx
  - src/app/api/feedback/route.ts
  - src/app/api/admin/feedback/route.ts

#### (2025-12-22) [FE] ui-avatars SVG `next/image` 에러 방지

- 변경 내용(why/what)
  - why: `ui-avatars.com`가 기본 SVG 응답을 반환하여 `next/image`가 차단(leaderboard 500)
  - what: Avatar에서 `ui-avatars.com` URL은 `format=png&size=`로 정규화하고 `unoptimized`로 처리
- 변경 파일
  - src/components/atoms/Avatar.tsx

#### (2025-12-22) [FE/WEB] 모바일 post-first 유지 + 태그 자동생성 3개 고정

- 플랜(체크리스트)
  - [x] 홈 메인 컬럼은 `PostList`가 첫 콘텐츠(모바일 상단 카드 제거)
  - [x] 인증 답변 배지는 모바일에서 `+N` 컴팩트 표기(상세는 툴팁 유지)
  - [x] 토픽/칩 우측 클립 완화(좌우 패딩/scroll padding)
  - [x] 글쓰기 자동 태그는 3개 고정 + 범용 seed(`#정보/#Tip/#추천`) 생성 금지
- 변경 파일
  - src/app/[lang]/(main)/HomeClient.tsx
  - src/components/molecules/cards/PostCard.tsx
  - src/app/globals.css
  - src/components/organisms/PostList.tsx
  - src/lib/seo/postTags.ts
  - src/app/[lang]/(main)/posts/new/NewPostClient.tsx
  - src/lib/constants/tag-translations.ts
  - messages/ko.json
  - messages/vi.json

#### (2025-12-22) [FE/WEB] 모바일 우측 레일 노출 + 프로필(아바타) 클릭 통일 + Playwright 스모크 확장

- 플랜(체크리스트)
  - [x] 우측 레일은 모바일에서 메인 하단으로 노출(추천 콘텐츠를 “왼쪽 사이드바”에 넣지 않음)
  - [x] 추천 사용자/커뮤니티 랭킹: 아바타 클릭도 프로필로 이동(닉네임과 동일 규칙)
  - [x] 구독 토픽 칩 우측 클립 완화(패딩/scroll padding)
  - [x] PostCard 상단 메뉴 버튼 위치 미세 조정(이미지와 간격)
  - [x] Playwright 스모크: privacy/terms/faq/feedback + robots/sitemap 포함
- 검증
  - [x] npm run lint
  - [x] npm run type-check
  - [x] SKIP_SITEMAP_DB=true npm run build
  - [x] npm run test:e2e
- 변경 파일
  - src/components/templates/MainLayout.tsx
  - src/components/organisms/PostList.tsx
  - src/components/organisms/RecommendedUsersSection.tsx
  - src/app/[lang]/(main)/leaderboard/LeaderboardClient.tsx
  - src/components/molecules/cards/PostCard.tsx
  - e2e/smoke.spec.ts
  - docs/WORKING_PLAN.md

#### (2025-12-22) [P0] PostCard 모바일 UX + 피드백/아바타 안정화

- 플랜(체크리스트)
  - [x] PostCard 상단 메뉴(…) 위치를 카드 우상단으로 통일(이미지 유무 관계 없음)
  - [x] “인증 답변/댓글” 배지는 모바일에서 compact 텍스트 유지 + truncate 처리
  - [x] PostCard 하단 액션 아이콘은 ActionIconButton 기반으로 스타일/터치 영역 규칙 통일
  - [x] 해시태그 칩은 최대 3개만 노출 + 범용 태그(`정보/추천/tip`) 노출 차단
  - [x] 모바일 좌측 메뉴 Sheet 폭을 화면에 맞게 확장(사이드바 뒤로 콘텐츠가 비치지 않음)
  - [x] 홈/검색 메인 배경을 canvas로 전환(카드는 white surface 유지)
  - [x] /api/feedback: `feedbacks.title` 컬럼이 없는 DB에서도 저장되도록 fallback 보강
  - [x] next/image: ui-avatars remotePatterns 경로 매칭 완화
- 변경 파일
  - src/components/molecules/cards/PostCard.tsx
  - src/components/organisms/PostList.tsx
  - src/components/templates/MainLayout.tsx
  - src/app/[lang]/(main)/HomeClient.tsx
  - src/app/[lang]/(main)/search/SearchClient.tsx
  - src/app/api/feedback/route.ts
  - src/app/api/admin/feedback/route.ts
  - next.config.ts
  - messages/ko.json
  - messages/vi.json
  - docs/WORKING_PLAN.md
- 검증
  - [x] npm run lint
  - [x] npm run type-check
  - [x] SKIP_SITEMAP_DB=true npm run build
  - [x] npm run test:e2e

#### (2025-12-22) [P0] Feed/Feedback/Leaderboard 런타임 이슈 정리 + 모바일 정렬 보강

- 작업
  - PostCard: 숨김/신고(…) 제거 → `×(숨기기)` 단일 액션 + Tooltip(이미지 유무와 무관하게 동일 위치)
  - PostCard: 제목/요약/태그/액션 인덴트(`pl-12`) 제거로 모바일 공간 확보
  - PostCard: “인증 답변/댓글” 배지는 border 없이 compact 텍스트로 유지(+ truncate)
  - 모바일: PostCard 하단 액션은 1열 유지(`globals.css` media query에서 wrap 제거)
  - 추천 사용자: recommendation meta 최대 3개 노출(온보딩 핵심 정보 강조)
  - /api/users/recommended: recommendation meta 우선순위 재정렬 + 최대 3개 반환
  - /api/feedback: DB 컬럼 불일치(title/page_url/contact_email 등)에서도 insert가 깨지지 않게 “missing column 감지 → 해당 컬럼 제거 후 재시도”로 하드닝(추가 마이그레이션 없이 동작)
  - Leaderboard: trustScore 노출 제거 + 주간 답변 수(최근 7일) 추가, 스코어 산식/정렬 기준 반영
  - Modal: `createPortal(document.body)`로 렌더링해 헤더(backdrop-filter) 컨텍스트에서 fixed 오프셋 이슈 방지
  - Rail/레이아웃: 추천 콘텐츠 “더보기” 제거, 모바일 메뉴 Sheet 폭을 w-full로 고정, 페이지 padding 보강
  - Excerpt: 글쓰기 모더레이션 템플릿 prelude가 피드 excerpt에 노출되지 않게 strip
- 변경 파일
  - messages/ko.json
  - messages/vi.json
  - src/app/[lang]/(main)/leaderboard/LeaderboardClient.tsx
  - src/app/api/feedback/route.ts
  - src/app/api/users/leaderboard/route.ts
  - src/app/api/users/recommended/route.ts
  - src/app/globals.css
  - src/components/atoms/Modal.tsx
  - src/components/molecules/cards/PostCard.tsx
  - src/components/molecules/modals/SettingsModal.tsx
  - src/components/molecules/user/UserProfile.tsx
  - src/components/organisms/AdminPostRail.tsx
  - src/components/organisms/PostList.tsx
  - src/components/organisms/RecommendedUsersSection.tsx
  - src/components/templates/MainLayout.tsx
  - src/lib/api/post-list.ts
  - src/repo/users/types.ts
- 검증
  - [x] npm run lint
  - [x] npm run type-check
  - [x] SKIP_SITEMAP_DB=true npm run build
  - [x] npm run test:e2e

#### (2025-12-22) [P0] 모바일 사이드바/추천 사용자/UGC 이미지 안정화 + Admin Feedback fallback

- 작업
  - 모바일 사이드바: Sheet가 화면을 전부 덮지 않도록 폭 제한(`max-w-[90vw]`)
  - 추천 사용자: 카드 레이아웃을 “아바타 좌측 + 정보 + 팔로우 버튼” 1행으로 재정렬(모바일 CTA 과대 문제 완화)
  - PostCard: 숨김 `×` 아이콘 크기/여백 미세 조정(이미지 유무 관계 없이 안정)
  - PostCard: 좋아요/북마크 active 상태 배경색 강조 제거(아이콘/텍스트 컬러로만 상태 표현)
  - 구독/카테고리: 구독 버튼 우측 클립 완화(행 wrap + 버튼 min-width 축소)
  - Post Detail: 본문/답변 UGC 영역에 `ugc-content` 적용 → 첨부 이미지가 원본 크기로 튀지 않게 제한
  - Admin Feedback: `feedbacks` 테이블 컬럼 불일치(title/steps/page_url 등)에서도 목록 조회가 깨지지 않게 fallback 보강
- 변경 파일
  - src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx
  - src/app/api/admin/feedback/route.ts
  - src/components/molecules/cards/PostCard.tsx
  - src/components/organisms/CategorySidebar.tsx
  - src/components/organisms/RecommendedUsersSection.tsx
  - src/components/templates/MainLayout.tsx
  - docs/WORKING_PLAN.md
- 검증
  - [x] npm run lint
  - [x] npm run type-check
  - [x] SKIP_SITEMAP_DB=true npm run build
  - [x] npm run test:e2e

#### (2025-12-22) [P0] Feedback 컬럼 호환 + PostCard hide(×) 미디어 겹침 방지

- 작업
  - /api/feedback: `feedbacks.content`(legacy) / `feedbacks.title+description`(new) 모두 insert 지원(마이그레이션 없이 동작)
  - /api/admin/feedback: `feedbacks` 컬럼 자동 감지 후 검색/목록 조회 지원(legacy/new 모두 호환)
  - PostCard: hide(×)를 본문 영역으로 이동해 썸네일과 겹치지 않게 조정
- 변경 파일
  - src/app/api/admin/feedback/route.ts
  - src/app/api/feedback/route.ts
  - src/components/atoms/Avatar.tsx
  - src/components/atoms/FollowButton.tsx
  - src/components/molecules/cards/PostCard.tsx
  - src/components/organisms/CategorySidebar.tsx
  - src/components/organisms/PostList.tsx
  - src/components/organisms/RecommendedUsersSection.tsx
  - docs/WORKING_PLAN.md
- 검증
  - [x] npm run lint
  - [x] npm run type-check
  - [x] SKIP_SITEMAP_DB=true npm run build
  - [x] npm run test:e2e

#### (2025-12-23) [P0] E2E 서버 재사용 방지 + 추천 유저/피드백 런타임 오류 제거

- 작업
  - Playwright: `reuseExistingServer` 기본값을 `false`로 고정(환경 불일치로 인한 robots/sitemap/health 500 플레키 방지)
  - 추천 사용자: `/api/users/recommended`에서 viewer 프로필 값이 null/empty일 때 score 계산 쿼리 오류 방지
  - Feedback: `feedbacks` Drizzle schema를 실제 DB 컬럼(`content`)과 정합
  - PostCard: 해시태그 칩 3개 규칙 안정화(태그가 비거나 필터링되면 `대분류/세부분류/작성 목적`으로 fallback)
- 변경 파일
  - playwright.config.ts
  - src/app/api/users/recommended/route.ts
  - src/lib/db/schema.ts
  - src/components/molecules/cards/PostCard.tsx
- 검증
  - [x] npm run lint
  - [x] npm run type-check
  - [x] SKIP_SITEMAP_DB=true npm run build
  - [x] npm run test:e2e
- PR/머지
  - [x] PR #58 (@codex) → `main` 머지

---

## Testing and validation (게이트)

- 공통: `npm run lint` → `npm run type-check` → `SKIP_SITEMAP_DB=true npm run build`
- 필수: Playwright 스모크 통과
- 필수: Rate limit 동작 확인(429 + UX 처리)
- 수동: P0-9 크로스브라우징 체크리스트 완료
- 정기(비차단): `P1-12` 성능 감사(CWV) = `LCP ≤ 2.5s`, `INP ≤ 200ms`, `CLS ≤ 0.1`

---

## Release Candidate (RC) Protocol (P0 종료 방식)

#### (2025-12-22) [LEAD] P0 기능 동결 + DoD(완료 정의) 기반 종료

- 원칙
  - 지금부터 신규 기능/확장 작업 금지(문서/리팩토링 포함). 오직 P0-2/P0-3/P0-9를 닫는 변경만 허용한다.
  - “집계용 Progress Checklist”는 최종 RC 서명(DoD 만족) 시점에만 갱신한다(중간 진행은 작업 로그로만 기록).
- 남은 Launch Blocker(문서 기준)
  - P0-2: i18n/클립 0(ko/vi) — 하드코딩 제거 + 텍스트 잘림 0
  - P0-3: 모바일 키보드/스크롤 — 입력/제출 막힘 0
  - P0-9: 크로스브라우징/반응형 QA — Blocker/Major 0 리포트

#### (2025-12-22) [LEAD] 모바일 UI 회귀 수정 + UGC 이미지 제한 (P0-3/P0-16)

- 플랜(체크리스트)
  - [x] MainLayout: 모바일에서 rightRail을 본문 상단으로 이동 + 좌측 Sheet 폭을 360px로 복구
  - [x] PostCard: hide(×) 고정 위치 + 하단 액션바(좋아요/공유/북마크) 형태 일관화
  - [x] 추천 사용자: avatar 확대 + follow CTA 축소
  - [x] 상세: UGC 이미지가 원본 크기로 과대 노출되지 않게 제한(`ugc-content`)
- 변경 내용(why/what)
  - why: 모바일에서 “추천 콘텐츠 위치/사이드바 시트 폭/카드 액션/상세 이미지” 회귀를 정리해 전환·체류에 영향을 주는 UI 리스크를 제거
  - what:
    - `src/components/templates/MainLayout.tsx`: mobile에서 rightRail 상단 렌더 + rightRail aside는 lg+만 노출, Sheet 폭 고정
    - `src/components/molecules/cards/PostCard.tsx`: hide(×) absolute 고정 + 액션바 좋아요 버튼을 icon variant로 통일
    - `src/components/organisms/RecommendedUsersSection.tsx`, `src/components/atoms/FollowButton.tsx`: 모바일 카드에서 avatar/CTA 비율 조정
    - `src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx`, `src/app/globals.css`: UGC 컨테이너에 `ugc-content` 적용 + img max-height 제한
- 검증
  - [x] `npm run lint`
  - [x] `npm run type-check`
  - [x] `SKIP_SITEMAP_DB=true npm run build`
  - [x] `npm run test:e2e`

#### (2025-12-23) [LEAD] P0-9 수동 QA 리포트 템플릿(기록용)

- 목적: 크로스브라우징/반응형 수동 QA 결과를 1곳에 기록해 “Blocker/Major 0”를 확인한다(실행은 로컬 실기기/브라우저 전제).
- 범위(필수 플로우): 홈(피드) → 카테고리 전환 → 검색 → 상세, 로그인/게이팅, 글쓰기(키보드), 답변/댓글(키보드), 프로필/구독/알림/인증
- 매트릭스(필수): iOS Safari(iPhone SE/일반/iPad), Android Chrome(중저가/대화면), Desktop(Chrome/Edge/Safari 가능 시)

리포트(채우기)

| 환경(기기/OS/브라우저) | 홈/피드 | 검색 | 상세 | 글쓰기(키보드) | 답변/댓글(키보드) | 프로필 | 구독 | 알림 | 인증 | 결과/메모 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| iPhone SE / iOS __ / Safari |  |  |  |  |  |  |  |  |  |  |
| iPhone 14/15 / iOS __ / Safari |  |  |  |  |  |  |  |  |  |  |
| iPad / iPadOS __ / Safari |  |  |  |  |  |  |  |  |  |  |
| Android(중저가) / Android __ / Chrome |  |  |  |  |  |  |  |  |  |  |
| Android(대화면) / Android __ / Chrome |  |  |  |  |  |  |  |  |  |  |
| Desktop / macOS __ / Chrome |  |  |  | N/A | N/A |  |  |  |  |  |
| Desktop / macOS __ / Safari |  |  |  | N/A | N/A |  |  |  |  |  |
| Desktop / Windows __ / Edge |  |  |  | N/A | N/A |  |  |  |  |  |

이슈 로그(채우기)

- 포맷: `ID` / `Severity(Blocker|Major|Minor)` / `Env` / `URL` / `Steps` / `Expected` / `Actual` / `Screenshot` / `Status(Open|Fixed|Wontfix)`

최종 서명(DoD)

- [ ] Blocker 0
- [ ] Major 0
- [ ] Minor는 P1로 이월 목록화

#### (2025-12-23) [P0] 알림 컨텐츠 i18n(ko/vi) + 모바일 키보드 UI 하드닝 (P0-2/P0-3)

- 목표: 알림 본문이 한국어로만 저장되는 문제를 제거(ko/vi) + 모바일에서 키보드가 열릴 때 하단 내비가 폼 제출을 가리지 않게 한다
- 변경 내용
  - `src/lib/notifications/create.ts`: 수신자 `preferredLanguage` 기반으로 알림 본문 템플릿을 ko/vi로 생성(`en` 등은 `ko`로 fallback, 기본은 `vi`)
  - `src/components/organisms/BottomNavigation.tsx`: `visualViewport` 기반으로 키보드 열림을 감지해 BottomNavigation(및 홈 피드 토글)을 자동 숨김 처리
- 검증
  - [x] `npm run lint`
  - [x] `npm run type-check`
  - [x] `SKIP_SITEMAP_DB=true npm run build`
  - [x] `npm run test:e2e`
- PR/머지
  - [x] PR #39 (@codex) → `main` 머지

#### (2025-12-22) [LEAD] P0-9 QA 매트릭스 (1라운드)

- 대상 브랜치: `codex-integration` (QA 통과 후 `main` 머지)
- 기기/브라우저 매트릭스(필수)
  - iOS Safari: iPhone SE(또는 동급 소형), iPhone 14/15(일반), iPad(태블릿)
  - Android Chrome: 1종(중저가) + 1종(대화면)
  - Desktop: Chrome + Edge + Safari(가능하면)
- 핵심 플로우(필수)
  - 홈(피드) → 카테고리 전환 → 검색 → 상세 진입
  - 로그인 모달/게이팅(글쓰기/좋아요/팔로우 등)
  - 글쓰기(템플릿/에디터/태그) → 제출 버튼 접근(키보드 올라온 상태)
  - 댓글/답변 입력 → 제출 버튼 접근(키보드 올라온 상태)
  - 프로필/구독/알림/인증 신청(모달/시트 포함)
- 이슈 기록 포맷(필수)
  - 환경(기기/OS/브라우저) + URL + 재현 스텝 + 기대/실제 + 스크린샷 + 심각도(Blocker/Major/Minor)

#### P0 Sign-off (RC 서명)

- P0-2 (i18n/클립): [ ] Blocker/Major 0  [ ] 핵심 플로우 ko/vi 텍스트 클립 0
- P0-3 (모바일 키보드): [ ] iOS/Android에서 입력/제출 막힘 0
- P0-9 (QA): [ ] 리포트 완료  [ ] Blocker/Major 0  [ ] Minor는 P1로 이월 목록화

#### (2025-12-22) [LEAD] 모바일 랭킹/프로필/추천유저 컴팩트화 + 레이아웃 시작점 정렬 (P0-16/P0-19)

- 플랜(체크리스트)
  - [x] Leaderboard: 모바일 “상위 랭커” 세로 스택 → 가로 캐러셀, 랭킹 설명은 Tooltip로 축약
  - [x] Leaderboard: `hideSidebar` 제거로 모바일 사이드바 버튼 동작 복구
  - [x] Profile: 메인 헤더/레이아웃과 동일한 골격(MainLayout)로 통일 + 모바일에서 아바타/닉네임 1행 정렬
  - [x] 추천 사용자: 게시글 카드와 구분되는 섹션 스타일(배경/보더) + 카드 폭 확장
  - [x] 홈 레이아웃: 좌/우 레일 상단 패딩 튜닝으로 시작점 정렬(메뉴/추천콘텐츠/피드)
- 현황 분석(코드 기준)
  - Leaderboard: 모바일에서 상위 3명 카드가 세로로 길게 쌓이며 스크롤 부담이 큼 + 랭킹 설명 블록도 세로 확장(`src/app/[lang]/(main)/leaderboard/LeaderboardClient.tsx`)
  - Leaderboard: `hideSidebar`로 인해 헤더 햄버거 버튼이 동작해도 Sheet가 렌더되지 않음(`src/app/[lang]/(main)/leaderboard/page.tsx`)
  - Profile: 개별 Header/컨테이너로 운영되어 메인 헤더와 이질감 + 모바일 아바타가 닉네임과 분리되어 공간 낭비(`src/app/[lang]/(main)/profile/[id]/ProfileClient.tsx`)
  - 추천 사용자: 게시글 카드와 거의 동일한 톤으로 구분감이 약함(`src/components/organisms/RecommendedUsersSection.tsx`)
- 변경 내용(why/what)
  - why: 모바일에서 “세로로 길어지는 블록”을 줄이고, 페이지 간 골격/정렬 일관성을 회복해 인지부하/이탈 리스크를 낮춤
  - what:
    - `src/app/[lang]/(main)/leaderboard/page.tsx`: `hideSidebar` 제거(모바일 사이드바 버튼 동작 복구)
    - `src/app/[lang]/(main)/leaderboard/LeaderboardClient.tsx`: 상위 랭커 캐러셀 + 랭킹 설명 Tooltip(모바일) + “신뢰1”류 배지 노출 제거
    - `src/app/[lang]/(main)/profile/[id]/ProfileClient.tsx`: MainLayout로 통일 + 모바일 헤더 영역 1행 정렬(아바타↔닉네임)
    - `src/components/organisms/RecommendedUsersSection.tsx`: 섹션 배경/보더로 구분 + auto-cols 확장
    - `src/components/organisms/CategorySidebar.tsx`: 메뉴 섹션 상단 padding 제거(정렬 보정)
    - `src/components/organisms/AdminPostRail.tsx`: 데스크톱 padding 축소(정렬 보정)
- 검증
  - [x] `npm run lint`
  - [x] `npm run type-check`
  - [x] `SKIP_SITEMAP_DB=true npm run build`
  - [x] `npm run test:e2e`
- 변경 파일
  - src/app/[lang]/(main)/leaderboard/page.tsx
  - src/app/[lang]/(main)/leaderboard/LeaderboardClient.tsx
  - src/app/[lang]/(main)/profile/[id]/ProfileClient.tsx
  - src/components/organisms/RecommendedUsersSection.tsx
  - src/components/organisms/CategorySidebar.tsx
  - src/components/organisms/AdminPostRail.tsx

#### (2025-12-22) [WEB/BE] 추천유저/피드백 오류 해소 + PostCard/구독 UI 모바일 하드닝 (P0 보완)

- 플랜(체크리스트)
  - [x] 추천 사용자: `/api/users/recommended` SQL 파라미터 타입 에러 제거(500 방지)
  - [x] 피드백: `feedbacks` 테이블 컬럼 불일치(마이그레이션 미적용 등)에서도 저장 가능하도록 삽입 로직 보강
  - [x] ui-avatars: 프로필 수정 페이지에서 `next/image` 크래시 방지(미리보기는 `<img>`로 처리)
  - [x] PostCard: 숨김(×) 위치 고정 + 인증 답변 라벨 compact 고정 + 댓글 액션 버튼 톤 통일
  - [x] 구독: 토픽 구독 버튼이 우측에서 잘리는 케이스 완화(모바일에서 2줄 배치)
- 현황 분석(로그/코드 기준)
  - 추천 사용자: `could not determine data type of parameter` / `syntax error` 류로 `/api/users/recommended` 500 발생 가능(`src/app/api/users/recommended/route.ts`)
  - 피드백: `feedbacks.title` 컬럼 불일치 시 `/api/feedback` 500(`src/app/api/feedback/route.ts`)
  - ui-avatars: 프로필 수정 페이지에서 원격 아바타가 ui-avatars(SVG)일 때 `next/image`가 에러를 던질 수 있음(`src/app/[lang]/(main)/profile/edit/ProfileEditClient.tsx`)
  - PostCard: 숨김 버튼이 레이아웃에 영향을 줘 텍스트/미디어와 간격 이슈 유발 + 인증 답변 라벨이 문장형으로 길어짐(`src/components/molecules/cards/PostCard.tsx`)
  - 구독(Topics): 토픽명/구독 버튼이 한 줄에 고정되어 일부 언어(vi)에서 클립(`src/app/[lang]/(main)/subscriptions/SubscriptionsClient.tsx`)
- 변경 내용(what)
  - `src/app/api/users/recommended/route.ts`: match score 계산을 단순화해 Postgres 타입 추론 오류 방지
  - `src/app/api/feedback/route.ts`: `information_schema` 기반 컬럼 감지 → 존재 컬럼만 INSERT(환경별 스키마 차이 흡수)
  - `src/app/[lang]/(main)/profile/edit/ProfileEditClient.tsx`: ui-avatars/blob/data 미리보기는 `<img>`로 렌더
  - `src/lib/db/seed.ts`: ui-avatars 기본 URL을 `format=png`로 고정
  - `src/components/molecules/cards/PostCard.tsx`: 숨김(×) 버튼을 absolute로 고정 + 인증 라벨 compact 고정 + 댓글 액션을 ActionIconButton 톤으로 통일
  - `src/components/atoms/FollowButton.tsx`: `xs` 사이즈 버튼 높이/패딩 축소(추천 사용자 카드에서 과도한 버튼 크기 완화)
  - `src/app/[lang]/(main)/subscriptions/SubscriptionsClient.tsx`: 토픽 행을 `flex-col sm:flex-row`로 변경해 버튼/라벨 클립 완화
- 검증
  - [x] `npm run lint`
  - [x] `npm run type-check`
  - [x] `SKIP_SITEMAP_DB=true npm run build`
  - [x] `npm run test:e2e`
- 변경 파일
  - src/app/api/users/recommended/route.ts
  - src/app/api/feedback/route.ts
  - src/app/[lang]/(main)/profile/edit/ProfileEditClient.tsx
  - src/components/molecules/cards/PostCard.tsx
  - src/components/atoms/FollowButton.tsx
  - src/app/[lang]/(main)/subscriptions/SubscriptionsClient.tsx
  - src/lib/db/seed.ts
- PR/머지
  - [x] PR #43 (@codex) → `main` 머지

#### (2025-12-22) [WEB] report/feedback fetch fallback 코드화 (P0-2)

- 목표: 에러 메시지(ko) 누수 없이, UI에서 `errors` 키로 일관된 로컬라이즈 처리
- 변경 내용
  - `src/repo/reports/fetch.ts`: report 실패 시 fallback 메시지 제거 → `REPORT_FAILED` 코드로 고정
  - `src/repo/feedback/fetch.ts`: feedback 실패 시 fallback 메시지 제거 → `FEEDBACK_FAILED` 코드로 고정
  - `messages/ko.json`, `messages/vi.json`: `REPORT_FAILED`, `FEEDBACK_FAILED` 추가
- 검증
  - [x] `npm run lint`
  - [x] `npm run type-check`
  - [x] `SKIP_SITEMAP_DB=true npm run build`
- PR/머지
  - [x] PR #45 (@codex) → `main` 머지

#### (2025-12-22) [FE] 팔로우 모달/카드/에디터 모바일 UX 보강 (P0-3/P0-9)

- 목표: 모바일에서 “세로 과확장/클릭 오해/링크 미가시성”을 줄여 체류/전환 리스크를 낮춤
- 변경 내용
  - `src/components/molecules/modals/FollowingModal.tsx`: 추천 사용자 카드에서 아바타 확대 + Follow CTA 축소 + 메타는 최대 3개 칩으로 노출(불필요 `#` 제거)
  - `src/components/molecules/cards/PostCard.tsx`: 숨김(×)을 카드 헤더 라인으로 이동(미디어 유무와 무관하게 동일 위치)
  - `src/app/globals.css`: ProseMirror 링크 스타일 추가(에디터에서 링크가 시각적으로 보이게)
- 검증
  - [x] `npm run lint`
  - [x] `npm run type-check`
  - [x] `SKIP_SITEMAP_DB=true npm run build`
  - [x] `npm run test:e2e`
- PR/머지
  - [x] PR #46 (@codex) → `main` 머지

#### (2025-12-22) [P0] 상세 공유 on-demand + 자기답변 채택 방지 + 리더보드 스모크

- 목표: 상세 화면 전환 흐름(본문/답변)에 집중시키고, 채택 룰/회귀 테스트로 P0 리스크를 줄임
- 변경 내용
  - `src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx`: 상세 “공유 박스” 상시 노출 제거 → 공유 버튼 클릭 시 모달로 노출(복사/공유 후 자동 닫힘)
  - `src/app/api/answers/[id]/adopt/route.ts`: 질문 작성자라 하더라도 “본인 답변”은 채택 불가(403)
  - `e2e/smoke.spec.ts`: `/leaderboard` 렌더 스모크 추가(브라우저/모바일/웹킷 공통)
- 검증
  - [x] `npm run lint`
  - [x] `npm run type-check`
  - [x] `SKIP_SITEMAP_DB=true npm run build`
  - [x] `npm run test:e2e`
- PR/머지
  - [x] PR #48 (@codex) → `main` 머지

#### (2025-12-22) [FE] 홈/상세 레이아웃 일관성 + 사이드바 네비게이션 fallback (P0-3/P0-9)

- 목표: “헤더/사이드바/폭”을 전 페이지에서 일관되게 유지하고, 모바일에서 회귀(클립/오작동)를 줄임
- 변경 내용
  - `src/components/organisms/CategorySidebar.tsx`: `onCategoryChange` 미전달 페이지에서도 메뉴 클릭 시 `/${lang}?c=...`로 fallback 네비게이션(리더보드 등에서 메뉴 동작 보장)
  - `src/components/organisms/CategorySidebar.tsx`: 홈 전용 NoticeBanner를 좌측 레일에서 제거(메뉴 시작점 정렬)
  - `src/app/[lang]/(main)/HomeClient.tsx`: NoticeBanner를 우측 레일(Desktop only)로 이동(메뉴 정렬 유지 + 본문 피드 방해 최소화)
  - `src/components/templates/MainLayout.tsx`: 레일 존재 시 메인 폭을 `lg:max-w-[920px]`로 고정(데스크톱 과확장 억제)
  - `src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx`: 상세 페이지를 MainLayout 기반으로 통합(메인 페이지와 동일한 헤더/사이드바 구조)
  - `src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx`: 본인 답변에는 “채택하기” 버튼 노출하지 않음(서버 403 이전에 UX 차단)
  - `src/components/molecules/editor/RichTextEditor.tsx`: 링크 추가 시 선택 텍스트가 없으면 URL을 삽입 후 링크 적용(“추가했는데 안 보임” 이슈 완화)
  - `src/components/molecules/cards/PostCard.tsx`: 숨김(×)을 작성자 라인 우측으로 이동해 미디어 유무와 무관하게 동일 위치
- 검증
  - [x] `npm run lint`
  - [x] `npm run type-check`
  - [x] `SKIP_SITEMAP_DB=true npm run build`
  - [x] `npm run test:e2e`

#### (2025-12-22) [UI] Header/Sidebar/Feed 모바일 회귀 정리 (P0-3/P0-9)

- 목표: 모바일에서 “시작점 불일치/닫기 버튼 중복/카드 액션 오작동/세로 과확장”으로 보이는 회귀를 줄여 체류·전환 리스크를 낮춤
- 변경 내용
  - `src/components/ui/sheet.tsx`: Sheet 기본 닫기 버튼 on/off 지원(`showCloseButton`)
  - `src/components/templates/MainLayout.tsx`: 모바일 사이드바 Sheet 기본 닫기 버튼 비활성화(사이드바 상단 닫기 버튼만 사용)
  - `src/components/organisms/CategorySidebar.tsx`: 모바일 사이드바 “× + 메뉴” 헤더를 좌측 정렬(중복/혼선 제거)
  - `src/components/organisms/Header.tsx`: Header padding/grid를 MainLayout과 정렬(2xl center 920px, padding 통일)
  - `src/components/molecules/cards/PostCard.tsx`: hide(×)를 작성자 라인 우측으로 고정(썸네일 유무와 무관하게 동일 위치)
  - `src/app/[lang]/(main)/leaderboard/LeaderboardClient.tsx`: 모바일 이벤트 설명을 tooltip로 축소(세로 과확장 방지)
  - `src/components/organisms/PostList.tsx`: 토픽(구독) 칩 row 우측 패딩 증가(마지막 칩 클립 완화)
  - `src/components/organisms/RecommendedUsersSection.tsx`: 모바일 추천 사용자 캐러셀 auto-cols를 `100vw` 기반으로 재조정(카드/버튼 클립 완화)
- 검증
  - [x] `npm run lint`
  - [x] `npm run type-check`
  - [x] `SKIP_SITEMAP_DB=true npm run build`
  - [x] `npm run test:e2e`
- PR/머지
  - [x] PR #53 (@codex) → `main` 머지
  - [x] PR #54 (@codex) → `main` 머지
  - [x] PR #55 (@codex) → `main` 머지
  - [x] PR #56 (@codex) → `main` 머지

#### (2025-12-23) [P0] Account restriction i18n + rail gating (P0-2/P0-3)

- 목표: 계정 제한 문구의 영문 노출 제거 + `ACCOUNT_RESTRICTED` 흐름을 API→repo→UI까지 통일 + 모바일 홈에서 우측 레일이 게시글 위로 올라오는 UX 제거
- 변경 내용
  - `src/components/molecules/banners/AccountStatusBanner.tsx`: 계정 상태 배너를 번역키 기반으로 전환(정지/일시정지)
  - `messages/ko.json`, `messages/vi.json`: `accountStatusBanner.*`, `errors.ACCOUNT_RESTRICTED` 추가
  - `src/app/[lang]/(main)/posts/new/NewPostClient.tsx`: 계정 제한 에러는 번역키 우선으로 토스트 처리
  - `src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx`: 계정 제한 에러는 번역키 우선으로 표시
  - `src/app/api/posts/route.ts`, `src/app/api/posts/[id]/answers/route.ts`, `src/app/api/posts/[id]/comments/route.ts`, `src/app/api/answers/[id]/comments/route.ts`: 제한 시 `code: ACCOUNT_RESTRICTED` + 403으로 표준화
  - `src/repo/posts/fetch.ts`, `src/repo/answers/fetch.ts`, `src/repo/comments/fetch.ts`: 403이라도 `code===ACCOUNT_RESTRICTED`일 때만 AccountRestrictedError로 분기
  - `src/components/templates/MainLayout.tsx`: 모바일에서 `rightRail`을 기본 노출하지 않고 `mobileRightRail`로 opt-in
  - `src/app/[lang]/(main)/leaderboard/page.tsx`: 이벤트 섹션을 `mobileRightRail`로 제공
- 검증
  - [x] `npm run lint`
  - [x] `npm run type-check`
  - [x] `SKIP_SITEMAP_DB=true npm run build`
  - [x] `npm run test:e2e`

#### (2025-12-23) [P0] Feedback/Recommended 안정화 + Subscriptions i18n/클립 + E2E 재사용 (P0-2/P0-3)

- 목표: `/api/feedback` DB 스키마 불일치로 인한 제출 실패 해소 + 추천 사용자 쿼리의 타입/배열 안전성 강화 + 구독 페이지의 버튼 클립과 영문 하드코딩 제거 + 로컬에서 Playwright 게이트가 “이미 실행 중인 서버” 때문에 실패하지 않게 안정화
- 변경 내용
  - `docs/WORKING_PLAN.md`: MCP 신규 연결/사용 전 사용자 보고 규칙 추가 + filesystem MCP의 tools-only 케이스 설명 보강
  - `src/app/api/feedback/route.ts`: `feedbacks.content` 단일 컬럼에 맞춰 저장(제목/내용/재현을 합쳐 저장) + rate limit 유지
  - `src/app/api/users/recommended/route.ts`: `userType/visaType/koreanLevel/interests` 비교값을 `::text` 캐스팅해 Postgres 파라미터 타입 이슈 방지
  - `src/app/[lang]/(main)/subscriptions/SubscriptionsClient.tsx`: 토픽 구독 버튼 줄바꿈(클립 방지) + 채널/빈도 라벨을 i18n 키로 전환
  - `messages/ko.json`, `messages/vi.json`: `subscription.*`(채널/빈도/설명) 키 보강
  - `playwright.config.ts`: `reuseExistingServer: true`로 로컬 3000 포트 점유 시에도 `npm run test:e2e`가 안정적으로 동작
- 검증
  - [x] `npm run lint`
  - [x] `npm run type-check`
  - [x] `SKIP_SITEMAP_DB=true npm run build`
  - [x] `npm run test:e2e`

#### (2025-12-23) [P0] 팔로우 추천 카드 정렬 + 에디터 링크 삽입 안정화 + PostCard 컴팩트 (P0-2/P0-3)

- 목표: 모바일에서 “추천 팔로우” 카드의 아바타/팔로우 버튼 비율을 정상화 + 링크 추가 시 에디터에 반영되지 않는 케이스를 줄여 작성 실패 리스크를 낮춤 + PostCard의 숨김/신뢰 라벨이 액션바를 밀지 않게 컴팩트화
- 변경 내용
  - `src/components/molecules/modals/FollowingModal.tsx`: 추천/팔로잉 카드에서 팔로우 버튼을 우측으로 분리(아바타 축소/버튼 과대 강조 방지) + 프로필 진입 동선 유지
  - `src/components/molecules/editor/RichTextEditor.tsx`: 링크 URL 삽입 시 빈 선택 영역에서도 링크 마크가 확실히 적용되도록 삽입 방식을 개선
  - `src/components/molecules/cards/PostCard.tsx`: hide(×) 터치 타깃/정렬 보정 + 인증 응답 라벨 padding/폭 축소(클립/밀림 완화) + purpose 태그 하드코딩 fallback 제거
- 검증
  - [x] `npm run lint`
  - [x] `npm run type-check`
  - [x] `SKIP_SITEMAP_DB=true npm run build`
  - [x] `npm run test:e2e`

#### (2025-12-23) [P0] 해시태그 자동 생성 규칙 고정(3개) + 로컬 E2E 포트 분리

- 목표: 의미 없는 해시태그 도배(#정보/#Tip/#추천 등) 제거 + “모더레이션 입력값 → 해시태그”를 단일 소스로 고정(3개) + dev(3000) 실행 중에도 `npm run test:e2e`가 안정적으로 동작하도록 E2E 포트 분리
- 변경 내용
  - `src/lib/seo/postTags.ts`: 자동 태그를 3개로 고정하고, 제목/본문 기반 키워드 추출 fallback 제거(분류/모더레이션 값만 사용) + stop-keys(ko/en/vi) 확장
  - `src/components/molecules/cards/PostCard.tsx`: 금칙/범용 태그(ko/en/vi) 렌더링 차단 강화(의미 없는 칩 노출 방지)
  - `src/app/api/users/recommended/route.ts`: 추천 사용자 메타 칩 우선순위를 `userType → visaType → interest → nationality → koreanLevel`로 재정렬(최대 3개 노출 전제)
  - `playwright.config.ts`: 기본 포트를 `3100`으로 변경(E2E는 3100, dev는 3000 고정) + 필요 시 `E2E_PORT`로 오버라이드
- 검증
  - [x] `npm run lint`
  - [x] `npm run type-check`
  - [x] `SKIP_SITEMAP_DB=true npm run build`
  - [x] `npm run test:e2e`

#### (2025-12-23) [P0] 모바일 홈 추천 콘텐츠 복구 + 팔로우 탭 상단 배너 완화 (P0-3)

- 목표: 모바일 홈에서 추천 콘텐츠가 사이드바로 “이동/누락”되는 체감 문제를 줄이고(홈 진입 시 컨텐츠 노출), 팔로우 탭에서 추천 사용자 섹션이 피드를 과점유하는 경우를 방지해 “게시글 우선” 흐름을 유지
- 변경 내용
  - `src/app/[lang]/(main)/HomeClient.tsx`: 모바일에서도 홈 추천 콘텐츠가 보이도록 `mobileRightRail`에 `AdminPostRail` 제공(데스크톱은 기존 `rightRail` 유지)
  - `src/components/organisms/PostList.tsx`: `following` 탭에서 추천 사용자 섹션을 “팔로우 글이 0개일 때만” 상단에 노출(피드가 있는 경우 상단 배너로 피드가 밀리는 현상 방지)
- 검증
  - [x] `npm run lint`
  - [x] `npm run type-check`
  - [x] `SKIP_SITEMAP_DB=true npm run build`
  - [x] `npm run test:e2e`

#### (2025-12-23) [P0] PostDetail/알림 모달 i18n 하드코딩 제거 (P0-2)

- 목표: PostDetailClient/알림 모달에 남아있던 locale 분기 fallback 문자열을 제거하고, ko/vi messages 기반으로 단일화
- 변경 내용
  - `src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx`: locale 분기 fallback 오브젝트 제거 + 신고 사유 라벨을 번역키로 통일
  - `src/components/molecules/modals/NotificationModal.tsx`: locale 분기 fallback 오브젝트 제거(라우팅은 URL locale 사용) + notifications 번역키로 통일
  - `messages/ko.json`, `messages/vi.json`: notifications 모달에 필요한 키(`loginRequired`, `login`, `loadError`, `retry`, `justNow`, `minutesAgo`, `hoursAgo`, `daysAgo`) 보강
- 검증
  - [x] `npm run lint`
  - [x] `npm run type-check`
  - [x] `SKIP_SITEMAP_DB=true npm run build`
  - [x] `npm run test:e2e`

#### (2025-12-23) [P0] Signup/프로필/유사질문 i18n 하드코딩 제거 + signup update API 정합 (P0-2)

- 목표: 회원가입(프로필 완성)에서 하드코딩(`국내/해외`) 제거 + 프로필 날짜 표시의 하드코딩 제거 + 유사질문 추천태그 locale 분기 제거 + 회원가입 프로필 업데이트 API 경로/메서드 정합
- 변경 내용
  - `src/app/[lang]/(auth)/signup/SignupClient.tsx`: nationality value를 code(`domestic/overseas`)로 전환 + 프로필 업데이트를 `PUT /api/users/[id]`로 정합
  - `src/app/[lang]/(main)/profile/[id]/ProfileClient.tsx`: `방금 전` 비교 하드코딩 제거 → `getJustNowLabel(locale)` 사용
  - `src/components/organisms/SimilarQuestionPrompt.tsx`: 추천 태그를 messages(`newPost.similarTagSuggestions`) 기반으로 파싱(코드 내 locale 분기 제거)
  - `messages/ko.json`, `messages/vi.json`: `newPost.similarTagSuggestions` 추가
- 검증
  - [x] `npm run lint`
  - [x] `npm run type-check`
  - [x] `SKIP_SITEMAP_DB=true npm run build`
  - [x] `npm run test:e2e`

#### (2025-12-23) [P0] Trust badges/ShareButton 하드코딩 제거 (P0-2)

- 목표: Trust badges 가이드/ShareButton에 남아있던 locale 분기 하드코딩을 제거하고 messages 기반으로 단일화
- 변경 내용
  - `src/app/[lang]/guide/trust-badges/page.tsx`: 메타(title/description) 및 헤딩/서브헤딩을 messages 기반으로 통일
  - `messages/ko.json`, `messages/vi.json`, `messages/en.json`: `metadata.trustBadges` + `trustBadges.guideTitle/guideSubtitle` 추가
  - `src/components/molecules/actions/ShareButton.tsx`: locale 하드코딩 제거 + `translations` 기반 tooltip/linkCopied 사용
  - `src/components/organisms/CardNewsShowcase.tsx`, `src/components/organisms/ShortFormPlaylist.tsx`: ShareButton에 `translations` 전달
- 검증
  - [x] `npm run lint`
  - [x] `npm run type-check`
  - [x] `SKIP_SITEMAP_DB=true npm run build`
  - [x] `npm run test:e2e`

#### (2025-12-23) [P0] UserProfile 모달 로딩 타이틀 i18n 하드코딩 제거 (P0-2)

- 목표: 헤더 유저 메뉴 모달(Profile/MyPosts/Following/Bookmarks/Settings) 로딩 UI에서 ko/en/vi 하드코딩을 제거하고 messages 기반으로 단일화
- 변경 내용
  - `src/components/molecules/user/UserProfile.tsx`: dynamic 모달 로딩 fallback의 타이틀/aria-label을 `translations.*.loading` 기반으로 표시(하드코딩 제거)
- 검증
  - [x] `npm run lint`
  - [x] `npm run type-check`
  - [x] `SKIP_SITEMAP_DB=true npm run build`
  - [x] `npm run test:e2e`

#### (2025-12-23) [P0] Subscriptions 로딩 문구 i18n 누락 제거 (P0-2)

- 목표: 구독 페이지 로딩 상태에서 공통 `loading` 라벨이 없어 영어 fallback(`Loading...`)이 노출될 수 있는 케이스를 제거
- 변경 내용
  - `messages/ko.json`, `messages/vi.json`, `messages/en.json`: `common.loading` 추가
  - `src/app/[lang]/(main)/subscriptions/SubscriptionsClient.tsx`: `copy.loading`을 `common.loading` 기반으로 단일화(영문 fallback 제거)

#### (2025-12-23) [P0] 모바일 PostCard 숨김 버튼 위치 고정 + 미디어 상단 오프셋 제거 + 홈 피드 토글 고정 (P0-3)

- 목표: 모바일에서 카드 액션이 “떠 있는 것처럼” 보이는 현상(숨김 버튼 위치 흔들림/미디어 상단 여백/홈 피드 토글 오버레이)을 제거하고, 게시글 피드의 레이아웃 안정성을 확보
- 변경 내용
  - `src/components/molecules/cards/PostCard.tsx`: 숨김 버튼을 카드 우상단 고정 영역(`.question-card-badges`)로 이동해 미디어 유무에 따른 위치 흔들림 제거(작은 `×` + tooltip)
  - `src/app/globals.css`: `.question-card-media`의 불필요한 상단 오프셋 제거(모바일/데스크톱 동일)
  - `src/components/organisms/BottomNavigation.tsx`: 홈 피드 토글(`vk-home-feed-toggle`)을 하단 내비 위로 고정(`bottom` anchor)해 중간 영역에 떠 보이는 현상 방지
- 검증
  - [x] `npm run lint`
  - [x] `npm run type-check`
  - [x] `SKIP_SITEMAP_DB=true npm run build`
  - [x] `npm run test:e2e`
  - PR: https://github.com/LEE-SANG-BOK/VKC-2-/pull/72

#### (2025-12-23) [P0] 추천 사용자/피드 액션 UI 일관화 + 우측 레일 정렬 (P0-3)

- 목표: 모바일에서 추천 사용자 카드가 “팔로우 CTA 과대/정보 구분 약함”으로 보이는 문제와, 피드 액션(댓글/좋아요 등) 숫자 폭에 따라 아이콘 위치가 흔들리는 문제를 줄이고, 3열 레이아웃(좌/중/우) 시작점 정렬을 강화
- 변경 내용
  - `src/components/organisms/RecommendedUsersSection.tsx`: 추천 사용자 카드의 아바타/팔로우 버튼을 컴팩트하게 조정 + 카드 배경을 분리해 게시글 카드와 시각적으로 구분
  - `src/components/atoms/ActionIconButton.tsx`: icon+count 버튼 폭을 고정(`tabular-nums`, `min-w`)해 동일 행에서 아이콘 위치가 흔들리지 않도록 정렬 안정화
  - `src/components/molecules/cards/PostCard.tsx`: 숨김 버튼을 본문 영역(`question-card-body`) 기준으로 배치해 미디어(썸네일) 위로 겹쳐 보이는 케이스를 최소화
  - `src/components/templates/MainLayout.tsx`: 우측 레일을 sticky로 전환해 좌측 레일과 동일한 시작점/스크롤 UX 확보
- 검증
  - [x] `npm run lint`
  - [x] `npm run type-check`
  - [x] `SKIP_SITEMAP_DB=true npm run build`
  - [x] `npm run test:e2e`

#### (2025-12-23) [P0] 피드 템플릿(모더레이션) 텍스트 숨김 + PostCard 숨김(×) 컴팩트 정렬 (P0-2/P0-3)

- 목표: 글쓰기 템플릿(조건/목표/배경) 입력값이 피드 요약(excerpt)에 노출되어 “게시글 위주” 흐름이 깨지는 문제를 줄이고, 모바일에서 PostCard 숨김(×) 버튼이 상단에 떠 보이는 컴팩트함 저하를 개선
- 변경 내용
  - `src/app/[lang]/(main)/posts/new/NewPostClient.tsx`: 템플릿 `<p>`에 `data-vk-template="1"` / spacer에 `data-vk-template-spacer="1"`을 추가(피드 요약에서 안정적으로 제거 가능)
  - `src/components/organisms/PostList.tsx`: 피드 excerpt 생성 시 템플릿 블록을 제거하고 본문만 요약(기존 템플릿 마크업도 제한적으로 호환)
  - `src/components/molecules/cards/PostCard.tsx`: 숨김(×) 버튼을 카드 우상단 absolute에서 “작성자 헤더 행” 우측으로 이동(위 여백 감소, 위치 일관성 유지)
  - `src/components/organisms/RecommendedUsersSection.tsx`: 모바일 추천 사용자 카드에서 아바타를 확대하고 팔로우 CTA 높이를 축소(세로/가로 비율 개선)
- 검증
  - [x] `npm run lint`
  - [x] `npm run type-check`
  - [x] `SKIP_SITEMAP_DB=true npm run build`
  - [x] `npm run test:e2e`

#### (2025-12-23) [P0] 홈 피드 토글 오버레이 제거 (P0-3)

- 목표: 모바일에서 홈 피드 토글(🔥 인기/🕒 최신) 오버레이가 콘텐츠를 가리거나 깜빡이는 현상을 제거하고 “게시글 위주” 첫 화면을 유지
- 변경 내용
  - `src/components/organisms/BottomNavigation.tsx`: 홈 토글 오버레이 제거(하단 탭 홈은 `/${lang}`로만 이동)
  - `src/app/globals.css`: `.vk-home-feed-toggle` 스타일 제거
- 검증
  - [x] `npm run lint`
  - [x] `npm run type-check`
  - [x] `SKIP_SITEMAP_DB=true npm run build`
  - [x] `npm run test:e2e`

#### (2025-12-23) [P0] Feedback 저장 스키마 드리프트 대응(호환 insert) (P0-3)

- 목표: 환경별 feedbacks 테이블 컬럼 드리프트(`content` vs `title/description/steps`)가 있어도 제출이 실패하지 않게 서버에서 insert를 자동 호환
- 변경 내용
  - `src/app/api/feedback/route.ts`: information_schema 기반으로 존재 컬럼을 감지하고, 해당 스키마에 맞춰 insert payload를 구성해 저장
- 검증
  - [x] `npm run lint`
  - [x] `npm run type-check`
  - [x] `SKIP_SITEMAP_DB=true npm run build`
  - [x] `npm run test:e2e`

#### (2025-12-23) [P0] ui-avatars URL 정규화(포맷/프로토콜)로 SVG/호스트 이슈 방지 (P0-3)

- 목표: `ui-avatars.com`가 기본 SVG를 반환하는 특성 때문에(Next/Image SVG 제한) URL이 프로토콜 누락/format 누락 상태로 들어와도 렌더 단계에서 PNG로 정규화해 에러를 방지
- 변경 내용
  - `src/components/atoms/Avatar.tsx`: `ui-avatars.com` URL을 `https://` + `format=png` + `size`로 정규화하고, 파싱 실패 케이스에서도 안전하게 `<img>` 경로로 처리
  - `src/app/[lang]/(main)/profile/edit/ProfileEditClient.tsx`: 프로필 이미지 프리뷰에서도 동일한 URL 정규화/`unoptimized` 분기 적용

#### (2025-12-24) [P0] PR 머지 로그(74~77) (P0-3)

- PR/머지
  - [x] PR #74 (@codex) → `main` 머지: https://github.com/LEE-SANG-BOK/VKC-2-/pull/74
  - [x] PR #75 (@codex) → `main` 머지: https://github.com/LEE-SANG-BOK/VKC-2-/pull/75
  - [x] PR #76 (@codex) → `main` 머지: https://github.com/LEE-SANG-BOK/VKC-2-/pull/76
  - [x] PR #77 (@codex) → `main` 머지: https://github.com/LEE-SANG-BOK/VKC-2-/pull/77
- 비고
  - Vercel preview는 `build-rate-limit`로 실패할 수 있음 → GH CI(`build`) 통과 시 admin override로 머지

#### (2025-12-24) [P0] Feedback/Sidebar 안정화 + Leaderboard 모바일 중복 제거 (PR #80) (P0-3)

- 목표: 피드백 제출이 DB 스키마 드리프트로 실패하지 않게 하고, 모바일에서 사이드바 토글/닫기 회귀를 Playwright로 고정하며, 커뮤니티 랭킹(leaderboard) 모바일 상단 Event 블록 중복을 제거
- 변경 내용
  - `src/app/api/feedback/route.ts`: `feedbacks` 테이블 컬럼 드리프트가 있어도 insert가 실패하지 않도록 “존재하지 않는 컬럼 제거 후 재시도” + `public.feedbacks` 고정 insert
  - `src/app/api/admin/feedback/route.ts`: admin 목록 조회도 `public.feedbacks`/`public.users`로 고정(검색/리스트 쿼리 안정화)
  - `src/components/molecules/cards/PostCard.tsx`: 숨김(×) 버튼을 카드 우상단 absolute로 고정해 미디어/비미디어 카드에서 위치가 흔들리지 않도록 안정화 + 작성자 헤더 라인 정리
  - `src/components/molecules/modals/FollowingModal.tsx`: 추천 유저 카드에서 아바타 확대 + 팔로우 버튼 높이/패딩 축소(모바일 시야성 개선)
  - `src/app/[lang]/(main)/leaderboard/page.tsx`: `mobileRightRail` 제거로 모바일 Event 섹션 중복 노출 제거(모바일은 LeaderboardClient 내 Event만 유지)
  - `src/components/organisms/Header.tsx`, `src/components/organisms/CategorySidebar.tsx`: 모바일 사이드바 토글/닫기용 `data-testid` 추가
  - `e2e/smoke.spec.ts`: `/ko/leaderboard`에서 모바일 사이드바 open/close 스모크 추가(mobile-chromium만)
- 검증
  - [x] `npm run lint`
  - [x] `npm run type-check`
  - [x] `SKIP_SITEMAP_DB=true npm run build`
  - [x] `npm run test:e2e`
- PR/머지
  - [x] PR #80 (@codex) → `main` 머지: https://github.com/LEE-SANG-BOK/VKC-2-/pull/80

#### (2025-12-24) [P0] 추천 사용자 메타(온보딩) 우선순위 보강 + 모바일 카드 컴팩트화 (P0-2/P0-3)

- 목표: 추천 사용자 카드가 모바일에서 “아바타는 작고 팔로우 버튼은 큰” 비율로 보이는 문제를 줄이고, 추천 메타(온보딩 기반)에서 실제로 “겹치는 관심사”가 우선 노출되도록 개선
- 변경 내용
  - `src/app/api/users/recommended/route.ts`: viewer 관심사도 slug resolve 대상에 포함 + interest 메타는 viewer와 겹치는 값을 우선 선택(없으면 fallback) + 메타 표시는 3개 유지
  - `src/components/organisms/RecommendedUsersSection.tsx`: 모바일에서 아바타 확대(`xl`) + 팔로우 버튼 높이/패딩 축소(텍스트 잘림/비율 개선)
  - `src/components/organisms/BottomNavigation.tsx`: 하단 고정바 배경을 `bg-white/95`, `dark:bg-gray-900/95`로 조정(콘텐츠와의 시각적 분리 강화)
- 검증
  - [x] `npm run lint`
  - [x] `npm run type-check`
  - [x] `SKIP_SITEMAP_DB=true npm run build`
  - [x] `npm run test:e2e`

#### (2025-12-24) [P0] PR 머지 로그 (PR #82) (P0-2/P0-3)

- PR/머지
  - [x] PR #82 (@codex) → `main` 머지: https://github.com/LEE-SANG-BOK/VKC-2-/pull/82

#### (2025-12-24) [P0] PostCard 숨김(×) 버튼을 작성자 헤더로 이동 (P0-3)

- 목표: 모바일에서 카드 우상단 오버레이로 인해 작성자/팔로우 영역이 눌리거나 겹치는 문제를 줄이고, PostCard 헤더 라인에서 컨트롤을 끝내도록 컴팩트화
- 변경 내용
  - `src/components/molecules/cards/PostCard.tsx`: 숨김(×)을 카드 absolute 영역에서 제거하고 작성자 헤더 우측 컨트롤로 이동(툴팁 유지) + 헤더 불필요 패딩(`pr-8`) 제거
- 검증
  - [x] `npm run lint`
  - [x] `npm run type-check`
  - [x] `SKIP_SITEMAP_DB=true npm run build`
  - [x] `npm run test:e2e`

#### (2025-12-24) [P0] PostCard 모바일 클립/세로 팽창 최소화(헤더/태그) (P0-2)

- 목표: `ko/vi` 텍스트 길이와 아이콘/버튼 조합 때문에 PostCard 상단/태그 라인이 줄바꿈되며 카드가 불필요하게 세로로 길어지는 문제를 완화
- 변경 내용
  - `src/components/molecules/cards/PostCard.tsx`
    - 작성자 헤더: 모바일은 `flex-nowrap`로 고정(`sm`부터 wrap 허용) + 팔로우 버튼 `whitespace-nowrap`로 고정
    - 태그 칩: 모바일은 1줄 유지 + 가로 스크롤(`scrollbar-hide`)로 처리(`sm`부터 wrap/overflow-visible)
- 검증
  - [x] `npm run lint`
  - [x] `npm run type-check`
  - [x] `SKIP_SITEMAP_DB=true npm run build`
  - [x] `npm run test:e2e`

#### (2025-12-24) [FE] 추천 사용자 카드 비율 개선 + 하단탭 시각 분리(불투명) (P0-2/P0-3)

- 목표: 추천 사용자 카드에서 “아바타/팔로우 버튼 비율”과 “가로 카드 폭”을 모바일에 맞게 안정화하고, 하단 고정 탭이 콘텐츠 위에 겹쳐 보이는 인상을 줄인다.
- 변경 내용
  - `src/components/organisms/RecommendedUsersSection.tsx`
    - compact 모드 카드 폭 확대(auto-cols)로 텍스트 잘림/겹침 완화
    - 아바타 크기 상향(`2xl`) + 팔로우 버튼 높이/패딩 축소(`min-h` 24px)
  - `src/components/organisms/BottomNavigation.tsx`: 배경을 불투명(`bg-white`/`dark:bg-gray-900`)으로 고정해 콘텐츠가 비쳐 보이는 겹침 인상을 완화
- 검증
  - [x] `npm run lint`
  - [x] `npm run type-check`
  - [x] `SKIP_SITEMAP_DB=true npm run build`
  - [x] `npm run test:e2e`

#### (2025-12-24) [P0] PostCard 모바일 헤더 컴팩트 + 팔로우 탭(비로그인) 추천유저 노출 (P0-3)

- 목표: 모바일에서 PostCard 헤더의 불필요한 상단 여백/정렬 흔들림을 줄이고, 팔로우 탭에서 비로그인 상태여도 추천 유저가 노출되도록(팔로우 액션은 로그인 게이트 유지) 복구
- 변경 내용
  - `src/components/molecules/cards/PostCard.tsx`
    - 작성자 헤더 정렬을 `items-center`로 통일해 “× 버튼이 과도하게 위로 뜨는” 인상 완화
    - 팔로우 텍스트/숨김(×) 크기를 모바일 기준으로 컴팩트하게 조정
  - `src/app/api/users/recommended/route.ts`: 비로그인 요청은 viewer/following 기반 가중치 없이 fallback 정렬로 추천 유저 반환(로그인 상태는 기존 개인화 유지)
  - `src/components/organisms/PostList.tsx`: 팔로우 탭은 비로그인 상태에서도 추천 유저를 fetch/렌더(팔로우 액션은 로그인 페이지로 유도)
- 검증
  - [x] `npm run lint`
  - [x] `npm run type-check`
  - [x] `SKIP_SITEMAP_DB=true npm run build`
  - [x] `npm run test:e2e`

#### (2025-12-25) [P0] 모바일 피드 터치 여유/겹침 완화 + 추천 유저 메타 노이즈 제거 (P0-3)

- 목표: 모바일에서 상단 숨김(×) 터치 여유를 확보하면서 시각적 밀도를 유지하고, 하단탭 겹침/가려짐 체감을 줄인다. 추천 유저 카드의 “저신호 메타(예: 한국어 레벨)” 노출을 제거해 핵심 정보(상황/비자/관심 주제) 중심으로 정리한다.
- 변경 내용
  - `src/components/molecules/cards/PostCard.tsx`: 숨김(×) 버튼 hit area 확장(시각 크기는 축소)으로 오탭 감소
  - `src/app/globals.css`: 모바일(`<=640px`) PostCard padding 소폭 축소로 세로 팽창 억제
  - `src/components/organisms/BottomNavigation.tsx`: `--vk-bottom-safe-offset` 84px로 상향(하단탭 높이+safe-area 여유)
  - `src/app/api/users/recommended/route.ts`: 추천 유저 `recommendationMeta`에서 `koreanLevel` 제외(상황/비자/관심 주제 우선)
  - `src/components/organisms/RecommendedUsersSection.tsx`: compact 카드 폭 계산(min/max) 안정화(초소형 뷰포트에서 잘림/비율 깨짐 방지)
- 검증
  - [x] `npm run lint`
  - [x] `npm run type-check`
  - [x] `SKIP_SITEMAP_DB=true npm run build`
  - [x] `npm run test:e2e`

#### (2025-12-25) [P0] 모바일 키보드 오버레이 완화 + 에디터 링크 삽입 안정화 (P0-3)

- 목표: iOS/Android에서 키보드가 올라와도 입력/제출 UI가 가려지지 않게 “추가 스크롤 여유”를 확보하고, 글쓰기 에디터에서 링크 추가가 빈 선택(커서만 있는 상태)에서도 항상 반영되도록 한다.
- 변경 내용
  - `src/components/organisms/BottomNavigation.tsx`
    - `visualViewport` 기반으로 `--vk-keyboard-offset`을 설정하고, 키보드 open 시 `--vk-bottom-safe-offset`을 축소(하단탭 숨김 전제)하여 과도한 패딩/겹침을 완화
  - `src/app/globals.css`
    - `.vk-safe-bottom`의 `padding-bottom` / 입력 `scroll-margin-bottom` 계산에 `--vk-keyboard-offset` 포함
  - `src/app/[lang]/(main)/posts/new/NewPostClient.tsx`, `src/app/[lang]/(main)/posts/[id]/PostDetailClient.tsx`
    - 포커스 시 `scrollMarginBottom` 계산에 `--vk-keyboard-offset` 포함
  - `src/components/molecules/editor/RichTextEditor.tsx`
    - 링크 추가 시 선택이 비어있으면 URL 텍스트 삽입 → 해당 범위 선택 → 링크 마크 적용으로 “삽입 누락” 케이스 방지
- 검증
  - [x] `npm run lint`
  - [x] `npm run type-check`
  - [x] `SKIP_SITEMAP_DB=true npm run build`
  - [x] `npm run test:e2e`

#### (2025-12-25) [P0] 모바일 메뉴 오픈 시 추천 콘텐츠 숨김 + 추천유저 where 절 안정화 + 설정 모달 버튼 클립 방지 (P0-2/P0-3)

- 목표: 모바일에서 사이드바(시트) 오픈 상태일 때 메인 상단 “추천 콘텐츠”가 뒤에서 보여 혼동되는 케이스를 방지하고, 추천유저 API의 where 절 생성이 빈 배열일 때도 안정적으로 동작하도록 보강한다. 또한 설정 모달의 “구독 관리” 버튼이 텍스트 길이(ko/vi)에서 잘리거나 정렬이 흔들리는 문제를 완화한다.
- 변경 내용
  - `src/components/templates/MainLayout.tsx`: 모바일 메뉴 오픈 시 `mobileRightRail` 렌더를 중지(메뉴 닫힘 상태에서만 노출)
  - `src/app/api/users/recommended/route.ts`: where 조건이 없는 경우 `.where(undefined)`로 안전하게 처리(빈 `and()` 호출 방지)
  - `src/components/molecules/modals/SettingsModal.tsx`: “구독 관리” 버튼 `break-words/whitespace-normal` 적용 + `self-end` 정렬로 클립/줄바꿈 대응
- 검증
  - [x] `npm run lint`
  - [x] `npm run type-check`
  - [x] `SKIP_SITEMAP_DB=true npm run build`
  - [x] `npm run test:e2e`

#### (2025-12-25) [P0] 추천 유저 카드 팔로우 CTA 컴팩트화 + 구독 토픽 칩 잘림 방지 (P0-2)

- 목표: 모바일에서 추천 유저 카드가 “팔로우 버튼 과대”로 보이며 콘텐츠 대비 UI가 무거워지는 문제를 완화하고, 구독 탭 상단 토픽 칩이 긴 라벨(ko/vi)에서 화면 끝이 잘려 보이는 케이스를 줄인다.
- 변경 내용
  - `src/components/atoms/FollowButton.tsx`: `variant="text"` 추가(텍스트형 팔로우 CTA 지원)
  - `src/components/organisms/RecommendedUsersSection.tsx`: compact 모드에서 팔로우 CTA를 텍스트형으로 전환(카드 내 시각적 무게/세로 팽창 완화)
  - `src/components/organisms/PostList.tsx`: 구독 토픽 필터 칩에 `max-w + truncate` 적용(오른쪽 잘림/과도한 가로 확장 방지)
- 검증
  - [x] `npm run lint`
  - [x] `npm run type-check`
  - [x] `SKIP_SITEMAP_DB=true npm run build`
  - [x] `npm run test:e2e`

#### (2025-12-25) [P0] 모바일 폼(회원가입/피드백) 스크롤 여유 확보 (P0-3)

- 목표: 모바일에서 키보드/주소창 변화로 레이아웃이 흔들릴 때 폼이 중앙 고정되어 “입력/제출” 동선이 불편해지는 케이스를 줄인다.
- 변경 내용
  - `src/app/[lang]/(auth)/signup/SignupClient.tsx`: 모바일에서는 `items-start`로 상단 정렬, `sm` 이상에서만 중앙 정렬(폼이 긴 경우 스크롤 접근성 개선)
  - `src/app/[lang]/(main)/feedback/FeedbackClient.tsx`: `min-h-[100dvh]` 추가로 뷰포트 단위 변화(iOS 등) 대응
- 검증
  - [x] `npm run lint`
  - [x] `npm run type-check`
  - [x] `SKIP_SITEMAP_DB=true npm run build`
  - [x] `npm run test:e2e`

#### (2025-12-25) [P0-9] 자동 스모크(Playwright) 결과 기록 (기록용)

- 목적: 수동 QA(P0-9) 수행 전, 자동 스모크에서 “기본 페이지 로드/정책”이 깨지지 않았음을 기준선으로 남긴다(실기기 QA를 대체하지 않음).
- 자동 스모크 커버리지(현재 테스트 기준)
  - 페이지 로드: about/privacy/terms/faq/feedback/leaderboard/posts/new(ko/vi/en)
  - 정책: 언어 스위치(UI에서 en 숨김 + ko↔vi 전환), robots.txt/sitemap.xml, rate limit probe 429
- 결과(최근 실행): `npm run test:e2e` → `43 passed, 2 skipped` (chromium/mobile-chromium/webkit)

#### (2025-12-26) [P0] UI 스냅샷 캡처(Playwright, opt-in)

- 목적: 홈 피드/카드 UI를 “실데이터 없이” 재현 가능한 목 데이터로 렌더링하고 스크린샷을 자동 생성한다(시각 회귀 확인용).
- 실행: `npm run test:e2e:ui`
- 산출물: `test-results/**/home-*.png`, `test-results/**/postcard-*.png`, `playwright-report/index.html`

#### (2025-12-25) [P0-2] i18n/클립 최종 스윕 (서명용 체크리스트)

- 목표: `ko/vi` 기준 “텍스트 잘림/겹침/오버플로로 인한 의미 훼손” 0 (의도된 `truncate` 제외)
- 원칙
  - 의도된 `truncate`: 제목/닉네임/태그처럼 “길이 무제한” 콘텐츠는 1~2줄 `line-clamp`/`truncate` 허용(단, `title`/tooltip 등으로 전체값 확인 가능해야 함)
  - 비의도 클립: 버튼/칩/CTA/배지/폼 라벨이 잘려서 “무슨 행동인지” 이해가 깨지면 Blocker/Major로 분류
- 점검 범위(필수, ko→vi 순)
  - 홈(피드): 카테고리 전환(인기/최신/팔로우/구독), 추천 콘텐츠(모바일), PostCard 헤더/태그/액션바
  - 검색: 검색창/자동완성/필터/결과 리스트
  - 상세: 제목/메타/배지/답변/댓글 입력 + 더보기/공유 UI
  - 글쓰기: 템플릿(선택/미선택), 에디터 툴바/링크 삽입, 제출 CTA
  - 프로필: 헤더(닉네임/배지/버튼), 탭, 빈 상태
  - 구독: 토픽/카테고리 라벨 + 구독 버튼(1~2줄 허용)
  - 알림/인증/팔로우: 리스트 아이템/버튼/배지/모달
- 종료 조건(DoD)
  - [ ] 핵심 플로우에서 `ko/vi` 기준 비의도 클립 0
  - [ ] Minor(의미 훼손 없는 시각적 어색함)만 P1로 이월 목록화

#### (2025-12-25) [P0-3] 모바일 키보드/스크롤 종료 체크리스트 (서명용)

- 목표: iOS/Android(WebView 포함 가능)에서 “입력/제출이 막히는 케이스” 0
- 공통 판정 기준
  - 키보드가 올라온 상태에서 제출 CTA가 화면 밖으로 사라져 “제출 불가”가 되면 Blocker
  - 스크롤이 잠겨 입력 폼/버튼에 접근 불가하면 Blocker
  - BottomNavigation이 폼을 가리면 Blocker(키보드 오픈 시 숨김/오프셋 적용이 전제)
- 필수 시나리오(ko 기준 → vi 기준)
  - 글쓰기: `/{lang}/posts/new` → 제목/본문 포커스 → 키보드 오픈 → 제출 버튼 접근/클릭 가능
  - 상세(질문): `/{lang}/posts/{id}` → 답변 입력 → 제출 버튼 접근/클릭 가능
  - 상세(공유글): `/{lang}/posts/{id}` → 댓글 입력 → 제출 버튼 접근/클릭 가능
  - 로그인 게이트: 비로그인 상태에서 좋아요/팔로우/글쓰기 시도 → 로그인 프롬프트/모달에서 입력/제출 가능
  - 인증/프로필 수정: `/{lang}/verification/request`, `/{lang}/profile/edit` 폼 입력/제출 가능
  - 피드백: `/{lang}/feedback` 입력/제출 가능
- 기록(증빙)
  - P0-9 리포트 테이블의 “글쓰기(키보드) / 답변·댓글(키보드)” 칸에 `OK` 또는 이슈 ID를 남김

#### (2025-12-25) [P0-9] 수동 QA 실행 순서(가이드)

- 목적: 실기기/실브라우저에서 “Blocker/Major 0”를 확인하고, Minor는 P1로 이월한다.
- 사전 조건
  - [ ] 최신 `main` 기준으로 QA (P0-9는 브랜치/환경 드리프트가 있으면 의미가 사라짐)
  - [ ] 자동 스모크(Playwright) 통과 상태 유지(`npm run test:e2e`)
- 권장 진행 순서(환경 1개당 10~15분)
  1) 홈(피드): `/{lang}` → 인기/최신/팔로우/구독 전환, PostCard 탭/숨김/좋아요/공유 동작 확인
  2) 검색: `/{lang}/search` → 입력/자동완성/결과 진입
  3) 상세: 임의 글 진입 → 답변/댓글 입력(키보드) → 제출 가능 여부
  4) 글쓰기: `/{lang}/posts/new` → 제목/본문 입력(키보드) → 제출 가능 여부
  5) 프로필/구독/알림/인증: 각 페이지 진입 + 핵심 CTA 1회씩 실행
- 기록 방식
  - 리포트 테이블: 각 칸에 `OK` 또는 이슈 ID를 기입
  - 이슈 로그: `ID / Severity / Env / URL / Steps / Expected / Actual / Screenshot / Status`

#### (2025-12-26) [TEST] Playwright 기능 플로우 + UI 스모크(스크린샷) 자동화 (P0-7)

- 목적: “지금 수정한 기능/UI”를 매번 Playwright로 재현/검증 가능한 형태로 남기고, DB 의존 없이 CI에서 돌린다.
- 변경
  - `E2E_TEST_MODE=1`에서 NextAuth 세션을 테스트 쿠키(`vk-e2e-user`)로 시뮬레이션
  - `E2E_TEST_MODE=1`에서 주요 API를 in-memory 스토어로 fallback(팔로우/좋아요/북마크/글 CRUD/추천유저/리더보드 등)
  - UI 스모크: 홈 피드 desktop/mobile 스크린샷 + 모바일에서 하단탭 겹침(assert) (`npm run test:e2e:ui`)
- 검증
  - [x] `npm run lint`
  - [x] `npm run type-check`
  - [x] `SKIP_SITEMAP_DB=true npm run build`
  - [x] `npm run test:e2e`

#### (2025-12-26) [P0] 모바일 포커스 입력 시 하단탭 숨김 + 기본 아바타 누락 경로 안전화 (P0-3)

- 목표: iOS/Android에서 키보드 오픈 감지가 불안정한 케이스에서도 입력 폼이 하단탭에 가려지지 않도록 하고, 누락된 기본 아바타 경로로 인한 Next Image 경고를 제거한다.
- 변경 내용
  - `src/components/organisms/BottomNavigation.tsx`: visualViewport 기반 감지 + focusin/focusout 기반 fallback으로 키보드 상태 판단(하단탭 숨김)
  - `src/components/atoms/Avatar.tsx`: `/default-avatar.*` sentinel은 이미지로 렌더하지 않고 fallback 처리 + verified 오버레이를 아이콘 기반으로 교체
  - `src/app/default-avatar.jpg/route.ts`, `src/app/avatar-default.jpg/route.ts`: 누락된 기본 아바타 경로 요청 시 1x1 PNG 응답(Next Image 경고 방지)
  - `e2e/functional.spec.ts`: 모바일에서 제목 입력 포커스 시 하단탭이 숨김 처리되는지 E2E로 고정
- 검증
  - [x] `npm run lint`
  - [x] `npm run type-check`
  - [x] `SKIP_SITEMAP_DB=true npm run build`
  - [x] `npm run test:e2e`

#### (2025-12-26) [P0-3] 글쓰기 로그인 프롬프트 오탐 방지 + 댓글 입력 포커스 E2E 추가 (P0-3)

- 목적: 로그인 상태에서도 세션 로딩 타이밍에 “로그인 필요” 프롬프트가 잘못 뜨는 케이스를 차단하고, 공유글 댓글 입력 포커스를 E2E로 고정한다.
- 변경
  - `src/app/[lang]/(main)/posts/new/NewPostClient.tsx`: `useSession().status` 기준으로 로그인 프롬프트 게이팅(loading 중 오탐 방지)
  - `src/lib/e2e/store.ts`: 공유글(`type=share`) seed 추가로 댓글 입력 플로우 테스트 가능하게 함
  - `e2e/functional.spec.ts`: 모바일에서 공유글 댓글 입력 포커스 시 하단탭 숨김(assert) 추가
- PR
  - https://github.com/LEE-SANG-BOK/VKC-2-/pull/103
- 검증
  - [x] `npm run lint`
  - [x] `npm run type-check`
  - [x] `SKIP_SITEMAP_DB=true npm run build`
  - [x] `npm run test:e2e`

#### (2025-12-26) [P0-2] 프로필/공지/비자 로드맵 i18n 하드코딩 제거 (P0-2)

- 목표: ko/vi 기준 하드코딩 문자열·중복 메타 로직을 제거하고, 공용 메타 빌더/번역 리소스로 일원화한다.
- 변경
  - `src/app/[lang]/(main)/profile/[id]/page.tsx`: 프로필 메타를 `buildPageMetadata`로 통일 + userType 라벨 매핑을 `getUserTypeLabel`로 공용화
  - `src/lib/seo/metadata.ts`: OpenGraph `type`에 `profile` 지원 추가
  - `src/components/organisms/NoticeBanner.tsx`: 공지 카테고리 판별을 번역 리소스(`noticeCategoryAliases`) 기반으로 변경(코드 하드코딩 제거)
  - `src/app/[lang]/guide/visa-roadmap/page.tsx`: 페이지/메타 전부 번역 리소스 기반으로 전환 + `buildPageMetadata` 적용
  - `messages/ko.json`, `messages/vi.json`: `metadata.visaRoadmap`, `visaRoadmap`, `noticeBanner.noticeCategoryAliases` 추가
- 검증
  - [x] `npm run lint`
  - [x] `npm run type-check`
  - [x] `SKIP_SITEMAP_DB=true npm run build`
  - [x] `npm run test:e2e`

#### (2025-12-26) [P0-2] 전역 홈 메타/키워드 하드코딩 제거 (P0-2)

- 목표: locale 레이아웃(`src/app/[lang]/layout.tsx`)에서 하드코딩된 홈 메타/키워드를 제거하고, 번역 리소스 기반으로 일원화한다.
- 변경
  - `src/app/[lang]/layout.tsx`: `metadata.home`/`metadata.keywords` 기반으로 title/description/keywords 구성(필요 시 ko 딕셔너리로 fallback)
- 검증
  - [x] `npm run lint`
  - [x] `npm run type-check`
  - [x] `SKIP_SITEMAP_DB=true npm run build`
  - [x] `npm run test:e2e`
