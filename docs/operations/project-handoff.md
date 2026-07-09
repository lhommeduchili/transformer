# Project Handoff

Use this document to resume work after a break without relying on chat history.

## Current State

The project has completed Phases 0 through 11 of `docs/roadmap.md` and is at a production-readiness baseline for the current scope.

Implemented capabilities:

- Local-first browser audio preparation with no upload path.
- Vite, React, TypeScript, Vitest, Playwright, ESLint, Prettier, dependency-cruiser, and CI gates.
- Feature-oriented clean architecture with domain, application, infrastructure, and UI boundaries.
- Local file import with lightweight file references.
- Mock inspection for current UI planning.
- AIFF-first DJ preset for CDJ/Rekordbox-safe output.
- FLAC to AIFF conversion through worker-isolated FFmpeg.wasm.
- AIFF output uses `pcm_s16be`, 44.1kHz, stereo.
- Text metadata preservation for built-in presets.
- Embedded artwork preservation for AIFF and MP3 when FFmpeg can map source artwork.
- Filename structure preservation, including `Artist - Song.flac` to `Artist - Song.aiff`.
- File System Access folder output in supported browsers.
- Browser download fallback where folder output is unavailable.
- Queue planning, start, pause, resume, cancel, retry, skip, reset, and progress states.
- Local JSON conversion reports.
- Accessibility and UX hardening for control guidance, keyboard flow, progress status, and error recovery.
- Performance guardrails and 1,000-item tests for large-batch planning/reporting.
- Production readiness and manual release checklists.

## Confirmed Manual Behavior

Manual tests confirmed:

- FLAC to AIFF conversion works in the browser.
- Rekordbox imports the resulting AIFF.
- Text metadata is preserved after adding AIFF ID3v2 metadata mapping.
- Artwork is preserved after adding optional artwork stream mapping.
- Filename spacing around `-` is preserved.
- JSON report export works and contains queue/job metadata only.

## Important Commands

Run the full gate set before considering work complete:

```bash
npm run format:check
npm run typecheck
npm run lint
npm run test:run
npm run arch
npm run build
npm run test:e2e
```

Useful development commands:

```bash
npm run dev
npm run format
npm run test
```

## Key Files

Application wiring:

- `src/app/App.tsx`
- `src/main.tsx`
- `src/app/error-boundaries/AppErrorBoundary.tsx`

Import and file registry:

- `src/features/import/application/import-audio-assets.ts`
- `src/features/import/application/imported-file-registry.ts`
- `src/features/import/infrastructure/browser-file-import-adapter.ts`

Presets and filenames:

- `src/features/presets/domain/built-in-presets.ts`
- `src/features/presets/domain/filename-sanitizer.ts`
- `src/features/presets/domain/output-filename-preview.ts`

Conversion:

- `src/features/conversion/application/build-ffmpeg-args.ts`
- `src/features/conversion/infrastructure/ffmpeg-audio-conversion-adapter.ts`
- `src/features/conversion/infrastructure/worker-runtime-adapter.ts`
- `src/features/conversion/workers/conversion.worker.ts`
- `src/features/conversion/workers/conversion-worker-protocol.ts`

Queue execution:

- `src/features/queue/application/queue-store.ts`
- `src/features/queue/infrastructure/conversion-output-queue-executor.ts`
- `src/features/queue/ui/QueuePanel.tsx`

Output writing:

- `src/features/output/application/output-writer-port.ts`
- `src/features/output/infrastructure/file-system-access-output-writer.ts`
- `src/features/output/infrastructure/browser-download-output-writer.ts`
- `src/features/output/infrastructure/output-writer-factory.ts`

Reports:

- `src/features/reports/domain/conversion-report.ts`
- `src/features/reports/application/build-conversion-report.ts`
- `src/features/reports/application/export-conversion-report-json.ts`
- `src/features/reports/ui/ReportPanel.tsx`

Operations docs:

- `docs/operations/production-readiness.md`
- `docs/operations/manual-release-test.md`
- `docs/operations/performance-budget.md`
- `docs/operations/quality-gates.md`

Architecture docs:

- `docs/architecture/system-architecture.md`
- `docs/architecture/processing-pipeline.md`
- `docs/architecture/domain-model.md`
- `docs/architecture/folder-structure.md`
- `docs/adr/`

## Current Automated Coverage

At handoff time:

- 57 unit/component tests pass.
- 5 Playwright E2E/accessibility tests pass.
- Architecture boundary checks pass.
- Production build passes.

Coverage includes:

- Domain primitives and IDs.
- Import filtering and 1,000-file lightweight import.
- Presets, filename sanitization, output filename preview.
- Queue planning, progress, state transitions, mock executor, conversion-output executor.
- Active-file-only conversion reads.
- FFmpeg argument construction for AIFF/MP3 metadata and artwork mapping.
- Output writer policies.
- Report generation/export, including 1,000-job reports.
- Error boundary and key UI panels.
- E2E import, filename preservation, output destination guard, keyboard flow, and axe scan.

## Known Limitations

- Real FFmpeg conversion is not executed in automated tests with fixture audio.
- Inspection is still mock-based; real metadata/codec inspection is future work.
- Browser folder output depends on File System Access API support.
- Safari/Firefox use download fallback behavior.
- Metadata/artwork compatibility must be manually verified with representative source files and Rekordbox/CDJ hardware.
- Final visual design, branding, and advanced UX polish are intentionally deferred.
- No persistent library database or settings persistence exists yet.
- Default conversion concurrency is intentionally `1`.

## Recommended Next Work

Good next increments:

- Replace mock inspection with real local inspection behind the existing inspection port.
- Add user-visible compatibility warnings based on real inspection data.
- Add settings for output extension preference if `.aif` is desired instead of `.aiff`.
- Add optional report CSV export if useful for library audits.
- Add final UX/UI design pass once functional behavior is stable.
- Add real-audio integration tests only if stable fixture licensing and runtime constraints are acceptable.
- Run full manual release validation from `docs/operations/manual-release-test.md` on target browsers and Rekordbox/CDJ hardware.

Avoid for now unless explicitly needed:

- Parallel FFmpeg conversion.
- Uploads, server-side conversion, or remote metadata enrichment.
- Persistent file handles without a dedicated permission/privacy design.

## Resume Checklist

When picking up the project:

1. Read `AGENTS.md` and required `.ai/` rules.
2. Read this handoff document.
3. Run `npm run format:check`, `npm run typecheck`, `npm run lint`, and `npm run test:run`.
4. Run `npm run dev` for manual exploration.
5. If changing conversion/output behavior, manually test FLAC to AIFF and Rekordbox import.
6. Before ending work, run the full gate set listed above.
