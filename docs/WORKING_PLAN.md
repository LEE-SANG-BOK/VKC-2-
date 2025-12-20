# WORKING_PLAN

본 문서는 현재 코드/문서 현황을 기준으로 “무엇을 언제(P0/P1/P2)까지 닫을지”를 고정한다. 구현 단위는 기능(도메인) 기준으로 쪼개고, Hot File 충돌을 피하며, 릴리즈 게이트(Playwright/Rate limit)를 P0에서 확정한다.

## Plan (요약)

- P0(출시 전)은 “실데이터/SEO 정합 + 모바일 UX + 신뢰(인증/배지) + 운영도구(계측/방어) + 필수 자동화(Playwright/Rate limit)”를 닫는 데 집중한다.
- P1은 안정화/유지보수 체계(테스트 확장, Admin 정리, 모니터링), P2는 스케일/확장(캐시/레플리카/플래그/CMS/추천 고도화)로 분리한다.
- 추가 정책: `en`은 웹 UI에서 숨김(언어 스위치/노출 동선 제거)하되, 기존 `en` 페이지/번역은 삭제하지 않고 SEO 노출은 유지한다. 앞으로 신규 작업은 `en` 번역 추가/검수는 하지 않음(단, 페이지 렌더가 깨지지 않도록 fallback은 보장).

## Policy decisions (확정)

- AI 번역/챗봇: 도입/PoC 모두 제외
- Language: UI 노출 로케일 = `ko/vi`, SEO 로케일 = `ko/en/vi` (예: `src/app/sitemap.ts`, `src/app/[lang]/layout.tsx`의 alternates는 유지)
- i18n: 신규 작업은 `en` 번역 키를 추가/검수하지 않음, `en` 렌더는 `ko` fallback으로 깨짐 방지
- E2E: Playwright 필수(릴리즈 게이트에 포함)
- Abuse 방어: Rate limit 필수(주요 쓰기 API에 적용)

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
| P0-10 | Lead | Web Feature, BE | Shared(API/DB) | 가이드라인 동의 v1 + 작성 게이팅 | 최초 1회 동의 기록 + 미동의 상태에서 작성 시 안내/차단 |

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

### P2(확장/성장) 또는 보류

- 미션/랭크/게이미피케이션(장기 ROI는 높지만 MVP 범위 초과 가능)
- 숏폼/카드뉴스 등 멀티미디어 UGC 확장(운영/모더레이션 부담이 커 단계적 추진)
- 실시간(WebSocket) 고도화, 대규모 검색/추천(트래픽/데이터 축적 이후)

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

## P0 (출시 전: Launch blocking)

### P0-0 운영/병렬 규칙 고정 (Lead)

- 목표: Hot File 충돌/번역키 충돌/통합 타이밍 문제를 구조적으로 차단
- 작업
  - Hot File 단일 소유 재확인: Header/MainLayout/PostList/globals.css는 Lead만 머지
  - i18n 키 추가 담당 1인 지정(Lead 권장): `messages/ko.json`, `messages/vi.json`만 의무
  - 통합 윈도우/릴리즈 게이트 고정: lint/type-check/build + Playwright 통과 후만 머지
- 완료 기준: `docs/EXECUTION_PLAN.md`에 “잠금/소유/게이트”가 1페이지 요약으로 반영

### P0-1 en UI 숨김 + SEO 유지 (Lead + Web Feature)

- 목표: 사용자는 `ko/vi`만 보되, 검색엔진은 `en` URL을 계속 발견/색인 가능
- 작업(핵심 파일 힌트)
  - UI: 언어 스위치에서 `en` 제거(예: `src/components/atoms/LanguageSwitcher.tsx`에 UI_LOCALES = `['ko','vi']`)
  - SEO: `src/app/sitemap.ts`의 locales = `['ko','en','vi']` 유지
  - Metadata: `src/app/[lang]/layout.tsx`의 alternates.languages에 `en` 유지
  - Fallback: 앞으로 `en` 번역을 추가하지 않아도 렌더가 깨지지 않게 dictionary 로딩 단계에서 `ko` 기반 fallback 병합
- QA
  - UI에서 언어 선택에 `en`이 보이지 않음
  - 직접 URL `/en/...` 접근 시 페이지 렌더/메타 alternates/sitemap의 `en` 노출 유지

### P0-2 i18n 전수 점검(ko/vi) + 텍스트 길이/클립 제거 (Design Front + Web Feature)

- 목표: 출시 직전 가장 많이 터지는 “베트남어 길이/하드코딩/번역 누락/클립” 제거
- 작업
  - 하드코딩 문자열 제거(CTA/배지/툴팁/에러/빈상태 우선) → `ko/vi` 키로 통일
  - “클립” 패턴 수정: `min-w-0`, `break-words`, `flex-wrap`, padding 기반 버튼, 긴 라벨은 2줄 허용(의도된 `truncate` 제외)
  - 신규 작업부터 `en` 키 추가/검수는 하지 않되, `en` 렌더 fallback 병합으로 깨짐 방지
