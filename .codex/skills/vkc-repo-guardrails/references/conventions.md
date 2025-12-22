# Conventions checklist (practical)

## API routes

- Public routes prefer `@/lib/api/response` helpers (`successResponse`, `errorResponse`, `rateLimitResponse`, ...)
- Admin routes use `getAdminSession` and usually return `NextResponse.json(...)` directly.
- Validate `request.json()` defensively; avoid trusting unknown shapes.

## Database

- Define tables/enums/indexes in `src/lib/db/schema.ts`.
- Generate migrations via `npm run db:generate` and apply via `npm run db:migrate` (LEAD runs commits).
- **Ruleset/template must be DB-driven**: visa assessment rules + doc templates live in tables, not hardcoded in TS.

## i18n

- Add keys to `messages/ko.json` and `messages/vi.json` in the same change.
- `en` is allowed to be partial because the app falls back to `ko` for missing keys (see `src/i18n/get-dictionary.ts`).
- Run: `bash .codex/skills/vkc-repo-guardrails/scripts/lint-i18n-keys.sh`

## Secrets

- Never paste API keys into chat, code, or committed files.
- Use environment variables (e.g. `OPENAI_API_KEY`) and local config files outside git (e.g. `~/.codex/config.toml`).

## Planning / Prompt Protocol

- 작업 시작 전 “Task Intake → Done 기준”을 먼저 고정한다: `docs/CODEX_PROMPT_PROTOCOL.md`
- 질문하기 전에 `AGENTS.md` + `docs/EXECUTION_PLAN.md` + `docs/WORKING_PLAN.md`를 먼저 확인하고, `rg`로 기존 패턴/근거를 찾는다.
