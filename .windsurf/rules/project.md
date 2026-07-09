# Windsurf Rules

Follow the shared project rules in `.ai/` and the ADRs in `docs/adr/`.

## Architecture

- UI -> Application -> Domain.
- Infrastructure implements application ports.
- Domain has no runtime dependencies.
- Browser APIs and FFmpeg.wasm are infrastructure concerns only.

## Product Constraints

- Local-only audio processing.
- No audio uploads.
- Worker-based conversion.
- Conservative concurrency.
- Large queue safety.
- Typed errors and progress events.

## Quality Constraints

- TypeScript strict mode.
- Unit tests for domain logic.
- Integration tests for application use cases.
- E2E tests for critical user flows.
- Accessibility checks for import, queue, progress, errors, and dialogs.
