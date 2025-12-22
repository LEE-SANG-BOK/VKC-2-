# Engineering Guidelines

## Code Splitting Rules
- Prefer `next/dynamic` for heavy UI (modals, editors, charts).
- Do not import locale bundles at module scope; use runtime `Intl` where possible.
- Avoid large date libs in always-mounted components; use small formatters.
- Keep headers/layouts free of heavy logic; move to child components.

## Mobile QA Checklist (WebView/Keyboard/100dvh)
- Verify safe-area insets on iOS/Android (bottom bars and keyboards).
- Inputs should scroll into view on focus; avoid hidden submit buttons.
- Check `100dvh`/`svh` layout stability with dynamic address bars.
- Ensure fixed headers/footers do not overlap content during keyboard open.

## i18n Length Rules
- Avoid fixed widths for labels; prefer `min-w-0` + wrap/truncate.
- Allow wrap for ko/vi on small screens; use `line-clamp` sparingly.
- Reserve space for CTAs by using `flex` gaps and `whitespace-nowrap` only when needed.

## Accessibility Checklist
- Icon-only buttons must include `aria-label`.
- Focus states must be visible (`focus-visible` ring).
- Avoid relying on color only for status; include text or icon labels.

## Atomic Structure
- Atoms: pure UI primitives (Button, Badge, Input).
- Molecules: combinations of atoms with light logic.
- Organisms: page-level sections (lists, headers, rails).
- Templates: layout wrappers and page shells.

## Admin Module Boundaries
- Admin UI routes: `src/app/admin/**`
- Admin data access: `src/repo/admin/**`
- Admin-only helpers: `src/lib/admin/**`

## Task Intake / Done Criteria

- 프로젝트 공통 프롬프트/워크플로우 규칙(SoT): `docs/CODEX_PROMPT_PROTOCOL.md`
- 구현 전 반드시 고정할 것
  - Scope(In/Out) + Non‑negotiables + Done(acceptance criteria)
  - 변경 리스크(문서/FE/BE/DB) 등급과 검증 게이트(`lint/type-check/build/e2e`)
