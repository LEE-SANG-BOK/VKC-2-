---
name: vkc-docgen-template-engine
description: Design and implement the Viet K-Connect document generation template engine (DB-driven wizard schema + PDF renderSpec + history + Storage upload). Start with 2 templates and scale linearly to 50 without hardcoding.
metadata:
  short-description: Docgen template engine (DB-driven)
---

# VKC Docgen Template Engine (P1)

## Goal

Generate official-form PDFs (starting with unified application + S-3) from:

- template schema (wizard fields/steps/i18n labels)
- renderSpec (PDF mapping)
- deterministic generator + storage history

## Non‑negotiable

- Templates are **data-driven**:
  - template schema and renderSpec stored in DB (versioned)
  - code is a stable renderer/evaluator

## Core data model (minimum)

- `document_templates`: `(docType, purpose, version, schemaJson, renderSpecJson, isActive)`
- `generated_documents`: history + `filePath` + `normalizedFieldsJson` + timestamps
- Storage: Supabase private bucket + signed URL download

## Schemas / specs

- Template schema JSON:
  - `.codex/skills/vkc-docgen-template-engine/references/template-schema.json`
- PDF renderSpec reference:
  - `.codex/skills/vkc-docgen-template-engine/references/pdf-render-spec.md`

## Integration points

- UI uses **WizardKit** and drives fields from `schemaJson`.
- API route `POST /api/documents/generate`:
  - auth + 1/day limit
  - load active template
  - validate payload
  - render PDF
  - upload to private storage
  - save history row

