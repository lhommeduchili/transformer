# Incremental Implementation Roadmap

## Phase 0: AI And Architecture Bootstrap

Deliverables:

- AI rules.
- Antigravity rules.
- Claude, Gemini, and ChatGPT instructions.
- Engineering standards.
- Review checklists.
- ADR template and initial ADRs.
- Product and architecture documents.

Exit criteria:

- AI assistants have clear project rules.
- Architectural boundaries are documented.
- Review gates are defined.

## Phase 1: Project Scaffold

Deliverables:

- Vite, React, TypeScript.
- Strict TypeScript config.
- ESLint and Prettier.
- Vitest and Playwright.
- Basic CI-ready scripts.
- Architecture boundary checks.

Exit criteria:

- App builds.
- Typecheck passes.
- Test runner works.
- Import boundaries are enforceable.

## Phase 2: Domain Foundation

Deliverables:

- Entities.
- Value objects.
- Queue model.
- Preset model.
- Compatibility model.
- Error model.
- Domain events.
- Unit tests.

## Phase 3: Import And Inspection

Deliverables:

- File import UI.
- Folder support where available.
- Capability detection.
- Inspection port.
- Mock inspection adapter.

## Phase 4: Presets And Validation

Deliverables:

- Built-in DJ presets.
- Filename sanitizer.
- Compatibility warnings.
- Output filename preview.

## Phase 5: Queue Management

Deliverables:

- Queue use cases.
- Queue store adapter.
- Pause, resume, cancel, retry.
- Progress aggregation.

## Phase 6: FFmpeg.wasm Worker Runtime

Deliverables:

- FFmpeg adapter.
- Worker command protocol.
- Progress parsing.
- Cancellation strategy.
- Memory cleanup strategy.

## Phase 7: Output Writing

Deliverables:

- File System Access API adapter.
- Output folder selection.
- Filename conflict handling.
- Fallback download mode.

## Phase 8: Reports And Audit Logs

Deliverables:

- Report model.
- Report UI.
- JSON export.
- Local structured logs.

## Phase 9: UX Hardening

Deliverables:

- Keyboard flows.
- Accessible progress.
- Error boundaries.
- Large queue usability.

## Phase 10: Performance And Scale Hardening

Deliverables:

- Large batch tests.
- Memory profiling.
- Worker concurrency tuning.
- Performance budgets.

## Phase 11: Production Readiness

Deliverables:

- CI quality gates.
- E2E suite.
- Accessibility audit.
- Performance report.
- Security/privacy review.

## Post-Phase 11: Recommended Next Increments

The Phase 0-11 baseline is complete for the current local-first conversion workflow. Next work should be prioritized from `docs/operations/project-handoff.md`.

Candidates:

- Deeper local metadata parsing for ID3, Vorbis comments, FLAC tags, and MP4 atoms.
- Grouped compatibility warning presentation for large batches if needed.
- Visual QA and regression hardening around the documented design baseline.
- Optional report CSV export.
- Browser and Rekordbox/CDJ manual validation across representative libraries.
