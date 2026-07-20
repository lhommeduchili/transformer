# Project Handoff

Use this document to resume work after a break without relying on chat history.

## Current State

The project has an implementation baseline across Phases 0 through 11 of `docs/roadmap.md`. It is in post-baseline hardening and is not release-ready until the automated and manual checks below are current for a specific build.

Implemented capabilities:

- Local-first browser audio preparation with no upload path.
- Vite, React, TypeScript, Vitest, Playwright, ESLint, Prettier, dependency-cruiser, and CI gates.
- Feature-oriented clean architecture with domain, application, infrastructure, and UI boundaries.
- Local file import and recursive folder-drop import where the browser entry API is available, using lightweight file references.
- Worker-isolated, bounded local header inspection for WAV, AIFF, FLAC, MP3, and M4A container/stream details where headers expose them.
- AIFF-first DJ preset for CDJ/Rekordbox-safe output.
- FLAC to AIFF conversion through worker-isolated FFmpeg.wasm.
- FFmpeg core JavaScript and WebAssembly are bundled locally rather than fetched from a runtime CDN.
- AIFF output uses `pcm_s16be`, 44.1kHz, stereo.
- Text metadata preservation for built-in presets.
- Embedded artwork preservation for AIFF and MP3 when FFmpeg can map source artwork.
- Filename structure preservation, including `Artist - Song.flac` to `Artist - Song.aiff`.
- File System Access folder output in supported browsers.
- Browser download fallback where folder output is unavailable.
- Queue planning, start, pause-after-current, resume, cancel, retry, skip, reset, and progress states.
- Compatibility warnings for unsupported source containers/codecs, planned conversions, sample-rate changes, bitrate changes, stereo rendering, and incomplete inspection data.
- Local JSON conversion reports.
- Last-selected preset persistence through local browser storage.
- Existing output filenames are conflict-checked before direct folder writes, and resolved output names are retained in reports.
- Accessibility and UX hardening for control guidance, keyboard flow, progress status, and error recovery.
- Documented brutal/minimal visual design baseline for the local audio workbench.
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

Inspection:

- `src/features/inspection/application/audio-inspection-port.ts`
- `src/features/inspection/infrastructure/browser-local-audio-inspection-adapter.ts`
- `src/features/inspection/infrastructure/mock-audio-inspection-adapter.ts`

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

At the 2026-07-19 hardening checkpoint:

- 109 unit/component tests pass.
- 8 Playwright E2E/accessibility tests pass.
- Architecture boundary checks pass.
- Production build passes.

Coverage includes:

- Domain primitives and IDs.
- Import filtering and 1,000-file lightweight import.
- Local header-based inspection for WAV and MP3 fixture headers.
- Presets, compatibility warnings, filename sanitization, output filename preview.
- Queue planning, progress, state transitions, mock executor, conversion-output executor.
- Active-file-only conversion reads.
- FFmpeg argument construction for AIFF/MP3 metadata and artwork mapping.
- Output writer policies.
- Report generation/export, including 1,000-job reports.
- Error boundary and key UI panels.
- E2E import, filename preservation, output destination guard, keyboard flow, and axe scan.

## Visual Design Baseline

The current visual direction is documented in `docs/ux/visual-design.md` and should be preserved by future UI work.

Key decisions:

- The app is a brutal, minimal, void-black local audio workbench, not a generic dashboard.
- Use bone, phosphor green, crimson, silver, and restrained cyan only.
- Main buttons use color inversion for hover/focus, not cyan outline rectangles.
- Compact `x` and `clear` actions are text-only and turn crimson on hover/focus.
- The audio/drop box uses normal square borders with phosphor green hover, focus, and drag-active feedback.
- Uploaded track separators appear only between tracks.
- Queue progress uses a full-width ASCII meter with `░` and `█`, ending one character before the percent.
- Individual queue jobs use status text and an active spinner, not filled progress bars.
- The animated `made with ♥ by alφ` signature is centered in the page footer while `transformer` remains the stable editorial header.
- Mobile workflow order should remain: tracks → preset → destination → convert.
- Major workbench regions use a shared spacing token; primary desktop columns stretch to the same bottom edge as content changes.
- Disclosure panels share reusable disclosure-content spacing rules instead of panel-specific body spacing.
- Accessibility requirements remain non-negotiable: keyboard access, visible focus, status announcements, reduced-motion behavior, and axe checks.

## Known Limitations

- Playwright executes a generated, license-free silent WAV through real local FFmpeg conversion and verifies AIFF download plus JSON report export; broader format/metadata fixture coverage is still limited.
- Inspection is header-based and bounded, but now includes metadata assessment, metadata audit panels, report summaries, binary ID3 parsing, structured FLAC Vorbis-comment parsing, bounded MP4 metadata-atom parsing, and dedicated parser infrastructure.
- Browser folder output depends on File System Access API support.
- Safari/Firefox use download fallback behavior.
- Metadata/artwork compatibility must be manually verified with representative source files and Rekordbox/CDJ hardware.
- The visual design baseline is documented, but visual regression coverage is still manual.
- No persistent library database exists; settings persistence is currently limited to the last-selected preset.
- Default conversion concurrency is intentionally `1`.
- A dedicated folder-picker control and persistent chronological audit-event history are not implemented; per-job diagnostics remain available in the queue and exported report rather than a separate report disclosure.
- E2E coverage now includes real generated-WAV conversion and report export, but browser-level pause/resume, cancellation, retry, recursive folder import, and direct-folder conflict handling remain uncovered.

## Recommended Next Work

Good next increments:

- Harden binary ID3v2 frame parsing and broaden MP4/M4A atom coverage for real-world container layouts.
- Extend metadata audit workflow with filtering and grouped issue presentation.
- Add metadata preservation verification; per-track metadata findings are now included in exported reports.
- Add grouped compatibility warning presentation if warning volume becomes noisy with large batches.
- Add settings for output extension preference if `.aif` is desired instead of `.aiff`.
- Add optional report CSV export if useful for library audits.
- Add visual QA and regression hardening around the documented design baseline.
- Expand generated or license-safe real-audio integration coverage for cancellation, metadata/artwork preservation, and additional formats where runtime remains acceptable.
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
