# Architecture pointers (Viet K-Connect)

This repo is Next.js 16 (App Router) + React 19 + TS strict with:

- **API only** backend entrypoints: `src/app/api/**` (no Server Actions)
- **DB**: Drizzle (`@/lib/db`, `@/lib/db/schema`)
- **Client data**: TanStack Query + `src/repo/**` + `src/repo/keys.ts`
- **i18n**: `messages/{ko,en,vi}.json`

Canonical implementations you can mirror:

- User API patterns: `src/app/api/reports/route.ts`, `src/app/api/events/route.ts`
- Admin API patterns: `src/app/api/admin/news/route.ts`
- Admin scheduling example (start/end): `src/lib/db/schema.ts` (`news` table) + `src/app/api/news/route.ts`

Primary “rules of the road”:

- `AGENTS.md`
- `docs/EXECUTION_PLAN.md`
- `docs/REPO_STRUCTURE_GUIDE.md`