- 완료 기준: 핵심 플로우(홈/검색/상세/글쓰기/프로필/구독/알림/인증/피드백)에서 `ko/vi` 기준 “텍스트 잘림 0(의도된 truncate 제외)”

### P0-3 모바일 키보드/스크롤(WebView 포함) UX 하드닝 (Design Front)

- 목표: iOS/Android에서 입력 폼이 키보드에 가려지거나 스크롤이 잠기는 문제 제거
- 작업
  - 글/답변/댓글/모달 입력에서 safe-area + `100dvh` + overflow 처리 점검
  - “키보드 올라옴 → 제출 버튼 접근 가능”을 종료 조건으로 맞춤(로그인 모달 포함)
- 완료 기준: iPhone SE급에서도 입력/제출이 막히지 않음

### P0-4 퍼포먼스 1차(저사양/저속) (Design Front + Web Feature)

- 목표: 초기 로딩/스크롤 체감 개선(이미지/무거운 UI 중심 + 불필요 API 호출 감소)
- 작업
  - 이미지 표준화: 피드/썸네일을 공용 컴포넌트로 통일하고 `next/image`의 `sizes`/lazy/placeholder 규격화(과한 해상도 요청 방지)
  - 코드 스플리팅: 에디터/모달/관리자/리더보드 등 무거운 컴포넌트 `dynamic import` 확대
  - Query 튜닝: 알림/모달/드로어/탭 등 “열렸을 때만” 요청(`enabled`), 불필요 refetch 제거, 적정 `staleTime` 설정
- 완료 기준: 저속 네트워크에서 첫 인터랙션 체감 개선 + “불필요 백그라운드 요청”이 발생하지 않음

### P0-5 A11y 최소 기준(출시 차단만) (Design Front)

- 목표: 아이콘 버튼/내비/모달 접근성 결함으로 인한 이탈 방지
- 작업
  - 아이콘-only 버튼 `aria-label` 전수(예: 네비/카드 액션/헤더)
  - 포커스 링/키보드 탭 이동/대비 기본 점검(치명 항목만)
- 완료 기준: 주요 화면에서 “무라벨 버튼 0”

### P0-6 Rate limit 필수 적용(쓰기 API 우선) (BE + Web Feature)

- 목표: 스팸/남용 방어(출시 직후 가장 흔한 장애 요인)
- 작업
  - 공용 rate limit 유틸 설계(스토리지 포함): Redis/KV 우선, 로컬/개발 환경은 in-memory fallback(환경변수 on/off)
  - 적용 우선순위(필수): 글/답변/댓글/신고/피드백/인증 요청 + 비용 큰 읽기(검색/키워드 추천 등)
  - 429 응답 규격 통일 + 프론트 UX 처리(토스트/재시도 안내, `Retry-After` 준수)
- 완료 기준: 지정된 엔드포인트에서 임계치 초과 시 429 + 클라이언트 UX 처리 완료

### P0-7 Playwright 필수 도입(릴리즈 게이트) (Lead + Web Feature)

- 목표: 최소 자동화로 “깨짐”을 배포 전에 잡는다
- 작업
  - Playwright 설정/스크립트 추가(`test:e2e` 등) + 릴리즈 게이트에 포함
  - 브라우저: Chromium + WebKit(iOS 대체) + 모바일 viewport 1종
  - 스모크 시나리오(로그인 없이 가능한 범위 우선)
    - 홈 로드/언어(ko↔vi) 전환
    - 검색 페이지/상세 진입
    - 글쓰기 시도 → 로그인 모달/게이팅 동작 확인
    - Rate limit 429 동작(테스트 가능한 조건/엔드포인트 포함)
- 완료 기준: “릴리즈 전 필수로 돌리는 Playwright 스모크”가 문서/CI에 고정되고, 실패 시 배포 중단

### P0-8 핵심 지표 이벤트 정의 + 수집 v1 (Lead + BE + Web Feature)

- 목표: 출시 후 의사결정/운영이 가능한 최소 계측
- 작업
  - 이벤트 목록/필드/트리거 정의(DAU, 질문/답변/댓글, 채택/해결, 신고, 인증 신청, 구독/알림 등)
  - `/api/events` 수집 + 저장(크기 제한/개인정보 최소화/검증)
  - 클라이언트는 핵심 트리거에만 연결(실패해도 UX 영향 0)
- 완료 기준: 이벤트가 실제 적재되고(샘플 확인), “볼 지표”가 합의됨

### P0-9 크로스브라우징/반응형 QA 라운드 (Lead + Design Front)

- 목표: iOS Safari/Android Chrome/Edge에서 치명 레이아웃/입력 결함 제거
- 작업: iPhone SE~태블릿까지 체크리스트 기반 수동 QA(스크린샷/재현 스텝 기록)
- 완료 기준: Blocker/Major 0, Minor는 P1 이월 목록화

### P0-10 신규 사용자 가이드라인 동의 v1 (Lead + Web Feature + BE)

