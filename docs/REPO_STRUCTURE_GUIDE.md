# Repo Structure Guide (Viet K-Connect)

목표: 폴더/컴포넌트 중복을 줄이고, 병렬 작업 시 충돌을 최소화하며, 신규 기능을 “어디에 어떻게 추가할지”를 빠르게 결정한다.

---

## 1) 레이어(역할) 요약

### `src/app/**`
- Next.js App Router 라우트(페이지/레이아웃).
- 데이터는 **Server Actions 없이** `/api/**` + `src/repo/**`(TanStack Query)로 연결한다.
- 리스트/상세/프로필 등 SEO가 중요한 화면은 SSR/SSG(ISR) + HydrationBoundary 패턴을 유지한다.

### `src/app/api/**`
- 서버 액션 대신 사용하는 API Routes.
- 도메인별로 “한 엔드포인트가 한 책임”을 갖도록 쪼개고, 개인화/캐시 정책 충돌이 없도록 설계한다.

### `src/repo/**`
- 클라이언트 데이터 레이어(HTTP 호출 + TanStack Query).
- 폴더 구조 고정: `src/repo/[domain]/(fetch.ts, mutation.ts, query.ts, types.ts)`
- Query keys는 `src/repo/keys.ts`에서만 정의한다.

### `src/lib/**`
- 순수 유틸/검증/DB/상수/서버 공용 로직.
- DB 스키마/마이그레이션: `src/lib/db/**`
- UGC 검증: `src/lib/validation/**`

### `src/components/**` (User/Admin 공용)
- ATOMIC 구조: `atoms/`, `molecules/`, `organisms/`, `templates/`
- “페이지 전용 컴포넌트”가 늘어나면 templates/organisms에 배치하고, 재사용이 확실할 때만 atoms/molecules로 내린다.
- import는 `@/components/*` 경로를 사용하고, `../` 상위 상대경로 import는 금지(ESLint로 방지).

### `src/components/ui/**` (shadcn/Magic UI)
- Radix 기반 프리미티브/복합 컴포넌트.
- Admin 대시보드에서 주로 사용하되, User 화면에서도 “프리미티브(예: sheet/dialog)”는 허용한다.

---

## 2) 중복 방지 규칙(필수)

### Button/Badge 등 “기본 UI” 중복
- **User UX(다국어/브랜드/상태)**가 얹힌 컴포넌트는 `src/components/atoms/**`에 둔다. (예: `atoms/Button`, `atoms/Tooltip`)
- **Radix/shadcn 프리미티브**는 `src/components/ui/**`에 둔다. (예: `ui/sheet`, `ui/dialog`)
- 같은 의미의 컴포넌트를 2개 만들기보다, 필요하면 “프리미티브(ui) → 브랜드 래퍼(atoms)”로 감싼다.

### 페이지 전용 컴포넌트 확장
- `src/app/[route]/` 안에만 존재하는 UI가 커지면, 먼저 `templates/` 또는 해당 도메인 전용 `organisms/`로 분리한다.
- “다른 화면에서도 재사용될 때만” molecules/atoms로 승격한다.

---

## 3) i18n/텍스트 규칙(필수)

- 화면에 보이는 문자열은 `messages/{ko,en,vi}.json` 기반으로 제공한다.
- 임시 fallback 문자열을 코드에 넣어야 한다면, ko/en/vi 3개 언어를 동시에 제공하거나, 빠르게 메시지 키로 승격해 혼용(ko/vi 섞임)을 방지한다.

---

## 4) 병렬 작업 충돌 방지(요약)

- 문서/번역: `docs/EXECUTION_PLAN.md`, `HANDOVER.md`, `messages/*.json`는 Agent Lead만 수정한다.
- DB 스키마/마이그레이션: `src/lib/db/schema.ts`, `src/lib/db/migrations/**`는 단일 소유(동시 수정 금지).
