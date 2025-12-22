# Wizard UI spec (VKC)

## Layout

- Container width follows Tailwind `container` conventions.
- Bottom CTA bar:
  - fixed to viewport bottom
  - includes safe-area padding (iOS home indicator)
  - never overlays essential form fields (provide bottom padding in scroll area)

## Draft persistence

- Save after each step change and on field blur.
- Key strategy:
  - `vkc:wizard:<wizardId>:<userId>` (or `anon` if no user)
- Clear draft on successful submit.

## Validation

- Runtime validation is required before moving forward.
- If Zod is introduced, validation schema lives next to the wizard feature and drives:
  - step required fields
  - final submit payload validation

## Event logging

- POST `/api/events` on:
  - wizard open (view)
  - step complete
  - submit success/failure
- Use existing allowlists in `src/app/api/events/route.ts` (extend only if necessary).

