# AGENTS.md (Viet K-Connect / VietHub)

## Worktree / Workflow

- 작업 시작 전 `docs/EXECUTION_PLAN.md`의 워크트리/브랜치/품질게이트 규칙을 우선 적용한다.
- Codex CLI 환경에서 `.git/index.lock` 이슈로 `git add/commit/push`가 실패할 수 있으니, 커밋/푸시는 필요 시 로컬 터미널에서 진행한다.

## Commands

- `npm run dev` - Dev server
- `npm run lint` - ESLint
- `npm run type-check` - TypeScript check
- `SKIP_SITEMAP_DB=true npm run build` - CI/Vercel 환경용 빌드(필요 시 DB 의존 스킵)
- `npm run db:generate` - Drizzle migrations 생성
- `npm run db:migrate` - Drizzle migrations 실행

## Non-Negotiables

- **Framework**: Next.js 16 (App Router), React 19, TypeScript (strict)
- **Styling**: Tailwind CSS 4, 반응형 필수(`container` 기준)
- **Imports**: `@/*` alias 사용(예: `@/components/*`, `@/lib/*`)
- **Components**: ATOMIC( `src/components/atoms|molecules|organisms|templates` ), default export
- **API**: 서버 액션 금지. `src/app/api/**` API routes만 사용
- **Repo 구조**: `src/repo/<domain>/{fetch,query,mutation,types}.ts`
- **Data Fetching**: TanStack Query, query keys는 `src/repo/keys.ts`에서 중앙 관리
- **i18n**: ko/en/vi, `messages/*.json` 키 동기화 유지
- **Comments**: 명시 요청 없으면 추가하지 않음

## SSR / Data

- 리스트/글/프로필은 SSR/SSG(ISR)로 최초 HTML을 제공하고, TanStack Query는 `HydrationBoundary`로 하이드레이션한다.
- 페이지네이션은 무한 스크롤만 쓰지 말고 정상 URL 구조/순차 링크를 제공한다.

## SEO

- `generateMetadata`로 title/description/canonical/OG/Twitter + locale alternates를 라우트별로 관리한다.
- `src/app/sitemap.ts` / `src/app/robots.ts`로 자동 생성한다.
- 내부 검색/프리뷰 등은 `noindex` 처리한다(robots.txt 차단이 아님).
- JSON-LD: 글은 `DiscussionForumPosting`, 프로필은 `ProfilePage`.
- UGC 외부 링크는 기본 `rel="ugc"`(필요 시 `nofollow`/`sponsored` 추가).
- CWV 목표: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1(75퍼센타일 기준).

## Architecture

- Supabase + Drizzle ORM
- NextAuth v5
- Magic UI primitives: `src/components/ui/**`

## Codex Skills (Optional)

- GitHub PR CI 실패( GitHub Actions ) 분석/수정: `$gh-fix-ci`
- GitHub PR 리뷰 코멘트 대응: `$gh-address-comments`
- 프롬프트 템플릿/규칙은 `docs/EXECUTION_PLAN.md`와 `HANDOVER.md`의 “Codex CLI 스킬 프롬프트” 섹션을 따른다.
