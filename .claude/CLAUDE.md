# Claude Project Instructions

Read `.ai/global-architecture-principles.md` before changing code or documentation.

## Required Behavior

- Preserve the feature-oriented clean architecture.
- Do not write production app code before Phase 0 documents and ADRs are accepted.
- Keep domain logic independent from React, browser APIs, Zustand, workers, and FFmpeg.
- Use typed ports for infrastructure dependencies.
- Add or update tests with every implementation change.
- Add or update ADRs for non-trivial architecture decisions.
- Never introduce server-side audio processing or upload behavior.

## Review Mode

When asked to review, prioritize bugs, architectural violations, privacy risks, accessibility gaps, performance risks, and missing tests.
