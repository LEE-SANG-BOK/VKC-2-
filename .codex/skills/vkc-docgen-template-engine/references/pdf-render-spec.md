# PDF renderSpec (reference)

Purpose: map normalized fields → PDF overlay instructions.

## Recommended shape (renderSpecJson)

- `background`:
  - `assetPath`: path to a background PDF/image (versioned)
- `pages`: list of pages with draw instructions
- `draw`: list of primitives:
  - `text`: `{ fieldKey, x, y, fontSize, maxWidth, align? }`
  - `checkbox`: `{ fieldKey, value, x, y }`

## Notes

- Keep it deterministic: no “auto layout” heuristics in v1.
- Version renderSpec with the same cadence as the official form updates.

