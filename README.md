# Viet K-Connect (VietHub)

베트남 사용자를 위한 한국 Q&A 커뮤니티입니다. 비자/취업/생활 정보를 신뢰 기반으로 공유하는 것을 목표로 합니다.

## Tech Stack

- Next.js 16 / React 19 / TypeScript (strict)
- Tailwind CSS 4
- Supabase + Drizzle ORM
- TanStack Query
- NextAuth v5
- i18n: ko/en/vi (`messages/*.json`)

## Commands

```bash
npm run dev
npm run build
npm run lint
npm run db:generate
npm run db:migrate
```

## Project Structure

- `src/app/[lang]/**`: 다국어 라우트(App Router)
- `src/app/api/**`: API routes only (server actions 금지)
- `src/repo/**`: TanStack Query fetch/mutation/query/types
- `src/repo/keys.ts`: query key 중앙 관리
- `src/components/atoms|molecules|organisms|templates`: ATOMIC 디자인 컴포넌트
- `src/components/ui/**`: Magic UI 기반 공용 프리미티브
- `src/lib/db/**`: Drizzle schema/migrations
- `messages/*.json`: ko/en/vi 번역 리소스

## Data & SEO

- 리스트/상세/프로필은 SSR + `HydrationBoundary` 사용
- `generateMetadata`로 title/description/OG/Twitter 관리
- JSON-LD: 글=DiscussionForumPosting, 프로필=ProfilePage

## Conventions

- `@/` alias 사용
- 서버 액션 금지, API routes만 사용
- UI/데이터 변경 시 i18n 키 동기화 필수
- LanguageSwitcher는 ko/vi만 노출, en은 유지하되 UI에서 숨김
- 리더보드는 사이드바 메뉴로 접근(홈 상단 프리뷰 없음)

## Codex Skills (Optional)

Codex CLI에서 GitHub PR 작업을 빠르게 처리하기 위한 스킬입니다(설치된 환경에서만 사용 가능).

### PR CI 깨짐 분석/수정: `gh-fix-ci`
```text
$gh-fix-ci
repo: .
pr: <PR 번호 또는 URL>
```

### PR 리뷰 코멘트 대응: `gh-address-comments`
```text
$gh-address-comments
repo: .
pr: <PR 번호 또는 URL>
```

자세한 진행 규칙/제약은 `docs/EXECUTION_PLAN.md`와 `HANDOVER.md`의 “Codex CLI 스킬 프롬프트” 섹션을 따른다.
