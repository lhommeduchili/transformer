# Gemini Project Instructions

Read `.ai/global-architecture-principles.md` and relevant ADRs before implementation.

## Constraints

- TypeScript everywhere.
- Strict mode required.
- No business logic in UI components.
- No direct FFmpeg or File System Access API usage from UI.
- No audio uploads.
- Worker-based conversion only.
- Conservative concurrency until measured.

## Expected Workflow

1. Identify affected feature and layer.
2. Check dependency direction.
3. Implement minimal composable change.
4. Add tests.
5. Run quality gates.
6. Update docs or ADRs if architecture changes.
