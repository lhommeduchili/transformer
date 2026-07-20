# Restart Handoff

Use this file when restarting Antigravity or another agent. It captures the current working state without relying on chat history.

## Repository State

- Workspace: `/Users/lhommeduchili/dev/transformer`.
- Git worktree was clean when this handoff was written.
- Current phase: post-Phase 11 hardening. The baseline exists, but release validation and known scope gaps remain.
- Main detailed handoff: `docs/operations/project-handoff.md`.
- Visual design source of truth: `docs/ux/visual-design.md`.

## What Was Completed In The Latest Work Session

### Visual Workbench Baseline

- Reworked the app into a brutal/minimal void-black local audio workbench.
- Preserved the `transformer` editorial title and animated `made with ♥ by alφ` signature.
- Kept uploaded tracks inside the audio/drop box.
- Added compact per-track `x` removal and `clear` all action.
- Removed cyan outline treatment from buttons and compact destructive actions.
- Main buttons now use color inversion for hover/focus.
- Drop/audio box uses normal square border with phosphor green hover/focus/drag feedback.
- Queue uses a full-width ASCII global progress meter with `░` and `█` ending one character before the percent.
- Individual queue jobs use text status plus spinner, not filled/native progress bars.
- The `transformer` title now uses layered composition with the animated `made with ♥ by alφ` signature rendered as an independent overlay layer using blend/compositing behavior.
- Mobile workflow order is preserved as: tracks -> preset -> destination -> convert.
- Disclosure panels now share reusable disclosure-content spacing rules.
- Added regression coverage for ASCII progress and keyboard-reachable imported track removal/clear.
- Documented all aesthetic decisions in `docs/ux/visual-design.md`.

### Local Header Inspection

- Added `src/features/inspection/infrastructure/browser-local-audio-inspection-adapter.ts`.
- Wired `src/app/App.tsx` to use bounded local header inspection instead of mock inspection.
- Inspection reads only a bounded header slice, not whole audio files.
- Header parsing runs in a dedicated typed inspection worker, with browser reads dispatched sequentially to bound memory pressure.
- Header support currently covers:
  - WAV: container, PCM codec, sample rate, channels, duration.
  - AIFF: container, codec where inferable, sample rate, channels, duration when COMM is available.
  - FLAC: container, codec, sample rate, channels, duration from STREAMINFO.
  - MP3: container, codec, sample rate, bitrate, channels from first frame.
  - M4A: lightweight container/codec sniffing.
- Falls back to extension-derived format plus `inspection_incomplete` warning when details cannot be confirmed.
- Added `src/features/inspection/tests/browser-local-audio-inspection-adapter.test.ts`.

### Richer Compatibility Warnings

- Expanded `src/features/presets/domain/compatibility-validation.ts`.
- Compatibility warnings now cover:
  - Unsupported source container for target profile.
  - Unsupported source codec for target profile.
  - Planned conversion to target container/codec.
  - Sample-rate changes.
  - MP3 bitrate changes for bitrate-targeting presets.
  - Stereo rendering when source channel count is not stereo.
  - Incomplete inspection data for container/codec, sample rate, or channels.
- Added tests in `src/features/presets/tests/compatibility-validation.test.ts`.

## Latest Verified Gates

The following passed at the end of the latest session:

```bash
npm run format:check
npm run test:run
npm run lint
npm run typecheck
npm run arch
npm run build
npm run test:e2e
```

Historical coverage count at this handoff (see `project-handoff.md` for the current checkpoint):

- 72 unit/component tests pass.
- 6 Playwright E2E/accessibility tests pass.
- Dependency-cruiser architecture checks pass.
- Production build passes.

## Non-Negotiable Constraints

- No audio uploads or upload paths.
- Do not put business logic in UI components.
- Domain code must not import React, browser APIs, FFmpeg, workers, Zustand, or infrastructure.
- Infrastructure dependencies must be behind typed ports.
- FFmpeg.wasm must remain worker-isolated.
- Browser memory pressure matters; avoid eager full-file reads.
- Preserve keyboard access, status announcements, visible focus, reduced-motion behavior, and axe checks.
- Preserve the visual baseline in `docs/ux/visual-design.md`.

## High-Value Next Increment

Recommended next task: deeper local metadata parsing behind the existing worker-isolated inspection boundary.

Suggested order:

1. Harden the existing ID3v2 frame parser across supported versions and encodings.
2. Replace lightweight FLAC comment scanning with structured Vorbis-comment parsing.
3. Add MP4/M4A atom parsing for common tags.
4. Add metadata filtering and per-track report findings after parser policies and tests are stable.

Keep this work in infrastructure/application/domain boundaries:

- Parsing browser `File` bytes belongs in inspection infrastructure.
- Metadata shape belongs in `src/features/inspection/domain/track-inspection.ts` if it needs to expand.
- Compatibility policy belongs in presets domain/application, not UI.
- UI should only render inspection and validation results.

## Alternative Next Increment

If compatibility warnings feel noisy with real batches, add grouped warning presentation before deeper parsing.

Possible approach:

- Keep individual warning data unchanged.
- Add grouping in application/UI presentation only.
- Group by warning type and message.
- Preserve per-track detail access.
- Add E2E or component coverage for keyboard access and screen-reader labels.

## Files To Read First After Restart

Read these in order:

1. `AGENTS.md`
2. `docs/operations/restart-handoff.md`
3. `docs/operations/project-handoff.md`
4. `docs/ux/visual-design.md`
5. `src/app/App.tsx`
6. `src/features/inspection/infrastructure/browser-local-audio-inspection-adapter.ts`
7. `src/features/presets/domain/compatibility-validation.ts`

## Important Commands

Quick confidence check after restart:

```bash
npm run format:check
npm run typecheck
npm run lint
npm run test:run
```

Full gate set before ending a substantial change:

```bash
npm run format:check
npm run typecheck
npm run lint
npm run test:run
npm run arch
npm run build
npm run test:e2e
```

Development server:

```bash
npm run dev
```

## Manual Validation Still Needed

- A generated silent WAV is now converted through real FFmpeg in Playwright; representative FLAC metadata/artwork and cancellation behavior still need broader automated or manual coverage.
- Manual FLAC to AIFF conversion should still be tested before release.
- Rekordbox/CDJ compatibility should be manually checked with representative files.
- Browser behavior should be checked in Chromium plus fallback-output browsers such as Safari/Firefox.
- Visual regression review is manual for now.
