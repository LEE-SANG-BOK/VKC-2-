# i18n UI safety (ko/vi)

Vietnamese often expands longer than Korean. Prefer resilient layouts:

- Flex rows: put `min-w-0` on the text wrapper, and `shrink-0` on icons.
- Long labels: `break-words` or `whitespace-pre-line`.
- Fixed CTA areas: ensure bottom safe-area padding and prevent overlap.
- Tables/cards: cap text with `line-clamp-2` / `line-clamp-3` when needed.

If a component breaks only in `vi`, fix the layout rather than shortening translations.

