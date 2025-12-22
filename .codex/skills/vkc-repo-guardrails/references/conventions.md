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
