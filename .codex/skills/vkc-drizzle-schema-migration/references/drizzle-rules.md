# Drizzle rules (VKC)

## Table design for “data-driven engines”

### Visa rulesets (P1)

- Store as rows with versioning + effective dates:
  - `visa_catalog`
  - `visa_transition_rules` (fromVisa/toVisa + ruleset JSON + version + effectiveFrom + status)
  - `visa_assessment_models` (weights/mapping JSON + version + status)

### Document templates (P1)

- Store as rows with versioning:
  - `document_templates` (schemaJson + renderSpecJson + version + isActive)
  - `generated_documents` (history + storage path)

### Regulation knowledge updates (P2)

- `immigration_sources` (allowlist)
- `immigration_source_snapshots` (hash + fetchedAt + raw/attachment path)
- `immigration_rulesets` (structured JSON + version + status)

## Naming

- Tables: `snake_case`
- Columns: `snake_case`
- IDs: prefer UUID primary keys for externally referenced records.

## Migration hygiene

- Keep migrations small and purpose-scoped.
- Never edit existing migration files after they are shared.

