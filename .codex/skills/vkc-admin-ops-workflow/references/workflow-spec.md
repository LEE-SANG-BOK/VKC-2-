# Admin ops workflow spec (VKC)

Use this as the default “ops backbone” for:

- Regulation/ruleset updates
- Visa transition rules updates
- Doc template version activation
- News/announcements scheduling

## Minimal data model

- `status`: `draft | in_review | scheduled | published | archived`
- `startAt` / `endAt` for schedule windows (optional)
- `isActive` boolean for simple toggles

## Minimal admin actions

- Create draft
- Edit draft
- Move to review
- Activate/publish (optionally schedule)
- Deactivate/archive

Keep the public side read-only and derived from active + schedule filtering.

