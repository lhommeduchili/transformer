# Agent Instructions

All AI agents working in this repository must follow the shared rules in `.ai/` before making changes.

## Required Reading

- `.ai/global-architecture-principles.md`
- `.ai/coding-standards.md`
- `.ai/testing-standards.md`
- `.ai/security-and-privacy-rules.md`
- `.ai/accessibility-rules.md`
- `.ai/performance-rules.md`
- Relevant ADRs in `docs/adr/`

## Non-Negotiable Rules

- Do not upload or add upload paths for audio files.
- Do not put business logic in UI components.
- Do not let domain code import React, browser APIs, FFmpeg, workers, Zustand, or infrastructure.
- Use typed ports for infrastructure dependencies.
- Keep FFmpeg.wasm worker-isolated.
- Add or update tests with implementation changes.
- Add or update ADRs for non-trivial architecture changes.
