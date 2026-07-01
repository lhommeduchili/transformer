# Browser-Based DJ Audio Preparation Tool

This repository is being bootstrapped as a production-grade, browser-native audio preparation tool for DJ music libraries.

The product principle is local-first processing: audio files must never be uploaded to a server. Conversion, validation, reporting, and audit logging are designed to run in the browser using worker-isolated WebAssembly-based FFmpeg.

## Current Phase

Phase 11: production readiness.

The project now has a Vite, React, TypeScript, test, lint, build, E2E, and architecture-check scaffold plus pure domain models, local file import, browser capability detection, mock inspection, AIFF-first DJ presets, compatibility validation, filename sanitization, output filename previews, queue planning, queue controls, worker-isolated FFmpeg.wasm conversion infrastructure, output folder selection, download fallback writing, real conversion-to-output executor wiring, preserved text metadata/artwork for DJ-safe AIFF/MP3 outputs, local JSON conversion reports, UX hardening for recovery, control guidance, keyboard flow, and progress announcements, performance guardrails for large batch planning/reporting and active-file-only conversion reads, and production readiness checklists for release validation.

## Primary Documents

- `.ai/`: shared rules for all AI-assisted development tools.
- `.antigravity/rules/`: Antigravity-specific project rules.
- `.claude/CLAUDE.md`: Claude project instructions.
- `.gemini/GEMINI.md`: Gemini project instructions.
- `.chatgpt/instructions.md`: ChatGPT project instructions.
- `docs/product/prd.md`: product requirements document.
- `docs/architecture/system-architecture.md`: system architecture.
- `docs/architecture/domain-model.md`: domain model.
- `docs/architecture/processing-pipeline.md`: conversion pipeline.
- `docs/testing/testing-strategy.md`: testing strategy.
- `docs/operations/project-handoff.md`: current state, key files, known limitations, and next work.
- `docs/operations/production-readiness.md`: release-readiness checklist.
- `docs/operations/manual-release-test.md`: manual release test script.
- `docs/adr/`: architectural decision records.

## Non-Negotiable Constraints

- TypeScript everywhere.
- Strict TypeScript mode.
- No audio uploads.
- No business logic in UI components.
- Domain layer must remain framework-independent.
- Long-running processing must be cancellable, observable, and recoverable.
- Browser memory pressure must be treated as a first-class design constraint.
- Accessibility, privacy, and testability are product requirements.

## Development Commands

- `npm run dev`: start local development server.
- `npm run format:check`: check formatting.
- `npm run typecheck`: run TypeScript project checks.
- `npm run lint`: run ESLint.
- `npm run test:run`: run unit tests.
- `npm run arch`: run architecture boundary checks.
- `npm run build`: build the production bundle.
- `npm run test:e2e`: run Playwright E2E and accessibility smoke tests.
# transformer