- 목표: “신뢰 기반 커뮤니티” 규칙을 신규 유저에게 강제 인지시키되, 반복 노출/과도한 마찰은 피한다
- 반영 범위(권장 v1)
  - 최초 1회 동의(규칙 체크박스 + 스크롤 확인) → 동의 시점/버전 저장
  - 미동의 상태에서 글/답변/댓글 작성 시 “동의 필요” 안내 + 진행 동선 제공(작성 차단/보류 정책은 합의)
  - “다시 보지 않기”는 동의 완료 상태에서만 제공(미동의 우회 방지)
- 구현 힌트
  - 데이터: `users`에 `community_guidelines_accepted_at`, `community_guidelines_version`(또는 별도 테이블) 추가
  - UI: 첫 로그인/온보딩 완료 직후 또는 첫 작성 시점에 모달로 노출(현재 온보딩 플로우와 충돌 없이 1회만)
  - API: 글/답변/댓글 라우트에서 “동의 여부”를 확인하고 공통 에러 코드로 응답
- 완료 기준
  - 신규 유저가 1회 동의하면 이후 반복 노출 없음
  - 미동의 상태에서 작성 시도 시 UX가 명확하고, 서버에서도 정책이 일관됨

### P0 Exit criteria

- UI에서 언어 선택은 `ko/vi`만 보임, `/en/*` 직접 접근 및 sitemap/alternates의 `en` 노출은 유지
- Rate limit 적용 엔드포인트에서 429가 동작하고, 클라 UX가 깨지지 않음
- Playwright 스모크가 릴리즈 게이트로 고정되고 항상 통과
- 모바일 입력/키보드 이슈로 “작성 불가” 케이스 0
- `ko/vi` 기준 텍스트 클립/하드코딩이 핵심 화면에서 0(의도된 `truncate` 제외)
- 가이드라인 동의가 1회 동작하고(버전/시점 저장), 미동의 작성 차단/안내가 일관됨

---

## P1 (출시 직후 1~2 스프린트: 안정화/유지보수)

- P1-1 Playwright 커버리지 확장: 로그인/작성/채택/구독/알림 핵심 플로우(필요 시 test-only auth 전략은 “프로덕션 비활성” 전제로)
- P1-2 Rate limit 고도화: 정책 세분화(엔드포인트별/유저별), 오탐 대응, CAPTCHA 옵션 검토
- P1-3 Admin 모듈 정리: admin 관련 유틸/타입/쿼리 경계 정리 + 페이지네이션/성능 일관화
- P1-4 운영 모니터링/Runbook 강화: 오류율/응답시간/DB 지표 알림 + 장애 대응/롤백 절차 리허설
- P1-5 디자인/컴포넌트 가이드: atoms/molecules/organisms 분류 기준/예시, 로딩/빈상태/에러 상태 표준화(Storybook은 선택)
- P1-6 온보딩 개인화(선택): 관심사/상태 수집 → 추천/피드/구독 초기값에 반영(데이터 모델 합의 후)
- P1-7 신뢰/전환 고도화(선택): 채택 리마인드, 팔로우 유도, 프로필 지표(채택률/도움된 답변 수) 노출
- P1-8 출처 표기(선택): 답변 작성 시 출처/날짜 필드 + 본문 하단 렌더, UGC 링크 정책(`rel="ugc"`) 문서화
- P1-9 모더레이션 자동화 고도화(권장): 룰 기반(금칙어/연락처/링크) 강화 + 신고 누적(신뢰 가중) 자동 숨김 + 관리자 리뷰 큐/복구
- P1-10 튜토리얼/리마인드(선택): 짧은 투어 슬라이드(검색/좋은 질문/좋아요/채택) + 공지/알림으로 분기별 리마인드 + 배지(선택)

---

## P2 (확장 단계: 스케일/성장)

- P2-1 캐시/스케일: Redis/KV 캐시, Supabase read replica 기준선/알람, 고빈도 조회 API 최적화
- P2-2 Feature Flag: 점진 릴리즈/실험 체계
- P2-3 CMS 도입 판단: 공지/가이드/뉴스 운영량 기준으로 “현 admin 유지 vs CMS”
- P2-4 추천/분석 고도화: 상호작용 데이터 모델(좋아요/스크랩/조회) + 룰/배치/캐시
- P2-5 미션/랭크/콘텐츠 확장(선택): 운영 리소스와 모더레이션 체계가 갖춰진 이후 단계적으로 추진
- P2-6 (선택) AI 모더레이션/유사질문 임베딩: 외부 AI 의존성/비용/오탐을 감안해 “룰 기반+운영 큐”가 안정화된 뒤에만 검토

---

## Testing and validation (게이트)

- 공통: `npm run lint` → `npm run type-check` → `SKIP_SITEMAP_DB=true npm run build`
- 필수: Playwright 스모크 통과
- 필수: Rate limit 동작 확인(429 + UX 처리)
- 수동: P0-9 크로스브라우징 체크리스트 완료
